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
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
  if (avgHealth < 20) return 'Major repair needed';

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
        pushNote(S, `AUTO-REFUEL: ${t.name} topped up to 100% (${fromBunker}L Depot Bunker, ${stillNeeded}L station top-off: -$${stationCost}).`);
      } else if (fromBunker > 0) {
        pushNote(S, `AUTO-REFUEL: ${t.name} filled tank (800L) from Depot Fuel Bunker before departure.`);
      } else {
        pushNote(S, `AUTO-REFUEL: ${t.name} filled tank (800L) at station (-$${stationCost}).`);
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
    const cargoName = cargo?.name || j.cargo || 'Commercial Freight';
    S.active.push({ ...j, cargo: cargoName, truck: t.id, dh, start: now, end: now + duration, env: routeEnv, isShipperTanker: isHazmatJob, unhitchedTrailer: previousTrailer });
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
      const cargo = CARGO_TYPES.find(c => c.id === a.cargoId);
      const truckModel = t ? (TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730']) : null;

      if (t) {
        const st = stats(S, t, a.weight || 0, a.env);
        t.status = 'idle';
        t.loc = a.to;
        syncUsage(t, km, st, a.env, S);
        applyWear(t, km, a.weight || 0, a.env);

        // Driver Hours of Service, Fatigue & Welfare Accrual
        const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
        if (drv) {
          if (!drv.stats) drv.stats = { tripsCompleted: 0, kmDriven: 0, earned: 0 };
          drv.stats.tripsCompleted++;
          drv.stats.kmDriven += km;
          drv.stats.earned += Math.round(a.pay * 0.12);

          const tripDriveHours = km / Math.max(50, st.topSpeed);
          drv.hosHours = parseFloat(((drv.hosHours || 0) + tripDriveHours).toFixed(1));
          drv.fatigue = Math.min(100, Math.round((drv.fatigue || 10) + (km / 75)));

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
              pushNote(S, `MENTORSHIP ACADEMY: Under Master Driver ${mentor.name}'s guidance, ${drv.name} advanced to Level ${drv.skill}★ CDL!`);
            }
          }

          // HOS Enforcement Check
          if (drv.hosHours > 11.0) {
            const fine = 1800;
            if (S.insurance?.liability) {
              pushNote(S, `HOS ENFORCEMENT: ${drv.name} logged 11h+ continuous drive. $${fine} DOT citation covered under Statutory Liability Policy.`);
            } else {
              S.money = Math.max(0, S.money - fine);
              pushNote(S, `DOT CITATION: ${drv.name} exceeded 11.0h statutory HOS limit without mandatory rest. Fined $${fine.toLocaleString()}.`);
            }
          }
        }

        // Weigh Station Axle Enforcement
        if (truckModel && (truckModel.baseWeight + (a.weight || 0) > truckModel.maxGVW) && !hasLicense(S, 'heavy_haul')) {
          const fine = 2400;
          if (S.insurance?.liability) {
            pushNote(S, `WEIGH STATION INSPECTION: Gross mass exceeded chassis rating. $${fine} Overweight citation covered by Liability Insurance.`);
          } else {
            S.money = Math.max(0, S.money - fine);
            pushNote(S, `WEIGH STATION CITATION: Gross mass exceeded rating without Heavy Permit. Transport Police fine: $${fine.toLocaleString()}.`);
          }
        }

        // Return shipper-supplied tanker if applicable
        if (a.isShipperTanker) {
          t.trailer = null;
          pushNote(S, `CONSIGNOR RETURN: Shipper's hazardous tanker returned to chemical terminal in ${a.to}. Tractor returns bobtail.`);
        }
      }

      if (a.kind === 'move') {
        pushNote(S, `${t ? t.name : 'Truck'} arrived in ${a.to}`);
        continue;
      }

      let finalPay = a.pay;

      // Warehouse Infrastructure Bonuses
      if (S.warehouseUpgrades?.cold_vault && (a.trailer === 'reefer' || cargo?.tempControlled)) {
        const coldBonus = Math.round(a.pay * 0.20);
        finalPay += coldBonus;
        pushNote(S, `COLD STORAGE VAULT: +$${coldBonus.toLocaleString()} premium earned via Cryogenic Warehouse Vault.`);
      }

      S.money += finalPay;
      S.loads++;
      const repGain = a.isAuctionWon ? 45 : 15;
      S.stats.earned += finalPay;
      S.stats.km += a.km;
      
      if (!S.reputation) S.reputation = 0;
      S.reputation += repGain;

      // Corporate Tender Progress Tracking
      if (a.tenderId && S.corporateTenders) {
        const tender = S.corporateTenders.find((ct: any) => ct.id === a.tenderId);
        if (tender) {
          tender.completedLoads = (tender.completedLoads || 0) + 1;
          tender.loadsRemaining = Math.max(0, tender.loadsRemaining - 1);
          if (tender.loadsRemaining === 0) {
            S.money += tender.bonusPayout;
            pushNote(S, `CONTRACT OF AFFREIGHTMENT COMPLETED: ${tender.client} awarded $${tender.bonusPayout.toLocaleString()} SLA performance bonus!`);
          }
        }
      }

      const baseXp = 140;
      const kmXp = Math.round((a.km || 0) * 0.12);
      const auctionBonus = a.isAuctionWon ? 90 : 0;
      const hazmatBonus = cargo?.isHazmat ? 75 : 0;
      const totalXp = baseXp + kmXp + auctionBonus + hazmatBonus;

      addCompanyXp(S, totalXp, `Delivery: ${cargo?.name || 'Freight'}`);
    }
  }

  // Passive Warehouse Income & Fleet Sub-contracting Retainer (Ticks every period)
  if (done.length > 0) {
    if (S.warehouseUpgrades?.cross_docking) {
      S.money += 1200;
    }
    if (S.warehouseUpgrades?.gantry_crane) {
      S.money += 600;
    }
    const subcontractCount = (S.subcontractedTrucks || []).length;
    if (subcontractCount > 0) {
      const retainerIncome = subcontractCount * 1800;
      S.money += retainerIncome;
    }
  }

  return { done, auctionChanged };
}
