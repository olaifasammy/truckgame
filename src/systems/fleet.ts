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
const pay = (S: any, c: number) => {
  if (S.money < c) { toast('Not enough cash'); return false; }
  S.money -= c;
  return true;
};

export const refuel = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const model = TRUCK_MODELS[t.modelId];
  const c = refuelCost(t);
  if (c <= 0) return;
  if (!pay(S, c)) return;
  t.fluids.fuel = model.tankSize;
});

export const repair = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t) return;
  const c = repairCost(t);
  if (c <= 0 || !pay(S, c)) return;
  Object.values(t.components).forEach((comp: any) => {
    comp.health = 100;
  });
});

export const inspect = (id: number) => set(S => {
  const t = idle(S, id);
  if (!t || !pay(S, inspectCost())) return;
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

export function buyTruckBatch(modelId: string, trailerType: TrailerType | null, quantity: number, destinationCity: string) {
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
    if (!pay(S, totalPrice)) return;

    for (let i = 0; i < quantity; i++) {
      const truck = newTruck(S, modelId, trailerType, destinationCity);
      S.fleet.push(truck);
    }

    pushNote(S, `Acquired ${quantity}x ${m.brand} ${m.name} with ${trailerType ? TRAILERS[trailerType] : 'Tractor Only'} to ${destinationCity}`);
    toast(`Successfully acquired ${quantity} vehicle(s)!`, 'success');
  });
}
