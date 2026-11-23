import { TRUCK_MODELS } from './trucks.data';
import { ensureJourney, isRepositioning, tankCapacity } from './trucks.journey';

/** @deprecated Phases are now real timed stages on the job (see trucks.journey.ts). Kept so old imports compile. */
export const TRIP_PHASES = {
  LOADING_END: 1.5,
  REST_START: 40.0,
  REST_END: 48.0,
  FUEL_START: 48.0,
  FUEL_END: 54.0,
  UNLOADING_START: 98.5
};

export type DrivingState =
  | 'parking'        // Parked or staged in terminal yard
  | 'delivering'     // Vehicle in logistics transit (factory-to-depot)
  | 'loading'        // Docked at shipper warehouse, cargo manifest loading
  | 'accelerating'   // Leaving depot / accelerating through gears
  | 'cruising'       // Steady linehaul cruise
  | 'speeding'       // Pushing above target (speed-demon drivers)
  | 'slow_down'      // Urban zone / approaching a stop
  | 'braking'        // Service brakes & engine retarder active
  | 'resting'        // Driver mandatory HOS rest
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
  targetSpeedKmh: number;      // current speed limit the truck is working toward
  throttlePct: number;
  brakePct: number;
  retarderActive: boolean;
  engineRpm: number;
  currentGear: string;
  fuelBurnRate: number;        // L/100km while moving, L/h while idling (see fuelBurnUnit)
  fuelBurnUnit: 'L/100km' | 'L/h';
  instantL100km: number;
  avgL100km: number;
  turboBoostBar: number;
  oilPressureBar: number;
  coolantTempC: number;
  brakeTempC: number;
  fuelPct: number;
  tankLiters: number;

  // Road & Trip telemetry
  gradientPct: number;
  roadSurface: string;
  pctCompleted: number;
  phase: string;
  isMoving: boolean;
  isStationary: boolean;
  stage: string;
  legIndex: number;            // 1-based
  legCount: number;            // 2 for round trips
  legLabel: string;

  // ETA (Google-Maps style)
  remainingMs: number;         // total time to finish this leg, incl. stops still to come
  etaAtMs: number;
  distanceRemainingKm: number; // driving distance left on this leg (incl. deadhead to pickup)
  distanceTotalKm: number;
  avgSpeedKmh: number;         // smoothed speed the ETA is based on
  stopTimeRemainingMs: number; // loading/unloading/rest/fuel time still ahead
}

const EXTRA_IDLE = {
  fuelBurnUnit: 'L/h' as const,
  instantL100km: 0,
  avgL100km: 0,
  fuelPct: 100,
  tankLiters: 0,
  isStationary: true,
  stage: 'idle',
  legIndex: 1,
  legCount: 1,
  legLabel: '',
  etaAtMs: 0,
  distanceTotalKm: 0,
  avgSpeedKmh: 0,
  stopTimeRemainingMs: 0
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Gear + RPM from road speed. Gear spans widen toward top gear like a real 12/16-speed box. */
function drivetrain(speedKmh: number, topKmh: number, totalGears: number, throttlePct: number, engineOn: boolean) {
  if (!engineOn) return { gear: 'P (Park)', rpm: 0, gearNumber: 0 };
  if (speedKmh < 1) return { gear: 'N (Neutral)', rpm: 650, gearNumber: 0 };
  const bound = (g: number) => topKmh * Math.pow(g / totalGears, 1.25);
  let g = 1;
  while (g < totalGears && speedKmh > bound(g)) g++;
  const lo = g === 1 ? 0 : bound(g - 1);
  const frac = clamp((speedKmh - lo) / Math.max(1, bound(g) - lo), 0, 1);
  return { gear: `${g} / ${totalGears}`, rpm: Math.round(1000 + frac * 800 + throttlePct), gearNumber: g };
}

/**
 * PURE reader. All physics lives in trucks.journey.ts (advanceJourney); this only turns the
 * job's journey fields into a dashboard snapshot. Safe to call every frame from any UI.
 */
export function getTruckTelematics(
  truck: any,
  activeJob?: any,
  driver?: any,
  nowMs: number = Date.now()
): TelematicsSnapshot {
  const model = (TRUCK_MODELS[truck?.modelId] || TRUCK_MODELS['scania_s730']) as any;
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
        distanceRemainingKm: Math.round(remaining / 60000 * 1.5),
        ...EXTRA_IDLE
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
      distanceRemainingKm: 0,
      ...EXTRA_IDLE
    };
  }

  // 2. Active job: read the journey state
  const a = activeJob;
  ensureJourney(a, truck, nowMs);

  const stage: string = a.stage;
  const repo = isRepositioning(a);
  const env = a.env || {};
  const ambientTemp = env.temp || 22;
  const weather = env.weather || 'clear';
  const legCount = a.isRoundTrip ? 2 : 1;
  const legIndex = a.currentLeg || 1;
  const legLabel = legCount === 2 ? (legIndex === 1 ? 'OUTBOUND LEG 1/2' : 'RETURN LEG 2/2') : '';
  const tag = legLabel ? `${legLabel} · ` : '';

  const speedKmh = Math.round(a.speedKmh || 0);
  let throttlePct = a.throttlePct || 0;
  const brakePct = a.brakePct || 0;
  const retarderActive = !!a.retarder;
  const moving = speedKmh > 0;

  let state: DrivingState;
  let stateLabel: string;
  let stateDescription: string;
  let stateBadgeColor: string;
  let stateIcon: string;
  let phase: string;

  const dhPrefix = stage === 'deadhead' ? 'DEADHEAD · ' : '';
  const moveLabel: Record<string, [DrivingState, string, string, string, string]> = {
    accelerating: ['accelerating', 'ACCELERATING', 'Building speed through the gears under load; predictive powertrain managing shift points.', '#10b981', '🚀'],
    cruising: ['cruising', 'HIGHWAY LINEHAUL CRUISING', 'Holding steady linehaul speed in a high gear; automated predictive powertrain in fuel-efficient eco band.', '#10b981', '🛣️'],
    speeding: ['speeding', 'PUSHING ABOVE TARGET', 'Driver is running above the set cruise speed; fuel burn and wear rising.', '#eab308', '⚡'],
    slow_down: ['slow_down', 'SLOW DOWN / ZONE LIMIT', 'Holding a reduced speed for the urban/terminal zone or the approach to the next stop.', '#f97316', '⚠️'],
    braking: ['braking', 'BRAKING / ENGINE RETARDER', 'Service brakes and driveline retarder scrubbing speed for the stop ahead.', '#ef4444', '🛑']
  };

  if (stage === 'loading') {
    state = repo ? 'parking' : 'loading';
    phase = repo ? 'Staging for Transit' : 'Terminal Loading';
    stateLabel = repo ? 'PRE-TRIP INSPECTION / STAGING' : 'CARGO DOCK LOADING & WEIGHBRIDGE';
    stateDescription = repo
      ? `Unit staged at ${a.from} depot. Multi-point safety inspection and air system pressure check before departure.`
      : `Docked at ${a.from} terminal. Securing ${a.cargo} payload (${a.weight || 18}t) & validating axle weights.`;
    stateBadgeColor = repo ? '#94a3b8' : '#38bdf8';
    stateIcon = repo ? '📋' : '📦';
  } else if (stage === 'unloading' || stage === 'done') {
    state = repo ? 'parking' : 'unloading';
    phase = repo ? 'Final Docking' : 'Final Bay Unloading';
    stateLabel = repo ? 'TERMINAL ARRIVAL / SHUTDOWN' : 'CONSIGNEE DOCK BAY UNLOADING';
    stateDescription = repo
      ? `Arrived at ${a.to}. Engaging parking brake and performing post-trip shutdown.`
      : `Reversed into ${a.to} receiving dock. Bill of lading signed; palletized cargo extraction in progress.`;
    stateBadgeColor = repo ? '#94a3b8' : '#38bdf8';
    stateIcon = repo ? '🅿️' : '🏁';
  } else if (stage === 'resting') {
    state = 'resting';
    phase = 'Safety Rest Break';
    stateLabel = 'MANDATORY HOS REST / SLEEPER BERTH';
    stateDescription = 'Parked at a highway travel plaza for the mandatory tachograph rest break and tire walkaround.';
    stateBadgeColor = '#a855f7';
    stateIcon = '☕';
  } else if (stage === 'refueling') {
    state = 'refueling';
    phase = 'En-Route Fueling Station';
    stateLabel = 'HIGH-FLOW COMMERCIAL DIESEL REFUELING';
    stateDescription = 'Stationed at an interstate travel plaza; bunkering ultra-low sulfur diesel and topping up DEF.';
    stateBadgeColor = '#eab308';
    stateIcon = '⛽';
  } else {
    const m = moveLabel[a.mode] || moveLabel.cruising;
    state = m[0];
    stateLabel = dhPrefix + m[1];
    stateDescription = stage === 'deadhead'
      ? `Running empty to the pickup at ${a.from}. ${m[2]}`
      : m[2];
    stateBadgeColor = m[3];
    stateIcon = m[4];
    phase = stage === 'deadhead'
      ? 'Deadhead to Pickup'
      : legCount === 2
        ? (legIndex === 1 ? 'Outbound Haul' : 'Return Haul')
        : (a.km >= 400 ? 'Long-Haul' : 'Regional Haul');
  }

  // Cruise throttle breathes a little (display only)
  if (state === 'cruising') throttlePct = clamp(throttlePct + Math.round(Math.sin(nowMs / 900) * 2), 0, 100);

  const engineOn = stage !== 'resting' && stage !== 'refueling';
  const dt = drivetrain(speedKmh, model.topSpeed || 120, totalGears, throttlePct, engineOn);
  const engineRpm = stage === 'loading' || stage === 'unloading' || stage === 'done' ? 650 : dt.rpm;

  const cap = tankCapacity(truck);
  const tankLiters = a.tankL ?? 0;
  const fuelPct = Math.round(clamp((tankLiters / cap) * 100, 0, 100) * 10) / 10;

  const idling = !moving && engineOn;
  const instL100 = a.instL100km || 0;
  const fuelBurnRate = moving
    ? parseFloat((instL100 * (0.8 + 0.4 * (throttlePct / 100))).toFixed(1))
    : idling ? 1.8 : 0;

  const coolantTempC = Math.round(
    82 + throttlePct * 0.12 + (ambientTemp > 30 ? 5 : 0) + (!engineOn ? -15 : 0)
  );
  const oilPressureBar = parseFloat((moving ? 4.2 + (engineRpm / 2000) * 0.8 : engineOn ? 2.4 : 0).toFixed(1));
  const turboBoostBar = parseFloat((engineOn ? 0.1 + (throttlePct / 100) * 1.8 : 0).toFixed(2));
  const brakeTempC = Math.round(80 + brakePct * 1.8 + (retarderActive ? 25 : 0));

  const dhTotal = a.dh || 0;
  const kmTotal = Math.max(1, a.km || 1);
  const distTotal = dhTotal + kmTotal;
  const distDone = Math.min(distTotal, (a.dhTravelled || 0) + (a.kmTravelled || 0));
  const pctCompleted = parseFloat(clamp((distDone / distTotal) * 100, 0, 100).toFixed(1));

  const roadSurface = (stage === 'loading' || stage === 'unloading' || stage === 'resting' || stage === 'refueling')
    ? 'Terminal / Plaza Concrete'
    : env.roadSurface
      ? env.roadSurface
      : weather === 'snow'
        ? 'Icy / Deep Snow'
        : weather === 'rain'
          ? 'Wet / Slippery'
          : (a.from && a.env?.region === 'Africa') ? 'Unpaved / Rough' : 'Dry Asphalt';

  return {
    state,
    stateLabel: tag + stateLabel,
    stateDescription,
    stateBadgeColor,
    stateIcon,
    speedKmh,
    targetSpeedKmh: Math.round(a.limitKmh || 0),
    throttlePct,
    brakePct,
    retarderActive,
    engineRpm,
    currentGear: dt.gear,
    fuelBurnRate,
    fuelBurnUnit: moving ? 'L/100km' : 'L/h',
    instantL100km: instL100,
    avgL100km: instL100,
    turboBoostBar,
    oilPressureBar,
    coolantTempC,
    brakeTempC,
    fuelPct,
    tankLiters: Math.round(tankLiters),
    gradientPct: parseFloat((a.gradePct || 0).toFixed(1)),
    roadSurface,
    pctCompleted,
    phase,
    isMoving: moving,
    isStationary: !moving,
    stage,
    legIndex,
    legCount,
    legLabel,
    remainingMs: Math.max(0, (a.end || nowMs) - nowMs),
    etaAtMs: a.end || nowMs,
    distanceRemainingKm: Math.round(a.remainingDriveKm ?? 0),
    distanceTotalKm: Math.round(distTotal),
    avgSpeedKmh: Math.round(a.planSpeedKmh || a.avgSpeedKmh || 0),
    stopTimeRemainingMs: Math.round(a.remainingStopMs || 0)
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
