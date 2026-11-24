/**
 * Domain Model for Regional Hub Characteristics, Specialties, and Limits.
 * Owns business rules for:
 * - Hub Economic Tiers (Tier 1 Mega-Hub, Tier 2 Regional Terminal, Tier 3 Feeder Depot)
 * - Daily Freight Job Limits & Daily Payload Tonnage Capacities
 * - Base Fuel Tank & Berth Storage Capacities
 * - Cargo Sector Specialties & Dynamic Revenue Multipliers
 * - Dynamic Hub Acquisition Price Valuation
 */

import { REGIONAL_HUBS, RegionalHub } from '../logistics/network';

export type HubTier = 1 | 2 | 3;

export type HubSpecialtyId = 
  | 'containers' 
  | 'petroleum' 
  | 'automotive' 
  | 'heavy_machinery' 
  | 'perishables' 
  | 'minerals' 
  | 'general';

export interface HubSpecialtyDef {
  id: HubSpecialtyId;
  name: string;
  icon: string;
  rateBonusPct: number;
  description: string;
}

export const HUB_SPECIALTY_DEFS: Record<HubSpecialtyId, HubSpecialtyDef> = {
  containers: {
    id: 'containers',
    name: 'Maritime Container Drayage',
    icon: '🚢',
    rateBonusPct: 20,
    description: 'High-density ocean port container handling & intermodal transshipment.'
  },
  petroleum: {
    id: 'petroleum',
    name: 'Petrochemicals & ADR Fuel',
    icon: '☣️',
    rateBonusPct: 25,
    description: 'Specialized liquid tankers, refined fuels, and hazardous ADR reagents.'
  },
  automotive: {
    id: 'automotive',
    name: 'Automotive & Machinery Components',
    icon: '🚗',
    rateBonusPct: 18,
    description: 'High-value vehicle chassis, powertrains, and precision industrial assemblies.'
  },
  heavy_machinery: {
    id: 'heavy_machinery',
    name: 'Oversized Heavy Equipment',
    icon: '🏗️',
    rateBonusPct: 30,
    description: 'Lowboy trailers, mining excavators, cranes, and structural steel beams.'
  },
  perishables: {
    id: 'perishables',
    name: 'Cryogenic Cold Chain',
    icon: '❄️',
    rateBonusPct: 22,
    description: 'Refrigerated vaccines, fresh produce, seafood, and temperature-sensitive food.'
  },
  minerals: {
    id: 'minerals',
    name: 'Bulk Mining & Raw Ore',
    icon: '💎',
    rateBonusPct: 15,
    description: 'Heavy side-tippers, raw bauxite, copper cathode, and industrial aggregate.'
  },
  general: {
    id: 'general',
    name: 'General Commercial Freight',
    icon: '📦',
    rateBonusPct: 10,
    description: 'Standard curtainside, FMCG palletized merchandise, and dry van goods.'
  }
};

export interface HubCharacteristics {
  hubId: string;
  city: string;
  name: string;
  region: string;
  tier: HubTier;
  tierLabel: string;
  specialties: HubSpecialtyDef[];
  dailyJobLimit: number;          // Maximum available jobs posted at this hub per day
  dailyTonnageCapacity: number;   // Maximum total payload tonnes available per day
  baseFuelTankLiters: number;     // Initial diesel fuel storage capacity
  baseBerths: number;             // Initial truck parking berths
  demandMultiplier: number;       // Base freight pay multiplier for contracts here
  calculatedCost: number;         // Authoritative calculated purchase price
}

// Custom specialized configurations for key strategic hubs
const CUSTOM_HUB_PROFILES: Record<string, Partial<HubCharacteristics>> = {
  hub_rotterdam: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.heavy_machinery, HUB_SPECIALTY_DEFS.perishables],
    dailyJobLimit: 24,
    dailyTonnageCapacity: 4500,
    baseFuelTankLiters: 45000,
    baseBerths: 6,
    demandMultiplier: 1.25
  },
  hub_shanghai: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.automotive, HUB_SPECIALTY_DEFS.heavy_machinery],
    dailyJobLimit: 26,
    dailyTonnageCapacity: 5000,
    baseFuelTankLiters: 50000,
    baseBerths: 6,
    demandMultiplier: 1.30
  },
  hub_lagos: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.petroleum, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 20,
    dailyTonnageCapacity: 3800,
    baseFuelTankLiters: 35000,
    baseBerths: 5,
    demandMultiplier: 1.20
  },
  hub_chicago: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.automotive, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 22,
    dailyTonnageCapacity: 4000,
    baseFuelTankLiters: 40000,
    baseBerths: 6,
    demandMultiplier: 1.25
  },
  hub_los_angeles: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.perishables, HUB_SPECIALTY_DEFS.automotive],
    dailyJobLimit: 24,
    dailyTonnageCapacity: 4200,
    baseFuelTankLiters: 45000,
    baseBerths: 6,
    demandMultiplier: 1.28
  },
  hub_tokyo: {
    tier: 1,
    specialties: [HUB_SPECIALTY_DEFS.automotive, HUB_SPECIALTY_DEFS.perishables, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 20,
    dailyTonnageCapacity: 3800,
    baseFuelTankLiters: 35000,
    baseBerths: 5,
    demandMultiplier: 1.22
  },
  hub_munich: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.automotive, HUB_SPECIALTY_DEFS.petroleum, HUB_SPECIALTY_DEFS.heavy_machinery],
    dailyJobLimit: 14,
    dailyTonnageCapacity: 2400,
    baseFuelTankLiters: 22000,
    baseBerths: 4,
    demandMultiplier: 1.10
  },
  hub_dallas: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.petroleum, HUB_SPECIALTY_DEFS.general, HUB_SPECIALTY_DEFS.automotive],
    dailyJobLimit: 16,
    dailyTonnageCapacity: 2600,
    baseFuelTankLiters: 25000,
    baseBerths: 5,
    demandMultiplier: 1.12
  },
  hub_lyon: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.perishables, HUB_SPECIALTY_DEFS.petroleum, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 13,
    dailyTonnageCapacity: 2200,
    baseFuelTankLiters: 20000,
    baseBerths: 4,
    demandMultiplier: 1.08
  },
  hub_algiers: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.petroleum, HUB_SPECIALTY_DEFS.containers],
    dailyJobLimit: 12,
    dailyTonnageCapacity: 2000,
    baseFuelTankLiters: 20000,
    baseBerths: 4,
    demandMultiplier: 1.05
  },
  hub_kano: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.minerals, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 10,
    dailyTonnageCapacity: 1800,
    baseFuelTankLiters: 16000,
    baseBerths: 4,
    demandMultiplier: 1.00
  },
  hub_almaty: {
    tier: 2,
    specialties: [HUB_SPECIALTY_DEFS.minerals, HUB_SPECIALTY_DEFS.heavy_machinery, HUB_SPECIALTY_DEFS.petroleum],
    dailyJobLimit: 12,
    dailyTonnageCapacity: 2100,
    baseFuelTankLiters: 20000,
    baseBerths: 4,
    demandMultiplier: 1.05
  },
  hub_innsbruck: {
    tier: 3,
    specialties: [HUB_SPECIALTY_DEFS.heavy_machinery, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 7,
    dailyTonnageCapacity: 1250,
    baseFuelTankLiters: 10000,
    baseBerths: 3,
    demandMultiplier: 0.95
  },
  hub_gaborone: {
    tier: 3,
    specialties: [HUB_SPECIALTY_DEFS.minerals, HUB_SPECIALTY_DEFS.general],
    dailyJobLimit: 6,
    dailyTonnageCapacity: 1200,
    baseFuelTankLiters: 9000,
    baseBerths: 3,
    demandMultiplier: 0.90
  }
};

/**
 * Calculates the authoritative acquisition cost of a hub based on its capabilities.
 */
export function calculateHubCost(tier: HubTier, berths: number, fuelTankLiters: number, dailyJobs: number, dailyTonnage: number): number {
  const baseTierCost = tier === 1 ? 160000 : tier === 2 ? 110000 : 65000;
  const berthsValuation = berths * 8500;
  const fuelTankValuation = (fuelTankLiters / 1000) * 1200;
  const capacityValuation = (dailyJobs * 1800) + (dailyTonnage * 45);

  const rawTotal = baseTierCost + berthsValuation + fuelTankValuation + capacityValuation;
  // Round to nearest 5,000 for clean economic pricing
  return Math.round(rawTotal / 5000) * 5000;
}

/**
 * Resolves full characteristics for any hub by ID or city name.
 */
export function getHubCharacteristics(hubIdOrCity: string): HubCharacteristics {
  const cleanKey = (hubIdOrCity || '').trim();
  const rawHub: RegionalHub | undefined = REGIONAL_HUBS.find(h => 
    h.id.toLowerCase() === cleanKey.toLowerCase() || 
    h.city.toUpperCase() === cleanKey.toUpperCase()
  );

  const hubId = rawHub ? rawHub.id : cleanKey.startsWith('hub_') ? cleanKey : `hub_${cleanKey.toLowerCase()}`;
  const city = rawHub ? rawHub.city : cleanKey.toUpperCase();
  const name = rawHub ? rawHub.name : `${city} Hub Terminal`;
  const region = rawHub ? rawHub.region : 'Africa';
  const rawCost = rawHub ? rawHub.cost : 125000;

  const custom = CUSTOM_HUB_PROFILES[hubId];

  // Derive Tier
  let tier: HubTier = 2;
  if (custom?.tier) {
    tier = custom.tier;
  } else if (rawCost >= 180000) {
    tier = 1;
  } else if (rawCost <= 100000) {
    tier = 3;
  }

  const tierLabel = tier === 1 ? 'Tier 1: Global Mega-Hub' : tier === 2 ? 'Tier 2: Regional Terminal' : 'Tier 3: Feeder & Border Depot';

  // Derive Daily Jobs Limit
  const dailyJobLimit = custom?.dailyJobLimit || (tier === 1 ? 20 : tier === 2 ? 11 : 7);

  // Derive Daily Tonnage Capacity
  const dailyTonnageCapacity = custom?.dailyTonnageCapacity || (tier === 1 ? 3800 : tier === 2 ? 2200 : 1200);

  // Derive Base Fuel Tank
  const baseFuelTankLiters = custom?.baseFuelTankLiters || (tier === 1 ? 35000 : tier === 2 ? 18000 : 10000);

  // Derive Base Berths
  const baseBerths = custom?.baseBerths || (rawHub ? rawHub.berths : (tier === 1 ? 5 : tier === 2 ? 4 : 3));

  // Derive Demand Multiplier
  const demandMultiplier = custom?.demandMultiplier || (tier === 1 ? 1.20 : tier === 2 ? 1.05 : 0.92);

  // Derive Specialties
  let specialties = custom?.specialties;
  if (!specialties || specialties.length === 0) {
    if (tier === 1) {
      specialties = [HUB_SPECIALTY_DEFS.containers, HUB_SPECIALTY_DEFS.general];
    } else if (tier === 2) {
      specialties = [HUB_SPECIALTY_DEFS.general, HUB_SPECIALTY_DEFS.minerals];
    } else {
      specialties = [HUB_SPECIALTY_DEFS.general];
    }
  }

  const calculatedCost = calculateHubCost(tier, baseBerths, baseFuelTankLiters, dailyJobLimit, dailyTonnageCapacity);

  return {
    hubId,
    city,
    name,
    region,
    tier,
    tierLabel,
    specialties,
    dailyJobLimit,
    dailyTonnageCapacity,
    baseFuelTankLiters,
    baseBerths,
    demandMultiplier,
    calculatedCost: Math.max(rawCost, calculatedCost)
  };
}

/**
 * Calculates sector rate bonus when a cargo type matches a hub's specialties.
 */
export function getHubSectorBonus(hubIdOrCity: string, cargoCategoryOrId: string): number {
  const char = getHubCharacteristics(hubIdOrCity);
  if (!char || !cargoCategoryOrId) return 1.0;

  const catLower = cargoCategoryOrId.toLowerCase();
  for (const spec of char.specialties) {
    if (
      (spec.id === 'containers' && (catLower.includes('container') || catLower.includes('sea'))) ||
      (spec.id === 'petroleum' && (catLower.includes('fuel') || catLower.includes('adr') || catLower.includes('chemical') || catLower.includes('oil'))) ||
      (spec.id === 'automotive' && (catLower.includes('auto') || catLower.includes('car') || catLower.includes('machinery'))) ||
      (spec.id === 'heavy_machinery' && (catLower.includes('lowboy') || catLower.includes('heavy') || catLower.includes('crane'))) ||
      (spec.id === 'perishables' && (catLower.includes('reefer') || catLower.includes('cold') || catLower.includes('food') || catLower.includes('pharma'))) ||
      (spec.id === 'minerals' && (catLower.includes('mineral') || catLower.includes('ore') || catLower.includes('bauxite') || catLower.includes('mining')))
    ) {
      return 1.0 + (spec.rateBonusPct / 100);
    }
  }

  return 1.0;
}

export interface HubDailyUsage {
  day: number;
  jobsCount: number;
  tonnageCount: number;
}

/**
 * Gets or initializes the daily usage record for a hub on the current simulation day.
 */
export function getHubDailyUsage(S: any, hubIdOrCity: string): HubDailyUsage {
  if (!S) return { day: 1, jobsCount: 0, tonnageCount: 0 };
  if (!S.hubDailyUsage) S.hubDailyUsage = {};
  const currentDay = S.simulationDay || 1;
  const char = getHubCharacteristics(hubIdOrCity);
  const canonicalKey = char.hubId.toLowerCase();
  const legacyKey = (hubIdOrCity || '').toLowerCase();
  
  let record = S.hubDailyUsage[canonicalKey];
  if (!record && legacyKey !== canonicalKey && S.hubDailyUsage[legacyKey]) {
    record = S.hubDailyUsage[legacyKey];
    S.hubDailyUsage[canonicalKey] = record;
    delete S.hubDailyUsage[legacyKey];
  }

  if (!record || record.day !== currentDay) {
    record = { day: currentDay, jobsCount: 0, tonnageCount: 0 };
    S.hubDailyUsage[canonicalKey] = record;
  }
  return record;
}

/**
 * Records a job dispatch against a hub's daily tonnage and job capacity.
 */
export function recordHubJobDispatched(S: any, hubIdOrCity: string, cargoTonnage: number = 20): void {
  const usage = getHubDailyUsage(S, hubIdOrCity);
  usage.jobsCount += 1;
  usage.tonnageCount += Math.max(1, cargoTonnage || 20);
}

/**
 * Returns the effective daily job limit for a hub accounting for facility upgrade level (+3 jobs/day per level).
 */
export function getHubEffectiveDailyJobLimit(S: any, hubIdOrCity: string): number {
  const char = getHubCharacteristics(hubIdOrCity);
  if (!S) return char.dailyJobLimit;
  const facility = S.hubFacilities?.[char.hubId];
  const level = facility?.level || 1;
  return char.dailyJobLimit + (level - 1) * 3;
}

/**
 * Returns the effective daily tonnage capacity for a hub accounting for facility upgrade level (+500 tonnes/day per level).
 */
export function getHubEffectiveDailyTonnageCapacity(S: any, hubIdOrCity: string): number {
  const char = getHubCharacteristics(hubIdOrCity);
  if (!S) return char.dailyTonnageCapacity;
  const facility = S.hubFacilities?.[char.hubId];
  const level = facility?.level || 1;
  return char.dailyTonnageCapacity + (level - 1) * 500;
}

/**
 * Checks if a hub has exceeded its daily job limit or tonnage capacity for the current simulation day.
 */
export function isHubDailyLimitReached(S: any, hubIdOrCity: string, extraTonnage: number = 0): boolean {
  if (!S) return false;
  const maxTonnage = getHubEffectiveDailyTonnageCapacity(S, hubIdOrCity);
  const usage = getHubDailyUsage(S, hubIdOrCity);

  if ((usage.tonnageCount + extraTonnage) > maxTonnage) return true;
  return false;
}

/**
 * Checks if both origin and destination are owned hubs in the company network,
 * returning a realistic network corridor synergy rate multiplier (+8% terminal savings).
 */
export function getHubNetworkSynergyBonus(S: any, fromCity: string, toCity: string): { isNetworkCorridor: boolean; rateMultiplier: number } {
  if (!S || !S.depots || S.depots.length < 2) {
    return { isNetworkCorridor: false, rateMultiplier: 1.0 };
  }

  const ownedCities = (S.depots || []).map((depotId: string) => {
    const hub = REGIONAL_HUBS.find(h => h.id === depotId);
    return hub ? hub.city.toUpperCase() : null;
  }).filter(Boolean);

  const fromUpper = (fromCity || '').toUpperCase();
  const toUpper = (toCity || '').toUpperCase();

  const isCorridor = ownedCities.includes(fromUpper) && ownedCities.includes(toUpper) && fromUpper !== toUpper;

  return {
    isNetworkCorridor: isCorridor,
    rateMultiplier: isCorridor ? 1.08 : 1.0
  };
}
