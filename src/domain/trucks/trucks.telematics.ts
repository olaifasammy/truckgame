import { TRUCK_MODELS } from './trucks.data';
import { calculatePerformance } from './trucks.physics';
import { resolveTruckRegion } from '../../data/world';

export type DrivingState =
  | 'parking'        // Parked or staged in terminal yard
  | 'delivering'     // Vehicle in logistics transit (factory-to-depot)
  | 'loading'        // Docked at shipper warehouse, cargo manifest loading
  | 'accelerating'   // Leaving depot / accelerating through gears
  | 'cruising'       // Steady linehaul cruise in overdrive top gear
  | 'speeding'       // Overtaking lane / descent momentum
  | 'slow_down'      // Traffic congestion / highway curve / urban limit
  | 'braking'        // Heavy service brakes & engine retarder active
  | 'resting'        // Driver mandatory HOS sleeper berth / truck plaza
  | 'refueling'      // Highway diesel travel plaza refueling
  | 'unloading';     // Docked at consignee warehouse, unloading pallets

export interface TelematicsSnapshot {
  state: DrivingState;
  stateLabel: string;
  stateDescription: string;
  stateBadgeColor: string;
  stateIcon: string;
  
  // Real-time dynamic mechanical values
  speedKmh: number;
  targetSpeedKmh: number;
  throttlePct: number;
  brakePct: number;
  retarderActive: boolean;
  engineRpm: number;
  currentGear: string;
  fuelBurnRate: number;     // Instantaneous L/100km
  turboBoostBar: number;
  oilPressureBar: number;
  coolantTempC: number;
  brakeTempC: number;
  
  // Road & Trip telemetry
  gradientPct: number;
  roadSurface: string;
  pctCompleted: number;
  phase: string;
  isMoving: boolean;
  remainingMs: number;
  distanceRemainingKm: number;
}

/**
 * Computes ultra-realistic, dynamic driving dynamics and vehicle telematics
 * for any tractor across its complete dispatch lifecycle.
 */
export function getTruckTelematics(
  truck: any,
  activeJob?: any,
  driver?: any,
  nowMs: number = Date.now()
): TelematicsSnapshot {
  const model = TRUCK_MODELS[truck?.modelId] || TRUCK_MODELS['scania_s730'];
  const hasCrawler = truck?.upgrades?.gearbox === '16spd_crawler';
  const totalGears = hasCrawler ? 16 : 12;

  // 1. Inactive / Parked / Delivering Tractor State
  if (!activeJob) {
    if (truck?.status === 'delivering') {
      const remaining = Math.max(0, (truck.availableAt || nowMs) - nowMs);
      const isRoRo = truck.shippingMode === 'maritime_roro';
      
      return {
        state: 'delivering',
        stateLabel: isRoRo ? 'MARITIME RO-RO TRANSIT' : 'LOGISTICS TRANSIT DELIVERY',
        stateDescription: isRoRo 
          ? `Vessel arrived at ${truck.loc} deepwater terminal. Unit awaiting customs discharge and port clearance.`
          : `Tractor in professional logistics transit repositioning to ${truck.loc} terminal hub.`,
        stateBadgeColor: '#fbbf24',
        stateIcon: isRoRo ? '🚢' : '🚚',
        speedKmh: isRoRo ? 35 : 82,
        targetSpeedKmh: 90,
        throttlePct: 0,
        brakePct: 0,
        retarderActive: false,
        engineRpm: 0,
        currentGear: 'N (Neutral)',
        fuelBurnRate: 0.0,
        turboBoostBar: 0.0,
        oilPressureBar: 0.0,
        coolantTempC: 22,
        brakeTempC: 22,
        gradientPct: 0.0,
        roadSurface: isRoRo ? 'Maritime Sea Lane' : 'Highway Asphalt',
        pctCompleted: 0,
        phase: isRoRo ? 'Maritime Shipping' : 'Dealer Delivery',
        isMoving: true,
        remainingMs: remaining,
        distanceRemainingKm: Math.round(remaining / 60000 * 1.5)
      };
    }

    return {
      state: 'parking',
      stateLabel: 'PARKED / TERMINAL STAGED',
      stateDescription: `Tractor staged in ${truck?.loc || 'HQ'} depot yard. Air parking brake set; pneumatic air reservoirs charged.`,
      stateBadgeColor: '#94a3b8',
      stateIcon: '🅿️',
      speedKmh: 0,
      targetSpeedKmh: 0,
      throttlePct: 0,
      brakePct: 100,
      retarderActive: false,
      engineRpm: 0,
      currentGear: 'P (Park)',
      fuelBurnRate: 0.0,
      turboBoostBar: 0.05,
      oilPressureBar: 2.4,
      coolantTempC: 72,
      brakeTempC: 45,
      gradientPct: 0.0,
      roadSurface: 'Depot Concrete Pavement',
      pctCompleted: 0,
      phase: 'Staged at Terminal',
      isMoving: false,
      remainingMs: 0,
      distanceRemainingKm: 0
    };
  }

  // 2. Active Consignment Trip Progression & Dynamic Physical Speed Engine
  // Environmental context
  const env = activeJob.env || {};
  const weather = env.weather || 'clear';
  const ambientTemp = env.temp || 22;
  const baseGrade = env.roadGrade || 0.5;

  // Base mechanical baseline from truck physics
  const st = calculatePerformance(truck, activeJob.weight || 18, driver, env);
  let baseTopSpeed = Math.round(st.topSpeed * 0.95); // e.g. 90-95 km/h

  // Adjust target cruise speed based on adverse weather
  if (weather === 'snow') baseTopSpeed -= 22;
  else if (weather === 'rain') baseTopSpeed -= 10;

  // Target cruise speed (customizable per truck: truck.targetSpeed or activeJob.targetSpeed or vehicle top speed)
  const targetCruiseSpeed = truck.targetSpeed || truck.cruiseSpeed || activeJob.targetSpeed || baseTopSpeed;

  // Driver Trait & Vehicle Condition Speed Modifiers
  const driverSpeedMod = driver ? (driver.fatigue > 80 ? 0.82 : driver.fatigue > 60 ? 0.90 : 1.0) : 1.0;
  const healthSpeedMod = Math.max(0.70, (truck.engineHealth || 100) / 100);
  const regionalSpeedMod = (activeJob.from && resolveTruckRegion(activeJob.from) === 'Africa') ? 0.88 : 1.0;

  // Effective Cruising Speed when driving
  const effectiveCruiseSpeed = Math.max(25, Math.min(130, Math.round(targetCruiseSpeed * driverSpeedMod * healthSpeedMod * regionalSpeedMod)));

  // Total trip distance
  const totalKm = Math.max(1, activeJob.km || 100);

  // Initialize or track physical km travelled
  let kmTravelled = activeJob.kmTravelled;
  if (typeof kmTravelled !== 'number') {
    const initElapsed = Math.max(0, nowMs - activeJob.start);
    const initDuration = Math.max(1, activeJob.end - activeJob.start);
    kmTravelled = Math.min(totalKm, totalKm * (initElapsed / initDuration));
    activeJob.kmTravelled = kmTravelled;
  }

  // Calculate percentage completed based on physical distance covered
  const pctCompleted = parseFloat((Math.min(100, Math.max(0, (kmTravelled / totalKm) * 100))).toFixed(1));
  const distanceRemainingKm = Math.max(0, totalKm - kmTravelled);

  // Long Trip Check for Mandatory Rest & Refueling Stops
  const isLongTrip = totalKm >= 400;
  const REST_START = 40.0;
  const REST_END = 48.0;
  const FUEL_START = 48.0;
  const FUEL_END = 54.0;

  // Dynamic Stop Delays Remaining (in Ms)
  let stopDelaysMs = 0;
  if (pctCompleted < 3.8) {
    // Dock loading/inspection delay (5 mins = 300,000 ms)
    const loadingTotalMs = 300000;
    stopDelaysMs += Math.max(0, loadingTotalMs * (1 - pctCompleted / 3.8));
  }

  if (isLongTrip) {
    if (pctCompleted < REST_START) {
      // Rest stop ahead (45 mins) + Refuel stop ahead (15 mins)
      stopDelaysMs += 2700000 + 900000;
    } else if (pctCompleted >= REST_START && pctCompleted < REST_END) {
      // Currently in Rest Stop (45 mins total)
      const restDoneRatio = (pctCompleted - REST_START) / (REST_END - REST_START);
      stopDelaysMs += Math.max(0, (1 - restDoneRatio) * 2700000) + 900000;
    } else if (pctCompleted >= FUEL_START && pctCompleted < FUEL_END) {
      // Currently in Refuel Stop (15 mins total)
      const fuelDoneRatio = (pctCompleted - FUEL_START) / (FUEL_END - FUEL_START);
      stopDelaysMs += Math.max(0, (1 - fuelDoneRatio) * 900000);
    }
  }

  // Driving time remaining at effectiveCruiseSpeed
  // e.g. 500km remaining at 50 km/h = 10 hrs driving time + stop delays
  // 500km remaining at 100 km/h = 5 hrs driving time + stop delays
  // 500km remaining at 75 km/h = 6.67 hrs driving time + stop delays
  const remainingDrivingMs = Math.round((distanceRemainingKm / effectiveCruiseSpeed) * 3600000);
  const remainingMs = Math.max(0, remainingDrivingMs + Math.round(stopDelaysMs));

  // Lively update activeJob.end to reflect dynamic target speed and rest/refuel stop changes
  activeJob.end = nowMs + remainingMs;

  // Weather road surface label
  const roadSurface = weather === 'snow'
    ? 'Alpine Snow & Packed Ice'
    : weather === 'rain'
      ? 'Wet Expressway Asphalt'
      : weather === 'heatwave'
        ? 'High-Temp Desert Highway'
        : 'Dry Asphalt Interstate';

  // 3. State Machine by Trip Progress & Time Cycle
  let state: DrivingState;
  let stateLabel: string;
  let stateDescription: string;
  let stateBadgeColor: string;
  let stateIcon: string;
  let phase: string;

  let speedKmh = 0;
  let throttlePct = 0;
  let brakePct = 0;
  let retarderActive = false;
  let engineRpm = 650;
  let gearNumber = totalGears;
  let currentGear = `${gearNumber} / ${totalGears}`;
  let turboBoostBar = 1.4;
  let brakeTempC = 75;
  let gradientPct = baseGrade;

  if (pctCompleted < 3.8) {
    // Phase 1: Cargo Loading & Inspection
    const isRepositioning = activeJob.kind === 'move' || !activeJob.cargoId;
    state = isRepositioning ? 'parking' : 'loading';
    phase = isRepositioning ? 'Staging for Transit' : 'Terminal Loading';
    stateLabel = isRepositioning ? 'PRE-TRIP INSPECTION / STAGING' : 'CARGO DOCK LOADING & WEIGHBRIDGE';
    stateDescription = isRepositioning
      ? `Unit staged at ${activeJob.from} depot. Performing multi-point safety inspection and air system pressure check before repositioning deadhead.`
      : `Docked at ${activeJob.from} terminal warehouse. Securing ${activeJob.cargo} payload (${activeJob.weight || 18}t) & validating bridge axle weights.`;
    stateBadgeColor = isRepositioning ? '#94a3b8' : '#38bdf8';
    stateIcon = isRepositioning ? '📋' : '📦';
    speedKmh = 0;
    throttlePct = 0;
    brakePct = 100;
    engineRpm = 650;
    currentGear = 'N (Neutral)';
    turboBoostBar = 0.1;
  } else if (pctCompleted < 8.5) {
    // Phase 2: Terminal Departure & Acceleration
    state = 'accelerating';
    phase = 'Departure & On-Ramp';
    stateLabel = 'TERMINAL DEPARTURE / ACCELERATING';
    stateDescription = 'Pulling gross combination mass out of freight yard onto highway interchange; climbing transmission ratios under heavy throttle.';
    stateBadgeColor = '#10b981';
    stateIcon = '🚀';
    const accelFactor = (pctCompleted - 3.8) / (8.5 - 3.8); // 0 to 1
    speedKmh = Math.round(15 + accelFactor * (baseTopSpeed * 0.75 - 15));
    throttlePct = 95;
    brakePct = 0;
    gearNumber = Math.max(3, Math.min(totalGears - 2, Math.floor(3 + accelFactor * (totalGears - 5))));
    currentGear = `${gearNumber} / ${totalGears}`;
    engineRpm = Math.round(1750 + Math.sin(accelFactor * 10) * 150);
    turboBoostBar = 2.3;
  } else if (isLongTrip && pctCompleted >= REST_START && pctCompleted < REST_END) {
    // Phase 3: Mandatory Rest Stop (Sleeper Berth)
    state = 'resting';
    phase = 'Midway HOS Rest Stop';
    stateLabel = 'MANDATORY HOS REST / SLEEPER BERTH';
    stateDescription = 'Parked at highway travel plaza for mandatory electronic tachograph logbook rest break & tire inspection walkaround.';
    stateBadgeColor = '#a855f7';
    stateIcon = '☕';
    speedKmh = 0;
    throttlePct = 0;
    brakePct = 100;
    engineRpm = 0;
    currentGear = 'P (Park)';
    turboBoostBar = 0.0;
  } else if (isLongTrip && pctCompleted >= FUEL_START && pctCompleted < FUEL_END) {
    // Phase 4: High-Flow Highway Refueling
    state = 'refueling';
    phase = 'En-Route Fueling Station';
    stateLabel = 'HIGH-FLOW COMMERCIAL DIESEL REFUELING';
    stateDescription = 'Stationed at interstate travel plaza commercial canopy; bunkering ultra-low sulfur diesel fuel and replenishing DEF adBlue reservoir.';
    stateBadgeColor = '#eab308';
    stateIcon = '⛽';
    speedKmh = 0;
    throttlePct = 0;
    brakePct = 100;
    engineRpm = 0;
    currentGear = 'P (Park)';
    turboBoostBar = 0.0;
  } else if (pctCompleted >= 93.5 && pctCompleted < 97.5) {
    // Phase 5: Approach Deceleration & Highway Exit
    state = 'braking';
    phase = 'Terminal Arrival Approach';
    stateLabel = 'HIGHWAY OFF-RAMP / ENGINE RETARDER';
    stateDescription = `Exiting expressway toward ${activeJob.to} industrial park; hydraulic driveline retarder and service brakes actively scrubbing kinetic speed.`;
    stateBadgeColor = '#f97316';
    stateIcon = '🛑';
    const decelFactor = (pctCompleted - 93.5) / (97.5 - 93.5);
    speedKmh = Math.max(25, Math.round(baseTopSpeed * 0.85 - decelFactor * 50));
    throttlePct = 0;
    brakePct = 65;
    retarderActive = true;
    gearNumber = Math.max(4, Math.floor(totalGears - 3 - decelFactor * 4));
    currentGear = `${gearNumber} / ${totalGears}`;
    engineRpm = 1750; // Jake brake compression RPM
    turboBoostBar = 0.3;
    brakeTempC = 240;
  } else if (pctCompleted >= 97.5) {
    // Phase 6: Consignee Dock Unloading
    const isRepositioning = activeJob.kind === 'move' || !activeJob.cargoId;
    state = isRepositioning ? 'parking' : 'unloading';
    phase = isRepositioning ? 'Final Docking' : 'Final Bay Unloading';
    stateLabel = isRepositioning ? 'TERMINAL ARRIVAL / SHUTDOWN' : 'CONSIGNEE DOCK BAY UNLOADING';
    stateDescription = isRepositioning
      ? `Repositioning complete. Unit arrived at ${activeJob.to} hub terminal; engaging parking brake and performing post-trip diagnostic shutdown.`
      : `Reversed into ${activeJob.to} receiving dock bay #4. Digital consignment bill of lading signed; palletized cargo extraction in progress.`;
    stateBadgeColor = isRepositioning ? '#94a3b8' : '#38bdf8';
    stateIcon = isRepositioning ? '🅿️' : '🏁';
    speedKmh = 0;
    throttlePct = 0;
    brakePct = 100;
    engineRpm = 650;
    currentGear = 'R (Docking)';
    turboBoostBar = 0.1;
  } else {
    // Phase 7: Dynamic Linehaul Highway Transit (Simulated continuous 50-second traffic & terrain cycle)
    phase = pctCompleted < 50 ? 'Long-Haul Leg 1' : 'Long-Haul Leg 2';
    const cycleSec = ((Math.floor(nowMs / 1000) + (truck.id * 11)) % 50);

    if (cycleSec < 22) {
      // 1. Cruising (Steady Highway Linehaul)
      state = 'cruising';
      stateLabel = 'HIGHWAY LINEHAUL CRUISING';
      stateDescription = 'Maintaining steady linehaul cruise speed in overdrive top gear; automated predictive powertrain in fuel-efficient eco band.';
      stateBadgeColor = '#10b981';
      stateIcon = '🛣️';
      speedKmh = Math.round(effectiveCruiseSpeed - 2 + Math.sin(nowMs / 3000) * 2.5);
      throttlePct = 60;
      brakePct = 0;
      gearNumber = totalGears;
      engineRpm = Math.round(1280 + (speedKmh % 10) * 12);
      turboBoostBar = 1.45;
    } else if (cycleSec < 31) {
      // 2. Speeding / Overtaking Passing Lane
      state = 'speeding';
      stateLabel = 'PASSING LANE / OVERTAKING SPEED';
      stateDescription = 'Accelerating past slower vehicles in expressway passing lane; turbocharger building positive manifold pressure.';
      stateBadgeColor = '#eab308';
      stateIcon = '⚡';
      speedKmh = Math.min(130, Math.round(effectiveCruiseSpeed * 1.12 + 2 + Math.cos(nowMs / 2500) * 2));
      throttlePct = 90;
      brakePct = 0;
      gearNumber = totalGears;
      engineRpm = Math.round(1480 + (speedKmh % 8) * 16);
      turboBoostBar = 2.15;
    } else if (cycleSec < 40) {
      // 3. Slow Down (Traffic Congestion or Road Curvature)
      state = 'slow_down';
      stateLabel = 'TRAFFIC SLOWDOWN / CURVATURE';
      stateDescription = 'Easing throttle for highway traffic congestion and road curvature; automated transmission downshifting into direct drive.';
      stateBadgeColor = '#f97316';
      stateIcon = '⚠️';
      speedKmh = Math.round(effectiveCruiseSpeed * 0.76 + Math.sin(nowMs / 2000) * 3);
      throttlePct = 20;
      brakePct = 15;
      gearNumber = totalGears - 2;
      engineRpm = Math.round(1220 + (speedKmh % 6) * 14);
      turboBoostBar = 0.7;
    } else if (cycleSec < 45) {
      // 4. Braking (Engine Retarder & Service Braking)
      state = 'braking';
      stateLabel = 'ENGINE RETARDER & SERVICE BRAKING';
      stateDescription = 'Exhaust brake and driveline retarder engaged down highway gradient; scrubbing momentum without overheating foundation disk brakes.';
      stateBadgeColor = '#ef4444';
      stateIcon = '🛑';
      speedKmh = Math.max(25, Math.round(effectiveCruiseSpeed * 0.62 - (cycleSec - 40) * 4));
      throttlePct = 0;
      brakePct = 70;
      retarderActive = true;
      gearNumber = totalGears - 3;
      engineRpm = 1720; // High engine compression braking RPM
      turboBoostBar = 0.25;
      brakeTempC = 190;
      gradientPct = -3.8;
    } else {
      // 5. Re-Accelerating back up to cruise
      state = 'accelerating';
      stateLabel = 'RE-ACCELERATING TO CRUISE SPEED';
      stateDescription = 'Traffic cleared; applying progressive throttle to spool turbocharger and regain target linehaul cruise speed.';
      stateBadgeColor = '#38bdf8';
      stateIcon = '🚀';
      const reAccel = (cycleSec - 45) / 5;
      speedKmh = Math.round(effectiveCruiseSpeed * 0.65 + reAccel * (effectiveCruiseSpeed * 0.32));
      throttlePct = 85;
      brakePct = 0;
      gearNumber = Math.max(totalGears - 2, Math.floor(totalGears - 2 + reAccel * 2));
      engineRpm = Math.round(1680 - reAccel * 250);
      turboBoostBar = 2.05;
    }

    currentGear = `${gearNumber} / ${totalGears}`;
  }

  // 4. Auxiliary Sensor Telemetry
  const isMoving = speedKmh > 0;
  const fuelBurnRate = isMoving
    ? parseFloat((st.fuelConsumption * (0.55 + (throttlePct / 100) * 0.65 + (speedKmh > 90 ? 0.15 : 0))).toFixed(1))
    : 1.8; // Idle burn L/hr

  const coolantTempC = Math.round(
    (ambientTemp > 30 ? 93 : 87) +
    (throttlePct > 80 ? 4 : 0) +
    (state === 'resting' || state === 'refueling' ? -15 : 0)
  );

  const oilPressureBar = parseFloat(
    (isMoving ? 4.2 + (engineRpm / 2000) * 0.8 : 2.4).toFixed(1)
  );

  return {
    state,
    stateLabel,
    stateDescription,
    stateBadgeColor,
    stateIcon,
    speedKmh,
    targetSpeedKmh: baseTopSpeed,
    throttlePct,
    brakePct,
    retarderActive,
    engineRpm,
    currentGear,
    fuelBurnRate,
    turboBoostBar: parseFloat(turboBoostBar.toFixed(2)),
    oilPressureBar,
    coolantTempC,
    brakeTempC,
    gradientPct: parseFloat(gradientPct.toFixed(1)),
    roadSurface,
    pctCompleted,
    phase,
    isMoving,
    remainingMs,
    distanceRemainingKm
  };
}

/**
 * Renders a standardized, modular driving state badge for UI components.
 */
export function getDrivingStateBadge(state: DrivingState, compact: boolean = false): string {
  const meta: Record<DrivingState, { label: string; icon: string; bg: string; border: string; text: string }> = {
    parking: { label: 'PARKED', icon: '🅿️', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
    delivering: { label: 'DELIVERING', icon: '🚚', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    loading: { label: 'LOADING', icon: '📦', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', text: '#38bdf8' },
    accelerating: { label: 'ACCELERATING', icon: '🚀', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
    cruising: { label: 'CRUISING', icon: '🛣️', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#34d399' },
    speeding: { label: 'OVERTAKING', icon: '⚡', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: '#eab308' },
    slow_down: { label: 'SLOW DOWN', icon: '⚠️', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', text: '#f97316' },
    braking: { label: 'BRAKING', icon: '🛑', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#ef4444' },
    resting: { label: 'HOS REST', icon: '☕', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#c084fc' },
    refueling: { label: 'REFUELING', icon: '⛽', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: '#fbbf24' },
    unloading: { label: 'UNLOADING', icon: '🏁', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.4)', text: '#38bdf8' }
  };

  const item = meta[state] || meta.parking;
  if (compact) {
    return `
      <span style="display:inline-flex; align-items:center; gap:4px; font-size:9px; font-weight:800; color:${item.text}; background:${item.bg}; border:1px solid ${item.border}; padding:2px 6px; border-radius:4px; font-family:monospace;">
        <span>${item.icon}</span>
        <span>${item.label}</span>
      </span>
    `;
  }

  return `
    <span style="display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:900; color:${item.text}; background:${item.bg}; border:1px solid ${item.border}; padding:3px 8px; border-radius:5px; font-family:monospace; letter-spacing:0.5px;">
      <span>${item.icon}</span>
      <span>${item.label}</span>
    </span>
  `;
}
