import { Truck, TruckModel } from '../trucks/trucks.types';
import { Driver } from '../drivers/drivers.types';
import { TRUCK_MODELS } from '../trucks/trucks.data';

/**
 * NexHaul Physics Engine - Phase 1: Mechanical Foundation
 * Responsible for deterministic calculation of vehicle performance.
 */

export interface PhysicsContext {
  cargoWeightKg: number;
  gradientPct: number; // 0 is flat, 5 is steep hill
  weatherCoeff: number; // 1.0 is perfect, 0.5 is blizzard
  trailerType?: string; // e.g. 'curtain', 'reefer', 'double_trailer', or undefined for bobtail
  roadType?: string; // Phase 2: asphalt, gravel, dirt, etc.
}

const TRAILER_TARE_KG: Record<string, number> = {
  curtain: 6500,
  reefer: 7500,
  tanker: 7200,
  hazmat: 7200,
  lowboy: 9800,
  flatbed: 6000,
  double_trailer: 13500,
  tipper: 8000,
  carrier: 7600,
  container: 6800
};

const TRAILER_CDA_MOD: Record<string, number> = {
  curtain: 1.0,
  reefer: 1.06,
  tanker: 0.92,
  hazmat: 0.92,
  lowboy: 0.95,
  flatbed: 0.88,
  double_trailer: 1.24,
  tipper: 0.98,
  carrier: 1.12,
  container: 1.02
};

export const BASE_WEAR_COEFFICIENTS: Record<string, number> = {
  engine: 0.0005,
  transmission: 0.0004,
  brakes: 0.0008,
  tires: 0.0012,
  suspension: 0.0006,
  windshield: 0.0001,
  oilFilter: 0.0025,
  fuelFilter: 0.0020,
  airFilter: 0.0015
};

function getComponentHealth(truck: any, part: string, legacyField?: string): number {
  const comp = truck?.components || {};
  const val = comp[part]?.health ?? (legacyField ? truck?.[legacyField] : undefined) ?? 100;
  return Math.max(0, Math.min(100, val));
}

export function getTrailerTareKg(trailerType?: string): number {
  return trailerType ? (TRAILER_TARE_KG[trailerType] ?? 6500) : 0;
}

export interface PerformanceResult {
  maxAttainableSpeed: number;
  accelerationCoeff: number; // 0 to 1 scaling
  isLimpMode: boolean;
  powerReservePct: number;
  instantL100km?: number;
  wearRateMod: number; // Phase 2: base wear multiplier
}

const ROAD_COEFFS: Record<string, { rollingResistance: number; traction: number }> = {
  asphalt: { rollingResistance: 1.0, traction: 1.0 },
  wet_pavement: { rollingResistance: 1.05, traction: 0.82 },
  icy_road: { rollingResistance: 1.15, traction: 0.35 },
  gravel: { rollingResistance: 1.25, traction: 0.70 },
  dirt: { rollingResistance: 1.45, traction: 0.55 },
  mountain_pass: { rollingResistance: 1.02, traction: 0.92 },
  desert_corridor: { rollingResistance: 1.08, traction: 0.88 }
};

/**
 * Fuel use (L/100km) at an arbitrary speed. Same model as calculateMechanicalLimits,
 * but evaluated at the speed the truck is actually doing (journey engine uses this per tick).
 * Floor of 0.6 so crawling is never "free" (low-gear / stop-start inefficiency).
 */
export function fuelPer100km(truck: any, context: PhysicsContext, speedKmh: number): number {
  const model = TRUCK_MODELS[truck?.modelId] as any;
  const trailerType = context.trailerType ?? truck?.trailer;
  const trailerTareKg = getTrailerTareKg(trailerType);
  const totalMassKg = (model?.weight || 8000) + trailerTareKg + context.cargoWeightKg;
  const base = model?.stats?.fuelConsumption || 32;
  const loadFactor = (totalMassKg / 10000) * 1.5;
  const gradeFactor = context.gradientPct > 0 ? context.gradientPct * 4 : 0;

  const road = ROAD_COEFFS[context.roadType || 'asphalt'] || ROAD_COEFFS.asphalt;

  const tireHealth = getComponentHealth(truck, 'tires', 'tireHealth') / 100;
  const airFilterHealth = getComponentHealth(truck, 'airFilter') / 100;
  const fuelFilterHealth = getComponentHealth(truck, 'fuelFilter') / 100;
  const engineHealth = getComponentHealth(truck, 'engine', 'engineHealth') / 100;

  const weatherCoeff = Math.max(0.4, Math.min(1.0, context.weatherCoeff ?? 1.0));
  const weatherRollPenalty = 1 + (1 - weatherCoeff) * 0.45;
  const tireRollPenalty = 1 + (1 - tireHealth) * 0.25;
  const roadPenalty = road.rollingResistance;
  const cdaMod = trailerType ? (TRAILER_CDA_MOD[trailerType] ?? 1.0) : 0.72;
  const efficiencyPenalty = 1 + (1 - airFilterHealth) * 0.08 + (1 - fuelFilterHealth) * 0.08 + (1 - engineHealth) * 0.12;

  const speedFactor = Math.max(0.6, (speedKmh / 80) ** 2);

  // Dynamic Upgrade Effects on Fuel Economy
  const upgrades = truck.upgrades || {};
  const ecoLevel = Math.max(0, Math.min(3, Number(upgrades.ecoTuning) || 0));
  const chipLevel = Math.max(0, Math.min(3, Number(upgrades.performanceChip) || 0));
  const ecoFuelMod = 1 - ecoLevel * 0.05; // -5% fuel burn per Eco-Tuning level
  const chipFuelMod = 1 + chipLevel * 0.025; // +2.5% fuel burn per Performance Chip level
  const axleFuelMod = upgrades.axleRatio === 'highway_eco' ? 0.93 : upgrades.axleRatio === 'heavy_diff_lock' ? 1.04 : 1.0;
  const tireFuelMod = upgrades.tireCompound === 'highway_eco' ? 0.95 : upgrades.tireCompound === 'all_terrain_winter' ? 1.04 : 1.0;

  return (base + loadFactor + gradeFactor) * speedFactor * cdaMod * weatherRollPenalty * tireRollPenalty * roadPenalty * efficiencyPenalty * ecoFuelMod * chipFuelMod * axleFuelMod * tireFuelMod;
}

// Phase 2: Driver Trait Configurations
export const DRIVER_TRAITS = {
  speed_demon: {
    speedMod: 1.12,
    fuelBurnMod: 1.25,
    wearMod: 1.20,
    riskMod: 1.50
  },
  eco_driver: {
    speedMod: 0.90,
    fuelBurnMod: 0.82,
    wearMod: 0.85,
    riskMod: 0.70
  },
  careful: {
    speedMod: 0.85,
    fuelBurnMod: 0.90,
    wearMod: 0.75,
    riskMod: 0.50
  },
  iron_man: {
    speedMod: 1.0,
    fuelBurnMod: 1.0,
    wearMod: 1.0,
    riskMod: 1.0,
    fatigueMod: 0.75
  },
  heavy_hauler: {
    speedMod: 0.95,
    fuelBurnMod: 1.05,
    wearMod: 1.10,
    riskMod: 1.0
  },
  night_owl: {
    speedMod: 1.0,
    fuelBurnMod: 1.0,
    wearMod: 1.0,
    riskMod: 0.9
  },
  STANDARD: {
    speedMod: 1.0,
    fuelBurnMod: 1.0,
    wearMod: 1.0,
    riskMod: 1.0
  }
};

export function deterministicRoll(seed: number): number {
  let x = (seed | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967296;
}

/**
 * Applies continuous physical wear to truck components based on distance and load.
 */
export function applyContinuousWear(
  truck: any,
  distanceKm: number,
  wearRateMod: number,
  traitWearMod: number = 1.0
) {
  if (!truck.components) return;
  const totalMod = wearRateMod * traitWearMod;

  for (const [part, baseWear] of Object.entries(BASE_WEAR_COEFFICIENTS)) {
    if (!truck.components[part]) {
      truck.components[part] = { health: 100 };
    }
    const wear = baseWear * distanceKm * totalMod;
    truck.components[part].health = Math.max(0, Math.round((truck.components[part].health - wear) * 1000) / 1000);
  }
}

/**
 * Calculates the absolute physical limits of a truck under specific load/terrain.
 */
export function calculateMechanicalLimits(
  truck: Truck,
  context: PhysicsContext
): PerformanceResult {
  const model = TRUCK_MODELS[truck.modelId];
  if (!model) {
    return { maxAttainableSpeed: 80, accelerationCoeff: 0.5, isLimpMode: false, powerReservePct: 100 };
  }

  // 1. Mass Calculation (Tractor + Trailer Tare + Cargo)
  const tractorMassKg = model.weight || 8000;
  const trailerType = context.trailerType ?? (truck as any).trailer;
  const trailerTareKg = getTrailerTareKg(trailerType);
  const totalMassKg = tractorMassKg + trailerTareKg + context.cargoWeightKg;

  // 2. Power-to-Weight Ratio
  // Typical: 400hp for 40,000kg (0.01 hp/kg)
  const hp = model.stats?.power || 400;
  const hpPerKg = hp / totalMassKg;
  
  // 3. Health Impacts (Surgical Mechanical Degradation)
  // Fleet code stores health under truck.components.<part>.health; flat fields are legacy fallbacks.
  const engineHealth = getComponentHealth(truck, 'engine', 'engineHealth');
  const transmissionHealth = getComponentHealth(truck, 'transmission', 'transmissionHealth');
  const tireHealth = getComponentHealth(truck, 'tires', 'tireHealth');
  const brakeHealth = getComponentHealth(truck, 'brakes');
  const airFilterHealth = getComponentHealth(truck, 'airFilter');
  const fuelFilterHealth = getComponentHealth(truck, 'fuelFilter');

  let isLimpMode = false;
  let mechanicalMod = 1.0;

  // Engine: Critical failure below 25%
  if (engineHealth < 25) {
    isLimpMode = true;
    mechanicalMod *= 0.4; // 40% power max
  } else if (engineHealth < 60) {
    mechanicalMod *= 0.85; // 15% power loss
  }

  // Transmission: Gear slipping impact
  if (transmissionHealth < 40) {
    mechanicalMod *= 0.9;
  }

  // Dirty air/fuel filters starve engine at high load
  if (airFilterHealth < 50 || fuelFilterHealth < 50) {
    mechanicalMod *= 0.94;
  }

  // Tires & Brakes: Safety speed cap when severely worn
  if (tireHealth < 35) {
    mechanicalMod *= 0.88;
  }
  if (brakeHealth < 35) {
    mechanicalMod *= 0.85;
  }

  // 4. Terrain, Weather, Load & Upgrade Physics
  const upgrades = truck.upgrades || {};
  const chipLevel = Math.max(0, Math.min(3, Number(upgrades.performanceChip) || 0));
  const gearboxGradeMod = upgrades.gearbox === '16spd_crawler' ? 0.60 : 1.0; // -40% uphill speed loss
  const gearboxTopSpeedMod = upgrades.gearbox === '16spd_crawler' ? 0.96 : 1.0;
  const axleGradeMod = upgrades.axleRatio === 'heavy_diff_lock' ? 0.75 : 1.0;
  const axleTopSpeedMod = upgrades.axleRatio === 'highway_eco' ? 1.04 : 1.0;
  const chipPowerMod = 1 + chipLevel * 0.06; // +6% top speed / power per chip level
  const tractionUpgradeMod =
    (upgrades.axleRatio === 'heavy_diff_lock' ? 1.15 : 1.0) *
    (upgrades.tireCompound === 'all_terrain_winter' ? 1.20 : upgrades.tireCompound === 'heavy_traction' ? 1.15 : 1.0);

  // Speed is reduced by 10km/h for every 1% of positive gradient at max load (mitigated by crawler gearbox & heavy diff)
  const gradientPenalty = Math.max(0, context.gradientPct * (totalMassKg / 10000) * 2 * gearboxGradeMod * axleGradeMod);
  const weatherCoeff = Math.max(0.4, Math.min(1.0, context.weatherCoeff ?? 1.0));
  const road = ROAD_COEFFS[context.roadType || 'asphalt'] || ROAD_COEFFS.asphalt;
  
  // 5. Final Result Construction
  const baseTopSpeed = (model.topSpeed || 120) * chipPowerMod * gearboxTopSpeedMod * axleTopSpeedMod;
  
  // Max speed is capped by power-to-weight, mechanical health, weather traction, and uphill drag
  const effectiveRoadTraction = Math.min(1.0, road.traction * tractionUpgradeMod);
  const environmentalTraction = Math.min(weatherCoeff, effectiveRoadTraction);
  let maxAttainableSpeed = (baseTopSpeed * mechanicalMod * (0.6 + 0.4 * environmentalTraction)) - gradientPenalty;

  // Safety floor: even a struggling truck crawls at 15km/h unless engine is 0%
  if (engineHealth > 0) {
    maxAttainableSpeed = Math.max(15, maxAttainableSpeed);
  } else {
    maxAttainableSpeed = 0;
  }

  const instantL100km = fuelPer100km(truck, context, maxAttainableSpeed);

  // Acceleration capability (lower for heavier loads, boosted by crawler gearbox & chip)
  const gearboxAccelMod = upgrades.gearbox === '16spd_crawler' ? 1.15 : 1.0;
  const accelerationCoeff = Math.max(0.1, (hpPerKg / 0.05) * mechanicalMod * effectiveRoadTraction * chipPowerMod * gearboxAccelMod);

  // Phase 3: Wear rate scales with load, terrain, road roughness & heavy-duty suspension
  const suspMod = upgrades.heavyDutySuspension ? 0.75 : 1.0;
  const loadWearMod = 1.0 + (context.cargoWeightKg / 25000) * 0.5 * suspMod;
  const roadWearMod = 1.0 + (road.rollingResistance - 1.0) * 2.0 * suspMod;
  const wearRateMod = loadWearMod * roadWearMod * (1.1 - 0.1 * weatherCoeff);

  return {
    maxAttainableSpeed: Math.round(maxAttainableSpeed * 100) / 100,
    accelerationCoeff: Math.round(accelerationCoeff * 100) / 100,
    isLimpMode,
    powerReservePct: Math.round(mechanicalMod * 100),
    instantL100km: Math.round(instantL100km * 100) / 100,
    wearRateMod: Math.round(wearRateMod * 100) / 100
  };
}
