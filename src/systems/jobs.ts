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
    const success = BiddingEngine.placePlayerBid(S, auctionId, amount);
    if (success) {
      toast(`Tender Submitted: $${amount.toLocaleString()}`, 'success');
    } else {
      toast('Invalid bid (must undercut current lowest tender or auction closed)', 'err');
    }
  });
};

import { hasLicense } from '../domain/freight/licenses';

export function why(S: any, t: any, j: any) {
  if (t.status !== 'idle') return 'Truck is busy';
  if (!t.driverId) return 'Assign a CDL driver';

  const d = (S.drivers || []).find((x: any) => x.id === t.driverId);
  if (!d) return 'Driver not found';

  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const trailerType = cargo?.trailer || j.trailer || 'curtain';
  const truckModel = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];

  // 1. Company Corporate License Verification
  if (cargo?.isHazmat && !hasLicense(S, 'adr_hazmat')) {
    return 'Missing Company License: ADR Hazmat Authority (Buy in HQ)';
  }
  if (cargo?.tempControlled && !hasLicense(S, 'cold_chain')) {
    return 'Missing Company License: Cold Chain Sanitary Authority (Buy in HQ)';
  }
  if (trailerType === 'lowboy' && !hasLicense(S, 'heavy_haul')) {
    return 'Missing Company Permit: Heavy Abnormal Permit (Buy in HQ)';
  }
  if (trailerType === 'double_trailer' && !hasLicense(S, 'lcv_double')) {
    return 'Missing Company Authority: LCV Double Permit (Buy in HQ)';
  }
  if (trailerType === 'tipper' && !hasLicense(S, 'bulk_tipper')) {
    return 'Missing Company License: Bulk Aggregate Tipper License (Buy in HQ)';
  }
  if (cargo?.isFragile && (cargo.baseValue || 0) > 30 && !hasLicense(S, 'high_value')) {
    return 'Missing Company Bond: High-Value Transit Bond (Buy in HQ)';
  }

  // 2. Driver Certification & Endorsement Verification
  const certs = d.certifications || [];
  if (cargo?.isHazmat && !certs.includes('ADR Hazmat') && d.skill < 3) {
    return 'Driver lacks ADR Hazmat Certification (Train in Drivers)';
  }
  if (cargo?.tempControlled && !certs.includes('Cold Chain') && d.skill < 2) {
    return 'Driver lacks Cold Chain Certification (Train in Drivers)';
  }
  if (trailerType === 'lowboy' && !certs.includes('Heavy Haul') && d.skill < 3) {
    return 'Driver lacks Heavy Haul Lowboy Endorsement';
  }
  if (trailerType === 'double_trailer' && !certs.includes('Double Trailer LCV') && d.skill < 3) {
    return 'Driver lacks Double Trailer LCV Endorsement';
  }

  // 3. Chassis & Trailer Coupling Verification
  const isHazmatJob = cargo?.isHazmat || trailerType === 'tanker' || trailerType === 'hazmat';
  const isRigidOnly = truckModel.category === 'Rigid' || (truckModel.haul?.length === 1 && truckModel.haul[0] === 'rigid_box');
  
  if (isRigidOnly) {
    if (trailerType !== 'rigid_box') {
      return 'Rigid box truck chassis cannot haul articulated semi-trailers';
    }
  } else if (isHazmatJob) {
    // Shipper Terminal Supplies Hazmat/Chemical Tanker directly at zero capital cost
    // All highway semi-tractors are equipped with universal fifth-wheel couplings
  } else {
    // Commercial freight trailers: must have required trailer type coupled to tractor
    if (t.trailer !== trailerType) {
      const currentDesc = t.trailer ? (TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer) : 'Bobtail (No Trailer)';
      return `Requires ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} (Current: ${currentDesc})`;
    }
  }

  // 4. Mechanical Condition Verification
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
  if (avgHealth < 20) return 'Major repair needed';

  // 5. Fuel Range Verification
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

  // Check corporate license
  if (cargo?.isHazmat && !hasLicense(S, 'adr_hazmat')) {
    return 'Acquire ADR Hazmat Authority in HQ Depot first';
  }
  if (cargo?.tempControlled && !hasLicense(S, 'cold_chain')) {
    return 'Acquire Cold Chain Authority in HQ Depot first';
  }
  if (trailerType === 'lowboy' && !hasLicense(S, 'heavy_haul')) {
    return 'Acquire Heavy Abnormal Permit in HQ Depot first';
  }
  if (trailerType === 'double_trailer' && !hasLicense(S, 'lcv_double')) {
    return 'Acquire LCV Double Permit in HQ Depot first';
  }
  if (trailerType === 'tipper' && !hasLicense(S, 'bulk_tipper')) {
    return 'Acquire Bulk Aggregate Tipper License in HQ Depot first';
  }

  const ableTractors = S.fleet.filter((t: any) => {
    const truckModel = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
    const isRigidOnly = truckModel.category === 'Rigid' || (truckModel.haul?.length === 1 && truckModel.haul[0] === 'rigid_box');
    if (isRigidOnly) return trailerType === 'rigid_box';
    if (cargo?.isHazmat || trailerType === 'tanker' || trailerType === 'hazmat') return true;
    return t.trailer === trailerType;
  });

  if (!ableTractors.length) {
    if (cargo?.isHazmat) {
      return 'Needs a tractor chassis that supports tanker fifth-wheel coupling';
    }
    return `Needs a tractor hitched with ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} (Hitch in Garage/HQ)`;
  }

  if (!ableTractors.some((t: any) => t.status === 'idle')) return 'All coupled tractors are currently busy';
  if (!ableTractors.some((t: any) => t.status === 'idle' && t.driverId)) return 'Assign a qualified CDL driver';
  if (!findTruck(S, j)) return 'Check Driver Certifications, Fuel, or Repair in Garage';
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

    const isHazmatJob = cargo?.isHazmat || (cargo?.trailer === 'tanker') || (cargo?.trailer === 'hazmat');
    let previousTrailer = null;
    if (isHazmatJob) {
      if (t.trailer && t.trailer !== cargo?.trailer) {
        if (!S.trailers) S.trailers = [];
        S.trailers.push(t.trailer);
        previousTrailer = t.trailer;
        pushNote(S, `DEPOT STORAGE: Coupled ${TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer} unhitched to HQ Storage Yard for Shipper Tanker manifest.`);
      }
      t.trailer = (cargo?.trailer as any) || 'hazmat';
    }

    S.jobs = S.jobs.filter((x: any) => x.id !== id);
    S.active.push({ ...j, truck: t.id, dh, start: now, end: now + duration, env: routeEnv, isShipperTanker: isHazmatJob, unhitchedTrailer: previousTrailer });
    t.status = 'busy';
    replenish(S);
    pushNote(S, `Consignment Dispatched: ${cargo?.name || 'Cargo'} · ${j.from} → ${j.to}${quotaNote}`);
    toast('Dispatched: ' + (cargo?.name || 'Load') + (quotaNote ? ` · ${quotaNote}` : ''), 'success');
  });
}

export function completeJobs(S: any, now: number) {
  const auctionChanged = BiddingEngine.tickAuctions(S, now);
  const done: any[] = S.active.filter((a: any) => a.end <= now);
  if (done.length > 0) {
    S.active = S.active.filter((a: any) => a.end > now);
    for (const a of done) {
      const t = S.fleet.find((x: any) => x.id === a.truck), km = a.km + (a.dh || 0);
      if (t) {
        const st = stats(S, t, a.weight || 0, a.env);
        t.status = 'idle';
        t.loc = a.to;
        syncUsage(t, km, st);
        applyWear(t, km, a.weight || 0, a.env);

        // If this was a shipper-supplied tanker, return it to consignor terminal
        if (a.isShipperTanker) {
          t.trailer = null; // Returned to consignor terminal, tractor returns bobtail
          pushNote(S, `CONSIGNOR RETURN: Shipper's hazardous tanker returned to terminal in ${a.to}. Tractor ready for new trailer.`);
        }
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
  }
  return { done, auctionChanged };
}
