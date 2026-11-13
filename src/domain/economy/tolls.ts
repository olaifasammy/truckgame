/**
 * Highway Tolls & Customs Tariffs Domain Engine
 * Calculates variable interstate toll fees, cargo weight wear surcharges,
 * international border tariffs, and EZ-Pass subscription discounts.
 */

import { LOCATIONS } from '../../data/world';

export interface TollCalculationResult {
  baseToll: number;
  weightSurcharge: number;
  crossBorderTariff: number;
  discountApplied: boolean;
  totalTollCost: number;
}

/**
 * Calculate total trip toll cost based on distance, cargo payload weight, and route geography.
 */
export function calculateTripToll(km: number, weight: number, originCity: string, destinationCity: string, hasEzPass: boolean = true): TollCalculationResult {
  const baseRatePerKm = 0.24; // $0.24 / km standard toll road / highway fee
  const baseToll = km * baseRatePerKm;

  // Weight surcharge: heavier trucks cause more highway wear (+1.5% per ton)
  const weightSurcharge = weight * 0.015 * baseToll;

  // Cross-border / Inter-region customs tariff check
  const upperFrom = originCity ? originCity.toUpperCase() : '';
  const upperTo = destinationCity ? destinationCity.toUpperCase() : '';
  const locFrom = LOCATIONS[upperFrom] || Object.values(LOCATIONS).find(l => l.name.toUpperCase() === upperFrom);
  const locTo = LOCATIONS[upperTo] || Object.values(LOCATIONS).find(l => l.name.toUpperCase() === upperTo);

  let crossBorderTariff = 0;
  if (locFrom && locTo && locFrom.region !== locTo.region) {
    crossBorderTariff = 180; // $180 interstate / international border customs clearance fee
  }

  let subtotal = baseToll + weightSurcharge + crossBorderTariff;

  // EZ-Pass Subscription discount (30% off)
  let discountApplied = false;
  if (hasEzPass) {
    subtotal *= 0.70;
    discountApplied = true;
  }

  const totalTollCost = Math.round(Math.max(25, subtotal));

  return {
    baseToll: Math.round(baseToll),
    weightSurcharge: Math.round(weightSurcharge),
    crossBorderTariff,
    discountApplied,
    totalTollCost
  };
}
