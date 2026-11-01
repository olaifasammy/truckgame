import { set } from '../core/store';
import { toast } from '../core/ui';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../domain/trucks/trucks.data';
import { TrailerType } from '../domain/trucks/trucks.types';
import { stats, distKm, fuelCostForTrip, tripMs, applyWear, syncUsage } from './calc';
import { pushNote } from './notify';
import { disc } from './perks';
import { slots } from './offices';
import { createTruck } from '../domain/trucks/trucks.physics';

export const FUEL_PRICE = 2.5;
export const inspectCost = () => Math.round(500 * disc('scanner'));

export const refuelCost = (t: any) => {
  const model = TRUCK_MODELS[t.modelId];
  const needed = model.tankSize - t.fluids.fuel;
  return Math.round(needed * FUEL_PRICE * disc('fuelcard'));
};

export const repairCost = (t: any) => {
  let total = 0;
  Object.values(t.components).forEach((c: any) => {
    total += (100 - c.health) * 50;
  });
  return Math.round(total * disc('service'));
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
const pay = (S: any, c: number, purpose: string) => {
  if (S.money < c) { toast('Not enough cash'); return false; }
  S.money -= c;
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
  const model = TRUCK_MODELS[t.modelId];
  const c = refuelCost(t);
  if (c <= 0) return;
  if (!pay(S, c, `Refuel Unit #${id} (${t.name})`)) return;
  t.fluids.fuel = model.tankSize;
});

export const repair = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const c = repairCost(t);
  if (c <= 0 || !pay(S, c, `Repair Service Unit #${id} (${t.name})`)) return;
  Object.values(t.components).forEach((comp: any) => {
    comp.health = 100;
  });
});

export const inspect = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const cost = inspectCost();
  if (!pay(S, cost, `Safety Inspection Unit #${id} (${t.name})`)) return;
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
});

export function transportInfo(S: any, t: any, city: string) {
  const km = distKm(t.loc, city), st = stats(S, t), fuelNeeded = (km / 100) * st.fuelConsumption;
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
  
  const why = t.status !== 'idle' ? 'busy' : !t.driverId ? 'driver' : t.fluids.fuel < fuelNeeded ? 'fuel' : avgHealth < 20 ? 'cond' : null;
  return { km, fuel: fuelNeeded, ms: tripMs(km, st.topSpeed), why };
}

export const transport = (id: number, city: string) => set(S => {
  const t = S.fleet.find((x: any) => x.id === id);
  if (!t) return;
  const i = transportInfo(S, t, city);
  if (i.why) return toast('Truck cannot make this trip');
  const now = Date.now();
  const st = stats(S, t);
  S.active.push({ id: S.nextId++, kind: 'move', cargo: 'Repositioning', from: t.loc, to: city, km: i.km, dh: 0, pay: 0, truck: id, start: now, end: now + tripMs(i.km, st.topSpeed) });
  t.status = 'busy';
  toast('Moving to ' + city);
});

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
    if (!pay(S, totalPrice, `Fleet Purchase: ${quantity}x ${m.brand} ${m.name}`)) return;

    const deliveryTimeMs = 15 * 60 * 1000; // 15 Minutes Factory-to-Depot Transit
    const arrivalTime = Date.now() + deliveryTimeMs;

    for (let i = 0; i < quantity; i++) {
      const truck = newTruck(S, modelId, trailerType, destinationCity);
      truck.status = 'delivering';
      truck.availableAt = arrivalTime;
      S.fleet.push(truck);
    }

    pushNote(S, `Purchase processed for ${quantity}x ${m.brand} ${m.name}. Logistics team is currently transporting the vehicles to ${destinationCity}.`, { 
      title: 'EQUIPMENT IN TRANSIT', 
      type: 'ops',
      body: `Order Details:\nQuantity: ${quantity}\nModel: ${m.brand} ${m.name}\nDestination: ${destinationCity} Terminal\nEstimated Arrival: ${new Date(arrivalTime).toLocaleTimeString()}`
    });
    toast(`Order Processed: ${quantity} vehicle(s) in transit to garage`, 'success');
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
    if (!pay(S, price, `Trailer Purchase: ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}`)) return;
    
    if (trailerType === 'hazmat') {
      toast('ADR Hazmat tankers are provided by consignor terminals on dispatch (no purchase necessary)', 'info');
      return;
    }

    const deliveryTimeMs = 8 * 60 * 1000; // 8 Minutes Delivery
    const arrivalTime = Date.now() + deliveryTimeMs;

    if (!S.pendingTrailers) S.pendingTrailers = [];
    S.pendingTrailers.push({ type: trailerType, availableAt: arrivalTime });

    pushNote(S, `Commercial Trailer Order: 1x ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} is being delivered to Central Storage.`, { 
      title: 'TRAILER IN TRANSIT', 
      type: 'ops',
      body: `Order Details:\nType: ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}\nDestination: HQ Storage Yard\nEstimated Arrival: ${new Date(arrivalTime).toLocaleTimeString()}`
    });
    toast(`${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} purchased and en-route!`, 'success');
  });
}

