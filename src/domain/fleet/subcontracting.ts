/**
 * Fleet & Trailer Subcontracting Charter Engine
 *
 * Implements realistic chartering of idle commercial tractors and storage yard trailers
 * to premier global logistics alliances (DHL, Maersk, FedEx, DB Schenker) with dynamic
 * asset-calibrated daily retainer rates ($2,400 - $6,800/day per rig; $950 - $2,200/day per trailer).
 */

import { TRUCK_MODELS } from '../trucks/trucks.data';
import { toast } from '../../core/ui';
import { pushNote } from '../../systems/notify';

export interface AlliancePartner {
  id: string;
  name: string;
  specialty: string;
  minTier: number;
  rateMultiplier: number;
  icon: string;
  badge: string;
}

export const ALLIANCE_PARTNERS: AlliancePartner[] = [
  {
    id: 'dhl_global',
    name: 'DHL Global Forwarding Priority',
    specialty: 'Express European Linehaul & Automotive Hubs',
    minTier: 0,
    rateMultiplier: 1.05,
    icon: '📦',
    badge: 'EXPEDITED LINEHAUL'
  },
  {
    id: 'maersk_intermodal',
    name: 'Maersk Inland Intermodal Services',
    specialty: 'Deepwater Container Drayage & Port Rail Corridors',
    minTier: 1,
    rateMultiplier: 1.15,
    icon: '🚢',
    badge: 'OCEAN INTERMODAL'
  },
  {
    id: 'fedex_freight',
    name: 'FedEx Freight Direct Commercial',
    specialty: 'High-Volume Palletized LTL & Hub-to-Hub',
    minTier: 0,
    rateMultiplier: 1.08,
    icon: '✈️',
    badge: 'SCHEDULED TRUNK'
  },
  {
    id: 'schenker_automotive',
    name: 'DB Schenker Automotive & Heavy Charter',
    specialty: 'Heavy Industrial Components & 6x4 Powertrains',
    minTier: 1,
    rateMultiplier: 1.20,
    icon: '🚆',
    badge: 'HEAVY INDUSTRIAL'
  },
  {
    id: 'kuehne_pharma',
    name: 'Kuehne+Nagel Pharma & Cryo Logistics',
    specialty: 'Strict Temperature-Controlled Cold Chain Rigs',
    minTier: 2,
    rateMultiplier: 1.28,
    icon: '❄️',
    badge: 'COLD CHAIN ALLIANCE'
  }
];

export const BASE_TRAILER_CHARTER_RATES: Record<string, number> = {
  reefer: 1450,       // Cold-chain refrigerated trailers
  tanker: 1750,       // Chemical / Fuel ADR tankers
  lowboy: 1950,       // Heavy equipment lowbeds
  double_trailer: 1650,// High-capacity B-double setups
  flatbed: 1100,      // Structural flatbeds
  curtain: 1050,      // Curtainsider standard
  rigid_box: 950      // Dry van freight box
};

/**
 * Calculates dynamic, realistic daily charter rate for a specific commercial tractor.
 * Sized realistically between $2,400/day and $6,800/day based on specs, horsepower,
 * truck replacement cost, and wear condition.
 */
export function calculateTruckCharterRate(truck: any, allianceMultiplier = 1.0): number {
  if (!truck) return 2500;
  const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'] || { price: 150000, hp: 500 };
  
  // 1. Base rate derived from vehicle replacement investment ($2,000 baseline)
  const priceBase = (model.price || 150000) * 0.015; // e.g. $180k truck -> $2,700 base
  
  // 2. Horsepower premium ($2.50 per engine HP)
  const hpBonus = (model.hp || 500) * 2.5; // e.g. 730HP -> $1,825
  
  // 3. Condition factor (well-maintained trucks earn full charter; beat-up trucks discounted)
  const condition = (truck.condition ?? 100) / 100;
  const conditionFactor = 0.85 + (condition * 0.15); // 0.85x to 1.0x

  // 4. Heavy axle configuration premium (8x4 / 6x4)
  const axleBonus = truck.axles === '8x4' ? 650 : truck.axles === '6x4' ? 350 : 0;

  const rawDaily = (priceBase + hpBonus + axleBonus) * conditionFactor * allianceMultiplier;
  
  // Round to nearest $50 for clean commercial invoicing
  return Math.max(2400, Math.min(6800, Math.round(rawDaily / 50) * 50));
}

/**
 * Calculates dynamic daily charter rate for an idle storage yard trailer.
 */
export function calculateTrailerCharterRate(trailerType: string, allianceMultiplier = 1.0): number {
  const base = BASE_TRAILER_CHARTER_RATES[trailerType] || 1000;
  return Math.round((base * allianceMultiplier) / 25) * 25;
}

/**
 * Computes authoritative total daily subcontract retainer cashflow across all
 * chartered tractors and trailers in the company.
 */
export function getTotalSubcontractInflow(S: any): number {
  let totalDailyInflow = 0;

  // 1. Subcontracted Fleet Tractors
  const subcontractedTruckIds: number[] = S.subcontractedTrucks || [];
  const fleet = S.fleet || [];

  for (const truckId of subcontractedTruckIds) {
    const truck = fleet.find((t: any) => t.id === truckId);
    if (truck) {
      totalDailyInflow += calculateTruckCharterRate(truck);
    } else {
      totalDailyInflow += 2800; // safe baseline fallback
    }
  }

  // 2. Subcontracted Storage Yard Trailers
  const subcontractedTrailers: string[] = S.subcontractedTrailers || [];
  for (const trType of subcontractedTrailers) {
    totalDailyInflow += calculateTrailerCharterRate(trType);
  }

  return totalDailyInflow;
}

/**
 * Charter out an idle tractor to an allied logistics network.
 */
export function charterOutTruck(S: any, truckId: number, allianceId = 'dhl_global'): boolean {
  if (!S.subcontractedTrucks) S.subcontractedTrucks = [];
  if (S.subcontractedTrucks.includes(truckId)) return false;

  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (!truck) return false;

  if (truck.status !== 'idle') {
    toast('Tractor must be parked idle in depot to charter out', 'err');
    return false;
  }

  const alliance = ALLIANCE_PARTNERS.find(a => a.id === allianceId) || ALLIANCE_PARTNERS[0];
  const dailyRate = calculateTruckCharterRate(truck, alliance.rateMultiplier);

  S.subcontractedTrucks.push(truckId);

  pushNote(S, `Unit #${truck.id} (${truck.name}) leased to ${alliance.name} for guaranteed +$${dailyRate.toLocaleString()}/day retainer.`, {
    title: 'RIG CHARTERED OUT',
    type: 'ops',
    priority: 1
  });

  toast(`Unit #${truck.id} chartered out: +$${dailyRate.toLocaleString()}/day!`, 'success');
  return true;
}

/**
 * Recall a chartered tractor back to company fleet operations.
 */
export function recallTruck(S: any, truckId: number): boolean {
  if (!S.subcontractedTrucks) return false;
  const idx = S.subcontractedTrucks.indexOf(truckId);
  if (idx === -1) return false;

  S.subcontractedTrucks.splice(idx, 1);

  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  pushNote(S, `Unit #${truckId} (${truck?.name || 'Tractor'}) recalled to active fleet operations.`, {
    title: 'RIG RECALLED TO DEPOT',
    type: 'ops'
  });

  toast(`Unit #${truckId} recalled to company dispatch depot`, 'info');
  return true;
}

/**
 * Charter out an idle storage yard trailer.
 */
export function charterOutTrailer(S: any, trailerType: string, allianceId = 'dhl_global'): boolean {
  if (!S.subcontractedTrailers) S.subcontractedTrailers = [];
  if (!S.trailers || !S.trailers.includes(trailerType)) {
    toast('Trailer not available in HQ yard inventory', 'err');
    return false;
  }

  // Check how many of this trailer type are currently owned vs already leased out
  const totalOwned = S.trailers.filter((t: string) => t === trailerType).length;
  const currentlyLeased = S.subcontractedTrailers.filter((t: string) => t === trailerType).length;

  if (currentlyLeased >= totalOwned) {
    toast('All trailers of this type are already out on charter', 'err');
    return false;
  }

  const alliance = ALLIANCE_PARTNERS.find(a => a.id === allianceId) || ALLIANCE_PARTNERS[0];
  const dailyRate = calculateTrailerCharterRate(trailerType, alliance.rateMultiplier);

  S.subcontractedTrailers.push(trailerType);

  pushNote(S, `${trailerType.toUpperCase()} trailer leased to ${alliance.name} for guaranteed +$${dailyRate.toLocaleString()}/day retainer.`, {
    title: 'TRAILER CHARTERED OUT',
    type: 'ops'
  });

  toast(`${trailerType.toUpperCase()} trailer chartered: +$${dailyRate.toLocaleString()}/day!`, 'success');
  return true;
}

/**
 * Recall a chartered trailer back to the storage yard.
 */
export function recallTrailer(S: any, trailerType: string): boolean {
  if (!S.subcontractedTrailers) return false;
  const idx = S.subcontractedTrailers.indexOf(trailerType);
  if (idx === -1) return false;

  S.subcontractedTrailers.splice(idx, 1);

  toast(`${trailerType.toUpperCase()} trailer recalled to HQ storage yard`, 'info');
  return true;
}
