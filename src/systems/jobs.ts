import { set } from '../core/store';
import { toast } from '../core/ui';
import { vehicleDeliveryTemplate, dailyAccountingTemplate, weeklyAccountingTemplate, monthlyAccountingTemplate, tenderWonTemplate } from '../domain/notifications/templates';
import { TRUCK_MODELS, TRAILERS } from '../domain/trucks/trucks.data';
import { stats, fuelCostForTrip, tripMs, distKm, applyWear, syncUsage, getRouteEnv } from './calc';
import { pushNote } from './notify';
import { FreightEngine } from '../domain/freight/engine/generator';
import { CARGO_TYPES } from '../domain/freight/cargo/registry';
import { BiddingEngine } from '../domain/freight/bids/engine';
import { addCompanyXp, getCompanyProgression } from '../domain/company/progression';
import { consumeBidDispatchQuota } from '../domain/freight/bids/quota';
import { LOCATIONS } from '../data/world';
import { isRegionUnlocked } from '../domain/logistics/network';
import { INSURANCE_POLICIES } from '../domain/finance/banking';

import { Driver } from '../domain/drivers/drivers.types';
import { TRAIT_REGISTRY } from '../domain/drivers/drivers.names';
import { processScheduledRepair } from './maintenance';

export const fuelCost = (j: any, t?: any) => {
  if (t) return Math.round(fuelCostForTrip(j.km, t, j.weight));
  // Default estimate for job card preview
  return Math.round((j.km / 100) * 33);
};

// Bridge to the new engine
export const replenish = (S: any) => FreightEngine.replenish(S);
export const makeJob = (S: any, vip = false) => FreightEngine.generate(S, { vip });

export function recallTruck(S: any, truckId: number) {
  const activeJobIndex = S.active.findIndex((a: any) => a.truck === truckId);
  if (activeJobIndex === -1) return;
  
  const job = S.active[activeJobIndex];
  const truck = S.fleet.find((t: any) => t.id === truckId);
  
  if (truck) {
    truck.status = 'idle';
    pushNote(S, `Unit #${truckId} (${truck.name}) has been ordered to abort transit. Consignment for ${job.cargo} cancelled.`, {
      title: 'FLEET RECALL',
      type: 'ops',
      priority: 1
    });
  }
  
  S.active.splice(activeJobIndex, 1);
}
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
  if ((S.subcontractedTrucks || []).includes(t.id)) return 'Truck is currently leased out on charter sub-contract';
  if (!t.driverId) return 'Assign a CDL driver';

  const d = (S.drivers || []).find((x: any) => x.id === t.driverId);
  if (!d) return 'Driver not found';

  // Hours of Service (HOS) & Fatigue Check
  if (d.hosRestUntil && d.hosRestUntil > Date.now()) {
    const sec = Math.ceil((d.hosRestUntil - Date.now()) / 1000);
    return `Driver on mandatory 10h HOS rest (${sec}s remaining)`;
  }
  if ((d.hosHours || 0) >= 11) {
    return 'Driver exceeded 11h HOS daily limit (Send to Motel in Drivers)';
  }
  if ((d.fatigue || 0) > 85) {
    return 'Driver critically fatigued (Send to Motel in Drivers)';
  }

  const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
  const trailerType = cargo?.trailer || j.trailer || 'curtain';
  const truckModel = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];

  // Gross Axle Rating Verification
  const grossTonnes = (truckModel.baseWeight || 8) + (j.weight || 0);
  if (grossTonnes > (truckModel.maxGVW || 44) && !hasLicense(S, 'heavy_haul')) {
    return `Gross mass (${grossTonnes}t) exceeds chassis max GVW (${truckModel.maxGVW}t). Requires Heavy Abnormal Permit`;
  }

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
  const isRigidOnly = truckModel.haul?.length === 1 && truckModel.haul[0] === 'rigid_box';
  
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
  const comp = t.components || {};
  const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
  const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
  if (avgHealth < 20) return 'Major repair needed';

  // 5. Fuel & Range Verification
  const currentFuel = t.fluids?.fuel ?? 800;
  if (currentFuel < 30) {
    const bunkerLiters = S.fuelBunker?.currentLiters || 0;
    const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
    const needed = model.tankSize - currentFuel;
    const cashNeeded = Math.max(0, needed - bunkerLiters) * 2.5;
    if (bunkerLiters < 40 && S.money < cashNeeded) {
      return `Critically low fuel (${Math.round(currentFuel)}L) and insufficient funds/bunker for top-up`;
    }
  }

  return null;
}

const ok = (S: any, j: any) => {
  if (j.isAuctionWon) return true;
  if (!j.vip) return true;
  const prog = getCompanyProgression(S);
  return prog.tier >= 3 || S.companyTier >= 3 || (S.vip && S.vip >= 1);
};
export const findTruck = (S: any, j: any) => S.fleet.filter((t: any) => !why(S, t, j)).sort((a: any, b: any) => distKm(a.loc, j.from) - distKm(b.loc, j.from))[0];

export function blocker(S: any, j: any) {
  // Check region unlock
  const locFrom = LOCATIONS[j.from];
  const locTo = LOCATIONS[j.to];
  if (locFrom && !isRegionUnlocked(S, locFrom.region)) {
    return `Origin region (${locFrom.region}) locked. Obtain authority in Hubs first.`;
  }
  if (locTo && !isRegionUnlocked(S, locTo.region)) {
    return `Destination region (${locTo.region}) locked. Obtain authority in Hubs first.`;
  }

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
    const isRigidOnly = truckModel.haul?.length === 1 && truckModel.haul[0] === 'rigid_box';
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
  if (!findTruck(S, j)) return 'Check Driver Endorsements, Trailer, or Mechanical Condition';
  return null;
}

export function takeJob(id: number, truckId?: number) {
  set(S => {
    const j = S.jobs.find((x: any) => x.id === id);
    if (!j) return;
    if (!ok(S, j)) {
      const prog = getCompanyProgression(S);
      return toast(`VIP Exclusive Contract: Requires VIP Rank (Tier 3+). Current: ${prog.title}`, 'err');
    }
    
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

    // Automatic Pre-Dispatch Refuel from Company Depot Storage / Station
    const tankCapacity = 800;
    const currentFuel = t.fluids?.fuel !== undefined ? t.fluids.fuel : 800;
    const neededFuel = Math.max(0, tankCapacity - currentFuel);
    if (neededFuel > 0) {
      if (!S.fuelBunker) S.fuelBunker = { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
      const fromBunker = Math.min(neededFuel, S.fuelBunker.currentLiters || 0);
      if (fromBunker > 0) {
        S.fuelBunker.currentLiters -= fromBunker;
      }
      const stillNeeded = neededFuel - fromBunker;
      let stationCost = 0;
      if (stillNeeded > 0) {
        stationCost = Math.round(stillNeeded * 1.25);
        S.money = Math.max(0, S.money - stationCost);
      }
      t.fluids.fuel = tankCapacity;
      if (fromBunker > 0 && stillNeeded > 0) {
        pushNote(S, `${t.name} topped up to 100% (${fromBunker}L Depot Bunker, ${stillNeeded}L station top-off: -$${stationCost}).`, { title: 'AUTO-REFUEL', type: 'ops' });
      } else if (fromBunker > 0) {
        pushNote(S, `${t.name} filled tank (800L) from Depot Fuel Bunker before departure.`, { title: 'AUTO-REFUEL', type: 'ops' });
      } else {
        pushNote(S, `${t.name} filled tank (800L) at station (-$${stationCost}).`, { title: 'AUTO-REFUEL', type: 'ops' });
      }
    }

    // Enforce 5 free daily bidded dispatches, 4 Gold Coins thereafter
    let quotaNote = '';
    if (j.isAuctionWon) {
      const quotaRes = consumeBidDispatchQuota(S);
      if (!quotaRes.success) {
        return toast(quotaRes.message, 'err');
      }
      if (quotaRes.costPaid > 0) {
        quotaNote = ' (Paid 4 Gold Coins)';
        pushNote(S, `4 Gold Coins paid for bidded consignment #${j.id} (daily limit exceeded).`, { title: 'EXPEDITED DISPATCH', type: 'finance', priority: 1 });
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
        pushNote(S, `Coupled ${TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer} unhitched to HQ Storage Yard for Shipper Tanker manifest.`, { title: 'DEPOT STORAGE', type: 'ops' });
      }
      t.trailer = (cargo?.trailer as any) || 'hazmat';
    }

    S.jobs = S.jobs.filter((x: any) => x.id !== id);
    const cargoName = cargo?.name || j.cargo || 'Commercial Freight';
    S.active.push({ ...j, cargo: cargoName, truck: t.id, dh, start: now, end: now + duration, env: routeEnv, isShipperTanker: isHazmatJob, unhitchedTrailer: previousTrailer });
    t.status = 'busy';
    replenish(S);
    pushNote(S, `Consignment Dispatched: ${cargo?.name || 'Cargo'} · ${j.from} → ${j.to}${quotaNote}`, { title: 'DISPATCH CONFIRMATION', type: 'ops' });
    toast('Dispatched: ' + (cargo?.name || 'Load') + (quotaNote ? ` · ${quotaNote}` : ''), 'success');
  });
}

export function completeJobs(S: any, now: number) {
  // Process Asset Deliveries (New Trucks & Trailers)
  const arrivedTrucks = S.fleet.filter((t: any) => t.status === 'delivering' && t.availableAt <= now);
  for (const t of arrivedTrucks) {
    t.status = 'idle';
    delete t.availableAt;
    const tpl = vehicleDeliveryTemplate(t.id, t.name, t.loc || 'Terminal');
    pushNote(S, tpl.msg, {
      title: tpl.title,
      type: tpl.type,
      priority: tpl.priority,
      body: tpl.body
    });
  }

  const arrivedTrailers = (S.pendingTrailers || []).filter((p: any) => p.availableAt <= now);
  if (arrivedTrailers.length > 0) {
    if (!S.trailers) S.trailers = [];
    for (const p of arrivedTrailers) {
      const trailerName = TRAILERS[p.type as keyof typeof TRAILERS] || p.type;
      S.trailers.push(p.type);
      const tpl = vehicleDeliveryTemplate('Yard', trailerName, 'HQ Storage Yard');
      pushNote(S, tpl.msg, {
        title: 'TRAILER DELIVERED',
        type: tpl.type,
        body: tpl.body
      });
    }
    S.pendingTrailers = S.pendingTrailers.filter((p: any) => p.availableAt > now);
  }

  const auctionChanged = BiddingEngine.tickAuctions(S, now);
  const done: any[] = S.active.filter((a: any) => a.end <= now);
  if (done.length > 0) {
    S.active = S.active.filter((a: any) => a.end > now);
    for (const a of done) {
      const t = S.fleet.find((x: any) => x.id === a.truck), km = a.km + (a.dh || 0);
      const cargo = CARGO_TYPES.find(c => c.id === a.cargoId);
      const truckModel = t ? (TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730']) : null;

      if (t) {
        const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
        const st = stats(S, t, a.weight || 0, a.env);
        t.status = 'idle';
        t.loc = a.to;
        processScheduledRepair(S, t.id);
        syncUsage(t, km, st, a.env, S);
        applyWear(t, km, a.weight || 0, a.env, drv);

        // Driver Hours of Service, Fatigue & Welfare Accrual
        if (drv) {
          if (!drv.stats) drv.stats = { tripsCompleted: 0, kmDriven: 0, earned: 0 };
          drv.stats.tripsCompleted++;
          drv.stats.kmDriven += km;
          drv.stats.earned += Math.round(a.pay * 0.12);

          // Fully rest driver upon job completion so they are always ready to move
          drv.fatigue = 0;
          drv.hosHours = 0;
          drv.hosRestUntil = null;
          pushNote(S, `${drv.name} completed consignment and returned to terminal fully rested and ready for dispatch.`, { title: 'DRIVER RESTED', type: 'ops' });

          // Environmental stress & weather wear
          if (a.env?.weather === 'snow' || a.env?.weather === 'heatwave') {
            drv.stress = Math.min(100, (drv.stress || 15) + 10);
            drv.morale = Math.max(10, (drv.morale || 90) - 4);
          }

          // Mentorship Academy skill acceleration
          if (drv.mentorId) {
            const mentor = S.drivers.find((m: any) => m.id === drv.mentorId);
            if (mentor && drv.skill < 3 && Math.random() < 0.25) {
              drv.skill++;
              pushNote(S, `Under Master Driver ${mentor.name}'s guidance, ${drv.name} advanced to Level ${drv.skill}★ CDL!`, { title: 'MENTORSHIP ACADEMY', type: 'ops', priority: 1 });
            }
          }

          // HOS Enforcement Check
          if (drv.hosHours > 11.0) {
            const fine = 1800;
            if (S.insurance?.liability) {
              pushNote(S, `${drv.name} logged 11h+ continuous drive. $${fine} DOT citation covered under Statutory Liability Policy.`, {
                title: 'HOS ENFORCEMENT',
                type: 'compliance',
                priority: 1,
                body: `Violation: Driving time exceeded 11.0 hours.\nDriver: ${drv.name}\nCitation: $${fine.toLocaleString()}\nOutcome: Fully covered by Carrier Liability Insurance.`
              });
            } else {
              S.money = Math.max(0, S.money - fine);
              pushNote(S, `${drv.name} exceeded 11.0h statutory HOS limit without mandatory rest. Fined $${fine.toLocaleString()}.`, {
                title: 'DOT CITATION',
                type: 'compliance',
                priority: 2,
                body: `Violation: Driving time exceeded 11.0 hours.\nDriver: ${drv.name}\nCitation: $${fine.toLocaleString()}\nOutcome: Deducted from Operating Capital.`
              });
            }
          }
        }

        // Weigh Station Axle Enforcement
        if (truckModel && (truckModel.baseWeight + (a.weight || 0) > truckModel.maxGVW) && !hasLicense(S, 'heavy_haul')) {
          const fine = 2400;
          if (S.insurance?.liability) {
            pushNote(S, `Gross mass exceeded chassis rating. $${fine} Overweight citation covered by Liability Insurance.`, {
              title: 'WEIGH STATION INSPECTION',
              type: 'compliance',
              priority: 1,
              body: `Violation: Gross Vehicle Weight exceeded registered GVWR.\nUnit: Unit #${a.truck}\nFine: $${fine.toLocaleString()}\nOutcome: Insurance Claim Filed & Paid.`
            });
          } else {
            S.money = Math.max(0, S.money - fine);
            pushNote(S, `Gross mass exceeded rating without Heavy Permit. Transport Police fine: $${fine.toLocaleString()}.`, {
              title: 'WEIGH STATION CITATION',
              type: 'compliance',
              priority: 2,
              body: `Violation: Gross Vehicle Weight exceeded registered GVWR.\nUnit: Unit #${a.truck}\nFine: $${fine.toLocaleString()}\nOutcome: Direct Operating Loss.`
            });
          }
        }

        // Return shipper-supplied tanker if applicable
        if (a.isShipperTanker) {
          t.trailer = null;
          pushNote(S, `Shipper's hazardous tanker returned to chemical terminal in ${a.to}. Tractor returns bobtail.`, { title: 'CONSIGNOR RETURN', type: 'ops' });
        }
      }

      if (a.kind === 'move') {
        pushNote(S, `${t ? t.name : 'Truck'} arrived in ${a.to}`, { title: 'MOVEMENT COMPLETE', type: 'ops' });
        continue;
      }

      let finalPay = a.pay;

      // Driver Trait Bonuses
      const drv = t ? (S.drivers || []).find((x: any) => x.id === t.driverId) : null;
      if (drv?.trait) {
        const traitDef = (TRAIT_REGISTRY as any)[drv.trait];
        if (traitDef?.effect?.payoutMod) {
          const traitBonus = Math.round(a.pay * traitDef.effect.payoutMod);
          finalPay += traitBonus;
          pushNote(S, `+$${traitBonus.toLocaleString()} trait bonus earned by ${drv.name} (${traitDef.name}).`, { title: 'DRIVER PERFORMANCE BONUS', type: 'finance' });
        }
      }

      // Warehouse Infrastructure Bonuses
      if (S.warehouseUpgrades?.cold_vault && (a.trailer === 'reefer' || cargo?.tempControlled)) {
        const coldBonus = Math.round(a.pay * 0.20);
        finalPay += coldBonus;
        pushNote(S, `+$${coldBonus.toLocaleString()} premium earned via Cryogenic Warehouse Vault.`, { title: 'COLD STORAGE VAULT', type: 'finance' });
      }

    S.money += finalPay;
    if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
    S.dailyStats.revenue += finalPay;

    pushNote(S, `Payment for ${cargo?.name || 'Freight'} haul: +$${finalPay.toLocaleString()}`, {
        title: 'PAYMENT REMITTANCE',
        type: 'finance',
        body: `Consignment: ${cargo?.name || 'Commercial Freight'}\nRoute: ${a.from} → ${a.to}\nGross Pay: $${finalPay.toLocaleString()}\nTimestamp: ${new Date().toLocaleString()}`
      });
      S.loads++;
      const repGain = a.isAuctionWon ? 45 : 15;
      S.stats.earned += finalPay;
      S.stats.km += a.km;
      
      if (!S.reputation) S.reputation = 0;
      S.reputation += repGain;

      // Proof-of-Delivery (PoD) Cryptographic Smart Contract Reward
      const podBonusFlb = parseFloat((0.05 + ((a.km || 300) / 1000) * 0.05).toFixed(2));
      S.coins = (S.coins || 0) + podBonusFlb;
      pushNote(S, `Proof-of-Delivery verified! Awarded +${podBonusFlb.toFixed(2)} FLB Smart-Contract PoD bonus for pristine delivery.`, {
        title: 'SMART CONTRACT PoD REWARD',
        type: 'finance',
        priority: 2,
        body: `Consignment: ${cargo?.name || 'Commercial Freight'}\nCarrier Seal: Intact · 0% Cargo Damage\nDestination: ${a.to}\nNetwork: FLB Proof-of-Delivery Protocol\nReward: +${podBonusFlb.toFixed(2)} FLB`
      });

      // Corporate Tender Progress Tracking
      if (a.tenderId && S.corporateTenders) {
        const tender = S.corporateTenders.find((ct: any) => ct.id === a.tenderId);
        if (tender) {
          tender.completedLoads = (tender.completedLoads || 0) + 1;
          tender.loadsRemaining = Math.max(0, tender.loadsRemaining - 1);
          if ((tender.completedLoads >= tender.totalLoads || tender.loadsRemaining <= 0) && !tender.bonusAwarded) {
            tender.bonusAwarded = true;
            S.money += tender.bonusPayout;
            S.stats.earned += tender.bonusPayout;
            pushNote(S, `${tender.client} contract completed! Awarded $${tender.bonusPayout.toLocaleString()} SLA performance bonus!`, {
              title: 'CORPORATE TENDER COMPLETED',
              type: 'tender',
              priority: 1,
              body: `Corporate Tender ID: ${a.tenderId}\nClient: ${tender.client}\nPerformance Bonus: $${tender.bonusPayout.toLocaleString()}\nSLA Met: 100%`
            });
            toast(`Tender Completed: ${tender.client}! +$${tender.bonusPayout.toLocaleString()} Bonus 🪙`, 'success');
            
            // Remove completed tender so new enterprise contracts from other companies become available
            S.corporateTenders = S.corporateTenders.filter((ct: any) => ct.id !== a.tenderId);
          }
        }
      }

      const baseXp = 25;
      const kmXp = Math.round((a.km || 0) * 0.02);
      const auctionBonus = a.isAuctionWon ? 20 : 0;
      const hazmatBonus = cargo?.isHazmat ? 15 : 0;
      const totalXp = baseXp + kmXp + auctionBonus + hazmatBonus;

      addCompanyXp(S, totalXp, `Delivery: ${cargo?.name || 'Freight'}`);
    }
  }

  return { done, auctionChanged };
}

/**
 * Processes passive income and economic ticks based on elapsed time.
 * Supports offline progression.
 */
import { processMiningTick } from '../domain/finance/markets/mining';

export function processEconomics(S: any, now: number) {
  if (!S.lastTick) S.lastTick = now;
  const elapsedMs = now - S.lastTick;
  if (elapsedMs <= 0) return;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Check and settle any completed corporate tenders retroactively or on tick
  if (S.corporateTenders && S.corporateTenders.length > 0) {
    S.corporateTenders = S.corporateTenders.filter((tender: any) => {
      if ((tender.completedLoads >= tender.totalLoads || tender.loadsRemaining <= 0) && !tender.bonusAwarded) {
        tender.bonusAwarded = true;
        S.money += tender.bonusPayout;
        S.stats.earned += tender.bonusPayout;
        pushNote(S, `${tender.client} contract completed! Awarded $${tender.bonusPayout.toLocaleString()} SLA performance bonus!`, {
          title: 'CORPORATE TENDER COMPLETED',
          type: 'tender',
          priority: 1,
          body: `Corporate Tender ID: ${tender.id}\nClient: ${tender.client}\nPerformance Bonus: $${tender.bonusPayout.toLocaleString()}\nSLA Met: 100%`
        });
        toast(`Tender Completed: ${tender.client}! +$${tender.bonusPayout.toLocaleString()} Bonus 🪙`, 'success');
        return false; // Remove completed tender
      }
      return tender.loadsRemaining > 0;
    });
  }
  
  // Process Crypto Mining Yield & Electricity Costs
  processMiningTick(S, elapsedMs);

  let dailyInflow = 0;
  let dailyOutflow = 0;

  // 1. Warehouse Automation Passive Income
  if (S.warehouseUpgrades?.cross_docking) {
    dailyInflow += 1200;
  }
  if (S.warehouseUpgrades?.gantry_crane) {
    dailyInflow += 600;
  }

  // 2. Sub-contracting Passive Retainer
  const subcontractCount = (S.subcontractedTrucks || []).length;
  if (subcontractCount > 0) {
    dailyInflow += subcontractCount * 1800;
  }

  // 3. Driver Payroll Daily Salaries
  const totalSalaries = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);
  dailyOutflow += totalSalaries;

  // 4. Commercial Insurance Premiums
  if (S.insurance) {
    if (S.insurance.liability) dailyOutflow += (INSURANCE_POLICIES.liability?.dailyCost || 85);
    if (S.insurance.collision) dailyOutflow += (INSURANCE_POLICIES.collision?.dailyCost || 220);
    if (S.insurance.cargo) dailyOutflow += (INSURANCE_POLICIES.cargo?.dailyCost || 310);
  }

  // 5. Debt Service & Equipment Leases
  if (S.loans && S.loans.length > 0) {
    for (const loan of S.loans) {
      dailyOutflow += (loan.dailyRate || 0);
    }
  }
  if (S.leases && S.leases.length > 0) {
    for (const lease of S.leases) {
      dailyOutflow += (lease.dailyRate || 0);
    }
  }

  // Subcontracted truck mechanical wear (0.05% wear per day on chartered rigs)
  if (subcontractCount > 0) {
    const dailyWearRatio = elapsedMs / MS_PER_DAY;
    for (const truckId of S.subcontractedTrucks) {
      const trk = (S.fleet || []).find((t: any) => t.id === truckId);
      if (trk && trk.components) {
        Object.values(trk.components).forEach((comp: any) => {
          if (typeof comp === 'object' && comp.health !== undefined) {
            comp.health = Math.max(15, parseFloat((comp.health - (0.05 * dailyWearRatio)).toFixed(2)));
          }
        });
      }
    }
  }

  // Net Operating Cashflow Delta
  const netDaily = dailyInflow - dailyOutflow;
  const netDelta = (netDaily / MS_PER_DAY) * elapsedMs;

  if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
  S.dailyStats.salaries += (totalSalaries / MS_PER_DAY) * elapsedMs;
  S.dailyStats.insurance += ((dailyOutflow - totalSalaries - (S.loans || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0) - (S.leases || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0)) / MS_PER_DAY) * elapsedMs;
  S.dailyStats.revenue += (dailyInflow / MS_PER_DAY) * elapsedMs;

  if (!S._lastDailyNote) S._lastDailyNote = now;
  if (now - S._lastDailyNote >= MS_PER_DAY) {
    S._lastDailyNote = now;

    const tplData = {
      revenue: S.dailyStats?.revenue || dailyInflow,
      salaries: S.dailyStats?.salaries || totalSalaries,
      fuel: S.dailyStats?.fuel || 0,
      maintenance: S.dailyStats?.maintenance || 0,
      insurance: S.dailyStats?.insurance || (dailyOutflow - totalSalaries), // fallback
      loans: (S.loans || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0) + (S.leases || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0),
      net: (S.dailyStats?.revenue || 0) - (S.dailyStats?.salaries || 0) - (S.dailyStats?.fuel || 0) - (S.dailyStats?.maintenance || 0) - (S.dailyStats?.insurance || 0)
    };

    const dNote = dailyAccountingTemplate(tplData);
    pushNote(S, dNote.msg, {
      title: dNote.title,
      type: dNote.type,
      priority: dNote.priority,
      body: dNote.body
    });

    // Reset daily stats
    S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };

    if (!S._daysCounter) S._daysCounter = 0;
    S._daysCounter++;

    if (S._daysCounter % 7 === 0) {
      const wNote = weeklyAccountingTemplate({
        revenue: dailyInflow * 7,
        expenses: dailyOutflow * 7,
        net: netDaily * 7,
        trips: S.loads || 0,
        km: S.stats?.km || 0
      });
      pushNote(S, wNote.msg, {
        title: wNote.title,
        type: wNote.type,
        priority: wNote.priority,
        body: wNote.body
      });
    }
    if (S._daysCounter % 30 === 0) {
      const assetsValue = (S.fleet?.length || 0) * 125000 + (S.offices?.length || 0) * 60000;
      const liabilities = (S.loans || []).reduce((acc: number, l: any) => acc + (l.balance || 0), 0);
      const mNote = monthlyAccountingTemplate({
        revenue: dailyInflow * 30,
        expenses: dailyOutflow * 30,
        net: netDaily * 30,
        assetsValue,
        liabilities,
        equity: S.money + assetsValue - liabilities
      });
      pushNote(S, mNote.msg, {
        title: mNote.title,
        type: mNote.type,
        priority: mNote.priority,
        body: mNote.body
      });
    }
  }

  if (!S._incomeAccumulator) S._incomeAccumulator = 0;
  S._incomeAccumulator += netDelta;

  if (Math.abs(S._incomeAccumulator) >= 1) {
    const wholeDollars = Math.trunc(S._incomeAccumulator);
    S.money += wholeDollars;
    S._incomeAccumulator -= wholeDollars;
  }

  // Smoothly amortize active commercial bank facilities
  if (S.loans && S.loans.length > 0) {
    for (const loan of S.loans) {
      const loanPayment = (loan.dailyRate / MS_PER_DAY) * elapsedMs;
      loan.balance = Math.max(0, loan.balance - loanPayment);
      loan.daysRemaining = Math.max(0, loan.daysRemaining - (elapsedMs / MS_PER_DAY));
    }
    const settled = S.loans.filter((l: any) => l.balance <= 0);
    if (settled.length > 0) {
      S.loans = S.loans.filter((l: any) => l.balance > 0);
      for (const l of settled) {
        pushNote(S, `Commercial Facility Paid in Full: ${l.name}`, { title: 'LOAN SETTLED', type: 'finance', priority: 1 });
      }
    }
  }

  // Amortize equipment leases
  if (S.leases && S.leases.length > 0) {
    for (const lease of S.leases) {
      lease.daysRemaining = Math.max(0, lease.daysRemaining - (elapsedMs / MS_PER_DAY));
    }
  }

  // 6. Instant Idle Recovery
  // Drivers are considered rested immediately when not on an active dispatch.
  if (S.drivers && S.drivers.length > 0) {
    S.drivers.forEach((drv: any) => {
      const isOnTrip = (S.active || []).some((a: any) => {
        const truck = (S.fleet || []).find((t: any) => t.id === a.truck);
        return truck && truck.driverId === drv.id;
      });

      if (!isOnTrip) {
        drv.fatigue = 0;
        drv.hosHours = 0;
        drv.hosRestUntil = null;
      }
    });
  }

  S.lastTick = now;
}
