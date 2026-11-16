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
  const totalMassKg = (model?.weight || 8000) + context.cargoWeightKg;
  const base = model?.stats?.fuelConsumption || 32;
  const loadFactor = (totalMassKg / 10000) * 1.5;
  const gradeFactor = context.gradientPct > 0 ? context.gradientPct * 4 : 0;
  const speedFactor = Math.max(0.6, (speedKmh / 80) ** 2);
  return (base + loadFactor + gradeFactor) * speedFactor;
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

  // 1. Mass Calculation (Tractor + Cargo)
  const tractorMassKg = model.weight || 8000;
  const totalMassKg = tractorMassKg + context.cargoWeightKg;

  // 2. Power-to-Weight Ratio
  // Typical: 400hp for 40,000kg (0.01 hp/kg)
  const hp = model.stats?.power || 400;
  const hpPerKg = hp / totalMassKg;
  
  // 3. Health Impacts (Surgical Mechanical Degradation)
  // Fleet code stores health under truck.components.<part>.health; flat fields are legacy fallbacks.
  const comp = (truck as any).components || {};
  const engineHealth = comp.engine?.health ?? (truck as any).engineHealth ?? 100;
  const transmissionHealth = comp.transmission?.health ?? (truck as any).transmissionHealth ?? 100;
  const tireHealth = comp.tires?.health ?? (truck as any).tireHealth ?? 100;

  let isLimpMode = false;
  let mechanicalMod = 1.0;

  // Engine: Critical failure below 20%
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

  // 4. Terrain & Load Physics
  // Speed is reduced by 10km/h for every 1% of positive gradient at max load
  const gradientPenalty = Math.max(0, context.gradientPct * (totalMassKg / 10000) * 2);
  
  // 5. Final Result Construction
  const baseTopSpeed = model.topSpeed || 120;
  
  // Max speed is capped by power-to-weight, mechanical health, and uphill drag
  let maxAttainableSpeed = (baseTopSpeed * mechanicalMod) - gradientPenalty;

  // Safety floor: even a struggling truck crawls at 15km/h unless engine is 0%
  if (engineHealth > 0) {
    maxAttainableSpeed = Math.max(15, maxAttainableSpeed);
  } else {
    maxAttainableSpeed = 0;
  }

  // Base fuel consumption in L/100km (unloaded, flat ground, 80 km/h)
  const baseL100km = model.stats?.fuelConsumption || 32;
  
  // Phase 3: Dynamic Physics-Based Fuel Burn
  // We use maxAttainableSpeed as the baseline for drag calculation at this mechanical state
  const loadFactor = (totalMassKg / 10000) * 1.5; // +1.5L per 10t
  const speedFactor = (maxAttainableSpeed / 80) ** 2; // Aero drag is square of speed
  const gradeFactor = context.gradientPct > 0 ? (context.gradientPct * 4) : 0; // +4L per 1% grade
  
  const instantL100km = (baseL100km + loadFactor + gradeFactor) * speedFactor;

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
