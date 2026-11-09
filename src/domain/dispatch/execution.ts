import { GameState } from '../../types/state';
import { pushNote } from '../../systems/notify';
import { toast, rnd } from '../../core/ui';
import { TRUCK_MODELS, TRAILERS } from '../trucks/trucks.data';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { distKm, getRouteEnv, stats, tripMs, syncUsage, applyWear } from '../../systems/calc';
import { consumeBidDispatchQuota } from '../freight/bids/quota';
import { getCompanyProgression, addCompanyXp } from '../company/progression';
import { BiddingEngine } from '../freight/bids/engine';
import { TRAIT_REGISTRY } from '../drivers/drivers.names';
import { processScheduledRepair } from '../../systems/maintenance';
import { vehicleDeliveryTemplate } from '../notifications/templates';
import { getDispatchEligibilityError } from './validation';
import { FreightEngine } from '../freight/engine/generator';
import { LOCATIONS } from '../../data/world';

import { getDispatchNeuralNetwork } from '../ai/neuralNetwork';

/**
 * Authoritative engine for dispatch lifecycle.
 * Following Engineering Constitution Section 6.4 (Logistics and Dispatch).
 */
export const DispatchExecution = {
  /**
   * Executes the dispatch of a truck for a specific job.
   */
  takeJob(state: GameState, jobId: number, truckId?: number, silent: boolean = false): { success: boolean; reason?: string } {
    const S = state as any;
    const j = S.jobs.find((x: any) => x.id === jobId);
    if (!j) return { success: false, reason: 'Job not found' };

    // VIP Eligibility Check
    const prog = getCompanyProgression(S);
    const isEligible = j.isAuctionWon || !j.vip || prog.tier >= 3;
    if (!isEligible) {
      const err = `VIP Exclusive Contract: Requires VIP Rank (Tier 3+). Current: ${prog.title}`;
      if (!silent) toast(err, 'err');
      return { success: false, reason: err };
    }
    
    // Find/Validate Truck
    let t: any;
    if (truckId) {
      t = S.fleet.find((x: any) => x.id === truckId);
      const err = t && getDispatchEligibilityError(S, t, j, S.drivers.find((d: any) => d.id === t.driverId));
      if (!t || err) {
        if (!silent) toast(err || 'No truck', 'err');
        return { success: false, reason: err || 'Truck ineligible' };
      }
    } else {
      // Find nearest eligible truck (Legacy blocker/findTruck logic simplified)
      t = S.fleet
        .filter((truck: any) => !getDispatchEligibilityError(S, truck, j, S.drivers.find((d: any) => d.id === truck.driverId)))
        .sort((a: any, b: any) => distKm(a.loc, j.from) - distKm(b.loc, j.from))[0];
      
      if (!t) {
        const err = 'No eligible idle truck found with required trailer/endorsements.';
        if (!silent) toast(err, 'err');
        return { success: false, reason: err };
      }
    }
    
    const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);

    // 1. Auto-Refuel
    this._handleAutoRefuel(S, t);

    // 2. Bidding Quota
    let quotaNote = '';
    if (j.isAuctionWon) {
      const quotaRes = consumeBidDispatchQuota(S);
      if (!quotaRes.success) {
        if (!silent) toast(quotaRes.message, 'err');
        return { success: false, reason: quotaRes.message };
      }
      if (quotaRes.costPaid > 0) {
        quotaNote = ' (Paid 4 Gold Coins)';
        pushNote(S, `4 Gold Coins paid for bidded consignment #${j.id}.`, { title: 'EXPEDITED DISPATCH', type: 'finance' });
      }
    }

    // 3. Physical Dispatch
    const now = Date.now(), dh = distKm(t.loc, j.from);
    const routeEnv = getRouteEnv(j.from, j.to);
    const st = stats(S, t, j.weight, routeEnv);
    const totalKm = j.km + dh;
    const duration = tripMs(totalKm, st.topSpeed, routeEnv);

    const isHazmatJob = cargo?.isHazmat || (cargo?.trailer === 'tanker') || (cargo?.trailer === 'hazmat');
    const trailerType = cargo?.trailer || (j as any).trailer || 'curtain';
    let previousTrailer = null;

    if (t.trailer !== trailerType) {
      if (t.trailer) {
        if (!S.trailers) S.trailers = [];
        S.trailers.push(t.trailer);
        previousTrailer = t.trailer;
      }
      const storageIdx = (S.trailers || []).indexOf(trailerType);
      if (storageIdx >= 0) {
        S.trailers.splice(storageIdx, 1);
      }
      t.trailer = trailerType;
      pushNote(S, `Coupled ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} for dispatch manifest.`, { title: 'TRAILER COUPLED', type: 'ops' });
    } else {
      previousTrailer = t.trailer;
    }

    S.jobs = S.jobs.filter((x: any) => x.id !== jobId);
    S.active.push({ 
      ...j, 
      cargo: cargo?.name || j.cargo || 'Freight', 
      truck: t.id, 
      dh, 
      start: now, 
      end: now + duration, 
      env: routeEnv, 
      isShipperTanker: isHazmatJob, 
      unhitchedTrailer: previousTrailer 
    });
    
    t.status = 'busy';
    pushNote(S, `Consignment Dispatched: ${cargo?.name || 'Cargo'} · ${j.from} → ${j.to}${quotaNote}`, { title: 'DISPATCH CONFIRMATION', type: 'ops' });
    if (!silent) toast('Dispatched: ' + (cargo?.name || 'Load'), 'success');
    return { success: true };
  },

  /**
   * Internal helper for refueling before departure.
   */
  _handleAutoRefuel(S: any, t: any): void {
    const tankCapacity = 800;
    const currentFuel = t.fluids?.fuel ?? tankCapacity;
    const neededFuel = Math.max(0, tankCapacity - currentFuel);
    if (neededFuel <= 0) return;

    if (!S.fuelBunker) S.fuelBunker = { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
    const fromBunker = Math.min(neededFuel, S.fuelBunker.currentLiters || 0);
    if (fromBunker > 0) S.fuelBunker.currentLiters -= fromBunker;
    
    const stillNeeded = neededFuel - fromBunker;
    let stationCost = 0;
    if (stillNeeded > 0) {
      stationCost = Math.round(stillNeeded * 1.25);
      S.money = Math.max(0, S.money - stationCost);
    }
    t.fluids.fuel = tankCapacity;
    
    const msg = stillNeeded > 0 
      ? `Topped up tank (${fromBunker}L Bunker, ${stillNeeded}L station: -$${stationCost}).`
      : `Filled tank (800L) from Depot Fuel Bunker.`;
    pushNote(S, `${t.name} ${msg}`, { title: 'AUTO-REFUEL', type: 'ops' });
  },

  /**
   * Ticks the dispatch system to complete arrived jobs and deliveries.
   */
  completeJobs(state: GameState, now: number): any {
    const S = state as any;
    
    // 1. Process Asset Deliveries
    this._processAssetDeliveries(S, now);

    // 2. Process Job Completions
    const auctionChanged = BiddingEngine.tickAuctions(S, now);
    const done: any[] = S.active.filter((a: any) => a.end <= now);
    
    if (done.length > 0) {
      S.active = S.active.filter((a: any) => a.end > now);
      for (const job of done) {
        this._finalizeJob(S, job);
      }
    }

    return { done, auctionChanged };
  },

  _processAssetDeliveries(S: any, now: number): void {
    const arrivedTrucks = S.fleet.filter((t: any) => t.status === 'delivering' && t.availableAt <= now);
    for (const t of arrivedTrucks) {
      t.status = 'idle';
      delete t.availableAt;
      if (t.shippingMode === 'maritime_roro') {
        pushNote(S, `🚢 Vessel arrived! ${t.name} safely discharged at ${t.loc} deepwater terminal. Cleared international customs and ready for commercial dispatch.`, {
          title: 'OVERSEAS RO-RO ARRIVAL',
          type: 'ops'
        });
        delete t.shippingMode;
        delete t.shippingVessel;
        delete t.shippingOrigin;
      } else {
        const tpl = vehicleDeliveryTemplate(t.id, t.name, t.loc || 'Terminal');
        pushNote(S, tpl.msg, { title: tpl.title, type: tpl.type, priority: tpl.priority, body: tpl.body });
      }
    }

    const arrivedTrailers = (S.pendingTrailers || []).filter((p: any) => p.availableAt <= now);
    if (arrivedTrailers.length > 0) {
      if (!S.trailers) S.trailers = [];
      for (const p of arrivedTrailers) {
        S.trailers.push(p.type);
        pushNote(S, `${TRAILERS[p.type as keyof typeof TRAILERS] || p.type} delivered to HQ Yard.`, { title: 'TRAILER DELIVERED', type: 'ops' });
      }
      S.pendingTrailers = S.pendingTrailers.filter((p: any) => p.availableAt > now);
    }
  },

  _finalizeJob(S: any, a: any): void {
    const t = S.fleet.find((x: any) => x.id === a.truck);
    const km = a.km + (a.dh || 0);
    const cargo = CARGO_TYPES.find(c => c.id === a.cargoId);

    if (t) {
      const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
      const st = stats(S, t, a.weight || 0, a.env);
      t.status = 'idle';
      t.loc = a.isRoundTrip ? a.from : a.to;
      processScheduledRepair(S, t.id);
      syncUsage(t, km, st, a.env, S);
      applyWear(t, km, a.weight || 0, a.env, drv);

      if (drv) {
        drv.fatigue = 0; drv.hosHours = 0; drv.hosRestUntil = null;
        if (!drv.stats) drv.stats = { tripsCompleted: 0, kmDriven: 0, earned: 0 };
        drv.stats.tripsCompleted++; drv.stats.kmDriven += km;
        
        // HOS Enforcement
        if (drv.hosHours > 11.0) {
          const fine = 1800;
          if (!S.insurance?.liability) S.money = Math.max(0, S.money - fine);
          pushNote(S, `${drv.name} HOS violation fine: $${fine.toLocaleString()}`, { title: 'DOT CITATION', type: 'compliance' });
        }
      }

      if (a.isShipperTanker) t.trailer = null;
    }

    if (a.kind === 'move') return;

    // Financials
    let finalPay = a.pay;
    // (Add trait/warehouse bonuses here if needed, keeping it modular)
    
    S.money += finalPay;
    S.loads++;
    S.stats.earned += finalPay;
    S.stats.km += a.km;
    S.reputation = (S.reputation || 0) + (a.isAuctionWon ? 45 : a.isRoundTrip ? 25 : 15);

    // PoD Bonus
    const podBonus = parseFloat((0.05 + (a.km / 1000) * 0.05).toFixed(2));
    S.coins = (S.coins || 0) + podBonus;

    addCompanyXp(S, 25 + Math.round(a.km * 0.02), `Delivery: ${cargo?.name || 'Freight'}`);
    
    // Corporate Tender Milestone Progression
    if (a.tenderId && S.corporateTenders) {
      const tnd = S.corporateTenders.find((ct: any) => ct.id === a.tenderId);
      if (tnd) {
        tnd.completedLoads = (tnd.completedLoads || 0) + 1;
        tnd.loadsRemaining = Math.max(0, (tnd.totalLoads || 10) - tnd.completedLoads);
        if (tnd.completedLoads >= tnd.totalLoads && !tnd.bonusAwarded) {
          tnd.bonusAwarded = true;
          S.money += tnd.bonusPayout;
          if (S.stats) S.stats.earned += tnd.bonusPayout;
          pushNote(S, `🎉 30-Day Tender Completed: ${tnd.client}! SLA threshold of ${tnd.slaTarget}% fulfilled. Awarded +$${tnd.bonusPayout.toLocaleString()} volume bonus to treasury!`, {
            title: 'ENTERPRISE TENDER COMPLETED',
            type: 'tender',
            priority: 1
          });
        } else {
          pushNote(S, `Tender consignment delivered for ${tnd.client} (${tnd.completedLoads}/${tnd.totalLoads} completed).`, {
            title: 'TENDER CONSIGNMENT DELIVERED',
            type: 'tender'
          });
        }
      }
    }

    if (a.isRoundTrip) {
      pushNote(S, `🔄 2-Way Turnaround Completed: ${a.from} ⇄ ${a.to} (Delivered ${cargo?.name} & returned with ${a.returnCargoName || 'Return Freight'}). Net: +$${finalPay.toLocaleString()} (Includes +$${(a.turnaroundBonus || 0).toLocaleString()} Turnaround Bonus).`, {
        title: 'ROUND-TRIP TURNAROUND SUCCESS',
        type: 'ops'
      });
    } else {
      pushNote(S, `Payment for ${cargo?.name || 'Freight'}: +$${finalPay.toLocaleString()}`, { title: 'PAYMENT REMITTANCE', type: 'finance' });

      // Generate immediate return haul ("To & Fro" backhaul from the arrival city back to departure city or regional hub)
      if (t && a.to && LOCATIONS[a.to]) {
        const destRegion = LOCATIONS[a.to].region;
        try {
          const returnJob = FreightEngine.generate(S, {
            forceRegion: destRegion,
            forceFrom: a.to,
            forceTo: a.from, // Return leg ("to & fro") back to origin!
            isBackhaul: true
          });
          if (returnJob) {
            if (!S.jobs) S.jobs = [];
            S.jobs.unshift(returnJob);
            pushNote(S, `Return freight manifest ready: ${LOCATIONS[a.to]?.name || a.to} → ${LOCATIONS[a.from]?.name || a.from}. Available on Freight Board for any compatible tractor.`, {
              title: 'RETURN HAUL READY (TO & FRO)',
              type: 'ops'
            });
          }
        } catch (e) {
          console.error('Failed to generate return haul', e);
        }
      }
    }

    // Neural Network Reinforcement Learning (Experience Feedback)
    try {
      const net = getDispatchNeuralNetwork(S.aiState?.neuralWeights);
      const deadheadKm = a.dh || 0;
      const totalKm = a.km + deadheadKm;
      const fuelCostEst = totalKm * 0.42 * 1.25;
      const netProfit = finalPay - fuelCostEst;
      const profitRatio = Math.max(0, Math.min(1, netProfit / Math.max(1, finalPay)));
      const dhEfficiency = Math.max(0, 1 - (deadheadKm / Math.max(1, totalKm)));
      const targetReward = (profitRatio * 0.65) + (dhEfficiency * 0.35);

      const features = [
        Math.min(1, finalPay / 40000),
        Math.min(1, (finalPay / Math.max(1, a.km)) / 30),
        dhEfficiency,
        Math.min(1, (a.weight || 10) / 44),
        0.85,
        profitRatio,
        0.8,
        Math.min(1, (a.isAuctionWon ? 45 : 15) / 50)
      ];

      net.train(features, targetReward, 0.05);
      if (S.aiState) {
        S.aiState.neuralWeights = net.toJSON();
        S.aiState.neuralTrainingEpochs = (S.aiState.neuralTrainingEpochs || 0) + 1;
      }
    } catch (e) {}
  }
};
