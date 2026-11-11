import { GameState } from '../../types/state';
import { REGIONAL_HUBS, RegionalHub, RegionName } from '../logistics/network';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { TRUCK_MODELS } from '../trucks/trucks.data';

export interface HubFacility {
  id: string;               // e.g. 'hub_lagos', 'hub_chicago'
  extraBerths: number;      // player-expanded berths (+2 per expansion)
  fuelCapacity: number;     // liters of diesel fuel storage
  fuelLiters: number;       // current liters in tank
  fuelAvgCost: number;      // historical average purchase cost per liter
}

const DEFAULT_FUEL_CAPACITY = 15000;
const DEFAULT_INITIAL_FUEL = 6500;
const WHOLESALE_FUEL_PRICE_PER_LITER = 0.85;

/**
 * Ensures the hubFacilities map exists on state and guarantees
 * valid facility records for all owned depots.
 */
export function ensureHubFacilities(S: any): Record<string, HubFacility> {
  if (!S.hubFacilities) {
    S.hubFacilities = {};
  }

  const ownedDepots: string[] = S.depots || ['hub_lagos'];
  ownedDepots.forEach(depotId => {
    if (!S.hubFacilities[depotId]) {
      S.hubFacilities[depotId] = {
        id: depotId,
        extraBerths: 0,
        fuelCapacity: DEFAULT_FUEL_CAPACITY,
        fuelLiters: depotId === 'hub_lagos' ? DEFAULT_INITIAL_FUEL : 4000,
        fuelAvgCost: WHOLESALE_FUEL_PRICE_PER_LITER
      };
    }
  });

  return S.hubFacilities;
}

/**
 * Returns the hub facility record for a specific hub ID.
 */
export function getHubFacility(S: any, hubId: string): HubFacility {
  ensureHubFacilities(S);
  if (!S.hubFacilities[hubId]) {
    S.hubFacilities[hubId] = {
      id: hubId,
      extraBerths: 0,
      fuelCapacity: DEFAULT_FUEL_CAPACITY,
      fuelLiters: 0,
      fuelAvgCost: WHOLESALE_FUEL_PRICE_PER_LITER
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
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  const baseBerths = hub?.berths || 4;
  const facility = S.hubFacilities?.[hubId];
  return baseBerths + (facility?.extraBerths || 0);
}

/**
 * Returns all trucks currently parked (idle) or stationed at a specific hub.
 */
export function getTrucksAtHub(S: any, hubCity: string): any[] {
  if (!S || !S.fleet || !hubCity) return [];
  const upperCity = hubCity.toUpperCase().trim().replace(/\s+/g, '_');
  
  // Find the hub definition for this city to get its ID
  const hubDef = REGIONAL_HUBS.find(h => h.city.toUpperCase().replace(/\s+/g, '_') === upperCity);
  const hubIdUpper = hubDef?.id.toUpperCase();

  return S.fleet.filter((t: any) => {
    if (t.status === 'busy' || t.status === 'delivering') return false;
    const loc = (t.loc || '').toUpperCase().trim().replace(/\s+/g, '_');
    // Match by city name OR by Hub ID
    return loc === upperCity || (hubIdUpper && loc === hubIdUpper);
  });
}

/**
 * Cost to expand berths at a specific hub (+2 berths).
 */
export function getHubBerthUpgradeCost(facility: HubFacility): number {
  const currentExpansions = Math.floor((facility.extraBerths || 0) / 2);
  return 25000 + (currentExpansions * 15000);
}

/**
 * Expands a hub's parking berths by +2 slots.
 */
export function expandHubBerths(S: any, hubId: string): boolean {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) {
    toast('Hub not found', 'err');
    return false;
  }
  const facility = getHubFacility(S, hubId);
  const cost = getHubBerthUpgradeCost(facility);

  if (S.money < cost) {
    toast(`Insufficient funds. Need $${cost.toLocaleString()} to expand terminal berths.`, 'err');
    return false;
  }

  S.money -= cost;
  facility.extraBerths = (facility.extraBerths || 0) + 2;
  const totalBerths = getHubTotalBerths(S, hubId);

  pushNote(S, `Terminal Expansion: ${hub.name} expanded to ${totalBerths} berths (+2 slots, -$${cost.toLocaleString()}).`, {
    title: 'FACILITY UPGRADE',
    type: 'ops',
    priority: 1
  });

  toast(`Berths Expanded! ${hub.name} now has ${totalBerths} parking berths.`, 'success');
  return true;
}

/**
 * Cost to expand a hub's diesel fuel tank by +10,000L.
 */
export function getHubFuelTankUpgradeCost(facility: HubFacility): number {
  const currentCapacity = facility.fuelCapacity || DEFAULT_FUEL_CAPACITY;
  const levels = Math.max(0, Math.floor((currentCapacity - DEFAULT_FUEL_CAPACITY) / 10000));
  return 18000 + (levels * 10000);
}

/**
 * Expands a hub's diesel fuel tank capacity (+10,000 Liters).
 */
export function expandHubFuelTank(S: any, hubId: string): boolean {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) return false;
  const facility = getHubFacility(S, hubId);
  const cost = getHubFuelTankUpgradeCost(facility);

  if (S.money < cost) {
    toast(`Insufficient funds. Need $${cost.toLocaleString()} to expand fuel bunker tank.`, 'err');
    return false;
  }

  S.money -= cost;
  facility.fuelCapacity = (facility.fuelCapacity || DEFAULT_FUEL_CAPACITY) + 10000;

  pushNote(S, `Fuel Infrastructure: ${hub.name} bulk tank capacity upgraded to ${facility.fuelCapacity.toLocaleString()}L (-$${cost.toLocaleString()}).`, {
    title: 'FUEL TANK UPGRADE',
    type: 'ops',
    priority: 1
  });

  toast(`Fuel Tank Expanded! New Capacity: ${facility.fuelCapacity.toLocaleString()}L`, 'success');
  return true;
}

/**
 * Purchases wholesale diesel fuel directly into a hub's private fuel tank.
 */
export function buyHubWholesaleFuel(S: any, hubId: string, liters: number): boolean {
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) return false;
  const facility = getHubFacility(S, hubId);
  
  const currentL = facility.fuelLiters || 0;
  const maxL = facility.fuelCapacity || DEFAULT_FUEL_CAPACITY;
  const room = Math.max(0, maxL - currentL);
  const toOrder = Math.min(room, liters);

  if (toOrder <= 0) {
    toast('Hub fuel tank is already at maximum capacity!', 'info');
    return false;
  }

  const cost = Math.round(toOrder * WHOLESALE_FUEL_PRICE_PER_LITER);
  if (S.money < cost) {
    toast(`Insufficient funds. Need $${cost.toLocaleString()} for ${toOrder.toLocaleString()}L wholesale fuel.`, 'err');
    return false;
  }

  S.money -= cost;
  const prevLiters = facility.fuelLiters || 0;
  const prevCost = facility.fuelAvgCost || WHOLESALE_FUEL_PRICE_PER_LITER;
  facility.fuelLiters = prevLiters + toOrder;
  facility.fuelAvgCost = parseFloat(((prevLiters * prevCost + cost) / facility.fuelLiters).toFixed(2));

  pushNote(S, `Wholesale Tanker Delivery: ${toOrder.toLocaleString()}L diesel pumped into ${hub.name} fuel tank at $${WHOLESALE_FUEL_PRICE_PER_LITER}/L (-$${cost.toLocaleString()}).`, {
    title: 'WHOLESALE FUEL RECEIPT',
    type: 'ops'
  });

  toast(`Refilled ${toOrder.toLocaleString()}L into ${hub.name} Tank! (-$${cost.toLocaleString()})`, 'success');
  return true;
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
