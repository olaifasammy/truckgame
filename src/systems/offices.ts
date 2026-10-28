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
  S.garageLevel++;
  pushNote(S, `Garage expanded to Level ${S.garageLevel} (+2 slots)`);
  toast(`Garage Expanded!`, 'success');
});

export const buyOffice = (id: string) => set(S => {
  const o = OFFICES[id];
  if (!o || S.offices.includes(id)) return;
  if (S.vip < o.vip) return toast('Requires VIP ' + o.vip);
  if (S.money < o.price) return toast('Not enough cash');
  S.money -= o.price;
  S.offices.push(id);
  pushNote(S, 'Opened ' + o.name + ' · +' + o.slots + ' truck slots');
  toast('Opened ' + o.name);
});
