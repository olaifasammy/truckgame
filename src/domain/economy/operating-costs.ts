import { Truck } from '../trucks/trucks.types';
import { fuelCostForTrip } from '../trucks/trucks.physics';

/**
 * Authoritative calculations for operating expenditures.
 * Following Engineering Constitution Section 6.3 (Economic Simulation).
 */
export const OperatingCosts = {
  /**
   * Calculates the estimated or actual fuel cost for a given job.
   * 
   * @param km Distance in kilometers.
   * @param weight Cargo weight in tonnes.
   * @param truck Optional truck instance. If omitted, uses a baseline highway consumption model.
   * @returns Cost in minor currency units (or rounded integer for simplicity, per current implementation).
   */
  calculateFuelCost(km: number, weight: number, truck?: Truck): number {
    if (truck) {
      return Math.round(fuelCostForTrip(km, truck, weight));
    }
    
    // Baseline highway efficiency model: 33L/100km at $1.00/L (Standard European/African Highway Mix)
    // This replaces the previous magic number with a documented baseline.
    const baselineConsumptionL100 = 33;
    const estimatedPricePerLiter = 1.00; 
    return Math.round((km / 100) * baselineConsumptionL100 * estimatedPricePerLiter);
  }
};
