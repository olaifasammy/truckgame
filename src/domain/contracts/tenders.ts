/**
 * Enterprise 30-Day Corporate Tenders & Contracts of Affreightment Engine
 *
 * Implements dynamic, competitive Request For Proposals (RFPs), corridor-specific
 * multi-load linehaul commitments, strict SLA enforcement, and volume bonus payouts.
 */

import { LOCATIONS } from '../../data/world';
import { REGIONAL_HUBS } from '../logistics/network';
import { CARGO_TYPES } from '../cargo/registry';

export interface CorporateTender {
  id: string;
  client: string;
  industry: string;
  lane: string;
  from: string;
  to: string;
  region: string;
  cargoType: string;
  trailerRequired: string;
  durationDays: number;
  ratePerDelivery: number;
  slaTarget: number; // e.g. 96%
  requiredCerts: string[];
  minFleetSize: number;
  minReputation: number;
  totalLoads: number;
  completedLoads: number;
  loadsRemaining: number;
  bonusPayout: number;
  desc: string;
  icon: string;
  expiresAtMs: number;
  startDate?: number;
  bonusAwarded?: boolean;
}

export interface ClientTemplate {
  client: string;
  industry: string;
  cargoId: string;
  trailerRequired: string;
  icon: string;
  desc: string;
  requiredCerts: string[];
  minFleetSize: number;
  minReputation: number;
  baseRateMultiplier: number;
}

const CLIENT_TEMPLATES: ClientTemplate[] = [
  {
    client: 'Continental Automotive AG',
    industry: 'Automotive & Heavy Powertrains',
    cargoId: 'industrial_machinery',
    trailerRequired: 'curtain',
    icon: '🚗',
    desc: 'High-frequency linehaul transporting vehicle sub-assemblies and transmission modules between assembly plants.',
    requiredCerts: [],
    minFleetSize: 1,
    minReputation: 80,
    baseRateMultiplier: 1.15
  },
  {
    client: 'BASF Chemical Logistics Europe',
    industry: 'Energy & ADR Petrochemicals',
    cargoId: 'gasoline',
    trailerRequired: 'tanker',
    icon: '☣️',
    desc: 'Regulated chemical and refined fuel distribution demanding dedicated hazmat-certified tanker drivers.',
    requiredCerts: ['ADR Hazmat'],
    minFleetSize: 2,
    minReputation: 95,
    baseRateMultiplier: 1.45
  },
  {
    client: 'Nordic Cold Chain Solutions',
    industry: 'Food & Temperature-Controlled Perishables',
    cargoId: 'frozen_fish',
    trailerRequired: 'reefer',
    icon: '❄️',
    desc: 'Critical cold-chain corridor moving perishable seafood and dairy under continuous temperature telematics.',
    requiredCerts: ['Cold Chain'],
    minFleetSize: 1,
    minReputation: 85,
    baseRateMultiplier: 1.30
  },
  {
    client: 'Apex Semiconductor & Microelectronics',
    industry: 'High-Tech & Precision Electronics',
    cargoId: 'electronics',
    trailerRequired: 'box',
    icon: '🖥️',
    desc: 'Air-ride secure linehaul delivering sensitive silicon wafers and server blade arrays between fab hubs.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 100,
    baseRateMultiplier: 1.35
  },
  {
    client: 'Dangote Industrial & Infrastructure Ltd',
    industry: 'Heavy Mining & Construction Aggregates',
    cargoId: 'steel_pipes',
    trailerRequired: 'flatbed',
    icon: '⛏️',
    desc: 'Heavy industrial flatbed haulage transporting structural steel beams and drilling equipment for port expansion.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 90,
    baseRateMultiplier: 1.25
  },
  {
    client: 'Pacific Aerospace & Defense Logistics',
    industry: 'Aerospace & Strategic Components',
    cargoId: 'aviation_parts',
    trailerRequired: 'lowboy',
    icon: '🛰️',
    desc: 'Classified transport of high-value propulsion assemblies and turbine modules between regional aerospace hubs.',
    requiredCerts: [],
    minFleetSize: 3,
    minReputation: 110,
    baseRateMultiplier: 1.60
  },
  {
    client: 'Maersk Intermodal Overland Drayage',
    industry: 'Containerized Ocean Port Drayage',
    cargoId: 'general_freight',
    trailerRequired: 'container',
    icon: '🚢',
    desc: 'Scheduled maritime intermodal container runs linking deepwater port terminals to inland rail dry docks.',
    requiredCerts: [],
    minFleetSize: 2,
    minReputation: 85,
    baseRateMultiplier: 1.20
  },
  {
    client: 'Pfizer BioPharma Distribution Trust',
    industry: 'Specialized Pharmaceuticals & Vaccines',
    cargoId: 'vaccines',
    trailerRequired: 'reefer',
    icon: '💉',
    desc: 'Ultra-low temperature cryogenic vaccine transport requiring strict 99% on-time delivery compliance.',
    requiredCerts: ['Cold Chain'],
    minFleetSize: 2,
    minReputation: 105,
    baseRateMultiplier: 1.50
  }
];

/**
 * Calculates straight highway distance between two city locations in kilometers.
 */
function getLaneDistance(cityA: string, cityB: string): number {
  const locA = LOCATIONS[cityA];
  const locB = LOCATIONS[cityB];
  if (!locA || !locB) return 500;
  const dx = locA.x - locB.x;
  const dy = locA.y - locB.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 1.8) + 120;
}

/**
 * Generates dynamic, competitive 30-day corporate tenders calibrated to player's
 * unlocked operating regions, actual highway corridors, and market pricing.
 */
export function getDynamicCorporateTenders(S: any): CorporateTender[] {
  const unlockedRegions = S.unlockedRegions || ['Europe', 'North America'];
  const now = Date.now();
  // 6-hour dynamic rotation cycle
  const cycleSeed = Math.floor(now / (1000 * 60 * 60 * 6));
  
  // Group cities by region
  const citiesByRegion: Record<string, string[]> = {};
  for (const [key, loc] of Object.entries(LOCATIONS)) {
    if (!citiesByRegion[loc.region]) citiesByRegion[loc.region] = [];
    citiesByRegion[loc.region].push(key);
  }

  const generatedTenders: CorporateTender[] = [];

  CLIENT_TEMPLATES.forEach((tpl, idx) => {
    // Pick an unlocked region for this tender
    const eligibleRegions = unlockedRegions.filter(r => citiesByRegion[r] && citiesByRegion[r].length >= 2);
    if (eligibleRegions.length === 0) return;
    
    const regionIdx = (idx + cycleSeed) % eligibleRegions.length;
    const region = eligibleRegions[regionIdx];
    const cities = citiesByRegion[region] || ['ROTTERDAM', 'MUNICH'];

    const fromCity = cities[(idx * 2 + cycleSeed) % cities.length];
    let toCity = cities[(idx * 2 + 1 + cycleSeed) % cities.length];
    if (toCity === fromCity) {
      toCity = cities[(cities.indexOf(fromCity) + 1) % cities.length];
    }

    const distKm = getLaneDistance(fromCity, toCity);

    // Realistic volume commitment: 10 to 24 consignments over 30 days
    const totalLoads = 10 + ((idx * 3 + cycleSeed) % 15);
    
    // Dynamic enterprise pricing calibrated to distance and industry multiplier
    const ratePerKm = 11.5 * tpl.baseRateMultiplier;
    const rawRate = Math.round((distKm * ratePerKm) / 250) * 250;
    const ratePerDelivery = Math.max(4500, Math.min(55000, rawRate));

    // Lucrative completion bonus: 25% to 35% of total contract value
    const totalContractValue = ratePerDelivery * totalLoads;
    const bonusPayout = Math.round((totalContractValue * 0.30) / 5000) * 5000;

    const expiresAtMs = (cycleSeed + 1) * (1000 * 60 * 60 * 6);

    const tenderId = `tender_${tpl.cargoId}_${idx}`;

    generatedTenders.push({
      id: tenderId,
      client: tpl.client,
      industry: tpl.industry,
      lane: `${fromCity} ⇄ ${toCity}`,
      from: fromCity,
      to: toCity,
      region,
      cargoType: tpl.cargoId,
      trailerRequired: tpl.trailerRequired,
      durationDays: 30,
      ratePerDelivery,
      slaTarget: 95 + (idx % 4), // 95% - 98%
      requiredCerts: tpl.requiredCerts,
      minFleetSize: tpl.minFleetSize,
      minReputation: tpl.minReputation,
      totalLoads,
      completedLoads: 0,
      loadsRemaining: totalLoads,
      bonusPayout,
      desc: `${tpl.desc} Dedicated lane: ${fromCity} ⇄ ${toCity} (${distKm} km).`,
      icon: tpl.icon,
      expiresAtMs
    });
  });

  return generatedTenders;
}

/**
 * Sign an exclusive 30-day corporate tender
 */
export function signCorporateTender(S: any, tenderId: string): boolean {
  if (!S.corporateTenders) S.corporateTenders = [];
  
  if (S.corporateTenders.some((t: any) => t.id === tenderId)) {
    return false;
  }

  const tenders = getDynamicCorporateTenders(S);
  const tenderDef = tenders.find(t => t.id === tenderId);
  if (!tenderDef) return false;

  // Prerequisites check
  const fleetSize = S.fleet?.length || 0;
  if (fleetSize < tenderDef.minFleetSize) {
    return false;
  }

  const reputation = S.reputation ?? 100;
  if (reputation < tenderDef.minReputation) {
    return false;
  }

  if (tenderDef.requiredCerts.length > 0) {
    const hasCerts = tenderDef.requiredCerts.every(c => {
      if (c === 'ADR Hazmat') return S.licenses?.includes('adr_hazmat');
      if (c === 'Cold Chain') return S.licenses?.includes('cold_chain');
      return true;
    });
    if (!hasCerts) return false;
  }

  S.corporateTenders.push({
    ...JSON.parse(JSON.stringify(tenderDef)),
    startDate: Date.now(),
    completedLoads: 0,
    loadsRemaining: tenderDef.totalLoads,
    bonusAwarded: false
  });

  return true;
}
