import { set } from '../core/store';
import { toast } from '../core/ui';
import { OFFICES, BASE_SLOTS } from '../data/shop';
import { pushNote } from './notify';

export const slots = (S: any) => BASE_SLOTS + (S.garageLevel * 2) + S.offices.reduce((a: number, id: string) => a + OFFICES[id].slots, 0);

export const upgradeGarageCost = (level: number) => 15000 + (level * 25000);

export const upgradeGarage = () => set(S => {
  const cost = upgradeGarageCost(S.garageLevel);
  if (S.money < cost) return toast('Not enough cash');
  
  S.money -= cost;
  pushNote(S, `Garage expansion to Level ${S.garageLevel + 1} (-$${cost.toLocaleString()})`, {
    title: 'Financial Transaction',
    type: 'finance',
    body: `Facility Infrastructure Upgrade authorized.\nLevel: ${S.garageLevel + 1}\nNew Capacity: +2 Slots\nFee: $${cost.toLocaleString()}\nTimestamp: ${new Date().toLocaleString()}`
  });
  S.garageLevel++;
  pushNote(S, `Garage expanded to Level ${S.garageLevel} (+2 vehicle slots).`, { title: 'FACILITY UPGRADE', type: 'ops', priority: 1 });
  toast(`Garage Expanded!`, 'success');
});

export const buyOffice = (id: string) => set(S => {
  const o = OFFICES[id];
  if (!o || S.offices.includes(id)) return;
  if (S.vip < o.vip) return toast('Requires VIP ' + o.vip);
  if (S.money < o.price) return toast('Not enough cash');
  S.money -= o.price;
  pushNote(S, `Depot Acquisition: ${o.name} (-$${o.price.toLocaleString()})`, {
    title: 'Financial Transaction',
    type: 'finance',
    body: `Regional Expansion authorized.\nLocation: ${o.name}\nCapacity: +${o.slots} Slots\nFee: $${o.price.toLocaleString()}\nTimestamp: ${new Date().toLocaleString()}`
  });
  S.offices.push(id);
  pushNote(S, `Registered ${o.name} depot facility. (+${o.slots} truck slots).`, { title: 'REGIONAL DEPOT', type: 'ops' });
  toast('Opened ' + o.name);
});
