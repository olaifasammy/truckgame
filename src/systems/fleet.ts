import { vehiclePurchaseTemplate } from '../domain/notifications/templates';
import { set } from '../core/store';
import { toast } from '../core/ui';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../domain/trucks/trucks.data';
import { TrailerType } from '../domain/trucks/trucks.types';
import { stats, distKm, tripMs, applyWear, syncUsage } from './calc';
import { pushNote } from './notify';
import { processScheduledRepair } from './maintenance';
import { disc } from './perks';
import { slots } from './offices';
import { createTruck } from '../domain/trucks/trucks.physics';
import { LOCATIONS } from '../data/world';
import { getHubFacilityForCity, getHubBerthOccupancy, OVERFLOW_HUB_PARKING_DAILY_FEE } from '../domain/hubs/hub-facility';

import { recordTransaction, LedgerCategory } from '../core/ledger';
import { getRegionalRetailFuelPrice } from '../domain/economy/fuel-market';
import { VehicleMaintenance } from '../domain/trucks/maintenance';

export const inspectCost = () => Math.round(500 * disc('scanner'));

export const refuelCost = (t: any, S?: any) => {
  const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
  const needed = Math.max(0, model.tankSize - (t.fluids?.fuel || 0));
  if (needed <= 0) return 0;
  const hubFacility = S ? getHubFacilityForCity(S, t.loc) : null;
  const hubTankLiters = hubFacility?.fuelLiters || 0;
  const atHomeCity = Boolean(S?.homeCity && (t.loc || '').toUpperCase() === S.homeCity.toUpperCase());
  const bunkerLiters = hubTankLiters > 0
    ? hubTankLiters
    : (atHomeCity ? (S?.fuelBunker?.currentLiters || 0) : 0);
  const cashNeeded = Math.max(0, needed - bunkerLiters);
  const retailPrice = getRegionalRetailFuelPrice(t.loc, S);
  return Math.round(cashNeeded * retailPrice * disc('fuelcard'));
};

export const repairCost = (t: any, S?: any) => {
  let total = 0;
  Object.values(t.components).forEach((c: any) => {
    total += (100 - c.health) * 50;
  });
  const locMult = S ? VehicleMaintenance.getRepairFacilityInfo(S, t).costMultiplier : 1.0;
  return Math.round(total * disc('service') * locMult);
};

export const upgradeCost = (k: string, l: number) => 5000 * (l + 1);

export const newTruck = (S: any, modelId: string, trailerType: TrailerType | null = null, loc = 'LAGOS') => {
  const m = TRUCK_MODELS[modelId];
  return createTruck(S.nextId++, modelId, `${m.brand} ${m.name} #${S.fleet.length + 1}`, loc, trailerType);
};

const idle = (S: any, id: number) => {
  const t = S.fleet.find((x: any) => x.id === id);
  if (!t || t.status !== 'idle') { toast('Truck is busy'); return null; }
  return t;
};
const pay = (S: any, c: number, purpose: string, category: LedgerCategory = 'expense_other') => {
  if (S.money < c) { toast('Not enough cash'); return false; }
  recordTransaction(S, category, -c, purpose);
  pushNote(S, `Transaction: ${purpose} (-$${c.toLocaleString()})`, {
    title: 'Financial Transaction',
    type: 'finance',
    body: `Payment authorized for: ${purpose}\nAmount: $${c.toLocaleString()}\nTimestamp: ${new Date().toLocaleString()}`
  });
  return true;
};

export const refuel = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
  const needed = Math.max(0, model.tankSize - (t.fluids?.fuel || 0));
  if (needed <= 0) return toast('Fuel tank is already at 100% capacity', 'info');

  const hubFacility = getHubFacilityForCity(S, t.loc);
  const atHomeCity = Boolean(S.homeCity && (t.loc || '').toUpperCase() === S.homeCity.toUpperCase());
  let fromTank = 0;
  let sourceName = 'Commercial Station';

  if (hubFacility && hubFacility.fuelLiters > 0) {
    fromTank = Math.min(hubFacility.fuelLiters, needed);
    hubFacility.fuelLiters -= fromTank;
    sourceName = `${t.loc} Hub Fuel Tank`;
  } else if (atHomeCity && S.fuelBunker && S.fuelBunker.currentLiters > 0) {
    fromTank = Math.min(S.fuelBunker.currentLiters, needed);
    S.fuelBunker.currentLiters -= fromTank;
    sourceName = 'HQ Fuel Bunker';
  }

  const remaining = needed - fromTank;
  let cashCost = 0;
  if (remaining > 0) {
    const retailPrice = getRegionalRetailFuelPrice(t.loc, S);
    cashCost = Math.round(remaining * retailPrice * disc('fuelcard'));
    if (!pay(S, cashCost, `Commercial Station Refuel Unit #${id} (${t.name})`, 'expense_fuel')) {
      if (hubFacility && fromTank > 0) hubFacility.fuelLiters += fromTank;
      else if (S.fuelBunker && fromTank > 0) S.fuelBunker.currentLiters += fromTank;
      return;
    }
    if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
    S.dailyStats.fuel += cashCost;
  }

  t.fluids.fuel = model.tankSize;
  if (fromTank > 0 && remaining > 0) {
    toast(`Refueled: ${Math.round(fromTank)}L from ${sourceName} ($0) + ${Math.round(remaining)}L Station ($${cashCost.toLocaleString()})`, 'success');
  } else if (fromTank > 0) {
    toast(`Refueled ${Math.round(fromTank)}L from ${sourceName}! ($0 cash)`, 'success');
  } else {
    toast(`Refueled ${Math.round(needed)}L at Commercial Station (-$${cashCost.toLocaleString()})`, 'success');
  }
});

export const repair = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const c = repairCost(t, S);
  if (c <= 0 || !pay(S, c, `Repair Service Unit #${id} (${t.name})`, 'expense_maintenance')) return;
  if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
  S.dailyStats.maintenance += c;
  Object.values(t.components).forEach((comp: any) => {
    comp.health = 100;
  });
});

export const inspect = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const cost = inspectCost();
  if (!pay(S, cost, `Safety Inspection Unit #${id} (${t.name})`, 'expense_permit')) return;
  t.lastInspection = { at: Date.now(), components: JSON.parse(JSON.stringify(t.components)) };
});

export const assign = (id: number, did: number | null) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  if (did) {
    const o = S.fleet.find((x: any) => x.driverId === did && x.id !== id);
    if (o && o.status === 'busy') return toast('Driver is on a job');
    if (o) o.driverId = null;
  }
  t.driverId = did || null;

  // Sync assignedTruckId across all drivers
  if (S.drivers && S.fleet) {
    S.drivers.forEach((d: any) => {
      const assigned = S.fleet.find((tr: any) => tr.driverId === d.id);
      d.assignedTruckId = assigned ? assigned.id : null;
    });
  }
});

export function transportInfo(S: any, t: any, city: string) {
  const km = distKm(t.loc, city), st = stats(S, t), fuelNeeded = (km / 100) * st.fuelConsumption;
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
  
  const locFrom = LOCATIONS[t.loc];
  const locTo = LOCATIONS[city];
  const isCrossContinent = locFrom && locTo && locFrom.region !== locTo.region;
  
  const why = t.status !== 'idle' ? 'busy' 
    : isCrossContinent ? 'region'
    : !t.driverId ? 'driver' 
    : t.fluids.fuel < fuelNeeded ? 'fuel' 
    : avgHealth < 20 ? 'cond' : null;
  return { km, fuel: fuelNeeded, ms: tripMs(km, st.topSpeed), why };
}

export const transport = (id: number, city: string) => set(S => {
  const t = S.fleet.find((x: any) => x.id === id);
  if (!t) return;
  if (!city) return toast('Select a destination terminal first', 'err');
  
  const i = transportInfo(S, t, city);
  if (i.why) {
    if (i.why === 'region') return toast('Cross-continental highway deadhead prohibited (inter-continental transit required)', 'err');
    if (i.why === 'busy') return toast(`Unit #${id} is currently busy. Recall or complete current job first.`, 'err');
    return toast('Truck cannot make this trip: ' + i.why, 'err');
  }
  const now = Date.now();
  const st = stats(S, t);
  const duration = tripMs(i.km, st.topSpeed);
  
  S.active.push({ 
    id: S.nextId++, 
    kind: 'move', 
    cargo: 'Repositioning', 
    from: t.loc, 
    to: city, 
    km: i.km, 
    dh: 0, 
    pay: 0, 
    truck: id, 
    start: now, 
    end: now + duration 
  });
  
  t.status = 'busy';
  toast(`Dispatching Unit #${id} deadhead to ${city}...`);
});

export const onTruckArrival = (S: any, truckId: number) => {
  const t = S.fleet.find((x: any) => x.id === truckId);
  if (!t) return;
  
  // Only set to idle if no other active jobs are currently assigned to this truck 
  // (Prevents clearing 'busy' status during Round-Trip Leg transitions)
  const stillActive = (S.active || []).some((a: any) => a.truck === truckId);
  if (!stillActive) {
    t.status = 'idle';
  }
  
  processScheduledRepair(S, truckId);
};

export const buyTruckBatch = (modelId: string, trailerType: TrailerType | null, quantity: number, destinationCity: string) => {
  set(S => {
    const m = TRUCK_MODELS[modelId];
    if (!m) return toast('Invalid model');
    const trailerCost = trailerType ? (TRAILER_PRICES[trailerType] || 15000) : 0;
    const unitPrice = m.price + trailerCost;
    const totalPrice = unitPrice * quantity;

    if (S.fleet.length + quantity > slots(S)) {
      toast(`Garage slots full! Need ${S.fleet.length + quantity} slots (Capacity: ${slots(S)})`, 'err');
      return;
    }
    if (!pay(S, totalPrice, `Fleet Purchase: ${quantity}x ${m.brand} ${m.name}`, 'expense_purchase')) return;

    const deliveryTimeMs = 15 * 60 * 1000; // 15 Minutes Factory-to-Depot Transit
    const arrivalTime = Date.now() + deliveryTimeMs;

    for (let i = 0; i < quantity; i++) {
      const truck = newTruck(S, modelId, trailerType, destinationCity);
      truck.status = 'delivering';
      truck.availableAt = arrivalTime;
      S.fleet.push(truck);
    }

    const firstUnit = S.fleet[S.fleet.length - quantity];
    const unitLabel = quantity > 1 ? `${quantity}x Units` : `${firstUnit.id}`;
    const tpl = vehiclePurchaseTemplate(unitLabel, `${m.brand} ${m.name}`, totalPrice, destinationCity, 15);
    pushNote(S, tpl.msg, { 
      title: tpl.title, 
      type: tpl.type,
      priority: tpl.priority,
      body: tpl.body
    });
    const berthInfo = getHubBerthOccupancy(S, destinationCity);
    const willOverflow = berthInfo.atOwnedHub && (berthInfo.occupied + quantity > berthInfo.totalBerths);
    toast(`Order Processed: ${quantity} vehicle(s) in transit to ${destinationCity} depot (Est. 15 mins)`, 'success');
    if (willOverflow) {
      toast(`Parking Notice: ${destinationCity} berths full (${berthInfo.occupied + quantity}/${berthInfo.totalBerths}). Overflow yard fee ($${OVERFLOW_HUB_PARKING_DAILY_FEE}/day/truck) applies.`, 'info');
    }
  });
};

export function unhitchTrailer(truckId: number) {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === truckId);
    if (!t) return;
    if (t.status === 'busy') return toast('Cannot unhitch while in transit', 'err');
    if (!t.trailer) return toast('No trailer attached to this tractor', 'info');

    if (!S.trailers) S.trailers = [];
    const detached = t.trailer;
    S.trailers.push(detached);
    t.trailer = null;

    pushNote(S, `Unit #${t.id} unhitched ${TRAILERS[detached as keyof typeof TRAILERS] || detached}. Staged at HQ Storage Yard.`, { title: 'TRAILER DECOUPLED', type: 'ops' });
    toast(`Unhitched ${TRAILERS[detached as keyof typeof TRAILERS] || detached} to HQ Yard`, 'success');
  });
}

export function hitchTrailer(truckId: number, trailerType: TrailerType) {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === truckId);
    if (!t) return;
    if (t.status === 'busy') return toast('Cannot hitch trailer while in transit', 'err');

    const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
    if (!m.haul.includes(trailerType)) {
      return toast(`Tractor chassis cannot haul ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}`, 'err');
    }

    if (!S.trailers || !S.trailers.includes(trailerType)) {
      return toast(`No ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} in HQ Storage Yard`, 'err');
    }

    // If currently has a trailer, unhitch it to storage
    if (t.trailer) {
      S.trailers.push(t.trailer);
    }

    const idx = S.trailers.indexOf(trailerType);
    if (idx >= 0) S.trailers.splice(idx, 1);

    t.trailer = trailerType;
    pushNote(S, `Unit #${t.id} successfully coupled with ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}.`, { title: 'TRAILER COUPLED', type: 'ops' });
    toast(`Coupled ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}!`, 'success');
  });
}

export function buyTrailerToYard(trailerType: TrailerType) {
  set(S => {
    const price = TRAILER_PRICES[trailerType] || 15000;
    if (!pay(S, price, `Trailer Purchase: ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}`, 'expense_purchase')) return;
    
    if (trailerType === 'hazmat') {
      toast('ADR Hazmat tankers are provided by consignor terminals on dispatch (no purchase necessary)', 'info');
      return;
    }

    const deliveryTimeMs = 8 * 60 * 1000; // 8 Minutes Delivery
    const arrivalTime = Date.now() + deliveryTimeMs;

    if (!S.pendingTrailers) S.pendingTrailers = [];
    S.pendingTrailers.push({ type: trailerType, availableAt: arrivalTime });

    const trailerName = TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType;
    const tpl = vehiclePurchaseTemplate('Yard Asset', trailerName, price, 'HQ Storage Yard');
    pushNote(S, tpl.msg, { 
      title: 'TRAILER ORDER CONFIRMED', 
      type: tpl.type,
      priority: tpl.priority,
      body: tpl.body
    });
    toast(`${trailerName} purchased and en-route!`, 'success');
  });
}

export function expediteTruckDelivery(truckId: number) {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === truckId);
    if (!t || t.status !== 'delivering') return;

    const remainingMin = Math.ceil(((t.availableAt || Date.now()) - Date.now()) / 60000);
    const cost = Math.max(1500, remainingMin * 200);

    if (!pay(S, cost, `Expedite Delivery: Unit #${t.id}`)) return;

    t.availableAt = Date.now();
    t.status = 'idle';
    delete t.shippingMode;
    delete t.shippingVessel;
    delete t.shippingOrigin;

    pushNote(S, `Express air-freight charter expedited delivery for Unit #${t.id} (${t.name}). Unit is now ready at terminal ${t.loc || 'HQ'}. Cost: $${cost.toLocaleString()}`, {
      title: 'DELIVERY EXPEDITED',
      type: 'ops',
      priority: 'high'
    });
    toast(`Vehicle delivery expedited successfully for $${cost.toLocaleString()}!`, 'success');
  });
}


