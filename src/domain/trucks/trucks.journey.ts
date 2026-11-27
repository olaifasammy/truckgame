import { TRUCK_MODELS } from './trucks.data';
import { calculateMechanicalLimits, DRIVER_TRAITS, fuelPer100km, applyContinuousWear, deterministicRoll } from '../simulation/physics';
import { evaluateRoadEvents, RoadIncident } from '../simulation/road-events';
import { TRAIT_REGISTRY } from '../drivers/drivers.names';
import { resolveTruckRegion } from '../../data/world';
import { getRouteEnv } from '../../systems/calc';

/**
 * NexHaul Journey Engine
 * ---------------------------------------------------------------------------
 * ONE authoritative simulation for an active job. Everything else (telematics
 * panel, ETA counters, odometer) only READS the fields written here.
 *
 * Stages:  deadhead -> loading -> driving -> unloading -> done
 *          (resting / refueling interrupt deadhead|driving and resume it)
 *
 * Single clock: 1 simulated hour = SIM_HOUR_MS real ms. This MUST equal the
 * constant used by tripMs() in systems/calc.ts (277 s per hour).
 */

export const SIM_HOUR_MS = 277_000;
const SIM_S_PER_MS = 3600 / SIM_HOUR_MS; // simulated seconds per real millisecond

export type Stage = 'deadhead' | 'loading' | 'driving' | 'unloading' | 'resting' | 'refueling' | 'done';

/** All stop durations in real ms, derived from the sim clock so they scale together. */
export const STOPS = {
  BREAK_MS: Math.round(0.75 * SIM_HOUR_MS),  // 45 sim-min mandatory fatigue break
  REST_MS: Math.round(2.0 * SIM_HOUR_MS),    // scaled 10h HOS sleeper-berth reset
  REFUEL_MS: Math.round(0.25 * SIM_HOUR_MS), // 15 sim-min at the pump (scaled by fill level)
  STAGE_MS: 20_000,                          // pre-trip check / post-trip shutdown for repositioning moves
  loadMs: (tonnes: number) => Math.round(0.30 * SIM_HOUR_MS + (tonnes || 0) * 2000),
  unloadMs: (tonnes: number) => Math.round(0.25 * SIM_HOUR_MS + (tonnes || 0) * 1500)
};

export const FATIGUE_PER_SIM_HOUR = 8.5;
export const REST_AT_FATIGUE = 80;
export const HOS_MAX_HOURS = 11.0;
const INCIDENT_CHECK_INTERVAL_KM = 25;
const REFUEL_BELOW_PCT = 12;
const BRAKE_KMH_PER_S = 2.0;                 // service-brake decel in km/h per simulated second
const BRAKE_KMH_PER_H = BRAKE_KMH_PER_S * 3600;
const COAST_KMH_PER_S = 0.5;                 // gentle slow-down when the cruise target drops (hill, weather)
const ZONE_KM = 3;                           // urban / terminal zone at both ends of every leg
const ZONE_KMH = 50;
const IDLE_L_PER_SIM_HOUR = 1.8;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const isRepositioning = (a: any) => a.kind === 'move' || !a.cargoId;

export function tankCapacity(truck: any): number {
  const m = TRUCK_MODELS[truck?.modelId] as any;
  return m?.tankSize || m?.fuelCapacity || 800;
}

/** Deterministic rolling terrain: gradient varies along the route so throttle/speed breathe naturally. */
export function gradeAt(a: any, km: number): number {
  const base = a.env?.roadGrade ?? 0.5;
  const g = base + Math.sin(km / 5.5) * base * 0.9 + Math.sin(km / 1.3) * 0.35;
  return clamp(g, -3, base * 2 + 1);
}

function weatherCoeff(a: any): number {
  const w = a.env?.weather || 'clear';
  if (w === 'snow') return 0.60;
  if (w === 'fog') return 0.78;
  if (w === 'rain') return 0.85;
  if (w === 'heatwave') return 0.94;
  return 1.0;
}

function cargoKgFor(a: any, stage: Stage): number {
  return stage === 'driving' && !isRepositioning(a) ? (a.weight || 0) * 1000 : 0;
}

function mechFor(a: any, truck: any, stage: Stage, gradePct: number, now?: number) {
  const cargoKg = cargoKgFor(a, stage);
  
  // Dynamic Route Environment update:
  // Recalculate environmental conditions based on current position along the route.
  const isDh = a.stage === 'deadhead';
  const currentKm = isDh ? (a.dhTravelled || 0) : (a.kmTravelled || 0);
  const totalKm = isDh ? (a.dh || 0) : (a.km || 0);
  
  // Use getRouteEnv from systems/calc (imported in dispatch/execution and often globally available or via shared util)
  // Since trucks.journey.ts is deep, we re-evaluate using the injected environment logic if available.
  if (a.from && a.to) {
    const updatedEnv = (a.getRouteEnv || getRouteEnv)(a.from, a.to, currentKm, totalKm, now ?? Date.now(), a.simDay);
    if (
      updatedEnv.weather !== a.env?.weather ||
      updatedEnv.temp !== a.env?.temp ||
      updatedEnv.terrain !== a.env?.terrain
    ) {
      a.env = { ...(a.env || {}), ...updatedEnv };
    }
  }

  const ctx = {
    cargoWeightKg: cargoKg,
    gradientPct: gradePct,
    weatherCoeff: weatherCoeff(a),
    trailerType: isRepositioning(a) ? undefined : truck?.trailer,
    roadType: a.env?.terrain
  };
  return { ctx, mech: calculateMechanicalLimits(truck, ctx) };
}

/** What speed this driver wants to hold right now, limited by what the truck can physically do. */
export function cruiseTarget(a: any, truck: any, driver: any, mech: { maxAttainableSpeed: number }) {
  const trait = (driver?.trait || 'STANDARD') as keyof typeof DRIVER_TRAITS;
  const cfg = DRIVER_TRAITS[trait] || DRIVER_TRAITS.STANDARD;
  const fatigue = driver?.fatigue || 0;
  const skill = driver?.skill || 5;
  const fatiguePenalty = fatigue > 70 ? 0.2 : fatigue > 50 ? 0.1 : 0;
  const skillBonus = Math.min(0.1, (skill / 100) * 0.1);
  const perf = ((1 - fatiguePenalty) + skillBonus) * cfg.speedMod;
  const roadCoeff = a.from && resolveTruckRegion(a.from) === 'Africa' ? 0.85 : 1.0;
  const user = truck?.targetSpeed || truck?.cruiseSpeed || a.targetSpeed || 85;
  const target = Math.max(15, Math.min(mech.maxAttainableSpeed, user * weatherCoeff(a) * roadCoeff * perf));
  return { target, user, cfg };
}

function fatigueRate(driver: any): number {
  const trait = (driver?.trait || 'STANDARD') as keyof typeof DRIVER_TRAITS;
  const cfg = DRIVER_TRAITS[trait] || DRIVER_TRAITS.STANDARD;
  return FATIGUE_PER_SIM_HOUR * (cfg.fatigueMod || 1.0);
}

// ---------------------------------------------------------------------------
// Stage handling
// ---------------------------------------------------------------------------

function enterStage(a: any, stage: Stage, now: number, truck?: any) {
  a.stage = stage;
  a.stageStartedAt = now;
  const w = a.weight || 0;
  const repo = isRepositioning(a);
  switch (stage) {
    case 'loading':
      a.stageEndsAt = now + (repo ? STOPS.STAGE_MS : STOPS.loadMs(w));
      break;
    case 'unloading':
      a.stageEndsAt = now + (repo ? STOPS.STAGE_MS : STOPS.unloadMs(w));
      break;
    case 'resting':
      a.stageEndsAt = now + (a.restType === 'break' ? STOPS.BREAK_MS : STOPS.REST_MS);
      break;
    case 'refueling': {
      const cap = tankCapacity(truck);
      const missing = clamp((cap - (a.tankL ?? 0)) / cap, 0, 1);
      a.stageEndsAt = now + Math.round(STOPS.REFUEL_MS * (0.4 + 0.6 * missing));
      break;
    }
    default:
      a.stageEndsAt = undefined;
  }
  if (stage !== 'deadhead' && stage !== 'driving') {
    a.speedKmh = 0;
    a.throttlePct = 0;
    a.brakePct = 100;
    a.retarder = false;
    a.mode = stage;
  }

  // Push live event
  if (!a.events) a.events = [];
  let label = '';
  let type: 'info' | 'warn' | 'danger' | 'success' = 'info';
  let icon = '📌';

  if (stage === 'loading') {
    label = repo ? `Staged at ${a.from} warehouse pre-trip inspection.` : `Docked at shipper warehouse in ${a.from} for cargo loading.`;
    type = 'info';
    icon = '📦';
  } else if (stage === 'unloading') {
    label = `Arrived at consignee receiving dock in ${a.to}. Offloading freight.`;
    type = 'success';
    icon = '🏁';
  } else if (stage === 'resting') {
    label = `Pulling over at roadside motel / travel plaza for mandatory HOS rest.`;
    type = 'warn';
    icon = '☕';
  } else if (stage === 'refueling') {
    label = `Pulling into travel plaza fuel island for commercial diesel bunkering.`;
    type = 'info';
    icon = '⛽';
  } else if (stage === 'driving' || stage === 'deadhead') {
    label = stage === 'deadhead' ? `Deadheading empty to pickup point in ${a.from}.` : `Linehaul transit underway towards ${a.to}.`;
    type = 'info';
    icon = '🚚';
  }

  if (label) {
    a.events.unshift({ time: now, text: label, type, icon });
    if (a.events.length > 25) a.events.pop();
  }
}

/** Start (or restart, e.g. for round-trip leg 2) the journey state on a job. */
export function initJourney(a: any, truck: any, now: number) {
  const cap = tankCapacity(truck);
  a.kmTravelled = 0;
  a.dhTravelled = 0;
  a.speedKmh = 0;
  a.avgSpeedKmh = undefined;
  a.refuelLiters = 0;
  a.resumeStage = undefined;
  a.etaAt = undefined;
  a.throttlePct = 0;
  a.brakePct = 100;
  a.retarder = false;
  a.limitKmh = 0;
  a.mode = 'parking';
  a.gradePct = a.env?.roadGrade ?? 0.5;
  a.tankL = clamp(truck?.fluids?.fuel ?? cap, 0, cap);
  a.lastAdvanceAt = now;
  if (a.start === undefined) a.start = now;
  enterStage(a, (a.dh || 0) > 0.5 ? 'deadhead' : 'loading', now, truck);
  updateEta(a, truck, undefined, now, 0);
}

/** Idempotent. Upgrades jobs created before the journey engine existed. */
export function ensureJourney(a: any, truck: any, now: number) {
  if (a.stage) return;
  const legacyKm = typeof a.kmTravelled === 'number' ? a.kmTravelled : 0;
  initJourney(a, truck, now);
  if (legacyKm > 0 && legacyKm < (a.km || 0)) {
    a.dhTravelled = a.dh || 0;
    a.kmTravelled = legacyKm;
    enterStage(a, 'driving', now, truck);
  }
}

// ---------------------------------------------------------------------------
// Advance
// ---------------------------------------------------------------------------

export type JourneyIncident = RoadIncident;

export interface JourneyHooks {
  onRest?: (driver: any, restType?: 'break' | 'full') => void;
  onRefuel?: (truck: any) => void;
  onIncident?: (incident: RoadIncident, truck: any, driver: any) => void;
}

/**
 * Advance one active job to `now`. Safe to call every tick or after hours offline:
 * time is sliced so stage changes, rests and fuel stops are all simulated, not skipped.
 */
export function advanceJourney(a: any, truck: any, driver: any, now: number, hooks?: JourneyHooks) {
  ensureJourney(a, truck, now);
  let cursor = a.lastAdvanceAt ?? now;
  const total = now - cursor;

  if (total > 0 && a.stage !== 'done') {
    const sliceMs = clamp(Math.ceil(total / 2000), 1000, 10_000);
    while (cursor < now && a.stage !== 'done') {
      const dt = Math.min(sliceMs, now - cursor);
      cursor += dt;
      stepSlice(a, truck, driver, cursor, dt, hooks);
    }
  }

  a.lastAdvanceAt = now;
  updateEta(a, truck, driver, now, Math.max(0, total));
  if (truck) truck.fuelPct = Math.round(clamp(((a.tankL ?? 0) / tankCapacity(truck)) * 100, 0, 100) * 10) / 10;
}

function stepSlice(a: any, truck: any, driver: any, now: number, dt: number, hooks?: JourneyHooks) {
  switch (a.stage as Stage) {
    case 'loading':
    case 'unloading':
      return stepDock(a, truck, now, dt);
    case 'resting':
      return stepRest(a, truck, driver, now);
    case 'refueling':
      return stepRefuel(a, truck, now);
    case 'deadhead':
    case 'driving':
      return stepDrive(a, truck, driver, now, dt, hooks);
  }
}

function stepDock(a: any, truck: any, now: number, dt: number) {
  // Engine idling at the dock
  const idleL = IDLE_L_PER_SIM_HOUR * (dt / SIM_HOUR_MS);
  a.tankL = Math.max(0, (a.tankL ?? 0) - idleL);
  if (now >= (a.stageEndsAt ?? now)) {
    if (a.stage === 'loading') enterStage(a, 'driving', now, truck);
    else enterStage(a, 'done', now, truck);
  }
}

function stepRest(a: any, truck: any, driver: any, now: number) {
  const isBreak = a.restType === 'break';
  const dur = isBreak ? STOPS.BREAK_MS : STOPS.REST_MS;
  const left = Math.max(0, (a.stageEndsAt ?? now) - now);
  const progress = clamp(1 - left / dur, 0, 1);

  if (driver) {
    const f0 = a.restFatigue0 ?? driver.fatigue ?? 0;
    const targetFatigue = isBreak ? Math.max(0, f0 - 40) : 0;
    driver.fatigue = Math.round((f0 + (targetFatigue - f0) * progress) * 100) / 100;
  }
  if (now >= (a.stageEndsAt ?? now)) {
    if (driver) {
      if (isBreak) {
        const f0 = a.restFatigue0 ?? driver.fatigue ?? 0;
        driver.fatigue = Math.round(Math.max(0, f0 - 40) * 100) / 100;
      } else {
        driver.fatigue = 0;
        driver.hosHours = 0;
      }
      driver.hosRestUntil = null;
    }
    a.restFatigue0 = undefined;
    a.restType = undefined;
    const resume = (a.resumeStage || 'driving') as Stage;
    a.resumeStage = undefined;
    enterStage(a, resume, now, truck);
  }
}

function stepRefuel(a: any, truck: any, now: number) {
  const cap = tankCapacity(truck);
  const start = a.stageStartedAt ?? now;
  const end = a.stageEndsAt ?? now;
  const frac = end > start ? clamp((now - start) / (end - start), 0, 1) : 1;
  const from = a.refuelFrom ?? a.tankL ?? 0;
  const level = from + (cap - from) * frac;
  if (level > a.tankL) {
    a.refuelLiters = (a.refuelLiters || 0) + (level - a.tankL);
    a.tankL = level;
  }
  if (now >= end) {
    if (a.tankL < cap) {
      a.refuelLiters = (a.refuelLiters || 0) + (cap - a.tankL);
      a.tankL = cap;
    }
    if (truck?.fluids && (truck.fluids.adBlue ?? 100) < 25) {
      const defNeededPct = Math.max(0, 100 - (truck.fluids.adBlue ?? 100));
      a.defAddedL = (a.defAddedL || 0) + Math.round(defNeededPct * 0.75);
      truck.fluids.adBlue = 100;
    }
    const resume = (a.resumeStage || 'driving') as Stage;
    a.resumeStage = undefined;
    a.refuelFrom = undefined;
    enterStage(a, resume, now, truck);
  }
}

function stepDrive(a: any, truck: any, driver: any, now: number, dt: number, hooks?: JourneyHooks) {
  const isDh = a.stage === 'deadhead';
  const total = isDh ? (a.dh || 0) : (a.km || 0);
  const done0 = isDh ? (a.dhTravelled || 0) : (a.kmTravelled || 0);
  const rem = Math.max(0, total - done0);
  const grade = gradeAt(a, done0);
  const { ctx, mech } = mechFor(a, truck, a.stage, grade, now);
  const { target: cruise, user, cfg } = cruiseTarget(a, truck, driver, mech);

  // ---- speed envelope: cruise target, active road hazard caps, SCR/DEF derate, urban zones, braking curve
  let limit = cruise;
  let limiter: 'cruise' | 'zone' | 'approach' = 'cruise';
  if (truck?.fluids?.adBlue !== undefined && truck.fluids.adBlue < 5 && limit > 65) {
    limit = 65; // SCR/DEF Emissions Derate
    limiter = 'zone';
  }
  if (a.speedCapKmH && a.speedCapKmH < limit) {
    limit = a.speedCapKmH;
    limiter = 'zone';
  }
  const zoneNow = done0 < ZONE_KM || rem <= ZONE_KM ? ZONE_KMH : Infinity;
  const zoneAhead = Math.sqrt(ZONE_KMH ** 2 + 2 * BRAKE_KMH_PER_H * Math.max(0, rem - ZONE_KM));
  const zoneLimit = Math.min(zoneNow, zoneAhead);
  if (zoneLimit < limit) { limit = zoneLimit; limiter = 'zone'; }
  const approach = Math.sqrt(2 * BRAKE_KMH_PER_H * rem) + 6;
  if (approach < limit) { limit = approach; limiter = 'approach'; }

  // ---- speed integration (acceleration scales with power-to-weight)
  const v0 = a.speedKmh || 0;
  const dtS = dt * SIM_S_PER_MS;
  const accel = 0.25 + 0.9 * Math.min(1, mech.accelerationCoeff);
  let v1: number;
  let decel = 0;
  if (limit >= v0) {
    v1 = Math.min(limit, v0 + accel * dtS);
  } else {
    const rate = limiter === 'cruise' ? COAST_KMH_PER_S : BRAKE_KMH_PER_S;
    v1 = Math.max(limit, v0 - rate * dtS);
    decel = (v0 - v1) / dtS;
  }

  // ---- speed stability jitter (Phase 2: fatigue effect)
  const fatigue = driver?.fatigue || 0;
  if (fatigue > 60 && limiter === 'cruise') {
    const seed = (a.jobId || 0) + Math.floor(now / 5000);
    const noise = (deterministicRoll(seed) - 0.5) * ((fatigue - 50) / 50) * 12; // ±6 km/h at 100% fatigue
    v1 = Math.max(15, v1 + noise);
  }

  // ---- distance
  let dKm = ((v0 + v1) / 2) * (dt / SIM_HOUR_MS);
  let arrived = false;
  if (dKm >= rem || rem - dKm < 0.02) { dKm = rem; arrived = true; }
  if (isDh) a.dhTravelled = done0 + dKm; else a.kmTravelled = done0 + dKm;

  // ---- continuous mechanical wear (Phase 2)
  applyContinuousWear(truck, dKm, mech.wearRateMod, cfg.wearMod);

  // ---- fuel & live fluids: burn diesel + AdBlue (DEF), oil, coolant & transmission fluid per km
  const per100 = fuelPer100km(truck, ctx, (v0 + v1) / 2) * (cfg.fuelBurnMod || 1);
  const fuelUsedL = (per100 / 100) * dKm;
  a.instL100km = per100;
  a.tankL = Math.max(0, (a.tankL ?? 0) - fuelUsedL);
  if (truck?.fluids) {
    a.liveFluidsSynced = true;
    const defUsedPct = (fuelUsedL * 0.05 / 75) * 100; // 5% DEF dosing ratio on a 75L tank
    truck.fluids.adBlue = Math.max(0, Math.round(((truck.fluids.adBlue ?? 100) - defUsedPct) * 10000) / 10000);
    truck.fluids.oil = Math.max(0, Math.round(((truck.fluids.oil ?? 40) - dKm * 0.0025) * 10000) / 10000);
    const coolantRate = a.env?.weather === 'heatwave' ? 0.0045 : 0.0012;
    truck.fluids.coolant = Math.max(0, Math.round(((truck.fluids.coolant ?? 100) - dKm * coolantRate) * 10000) / 10000);
    truck.fluids.transmissionOil = Math.max(0, Math.round(((truck.fluids.transmissionOil ?? 100) - dKm * 0.0008) * 10000) / 10000);
  }

  // ---- throttle / brake / mode (what the dashboard shows)
  const massKg = ((TRUCK_MODELS[truck?.modelId] as any)?.weight || 8000) + ctx.cargoWeightKg;
  const topRef = Math.max(60, mech.maxAttainableSpeed * 1.15);
  const rollAero = 0.12 + 0.55 * (v1 / topRef) ** 2;
  const gradeLoad = Math.max(0, grade) * 0.035 * (massKg / 40000);
  const accelLoad = v1 > v0 ? Math.min(0.5, ((v1 - v0) / dtS) * 0.9) : 0;
  let throttle = decel > 0.3 ? 0 : clamp(rollAero + gradeLoad + accelLoad, 0.05, 1);
  let brake = decel > 0.8 ? clamp((decel / BRAKE_KMH_PER_S) * 100, 15, 100) : 0;
  const retarder = decel > 0.5 && v1 > 40;

  let mode: string;
  if (brake > 0) mode = 'braking';
  else if (v1 > v0 + 0.01 && v1 < limit - 1.5) mode = 'accelerating';
  else if (limiter !== 'cruise') mode = 'slow_down';
  else if (cfg.speedMod > 1.05 && cruise > user * 1.01) mode = 'speeding';
  else mode = 'cruising';

  a.speedKmh = v1;
  a.limitKmh = limit;
  a.gradePct = grade;
  a.throttlePct = Math.round(throttle * 100);
  a.brakePct = Math.round(brake);
  a.retarder = retarder;
  a.mode = mode;

  // Long-window moving average of cruising speed: this is what the ETA trusts (not the instant speed).
  if (limiter === 'cruise' && v1 > 20 && v1 >= limit - 1) { // only once actually up to cruise speed
    const alpha = 1 - Math.exp(-dt / 120_000);
    a.avgSpeedKmh = a.avgSpeedKmh === undefined ? v1 : a.avgSpeedKmh + (v1 - a.avgSpeedKmh) * alpha;
  }

  // ---- driver fatigue & HOS hours
  const hours = dt / SIM_HOUR_MS;
  if (driver) {
    driver.fatigue = Math.min(100, (driver.fatigue || 0) + fatigueRate(driver) * hours);
    driver.hosHours = (driver.hosHours || 0) + hours;
  }

  // ---- deterministic en-route road events, incidents & accidents (checked every 25 km)
  const legKmDone = isDh ? (a.dhTravelled || 0) : (a.kmTravelled || 0);
  if (a.speedCapUntilKm && legKmDone >= a.speedCapUntilKm) {
    a.speedCapKmH = undefined;
    a.speedCapUntilKm = undefined;
  }

  const nextCheck = a.nextIncidentCheckKm ?? INCIDENT_CHECK_INTERVAL_KM;
  let forceRestNow = false;
  if (!arrived && legKmDone >= nextCheck) {
    a.nextIncidentCheckKm = nextCheck + INCIDENT_CHECK_INTERVAL_KM;
    const comp = truck?.components || {};
    const triggered = evaluateRoadEvents(
      {
        jobId: a.id || 1,
        truckId: truck?.id || 1,
        legKmDone,
        isDeadhead: isDh,
        isRepositioning: isRepositioning(a),
        mode: mode === 'speeding' ? 'speeding' : a.ecoMode ? 'eco' : 'normal',
        weather: a.env?.weather || 'clear',
        gradePct: grade,
        cargoWeightTonnes: a.weight || 0,
        riskMod: cfg.riskMod || 1.0,
        driverSkill: driver?.skill || 1,
        driverFatigue: driver?.fatigue || 0,
        driverHosHours: driver?.hosHours || 0,
        hasRegNo: Boolean(truck?.regNo),
        components: {
          engine: comp.engine?.health ?? 100,
          brakes: comp.brakes?.health ?? 100,
          tires: comp.tires?.health ?? 100,
          suspension: comp.suspension?.health ?? 100,
          windshield: comp.windshield?.health ?? 100
        },
        coolant: truck?.fluids?.coolant ?? 100,
        now
      },
      a,
      truck,
      driver
    );

    if (triggered.length > 0) {
      if (!a.incidents) a.incidents = [];
      if (!a.events) a.events = [];
      for (const inc of triggered) {
        a.incidents.push(inc);
        if (inc.forceRest) forceRestNow = true;
        hooks?.onIncident?.(inc, truck, driver);

        const incType = inc.severity === 'critical' || inc.severity === 'major' ? 'danger' : 'warn';
        const incIcon = inc.type === 'speeding_ticket' ? '👮' : inc.type === 'accident' ? '💥' : inc.type === 'breakdown' ? '🔧' : '⚠️';
        a.events.unshift({ time: now, text: inc.description || inc.message || 'En-route road incident recorded.', type: incType, icon: incIcon });
        if (a.events.length > 25) a.events.pop();
      }
    }
  }

  // ---- arrival
  if (arrived) {
    a.speedKmh = 0;
    a.nextIncidentCheckKm = undefined;
    a.speedCapKmH = undefined;
    a.speedCapUntilKm = undefined;
    enterStage(a, isDh ? 'loading' : 'unloading', now, truck);
    return;
  }

  // ---- mandatory HOS rest or fatigue break
  if (driver && (forceRestNow || (driver.hosHours || 0) >= HOS_MAX_HOURS || (driver.fatigue || 0) >= REST_AT_FATIGUE)) {
    const needsFullRest = (driver.hosHours || 0) >= HOS_MAX_HOURS || (driver.hosHours || 0) >= 8.5;
    a.restType = needsFullRest ? 'full' : 'break';
    a.resumeStage = a.stage;
    a.restFatigue0 = driver.fatigue;
    enterStage(a, 'resting', now, truck);
    driver.hosRestUntil = a.stageEndsAt;
    hooks?.onRest?.(driver, a.restType);
    return;
  }

  // ---- fuel stop (only if we can't make it to the end of this leg)
  const cap = tankCapacity(truck);
  const pct = ((a.tankL ?? 0) / cap) * 100;
  const rangeKm = (a.tankL ?? 0) / Math.max(0.01, per100 / 100);
  if (pct <= 0.5 || (pct < REFUEL_BELOW_PCT && rangeKm < rem + 25)) {
    a.resumeStage = a.stage;
    a.refuelFrom = a.tankL;
    enterStage(a, 'refueling', now, truck);
    hooks?.onRefuel?.(truck);
  }
}

// ---------------------------------------------------------------------------
// ETA (Google-Maps style): remaining distance / smoothed speed + stops still to come
// ---------------------------------------------------------------------------

export interface EtaBreakdown {
  driveKm: number;
  driveMs: number;
  stopMs: number;
  totalMs: number;
  planSpeedKmh: number;
}

export function computeEta(a: any, truck: any, driver: any, now: number): EtaBreakdown {
  const w = a.weight || 0;
  const cap = tankCapacity(truck);
  const timed = a.stage === 'loading' || a.stage === 'unloading' || a.stage === 'resting' || a.stage === 'refueling';
  const stageLeft = timed ? Math.max(0, (a.stageEndsAt ?? now) - now) : 0;
  const stage: Stage = (a.stage === 'resting' || a.stage === 'refueling' ? a.resumeStage || 'driving' : a.stage) as Stage;

  let driveKm = 0;
  let stopMs = stageLeft;
  const dhLeft = Math.max(0, (a.dh || 0) - (a.dhTravelled || 0));
  const kmLeft = Math.max(0, (a.km || 0) - (a.kmTravelled || 0));
  const repo = isRepositioning(a);
  const loadMs = repo ? STOPS.STAGE_MS : STOPS.loadMs(w);
  const unloadMs = repo ? STOPS.STAGE_MS : STOPS.unloadMs(w);

  switch (stage) {
    case 'deadhead': driveKm = dhLeft + (a.km || 0); stopMs += loadMs + unloadMs; break;
    case 'loading': driveKm = a.km || 0; stopMs += unloadMs; break;      // stageLeft = loading remaining
    case 'driving': driveKm = kmLeft; stopMs += unloadMs; break;
    case 'unloading': break;                                             // stageLeft = unloading remaining
    default: break;
  }

  // Planning speed: long-window average; before we have one, seed from the cruise target.
  let plan = a.avgSpeedKmh;
  if (plan === undefined) {
    const g = a.env?.roadGrade ?? 0.5;
    const { mech } = mechFor(a, truck, stage === 'deadhead' ? 'deadhead' : 'driving', g, now);
    plan = cruiseTarget(a, truck, driver, mech).target * 0.97;
  }
  plan = Math.max(25, plan);

  const hours = driveKm / plan;
  const driveMs = hours * SIM_HOUR_MS;

  // Rests & breaks we will have to take
  if (driver && hours > 0) {
    const rate = fatigueRate(driver);
    const f = a.stage === 'resting' ? 0 : driver.fatigue || 0;
    const h = a.stage === 'resting' ? 0 : driver.hosHours || 0;
    const untilHos = Math.max(0, HOS_MAX_HOURS - h);
    const fullRests = hours > untilHos ? 1 + Math.floor((hours - untilHos) / HOS_MAX_HOURS) : 0;
    const untilFatigue = Math.max(0, REST_AT_FATIGUE - f) / rate;
    const perBreak = 40 / rate;
    const totalBreaks = hours > untilFatigue ? 1 + Math.floor((hours - untilFatigue) / perBreak) : 0;
    const extraBreaks = Math.max(0, totalBreaks - fullRests);
    stopMs += fullRests * STOPS.REST_MS + extraBreaks * STOPS.BREAK_MS;
  }

  // Fuel stops we will have to take
  if (driveKm > 0) {
    const g = a.env?.roadGrade ?? 0.5;
    const ctx = { cargoWeightKg: stage === 'deadhead' || repo ? 0 : w * 1000, gradientPct: g, weatherCoeff: weatherCoeff(a) };
    const lPerKm = Math.max(0.01, fuelPer100km(truck, ctx, plan) / 100);
    const reserve = cap * (REFUEL_BELOW_PCT / 100);
    const usable = Math.max(0, (a.stage === 'refueling' ? cap : a.tankL ?? cap) - reserve);
    const rangeKm = usable / lPerKm;
    const perTank = (cap - reserve) / lPerKm;
    const stops = driveKm > rangeKm ? 1 + Math.floor((driveKm - rangeKm) / Math.max(1, perTank)) : 0;
    stopMs += stops * STOPS.REFUEL_MS;
  }

  return { driveKm, driveMs, stopMs, totalMs: driveMs + stopMs, planSpeedKmh: plan };
}

export function forceRestJourney(a: any, truck: any, now: number) {
  ensureJourney(a, truck, now);
  a.resumeStage = (a.stage === 'deadhead' ? 'deadhead' : 'driving');
  a.restType = 'full';
  a.restFatigue0 = 50;
  enterStage(a, 'resting', now, truck);
}

function updateEta(a: any, truck: any, driver: any, now: number, dt: number) {
  if (a.stage === 'done') {
    a.etaAt = now;
    a.end = now;
    a.remainingDriveKm = 0;
    return;
  }
  const eta = computeEta(a, truck, driver, now);
  const target = now + eta.totalMs;
  if (a.etaAt === undefined || !isFinite(a.etaAt)) {
    a.etaAt = target;
  } else {
    // Ease toward the new estimate (≈10 s time constant) so the counter never jumps.
    const alpha = 1 - Math.exp(-dt / 10_000);
    a.etaAt = a.etaAt + (target - a.etaAt) * alpha;
  }
  a.etaAt = Math.max(a.etaAt, now + 1000);
  a.end = Math.round(a.etaAt);
  a.remainingDriveKm = eta.driveKm;
  a.remainingStopMs = eta.stopMs;
  a.planSpeedKmh = eta.planSpeedKmh;
}
