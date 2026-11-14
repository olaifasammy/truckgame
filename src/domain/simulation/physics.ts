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

  // 1. Mass Calculation (Tractor + Cargo)
  const tractorMassKg = model.weight || 8000;
  const totalMassKg = tractorMassKg + context.cargoWeightKg;

  // 2. Power-to-Weight Ratio
  // Typical: 400hp for 40,000kg (0.01 hp/kg)
  const hp = model.stats?.power || 400;
  const hpPerKg = hp / totalMassKg;
  
  // 3. Health Impacts (Surgical Mechanical Degradation)
  const engineHealth = truck.engineHealth ?? 100;
  const transmissionHealth = truck.transmissionHealth ?? 100;
  const tireHealth = truck.tireHealth ?? 100;

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

  // Acceleration capability (lower for heavier loads)
  const accelerationCoeff = Math.max(0.1, (hpPerKg / 0.05) * mechanicalMod);

  return {
    maxAttainableSpeed: Math.round(maxAttainableSpeed * 100) / 100,
    accelerationCoeff: Math.round(accelerationCoeff * 100) / 100,
    isLimpMode,
    powerReservePct: Math.round(mechanicalMod * 100)
  };
}
