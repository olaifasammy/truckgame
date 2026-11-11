import { set } from '../core/store';
import { toast } from '../core/ui';
import { GOLD, EXCH } from '../data/shop';
import { replenish, makeJob } from './jobs';
import { addCompanyXp } from '../domain/company/progression';

const FX: Record<string, (S: any) => void> = {
  refresh: S => {
    const securedJobs = (S.jobs || []).filter((j: any) => j.isAuctionWon || j.tenderId);
    S.jobs = [...securedJobs];
    replenish(S);
  },
  vipjobs: S => { S.jobs.push(makeJob(S, true), makeJob(S, true)); },
  xp: S => {
    addCompanyXp(S, 1000, 'Gold Pack XP Boost');
  }
};

export const exchange = (requestedQty?: number) => set(S => {
  let qty = requestedQty !== undefined && !isNaN(requestedQty) ? requestedQty : 0;
  if (qty <= 0) {
    const input = document.getElementById('premium-exchange-qty-input') as HTMLInputElement | null;
    qty = input ? parseInt(input.value, 10) : 1;
  }
  if (isNaN(qty) || qty <= 0) return toast('Enter a valid coin quantity', 'err');

  const totalCost = EXCH * qty;
  if (S.money < totalCost) return toast(`Not enough cash (Need $${totalCost.toLocaleString()})`, 'err');
  S.money -= totalCost;
  S.coins = (S.coins || 0) + qty;
  toast(`Acquired +${qty} Gold Coin${qty > 1 ? 's' : ''}`, 'success');
});

export const spend = (k: string) => set(S => {
  const g = GOLD[k];
  if (!g) return;
  if (S.coins < g.cost) return toast('Not enough gold', 'err');
  S.coins -= g.cost;
  FX[k](S);
  toast(g.label, 'success');
});

