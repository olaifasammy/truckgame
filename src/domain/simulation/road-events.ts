/**
 * Ultra-Realistic Road Events, Incidents & Accidents Engine.
 * Deterministically evaluates corridor hazards, weighbridge inspections,
 * mechanical failures, regulatory citations, and risk-driven collisions.
 */

export type RoadIncidentType =
  | 'construction_zone'
  | 'weather_hazard'
  | 'weighbridge_inspection'
  | 'speeding_ticket'
  | 'hos_audit'
  | 'tire_blowout'
  | 'brake_failure'
  | 'engine_overheat'
  | 'cargo_shift'
  | 'minor_collision'
  | 'major_accident';

export interface RoadIncident {
  type: RoadIncidentType;
  category: 'traffic' | 'mechanical' | 'regulatory' | 'accident';
  severity: 'info' | 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  km: number;
  at: number;
  fine?: number;
  cost?: number;
  part?: string;
  damagePct?: number;
  speedCapKmH?: number;
  speedCapKm?: number;
  forceRest?: boolean;
  isPreventable?: boolean;
}

export interface RoadEventInput {
  jobId: number;
  truckId: number;
  legKmDone: number;
  isDeadhead: boolean;
  isRepositioning: boolean;
  mode: 'normal' | 'eco' | 'speeding';
  weather: string;
  gradePct: number;
  cargoWeightTonnes: number;
  riskMod: number;
  driverSkill: number;
  driverFatigue: number;
  driverHosHours: number;
  hasRegNo: boolean;
  components: {
    engine: number;
    brakes: number;
    tires: number;
    suspension: number;
    windshield: number;
  };
  coolant: number;
  now: number;
}

function deterministicRoll(seed: number): number {
  let x = (seed | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967296;
}

function applyComponentDamage(truck: any, part: string, delta: number) {
  if (!truck?.components) return;
  if (!truck.components[part]) truck.components[part] = { health: 100 };
  truck.components[part].health = Math.max(0, Math.round((truck.components[part].health - delta) * 10) / 10);
}

/**
 * Evaluates road events at a 25 km checkpoint and mutates truck/driver/job state
 * deterministically for any triggered incident. Returns the list of incidents triggered.
 */
export function evaluateRoadEvents(
  input: RoadEventInput,
  a: any,
  truck: any,
  driver: any
): RoadIncident[] {
  const events: RoadIncident[] = [];
  const km = Math.round(input.legKmDone);
  const seedBase =
    (input.jobId || 1) * 7919 +
    km * 104729 +
    (input.truckId || 1) * 31 +
    (input.isDeadhead ? 17 : 0);

  const skillMitigation = Math.max(0.55, 1.15 - (input.driverSkill || 1) * 0.12); // Skill 1: 1.03, Skill 5: 0.55
  const risk = Math.max(0.3, input.riskMod || 1.0);
  const isBadWeather = input.weather === 'snow' || input.weather === 'rain' || input.weather === 'fog';

  // 1. MAJOR & MINOR ACCIDENTS (Only when real risk factors stack)
  let accidentRisk = 0;
  if (input.driverFatigue >= 70) accidentRisk += 0.025 * ((input.driverFatigue - 65) / 20);
  if (input.mode === 'speeding') accidentRisk += 0.018;
  if (input.weather === 'snow') accidentRisk += 0.022;
  else if (input.weather === 'fog') accidentRisk += 0.018;
  else if (input.weather === 'rain') accidentRisk += 0.010;
  if (input.components.brakes < 30) accidentRisk += 0.025;
  if (input.components.tires < 30) accidentRisk += 0.020;
  if (input.gradePct >= 4 && input.cargoWeightTonnes >= 20) accidentRisk += 0.012;

  const effectiveAccidentProb = accidentRisk * risk * skillMitigation;
  const accidentRoll = deterministicRoll(seedBase + 11);

  if (effectiveAccidentProb > 0.02 && accidentRoll < effectiveAccidentProb * 0.35) {
    // Major Highway Collision
    const isPreventable = input.mode === 'speeding' || input.driverFatigue >= 70;
    const cargoDmg = (!input.isDeadhead && !input.isRepositioning) ? 22 : 0;
    applyComponentDamage(truck, 'engine', 25);
    applyComponentDamage(truck, 'brakes', 20);
    applyComponentDamage(truck, 'tires', 25);
    applyComponentDamage(truck, 'suspension', 25);
    applyComponentDamage(truck, 'windshield', 40);
    if (cargoDmg > 0) a.cargoDamagePct = Math.min(45, (a.cargoDamagePct || 0) + cargoDmg);
    if (driver) {
      driver.stress = Math.min(100, (driver.stress || 0) + 35);
      driver.morale = Math.max(10, (driver.morale || 80) - 20);
    }
    a.speedKmh = 0;
    a.speedCapKmH = 30;
    a.speedCapUntilKm = input.legKmDone + 30;

    events.push({
      type: 'major_accident',
      category: 'accident',
      severity: 'critical',
      title: 'MAJOR HIGHWAY COLLISION',
      description: `Severe collision at ${km} km (${input.weather}, brakes ${Math.round(input.components.brakes)}%, fatigue ${Math.round(input.driverFatigue)}%). Heavy chassis & cargo damage.`,
      km,
      at: input.now,
      cost: 3800,
      fine: isPreventable ? 1500 : 0,
      damagePct: cargoDmg,
      speedCapKmH: 30,
      speedCapKm: 30,
      isPreventable
    });
    return events; // Major accident supersedes minor rolls at this checkpoint
  }

  if (effectiveAccidentProb > 0.01 && accidentRoll < effectiveAccidentProb) {
    // Minor Sideswipe / Guardrail Scrape
    const isPreventable = input.mode === 'speeding' || input.driverFatigue >= 70;
    const cargoDmg = (!input.isDeadhead && !input.isRepositioning) ? 8 : 0;
    applyComponentDamage(truck, 'windshield', 15);
    applyComponentDamage(truck, 'suspension', 10);
    applyComponentDamage(truck, 'tires', 10);
    if (cargoDmg > 0) a.cargoDamagePct = Math.min(45, (a.cargoDamagePct || 0) + cargoDmg);
    if (driver) {
      driver.stress = Math.min(100, (driver.stress || 0) + 15);
      driver.morale = Math.max(15, (driver.morale || 80) - 8);
    }
    a.speedKmh = Math.min(a.speedKmh || 0, 20);
    a.speedCapKmH = 50;
    a.speedCapUntilKm = input.legKmDone + 15;

    events.push({
      type: 'minor_collision',
      category: 'accident',
      severity: 'major',
      title: 'MINOR GUARDRAIL COLLISION',
      description: `Sideswipe/guardrail contact at ${km} km (${input.weather}). Minor bodywork, tire & suspension damage.`,
      km,
      at: input.now,
      cost: 1400,
      fine: isPreventable ? 750 : 0,
      damagePct: cargoDmg,
      speedCapKmH: 50,
      speedCapKm: 15,
      isPreventable
    });
    return events;
  }

  // 2. MECHANICAL FAILURES (Component-driven)
  if (input.components.tires < 30 && deterministicRoll(seedBase + 21) < (0.06 + (30 - input.components.tires) * 0.005) * risk) {
    applyComponentDamage(truck, 'tires', 18);
    a.speedKmh = Math.min(a.speedKmh || 0, 20);
    a.speedCapKmH = 45;
    a.speedCapUntilKm = input.legKmDone + 20;
    events.push({
      type: 'tire_blowout',
      category: 'mechanical',
      severity: 'major',
      title: 'STEER/DRIVE TIRE BLOWOUT',
      description: `Worn tire blew out at ${km} km. Mobile tire truck dispatched (-$750); speed capped to 45 km/h.`,
      km,
      at: input.now,
      part: 'tires',
      cost: 750,
      speedCapKmH: 45,
      speedCapKm: 20
    });
  } else if (
    input.components.brakes < 30 &&
    (input.gradePct >= 2 || input.cargoWeightTonnes >= 18) &&
    deterministicRoll(seedBase + 22) < (0.05 + (30 - input.components.brakes) * 0.005) * risk
  ) {
    applyComponentDamage(truck, 'brakes', 15);
    a.speedKmh = Math.min(a.speedKmh || 0, 15);
    a.speedCapKmH = 40;
    a.speedCapUntilKm = input.legKmDone + 20;
    events.push({
      type: 'brake_failure',
      category: 'mechanical',
      severity: 'major',
      title: 'AIR-BRAKE FADE / LEAK',
      description: `Brake thermal fade on ${input.gradePct}% grade at ${km} km. Roadside air-line patch (-$850); speed capped to 40 km/h.`,
      km,
      at: input.now,
      part: 'brakes',
      cost: 850,
      speedCapKmH: 40,
      speedCapKm: 20
    });
  } else if (
    (input.coolant < 25 || input.components.engine < 25) &&
    deterministicRoll(seedBase + 23) < (input.weather === 'heatwave' ? 0.12 : 0.06)
  ) {
    applyComponentDamage(truck, 'engine', 8);
    if (truck?.fluids) truck.fluids.coolant = Math.max(10, (truck.fluids.coolant ?? 100) - 25);
    a.speedKmh = Math.min(a.speedKmh || 0, 25);
    a.speedCapKmH = 45;
    a.speedCapUntilKm = input.legKmDone + 20;
    events.push({
      type: 'engine_overheat',
      category: 'mechanical',
      severity: 'major',
      title: 'ENGINE OVERHEAT / COOLANT LOSS',
      description: `Engine temperature spiked at ${km} km. Emergency coolant hose repair (-$600); limp mode active.`,
      km,
      at: input.now,
      part: 'engine',
      cost: 600,
      speedCapKmH: 45,
      speedCapKm: 20
    });
  }

  // 3. CARGO SHIFT (Suspension / Brakes / Bad Weather)
  if (
    !input.isDeadhead &&
    !input.isRepositioning &&
    (input.components.suspension < 35 || input.components.brakes < 35 || isBadWeather) &&
    deterministicRoll(seedBase + 31) < 0.03 * risk * skillMitigation
  ) {
    applyComponentDamage(truck, 'suspension', 8);
    a.cargoDamagePct = Math.min(45, (a.cargoDamagePct || 0) + 10);
    events.push({
      type: 'cargo_shift',
      category: 'mechanical',
      severity: 'minor',
      title: 'LOAD SHIFT IN TRANSIT',
      description: `Freight shifted at ${km} km (+10% cargo damage). Load re-secured (-$800).`,
      km,
      at: input.now,
      cost: 800,
      damagePct: 10
    });
  }

  // 4. REGULATORY & WEIGHBRIDGE ENFORCEMENT
  if (input.mode === 'speeding' && deterministicRoll(seedBase + 41) < 0.045 * risk) {
    events.push({
      type: 'speeding_ticket',
      category: 'regulatory',
      severity: 'minor',
      title: 'DOT SPEEDING CITATION',
      description: `Radar enforcement cited unit for excessive speed at ${km} km ($450 fine).`,
      km,
      at: input.now,
      fine: 450
    });
  }

  if (
    (input.driverHosHours >= 10.5 || input.driverFatigue >= 85) &&
    deterministicRoll(seedBase + 42) < 0.12
  ) {
    events.push({
      type: 'hos_audit',
      category: 'regulatory',
      severity: 'major',
      title: 'ROADSIDE ELD / HOS AUDIT',
      description: `DOT inspector flagged fatigued/near-limit HOS logbook at ${km} km ($1,200 citation + mandatory rest).`,
      km,
      at: input.now,
      fine: 1200,
      forceRest: true
    });
  } else if (deterministicRoll(seedBase + 43) < (input.cargoWeightTonnes >= 22 ? 0.05 : 0.025)) {
    const failedSafety = !input.hasRegNo || input.components.brakes < 25 || input.components.tires < 25;
    if (failedSafety) {
      events.push({
        type: 'weighbridge_inspection',
        category: 'regulatory',
        severity: 'major',
        title: 'WEIGHBRIDGE SAFETY CITATION',
        description: `Unit failed roadside Level-1 DOT weighbridge check at ${km} km ($950 citation).`,
        km,
        at: input.now,
        fine: 950
      });
    }
  }

  // 5. TRAFFIC & WEATHER CORRIDOR DELAYS (Non-punitive realism)
  if (events.length === 0) {
    if (isBadWeather && deterministicRoll(seedBase + 51) < 0.06) {
      a.speedCapKmH = input.weather === 'snow' ? 45 : 55;
      a.speedCapUntilKm = input.legKmDone + 25;
      events.push({
        type: 'weather_hazard',
        category: 'traffic',
        severity: 'info',
        title: `SEVERE ${input.weather.toUpperCase()} CORRIDOR`,
        description: `Heavy ${input.weather} advisory at ${km} km. Safe speed restricted to ${a.speedCapKmH} km/h for 25 km.`,
        km,
        at: input.now,
        speedCapKmH: a.speedCapKmH,
        speedCapKm: 25
      });
    } else if (deterministicRoll(seedBase + 52) < 0.035) {
      a.speedCapKmH = 55;
      a.speedCapUntilKm = input.legKmDone + 20;
      events.push({
        type: 'construction_zone',
        category: 'traffic',
        severity: 'info',
        title: 'HIGHWAY CONSTRUCTION ZONE',
        description: `Single-lane roadwork at ${km} km. Speed restricted to 55 km/h for the next 20 km.`,
        km,
        at: input.now,
        speedCapKmH: 55,
        speedCapKm: 20
      });
    }
  }

  return events;
}
