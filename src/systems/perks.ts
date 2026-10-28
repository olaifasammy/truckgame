import { get, set } from '../core/store';
import { toast } from '../core/ui';
import { PERKS } from '../data/shop';

export const perkLvl = (k: string) => ((get() || {}).perks || {})[k] || 0;
export const disc = (k: string) => 1 - perkLvl(k) * PERKS[k].per;
export const perkCost = (k: string) => PERKS[k].base * (perkLvl(k) + 1);
export const buyPerk = (k: string) => set(S => {
  const p = PERKS[k], l = S.perks[k] || 0, c = p.base * (l + 1);
  if (l >= p.max) return;
  if (S.money < c) return toast('Not enough cash');
  S.money -= c;
  S.perks[k] = l + 1;
  toast(p.label + ' → L' + (l + 1));
});
