/**
 * Authoritative Fuel Market & Dynamic Regional Pricing Model.
 * Owns business logic for:
 * - Location & Region-based retail fuel pricing (Europe, Africa, America, Asia)
 * - Wholesale bulk fuel discounts (20% terminal discount off local market rate)
 * - Daily crude market index price fluctuations (±5% market volatility)
 */

import { LOCATIONS } from '../../data/world';
import { REGIONAL_HUBS } from '../logistics/network';

// Base regional diesel station retail prices ($/Liter)
export const REGIONAL_BASE_FUEL_PRICES: Record<string, number> = {
  Europe: 1.85,  // EU fuel duties & carbon taxes (€1.65 - €1.85/L)
  America: 1.25, // US Interstate diesel ($4.75/gal)
  Asia: 1.40,    // Pacific / East Asian commercial diesel
  Africa: 0.85   // Regional crude refining & regional subsidies
};

/**
 * Calculates the dynamic retail station price per liter for commercial diesel
 * at a specific location, accounting for region, local taxes, and crude market index.
 */
export function getRegionalRetailFuelPrice(locationOrRegion: string, S?: any): number {
  let regionName = 'Europe';

  if (locationOrRegion) {
    const loc = LOCATIONS[locationOrRegion.toUpperCase()];
    if (loc) {
      regionName = loc.region;
    } else {
      const hub = REGIONAL_HUBS.find(h => 
        h.id.toLowerCase() === locationOrRegion.toLowerCase() || 
        h.city.toLowerCase() === locationOrRegion.toLowerCase()
      );
      if (hub) regionName = hub.region;
      else if (['Europe', 'America', 'Asia', 'Africa'].includes(locationOrRegion)) {
        regionName = locationOrRegion;
      }
    }
  }

  const basePrice = REGIONAL_BASE_FUEL_PRICES[regionName] || 1.85;

  // Global crude market volatility index (if state exists, ±5% price variance based on simulation day)
  let marketModifier = 1.0;
  if (S && S.simulationDay) {
    const daySeed = (S.simulationDay * 17) % 11; // 0 to 10
    marketModifier = 0.95 + (daySeed * 0.01);   // 0.95 to 1.05
  }

  return parseFloat((basePrice * marketModifier).toFixed(2));
}

/**
 * Calculates the wholesale bulk terminal fuel price per liter for an owned hub facility.
 * Grants a 20% bulk wholesale discount off the local regional market retail station price.
 */
export function getHubWholesaleFuelPrice(hubIdOrCity: string, S?: any): number {
  const retailPrice = getRegionalRetailFuelPrice(hubIdOrCity, S);
  // 20% bulk wholesale discount off local retail station price
  const wholesalePrice = retailPrice * 0.80;
  return parseFloat(wholesalePrice.toFixed(2));
}
