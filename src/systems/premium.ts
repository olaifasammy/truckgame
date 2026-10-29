import { set } from '../core/store';
import { toast } from '../core/ui';
import { GOLD, EXCH } from '../data/shop';
import { replenish, makeJob } from './jobs';
import { addCompanyXp } from '../domain/company/progression';

const FX: Record<string, (S: any) => void> = {
  refresh: S => { S.jobs = []; replenish(S); },
  vipjobs: S => { S.jobs.push(makeJob(S, true), makeJob(S, true)); },
  xp: S => {
    addCompanyXp(S, 400, 'Gold Pack XP Boost');
  }
};

export const exchange = () => set(S => {
  if (S.money < EXCH) return toast('Not enough cash');
  S.money -= EXCH;
  S.coins++;
  toast('+1 gold', 'success');
});

export const spend = (k: string) => set(S => {
  const g = GOLD[k];
  if (!g) return;
  if (S.coins < g.cost) return toast('Not enough gold', 'err');
  S.coins -= g.cost;
  FX[k](S);
  toast(g.label, 'success');
});

