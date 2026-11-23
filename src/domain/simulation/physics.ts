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
}

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

  const tireHealth = getComponentHealth(truck, 'tires', 'tireHealth') / 100;
  const airFilterHealth = getComponentHealth(truck, 'airFilter') / 100;
  const fuelFilterHealth = getComponentHealth(truck, 'fuelFilter') / 100;
  const engineHealth = getComponentHealth(truck, 'engine', 'engineHealth') / 100;

  const weatherCoeff = Math.max(0.4, Math.min(1.0, context.weatherCoeff ?? 1.0));
  const weatherRollPenalty = 1 + (1 - weatherCoeff) * 0.45;
  const tireRollPenalty = 1 + (1 - tireHealth) * 0.25;
  const cdaMod = trailerType ? (TRAILER_CDA_MOD[trailerType] ?? 1.0) : 0.72;
  const efficiencyPenalty = 1 + (1 - airFilterHealth) * 0.08 + (1 - fuelFilterHealth) * 0.08 + (1 - engineHealth) * 0.12;

  const speedFactor = Math.max(0.6, (speedKmh / 80) ** 2);
  return (base + loadFactor + gradeFactor) * speedFactor * cdaMod * weatherRollPenalty * tireRollPenalty * efficiencyPenalty;
}

// Phase 2: Driver Trait Configurations
export const DRIVER_TRAITS = {
  SPEED_DEMON: {
    speedMod: 1.12,      // Pushes 12% above target cruise (if physics allow)
    fuelBurnMod: 1.25,   // 25% higher fuel consumption
    wearMod: 1.20,       // 20% faster component wear
    riskMod: 1.50        // Higher chance of road incidents
  },
  ECO_DRIVER: {
    speedMod: 0.90,      // Caps speed at 90% of target for efficiency
    fuelBurnMod: 0.82,   // 18% fuel savings
    wearMod: 0.85,       // 15% less wear
    riskMod: 0.70        // Safer driving
  },
  CAREFUL: {
    speedMod: 0.95,
    fuelBurnMod: 0.95,
    wearMod: 0.90,
    riskMod: 0.50
  },
  STANDARD: {
    speedMod: 1.0,
    fuelBurnMod: 1.0,
    wearMod: 1.0,
    riskMod: 1.0
  }
};

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

  // 4. Terrain, Weather & Load Physics
  // Speed is reduced by 10km/h for every 1% of positive gradient at max load
  const gradientPenalty = Math.max(0, context.gradientPct * (totalMassKg / 10000) * 2);
  const weatherCoeff = Math.max(0.4, Math.min(1.0, context.weatherCoeff ?? 1.0));
  
  // 5. Final Result Construction
  const baseTopSpeed = model.topSpeed || 120;
  
  // Max speed is capped by power-to-weight, mechanical health, weather traction, and uphill drag
  let maxAttainableSpeed = (baseTopSpeed * mechanicalMod * (0.7 + 0.3 * weatherCoeff)) - gradientPenalty;

  // Safety floor: even a struggling truck crawls at 15km/h unless engine is 0%
  if (engineHealth > 0) {
    maxAttainableSpeed = Math.max(15, maxAttainableSpeed);
  } else {
    maxAttainableSpeed = 0;
  }

  const instantL100km = fuelPer100km(truck, context, maxAttainableSpeed);

  // Acceleration capability (lower for heavier loads)
  const accelerationCoeff = Math.max(0.1, (hpPerKg / 0.05) * mechanicalMod);

  return {
    maxAttainableSpeed: Math.round(maxAttainableSpeed * 100) / 100,
    accelerationCoeff: Math.round(accelerationCoeff * 100) / 100,
    isLimpMode,
    powerReservePct: Math.round(mechanicalMod * 100),
    instantL100km: Math.round(instantL100km * 100) / 100
  };
}
