import { GameState } from '../../types/state';
import { REGIONAL_HUBS, RegionalHub, RegionName } from '../logistics/network';
import { getHubCharacteristics } from './characteristics';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { TRUCK_MODELS } from '../trucks/trucks.data';

import { recordTransaction } from '../../core/ledger';
import { getHubWholesaleFuelPrice, getRegionalRetailFuelPrice } from '../economy/fuel-market';

export interface HubFacility {
  id: string;               // e.g. 'hub_lagos', 'hub_chicago'
  level: number;            // Hub facility upgrade level (starts at 1)
  extraBerths: number;      // player-expanded berths (+2 per facility level)
  fuelCapacity: number;     // liters of diesel fuel storage (+10,000L per level)
  fuelLiters: number;       // current liters in tank
  fuelAvgCost: number;      // historical average purchase cost per liter
}

export interface PendingFuelOrder {
  id: string;
  hubId: string;
  hubName: string;
  liters: number;
  cost: number;
  wholesaleRate: number;
  orderedAt: number;
  deliverAt: number;
}

const DEFAULT_FUEL_CAPACITY = 15000;
const DEFAULT_INITIAL_FUEL = 6500;

/**
 * Ensures the hubFacilities map exists on state and guarantees
 * valid facility records for all owned depots.
 */
export function ensureHubFacilities(S: any): Record<string, HubFacility> {
  if (!S.hubFacilities) {
    S.hubFacilities = {};
  }
  if (!S.pendingFuelOrders) {
    S.pendingFuelOrders = [];
  }

  const ownedDepots: string[] = S.depots || ['hub_lagos'];
  ownedDepots.forEach(depotId => {
    if (!S.hubFacilities[depotId]) {
      const char = getHubCharacteristics(depotId);
      const initFuelCap = char ? char.baseFuelTankLiters : DEFAULT_FUEL_CAPACITY;
      const initFuelFill = Math.round(initFuelCap * 0.5);
      const initCost = getHubWholesaleFuelPrice(depotId, S);

      S.hubFacilities[depotId] = {
        id: depotId,
        level: S.hubFacilities[depotId]?.level || 1,
        extraBerths: S.hubFacilities[depotId]?.extraBerths ?? 0,
        fuelCapacity: S.hubFacilities[depotId]?.fuelCapacity ?? initFuelCap,
        fuelLiters: S.hubFacilities[depotId]?.fuelLiters ?? initFuelFill,
        fuelAvgCost: S.hubFacilities[depotId]?.fuelAvgCost ?? initCost
      };
    }
  });

  // Process in-transit wholesale fuel tanker deliveries
  processPendingFuelDeliveries(S, Date.now());

  return S.hubFacilities;
}

/**
 * Returns the hub facility record for a specific hub ID.
 */
export function getHubFacility(S: any, hubId: string): HubFacility {
  ensureHubFacilities(S);
  if (!S.hubFacilities[hubId]) {
    const char = getHubCharacteristics(hubId);
    const initFuelCap = char ? char.baseFuelTankLiters : DEFAULT_FUEL_CAPACITY;

    S.hubFacilities[hubId] = {
      id: hubId,
      level: 1,
      extraBerths: 0,
      fuelCapacity: initFuelCap,
      fuelLiters: 0,
      fuelAvgCost: getHubWholesaleFuelPrice(hubId, S)
    };
  }
  return S.hubFacilities[hubId];
}

/**
 * Finds the hub definition matching a given city name.
 */
export function getHubForCity(city: string): RegionalHub | undefined {
  if (!city) return undefined;
  const upper = city.toUpperCase().trim().replace(/\s+/g, '_');
  return REGIONAL_HUBS.find(h => 
    h.city.toUpperCase().replace(/\s+/g, '_') === upper || 
    h.id.toUpperCase() === upper ||
    h.id.toUpperCase().includes(upper)
  );
}

/**
 * Checks whether a given city corresponds to an owned/unlocked hub terminal.
 */
export function isCityUnlockedHub(S: any, city: string): boolean {
  if (!S || !S.depots || !city) return false;
  const hub = getHubForCity(city);
  if (!hub) return false;
  return S.depots.includes(hub.id);
}

/**
 * Returns the HubFacility record for a city if owned by the player.
 */
export function getHubFacilityForCity(S: any, city: string): HubFacility | null {
  if (!S || !city) return null;
  const hub = getHubForCity(city);
  if (!hub || !(S.depots || []).includes(hub.id)) return null;
  return getHubFacility(S, hub.id);
}

/**
 * Computes the total berths for a hub (base + player expansions).
 */
export function getHubTotalBerths(S: any, hubId: string): number {
  const char = getHubCharacteristics(hubId);
  const baseBerths = char ? char.baseBerths : 4;
  const facility = S.hubFacilities?.[hubId];
  return baseBerths + (facility?.extraBerths || 0);
}

/**
 * Returns all trucks currently parked (idle) or stationed/delivering at a specific hub.
 */
export function getTrucksAtHub(S: any, hubCity: string, includeDelivering = true): any[] {
  if (!S || !S.fleet || !hubCity) return [];
  const upperCity = hubCity.toUpperCase().trim().replace(/\s+/g, '_');
  
  // Find the hub definition for this city to get its ID
  const hubDef = REGIONAL_HUBS.find(h => h.city.toUpperCase().replace(/\s+/g, '_') === upperCity);
  const hubIdUpper = hubDef?.id.toUpperCase();

  return S.fleet.filter((t: any) => {
    if (t.status === 'busy') return false;
    if (t.status === 'delivering' && !includeDelivering) return false;
    const loc = (t.loc || '').toUpperCase().trim().replace(/\s+/g, '_');
    // Match by city name OR by Hub ID
    return loc === upperCity || (hubIdUpper && loc === hubIdUpper);
  });
}

/**
 * Returns the maximum upgrade facility level permitted for a hub based on its economic tier.
 * - Tier 1 (Mega Global Hubs e.g. Rotterdam, Shanghai, Lagos, Chicago, LA): Max Level 10
 * - Tier 2 (Regional Logistics Terminals e.g. Munich, Dallas, Lyon, Algiers, Kano): Max Level 6
 * - Tier 3 (Local Feeder Depots e.g. Abuja, Gothenburg, Kaduna, Omaha): Max Level 3
 */
export function getHubMaxFacilityLevel(hubIdOrCity: string): number {
  const char = getHubCharacteristics(hubIdOrCity);
  if (!char) return 3;
  if (char.tier === 1) return 10;
  if (char.tier === 2) return 6;
  return 3;
}

/**
 * Calculates the dynamic cost to upgrade a hub facility to the next level.
 * Cost is dynamic and coupled with:
 * - Current facility level (exponential capital progression curve)
 * - Hub Economic Tier (Tier 1 Mega-Hubs have higher capital valuation)
 * - Corporate & Government Bond Yield Capitalization Index (interest rate environment coupling)
 */
export function getHubFacilityUpgradeCost(facility: HubFacility, S?: any): number {
  const hubId = facility.id;
  const char = getHubCharacteristics(hubId);
  const tier = char ? char.tier : 2;
  const lvl = facility.level || 1;

  // Base Progressive Level Construction & Real Estate Capital Curve
  const baseCosts = [
    45000,   // Level 1 -> 2
    85000,   // Level 2 -> 3
    160000,  // Level 3 -> 4
    290000,  // Level 4 -> 5
    500000,  // Level 5 -> 6
    820000,  // Level 6 -> 7
    1250000, // Level 7 -> 8
    1850000, // Level 8 -> 9
    2700000  // Level 9 -> 10
  ];
  const baseCost = baseCosts[Math.min(lvl - 1, baseCosts.length - 1)] || Math.round(45000 * Math.pow(1.6, lvl - 1));

  // Hub Tier Capital Scaling Factor
  const tierMultiplier = tier === 1 ? 1.80 : tier === 2 ? 1.30 : 1.00;

  // Corporate & Government Bond Yield / Capitalization Rate Coupling
  // Baseline Treasury/Bond Yield: ~5.5% (0.055). Higher market yields raise financing costs.
  const bondYield = S?.finance?.bondYield || S?.bonds?.[0]?.yield || 0.055;
  const bondCapitalizationFactor = 1.0 + Math.max(0, (bondYield - 0.04)) * 2.5;

  return Math.round(baseCost * tierMultiplier * bondCapitalizationFactor);
}

/**
 * Legacy alias functions for berth & fuel tank upgrade cost calculation.
 */
export function getHubBerthUpgradeCost(facility: HubFacility, S?: any): number {
  return getHubFacilityUpgradeCost(facility, S);
}

export function getHubFuelTankUpgradeCost(facility: HubFacility, S?: any): number {
  return getHubFacilityUpgradeCost(facility, S);
}

/**
 * Upgrades a Hub Facility level.
 * Handles unified expansion of:
 * - Parking berths (+2 per level)
 * - Fuel storage tank (+10,000L per level)
 * - Hub daily freight job demand limit (+3 jobs/day & +50T tonnage capacity)
 * - Per-km freight payout yield (+4% per level above 1) & premium high-value job odds
 */
export function upgradeHubFacility(S: any, hubId: string): boolean {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) {
    toast('Hub not found', 'err');
    return false;
  }
  const facility = getHubFacility(S, hubId);
  const maxLvl = getHubMaxFacilityLevel(hubId);
  const curLvl = facility.level || 1;

  if (curLvl >= maxLvl) {
    const char = getHubCharacteristics(hubId);
    toast(`${hub.name} has reached its maximum infrastructure capacity (Level ${maxLvl}) for ${char?.tierLabel || 'this tier'} hubs.`, 'info');
    return false;
  }

  const cost = getHubFacilityUpgradeCost(facility, S);

  if (S.money < cost) {
    toast(`Insufficient funds. Need $${cost.toLocaleString()} to upgrade ${hub.name} facility.`, 'err');
    return false;
  }

  const char = getHubCharacteristics(hubId);
  const baseCap = char ? char.baseFuelTankLiters : DEFAULT_FUEL_CAPACITY;

  const newLvl = curLvl + 1;

  recordTransaction(S, 'expense_unlock', -cost, `Hub Facility Upgrade: ${hub.name} (Level ${newLvl})`);

  facility.level = newLvl;
  facility.extraBerths = (newLvl - 1) * 2;
  facility.fuelCapacity = baseCap + (newLvl - 1) * 10000;

  const totalBerths = getHubTotalBerths(S, hubId);
  const yieldPct = (newLvl - 1) * 4;

  pushNote(S, `🏛️ Facility Upgraded: ${hub.name} upgraded to Level ${newLvl}/${maxLvl}! (${totalBerths} Berths, ${facility.fuelCapacity.toLocaleString()}L Fuel Storage, +500 Tonnes/day Freight Tonnage Cap, +${yieldPct}% Freight Yield/km).`, {
    title: 'HUB FACILITY UPGRADED',
    type: 'ops',
    priority: 1
  });

  toast(`🏛️ Hub Facility Upgraded to Level ${newLvl}/${maxLvl}! (+2 Berths, +10kL Fuel, +500 T/day Freight Cap, +4% Payout Yield)`, 'success');
  return true;
}

/**
 * Legacy wrappers for berth and fuel tank expansion that call upgradeHubFacility.
 */
export function expandHubBerths(S: any, hubId: string): boolean {
  return upgradeHubFacility(S, hubId);
}

export function expandHubFuelTank(S: any, hubId: string): boolean {
  return upgradeHubFacility(S, hubId);
}

/**
 * Calculates the per-km freight yield multiplier bonus for jobs originating from a hub.
 * Starts at 1.0 (Level 1) and adds +4% (+0.04) per facility upgrade level above 1.
 */
export function getHubFacilityYieldBonus(S: any, hubIdOrCity: string): number {
  if (!S || !hubIdOrCity) return 1.0;
  const hub = getHubForCity(hubIdOrCity) || REGIONAL_HUBS.find(h => h.id === hubIdOrCity || h.city.toUpperCase() === hubIdOrCity.toUpperCase());
  if (!hub || !(S.depots || []).includes(hub.id)) return 1.0;
  const facility = S.hubFacilities?.[hub.id];
  if (!facility) return 1.0;
  const level = facility.level || 1;
  return 1.0 + (level - 1) * 0.04;
}

/**
 * Dispatches a wholesale fuel tanker order for a custom amount of liters.
 * Tanker takes physical transit time to arrive at the terminal dock.
 */
export function orderHubWholesaleFuel(S: any, hubId: string, liters: number): boolean {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) return false;
  const facility = getHubFacility(S, hubId);
  
  const currentL = facility.fuelLiters || 0;
  const maxL = facility.fuelCapacity || DEFAULT_FUEL_CAPACITY;
  
  // Calculate existing in-transit pending fuel for this hub
  const pendingOrders = getPendingFuelOrdersForHub(S, hubId);
  const pendingLiters = pendingOrders.reduce((sum, o) => sum + o.liters, 0);

  const room = Math.max(0, maxL - (currentL + pendingLiters));
  const toOrder = Math.min(room, Math.max(100, Math.round(liters)));

  if (toOrder <= 0) {
    toast(`Hub fuel tank capacity limit reached (${maxL.toLocaleString()}L max incl. in-transit deliveries)!`, 'info');
    return false;
  }

  const wholesaleRate = getHubWholesaleFuelPrice(hubId, S);
  const cost = Math.round(toOrder * wholesaleRate);
  if (S.money < cost) {
    toast(`Insufficient funds. Need $${cost.toLocaleString()} for ${toOrder.toLocaleString()}L wholesale fuel at $${wholesaleRate}/L.`, 'err');
    return false;
  }

  // Deduct wholesale order cost
  recordTransaction(S, 'expense_fuel', -cost, `Wholesale Tanker Order: ${toOrder.toLocaleString()}L for ${hub.name}`);

  // Calculate physical tanker transit time (e.g. 45s to 240s based on order volume)
  const transitMs = Math.max(45000, Math.min(240000, Math.round(toOrder * 12)));
  const deliverAt = Date.now() + transitMs;

  if (!S.pendingFuelOrders) S.pendingFuelOrders = [];
  S.pendingFuelOrders.push({
    id: `fuel_ord_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
    hubId,
    hubName: hub.name,
    liters: toOrder,
    cost,
    wholesaleRate,
    orderedAt: Date.now(),
    deliverAt
  });

  const etaSec = Math.round(transitMs / 1000);
  pushNote(S, `🚛 Wholesale Tanker Dispatched: ${toOrder.toLocaleString()}L ordered for ${hub.name} at $${wholesaleRate}/L (-$${cost.toLocaleString()}). In transit (ETA: ${etaSec}s).`, {
    title: 'FUEL TANKER DISPATCHED',
    type: 'ops',
    priority: 1
  });

  toast(`Wholesale Tanker Dispatched! ${toOrder.toLocaleString()}L arriving in ~${etaSec}s (-$${cost.toLocaleString()})`, 'success');
  return true;
}

/**
 * Returns all active in-transit fuel orders for a specific hub.
 */
export function getPendingFuelOrdersForHub(S: any, hubId: string): PendingFuelOrder[] {
  if (!S || !S.pendingFuelOrders) return [];
  return (S.pendingFuelOrders as PendingFuelOrder[]).filter(o => o.hubId === hubId);
}

/**
 * Processes completed in-transit wholesale fuel deliveries.
 */
export function processPendingFuelDeliveries(S: any, now: number): void {
  if (!S || !S.pendingFuelOrders || S.pendingFuelOrders.length === 0) return;

  const completed = S.pendingFuelOrders.filter((o: PendingFuelOrder) => now >= o.deliverAt);
  if (completed.length === 0) return;

  for (const order of completed) {
    const facility = getHubFacility(S, order.hubId);
    const prevLiters = facility.fuelLiters || 0;
    const prevCost = facility.fuelAvgCost || order.wholesaleRate;
    
    facility.fuelLiters = Math.min(facility.fuelCapacity || DEFAULT_FUEL_CAPACITY, prevLiters + order.liters);
    facility.fuelAvgCost = parseFloat(((prevLiters * prevCost + order.cost) / (facility.fuelLiters || 1)).toFixed(2));

    pushNote(S, `⛽ Wholesale Tanker Delivery Arrived: ${order.liters.toLocaleString()}L diesel pumped into ${order.hubName} tank at $${order.wholesaleRate}/L.`, {
      title: 'FUEL TANKER DELIVERED',
      type: 'ops',
      priority: 1
    });

    toast(`⛽ Tanker Delivery Arrived at ${order.hubName}! +${order.liters.toLocaleString()}L pumped into tank.`, 'success');
  }

  S.pendingFuelOrders = S.pendingFuelOrders.filter((o: PendingFuelOrder) => now < o.deliverAt);
}

/**
 * Legacy wrapper function for buying wholesale fuel.
 */
export function buyHubWholesaleFuel(S: any, hubId: string, liters: number): boolean {
  return orderHubWholesaleFuel(S, hubId, liters);
}

/**
 * Refuels all idle trucks currently parked at this hub from its fuel tank.
 */
export function bulkRefuelHubFleet(S: any, hubId: string): { refueledCount: number; litersUsed: number; cost: number } {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) return { refueledCount: 0, litersUsed: 0, cost: 0 };
  const facility = getHubFacility(S, hubId);

  const parkedTrucks = getTrucksAtHub(S, hub.city).filter((t: any) => t.status === 'idle');
  if (parkedTrucks.length === 0) {
    toast(`No idle tractors currently parked at ${hub.name}.`, 'info');
    return { refueledCount: 0, litersUsed: 0, cost: 0 };
  }

  let totalLitersNeeded = 0;
  const truckNeeds: { truck: any; needed: number }[] = [];

  for (const t of parkedTrucks) {
    const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
    const curFuel = t.fluids?.fuel ?? model.tankSize;
    const needed = Math.max(0, model.tankSize - curFuel);
    if (needed > 0) {
      totalLitersNeeded += needed;
      truckNeeds.push({ truck: t, needed });
    }
  }

  if (totalLitersNeeded <= 0) {
    toast(`All ${parkedTrucks.length} tractors parked at ${hub.name} already have 100% full tanks!`, 'info');
    return { refueledCount: 0, litersUsed: 0, cost: 0 };
  }

  let fromTank = 0;
  let remainingNeeded = totalLitersNeeded;

  if (facility.fuelLiters > 0) {
    fromTank = Math.min(facility.fuelLiters, totalLitersNeeded);
    facility.fuelLiters -= fromTank;
    remainingNeeded -= fromTank;
  }

  let stationCashPaid = 0;
  if (remainingNeeded > 0) {
    stationCashPaid = Math.round(remainingNeeded * 2.50);
    if (S.money < stationCashPaid) {
      // Revert tank usage if player can't afford commercial fallback
      facility.fuelLiters += fromTank;
      toast(`Insufficient cash to top off fleet from commercial pumps. Need $${stationCashPaid.toLocaleString()}.`, 'err');
      return { refueledCount: 0, litersUsed: 0, cost: 0 };
    }
    S.money -= stationCashPaid;
  }

  // Refuel all trucks to 100%
  for (const item of truckNeeds) {
    const model = TRUCK_MODELS[item.truck.modelId] || { tankSize: 800 };
    if (!item.truck.fluids) item.truck.fluids = { fuel: model.tankSize };
    item.truck.fluids.fuel = model.tankSize;
  }

  const msg = fromTank > 0 && stationCashPaid > 0
    ? `Fleet Refueled: ${truckNeeds.length} tractors filled (${Math.round(fromTank)}L from Hub Tank + ${Math.round(remainingNeeded)}L commercial pump: -$${stationCashPaid.toLocaleString()}).`
    : fromTank > 0
    ? `Fleet Refueled: ${truckNeeds.length} tractors filled with ${Math.round(fromTank)}L from ${hub.name} Tank ($0 cash)!`
    : `Fleet Refueled: ${truckNeeds.length} tractors filled at commercial pumps (-$${stationCashPaid.toLocaleString()}).`;

  pushNote(S, msg, { title: 'TERMINAL FLEET REFUEL', type: 'ops' });
  toast(msg, 'success');

  return { refueledCount: truckNeeds.length, litersUsed: totalLitersNeeded, cost: stationCashPaid };
}

export const OVERFLOW_HUB_PARKING_DAILY_FEE = 60;
export const NON_HUB_PARKING_DAILY_FEE = 85;

export interface HubBerthOccupancy {
  city: string;
  hubId: string | null;
  atOwnedHub: boolean;
  occupied: number;
  totalBerths: number;
  overflow: number;
  dailyParkingFee: number;
}

/**
 * Computes local berth occupancy and daily overflow parking fees for a city/hub.
 */
export function getHubBerthOccupancy(S: any, city: string): HubBerthOccupancy {
  const upperCity = (city || '').toUpperCase().trim().replace(/\s+/g, '_');
  const hub = getHubForCity(upperCity);
  const owned = Boolean(hub && Array.isArray(S?.depots) && S.depots.includes(hub.id));
  const occupied = getTrucksAtHub(S, upperCity, true).length;

  if (owned && hub) {
    const totalBerths = getHubTotalBerths(S, hub.id);
    const overflow = Math.max(0, occupied - totalBerths);
    return {
      city: hub.city,
      hubId: hub.id,
      atOwnedHub: true,
      occupied,
      totalBerths,
      overflow,
      dailyParkingFee: overflow * OVERFLOW_HUB_PARKING_DAILY_FEE
    };
  }

  return {
    city: upperCity,
    hubId: null,
    atOwnedHub: false,
    occupied,
    totalBerths: 0,
    overflow: occupied,
    dailyParkingFee: occupied * NON_HUB_PARKING_DAILY_FEE
  };
}

/**
 * Calculates total daily parking & overflow fees across all parked/idle/repair vehicles.
 * Starter HQ garage slots (BASE_SLOTS + garageLevel * 2) remain free at homeCity if no depots are owned yet.
 */
export function calculateFleetDailyParkingFees(S: any): {
  totalDailyFee: number;
  overflowTrucks: number;
  offHubTrucks: number;
} {
  if (!S || !Array.isArray(S.fleet) || S.fleet.length === 0) {
    return { totalDailyFee: 0, overflowTrucks: 0, offHubTrucks: 0 };
  }

  const parkedByCity: Record<string, number> = {};
  for (const t of S.fleet) {
    if (t.status === 'busy' || t.status === 'delivering') continue;
    const city = String(t.loc || '').toUpperCase().trim().replace(/\s+/g, '_');
    if (!city) continue;
    parkedByCity[city] = (parkedByCity[city] || 0) + 1;
  }

  let totalDailyFee = 0;
  let overflowTrucks = 0;
  let offHubTrucks = 0;
  const homeUpper = String(S.homeCity || '').toUpperCase().trim().replace(/\s+/g, '_');
  const hqFreeSlots = (!Array.isArray(S.depots) || S.depots.length === 0)
    ? 3 + (S.garageLevel || 0) * 2
    : 0;

  for (const [city, count] of Object.entries(parkedByCity)) {
    const hub = getHubForCity(city);
    const owned = Boolean(hub && Array.isArray(S.depots) && S.depots.includes(hub.id));
    if (owned && hub) {
      const berths = getHubTotalBerths(S, hub.id);
      const excess = Math.max(0, count - berths);
      if (excess > 0) {
        overflowTrucks += excess;
        totalDailyFee += excess * OVERFLOW_HUB_PARKING_DAILY_FEE;
      }
    } else {
      const freeQuota = (city === homeUpper) ? hqFreeSlots : 0;
      const billedCount = Math.max(0, count - freeQuota);
      if (billedCount > 0) {
        offHubTrucks += billedCount;
        totalDailyFee += billedCount * NON_HUB_PARKING_DAILY_FEE;
      }
    }
  }

  return { totalDailyFee, overflowTrucks, offHubTrucks };
}
