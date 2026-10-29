import { set } from '../core/store';
import { toast } from '../core/ui';
import { TRUCK_MODELS, TRAILERS } from '../domain/trucks/trucks.data';
import { stats, fuelCostForTrip, tripMs, distKm, applyWear, syncUsage, getRouteEnv } from './calc';
import { pushNote } from './notify';
import { FreightEngine } from '../domain/freight/engine/generator';
import { CARGO_TYPES } from '../domain/freight/cargo/registry';
import { BiddingEngine } from '../domain/freight/bids/engine';
import { addCompanyXp, getCompanyProgression } from '../domain/company/progression';
import { consumeBidDispatchQuota } from '../domain/freight/bids/quota';

export const fuelCost = (j: any, t?: any) => {
  if (t) return Math.round(fuelCostForTrip(j.km, t, j.weight));
  // Default estimate for job card preview
  return Math.round((j.km / 100) * 33);
};

// Bridge to the new engine
export const replenish = (S: any) => FreightEngine.replenish(S);
export const makeJob = (S: any, vip = false) => FreightEngine.generate(S, { vip });
export const placeBid = (auctionId: number, amount: number) => {
  set(S => {
    const prog = getCompanyProgression(S);
    if (prog.tier < 3) {
      return toast(`Job Bidding unlocks at VIP Rank (Tier 3+). Your rank: ${prog.title}`, 'err');
    }
    const success = BiddingEngine.placePlayerBid(S, auctionId, amount);
    if (success) {
      toast(`Tender Submitted: $${amount.toLocaleString()}`, 'success');
    } else {
      toast('Invalid bid (must undercut current lowest tender or auction closed)', 'err');
    }
  });
};

export function why(S: any, t: any, j: any) {
  if (t.status !== 'idle') return 'Truck is busy';
  if (!t.driverId) return 'Assign a driver first';
  
  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const trailerType = cargo?.trailer || j.trailer || 'curtain';
  
  const truckModel = TRUCK_MODELS[t.modelId];
  if (!truckModel.haul.includes(trailerType as any)) {
    return 'Incompatible trailer: ' + TRAILERS[trailerType as keyof typeof TRAILERS];
  }
  
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
  if (avgHealth < 20) return 'Major repair needed';
  
  const deadheadDist = distKm(t.loc, j.from);
  const initialStintKm = deadheadDist + Math.min(j.km || 0, 450);
  const departureFuelNeeded = Math.round(fuelCostForTrip(initialStintKm, t, j.weight));
  if (t.fluids.fuel < departureFuelNeeded || t.fluids.fuel < 60) return 'Refuel needed';
  
  return null;
}

const ok = (S: any, j: any) => !(j.vip && S.vip < 5);
export const findTruck = (S: any, j: any) => S.fleet.filter((t: any) => !why(S, t, j)).sort((a: any, b: any) => distKm(a.loc, j.from) - distKm(b.loc, j.from))[0];

export function blocker(S: any, j: any) {
  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const trailerType = cargo?.trailer || j.trailer || 'curtain';

  const able = S.fleet.filter((t: any) => TRUCK_MODELS[t.modelId].haul.includes(trailerType as any));
  if (!able.length) return 'Needs a truck that hauls ' + TRAILERS[trailerType as keyof typeof TRAILERS];
  if (!able.some((t: any) => t.status === 'idle')) return 'All suitable trucks are busy';
  if (!able.some((t: any) => t.status === 'idle' && t.driverId)) return 'Assign a driver in HQ Depot';
  if (!findTruck(S, j)) return 'Check Fuel/Maintenance in HQ Depot';
  return null;
}

export function takeJob(id: number, truckId?: number) {
  set(S => {
    const j = S.jobs.find((x: any) => x.id === id);
    if (!j) return;
    if (!ok(S, j)) return toast('VIP only');
    
    let t;
    if (truckId) {
      t = S.fleet.find((x: any) => x.id === truckId);
      const w = t && why(S, t, j);
      if (!t || w) return toast(w || 'No truck');
    } else {
      const w = blocker(S, j);
      if (w) return toast(w);
      t = findTruck(S, j);
    }
    
    const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);

    // Enforce 5 free daily bidded dispatches, 4 Gold Coins thereafter
    let quotaNote = '';
    if (j.isAuctionWon) {
      const quotaRes = consumeBidDispatchQuota(S);
      if (!quotaRes.success) {
        return toast(quotaRes.message, 'err');
      }
      if (quotaRes.costPaid > 0) {
        quotaNote = ' (Paid 4 Gold Coins)';
        pushNote(S, `EXPEDITED DISPATCH: 4 Gold Coins paid for bidded consignment #${j.id} (daily limit exceeded).`);
      } else {
        quotaNote = ` (${quotaRes.message})`;
      }
    }

    const now = Date.now(), dh = distKm(t.loc, j.from);
    const routeEnv = getRouteEnv(j.from, j.to);
    const st = stats(S, t, j.weight, routeEnv);
    const totalKm = j.km + dh;
    const duration = tripMs(totalKm, st.topSpeed, routeEnv);

    S.jobs = S.jobs.filter((x: any) => x.id !== id);
    S.active.push({ ...j, truck: t.id, dh, start: now, end: now + duration, env: routeEnv });
    t.status = 'busy';
    replenish(S);
    pushNote(S, `Consignment Dispatched: ${cargo?.name || 'Cargo'} · ${j.from} → ${j.to}${quotaNote}`);
    toast('Dispatched: ' + (cargo?.name || 'Load') + (quotaNote ? ` · ${quotaNote}` : ''), 'success');
  });
}

export function completeJobs(S: any, now: number) {
  BiddingEngine.tickAuctions(S, now);
  const done = S.active.filter((a: any) => a.end <= now);
  if (!done.length) return done;
  S.active = S.active.filter((a: any) => a.end > now);
  for (const a of done) {
    const t = S.fleet.find((x: any) => x.id === a.truck), km = a.km + (a.dh || 0);
    if (t) {
      const st = stats(S, t, a.weight || 0, a.env);
      t.status = 'idle';
      t.loc = a.to;
      syncUsage(t, km, st);
      applyWear(t, km, a.weight || 0, a.env);
    }
    if (a.kind === 'move') {
      pushNote(S, `${t ? t.name : 'Truck'} arrived in ${a.to}`);
      continue;
    }
    S.money += a.pay;
    S.loads++;
    const repGain = a.isAuctionWon ? 45 : 15;
    S.stats.earned += a.pay;
    S.stats.km += a.km;
    
    if (!S.reputation) S.reputation = 0;
    S.reputation += repGain;

    const cargo = CARGO_TYPES.find(c => c.id === a.cargoId);
    const baseXp = 140;
    const kmXp = Math.round((a.km || 0) * 0.12);
    const auctionBonus = a.isAuctionWon ? 90 : 0;
    const hazmatBonus = cargo?.isHazmat ? 75 : 0;
    const totalXp = baseXp + kmXp + auctionBonus + hazmatBonus;

    addCompanyXp(S, totalXp, `Delivery: ${cargo?.name || 'Freight'}`);
  }
  return done;
}
