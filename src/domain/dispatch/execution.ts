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
import { LOCATIONS, resolveTruckRegion } from '../../data/world';
import { isCityUnlockedHub, getHubForCity, getHubFacilityForCity } from '../hubs/hub-facility';

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
    
    // For Round Trips, Segment 1 is from -> to with baseKm.
    // If it's not a round trip, j.km is the total distance.
    const leg1Km = j.isRoundTrip ? (j.baseKm || j.km / 2) : j.km;
    const totalKm = leg1Km + dh;
    
    // Calculate raw driving time
    const drivingTimeMs = tripMs(totalKm, st.topSpeed, routeEnv);
    
    // Add time for mandatory stops on long trips (> 500km)
    const isLongTrip = totalKm > 500;
    const restTimeMs = isLongTrip ? (45 * 60 * 1000) : 0; // 45 minute rest
    const fuelTimeMs = isLongTrip ? (15 * 60 * 1000) : 0; // 15 minute fuel
    
    const duration = drivingTimeMs + restTimeMs + fuelTimeMs;

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
    
    const activeEntry = { 
      ...j, 
      cargo: cargo?.name || j.cargo || 'Freight', 
      truck: t.id, 
      dh, 
      start: now, 
      end: now + duration, 
      env: routeEnv, 
      isShipperTanker: isHazmatJob, 
      unhitchedTrailer: previousTrailer,
      km: leg1Km,
      pay: j.isRoundTrip ? (j.leg1Pay || Math.round(j.pay / 2.2)) : j.pay
    };

    if (j.isRoundTrip) {
      (activeEntry as any).currentLeg = 1;
    }

    S.active.push(activeEntry);
    
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

    // Check if the truck is departing from an owned hub with a fuel tank
    const hubFacility = getHubFacilityForCity(S, t.loc);
    let fromBunker = 0;
    let fuelSourceLabel = 'Depot Fuel Bunker';

    if (hubFacility && hubFacility.fuelLiters > 0) {
      fromBunker = Math.min(neededFuel, hubFacility.fuelLiters);
      hubFacility.fuelLiters -= fromBunker;
      fuelSourceLabel = `${t.loc} Hub Fuel Tank`;
    } else if (S.fuelBunker && S.fuelBunker.currentLiters > 0) {
      fromBunker = Math.min(neededFuel, S.fuelBunker.currentLiters);
      S.fuelBunker.currentLiters -= fromBunker;
    }
    
    const stillNeeded = neededFuel - fromBunker;
    let stationCost = 0;
    if (stillNeeded > 0) {
      stationCost = Math.round(stillNeeded * 1.25);
      S.money = Math.max(0, S.money - stationCost);
    }
    t.fluids.fuel = tankCapacity;
    
    const msg = stillNeeded > 0 
      ? `Topped up tank (${Math.round(fromBunker)}L from ${fuelSourceLabel}, ${Math.round(stillNeeded)}L station: -$${stationCost}).`
      : `Filled tank (800L) from ${fuelSourceLabel} ($0 cash).`;
    pushNote(S, `${t.name}: ${msg}`, { title: 'AUTO-REFUEL', type: 'ops' });
  },

  /**
   * Ticks the dispatch system to complete arrived jobs and deliveries.
   */
  completeJobs(state: GameState, now: number): any {
    const S = state as any;
    
    // 1. Process Asset Deliveries
    this._processAssetDeliveries(S, now);

    // 2. Process Job Completions
    const aucRes = BiddingEngine.tickAuctions(S, now);
    const auctionChanged = aucRes.listChanged;
    const bidChanged = aucRes.bidChanged;
    const done: any[] = S.active.filter((a: any) => a.end <= now);
    
    if (done.length > 0) {
      S.active = S.active.filter((a: any) => a.end > now);
      for (const job of done) {
        this._finalizeJob(S, job);
      }
    }

    return { done, auctionChanged, bidChanged };
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

    const isDestinationUnlockedHub = isCityUnlockedHub(S, a.to);
    const destHub = getHubForCity(a.to);

    if (t) {
      const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
      const st = stats(S, t, a.weight || 0, a.env);
      
      // If destination is an unlocked hub owned by the player, it parks at that hub and awaits new jobs!
      if (isDestinationUnlockedHub) {
        t.loc = a.to; 
      } else if (a.isRoundTrip && a.currentLeg === 2) {
        t.loc = a.from;
      } else {
        t.loc = a.to;
      }

      syncUsage(t, km, st, a.env, S);
      applyWear(t, km, a.weight || 0, a.env, drv);
      processScheduledRepair(S, t.id);

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

      // Handle Round Trip Leg Transition
      if (a.isRoundTrip && a.currentLeg === 1 && !isDestinationUnlockedHub) {
        // Start Leg 2 immediately (Standard Round Trip to external city)
        const now = Date.now();
        const routeEnvLeg2 = getRouteEnv(a.to, a.from);
        const stLeg2 = stats(S, t, a.weight || 0, routeEnvLeg2);
        const durationLeg2 = tripMs(a.km, stLeg2.topSpeed, routeEnvLeg2);
        
        S.active.push({
          ...a,
          currentLeg: 2,
          cargo: a.returnCargoName || a.cargo,
          from: a.to,
          to: a.from,
          dh: 0,
          start: now,
          end: now + durationLeg2,
          env: routeEnvLeg2,
          pay: (a.leg2Pay || Math.round(a.pay * 1.1)) + (a.turnaroundBonus || 0),
          km: a.km // baseKm
        });
        
        t.status = 'busy';
        t.loc = a.to; // Update location to the turnaround point
      } else if (!isDestinationUnlockedHub) {
        // CRITICAL FIX: Truck delivered to an UNOWNED city. 
        // We MUST force an immediate deadhead return to the origin hub or the nearest regional hub.
        const now = Date.now();
        
        // Find the most logical return destination (Nearest Owned Hub)
        const ownedHubs = (S.depots || []).map((id: string) => {
          const hubKey = id.replace('hub_', '').toUpperCase();
          return hubKey === 'LOS ANGELES' ? 'LOS_ANGELES' : hubKey;
        });
        
        const destRegion = resolveTruckRegion(a.to);
        const nearestHub = ownedHubs
          .filter((h: string) => (LOCATIONS[h]?.region || resolveTruckRegion(h)) === destRegion)
          .sort((a_hub: string, b_hub: string) => distKm(a.to, a_hub) - distKm(a.to, b_hub))[0] || a.from;

        const dhKm = distKm(a.to, nearestHub); // Return distance to nearest hub
        const stReturn = stats(S, t, 0); // Empty return
        
        // HASTE: Speed up empty deadhead returns to base (35% faster) since they don't generate pay
        const returnDuration = Math.round(tripMs(dhKm, stReturn.topSpeed) * 0.65);

        S.active.push({
          id: S.nextId++,
          kind: 'move',
          cargo: 'Terminal Return (Deadhead)',
          from: a.to,
          to: nearestHub,
          dh: 0,
          km: dhKm,
          pay: 0,
          truck: t.id,
          start: now,
          end: now + returnDuration,
          status: 'returning'
        });

        t.status = 'busy';
        t.loc = a.to; // Logically at destination before starting return
        pushNote(S, `⚠️ ${t.name} delivered to external city (${a.to}). Unit is deadheading to nearest terminal (${nearestHub}).`, {
          title: 'AUTO-RETURN DISPATCH',
          type: 'ops',
          priority: 1
        });
      } else {
        // Destination IS an unlocked player hub
        t.status = 'idle';
        t.loc = a.to; // Parked at the hub
        if (a.isShipperTanker) t.trailer = null;
        
        pushNote(S, `🏢 Unit #${t.id} (${t.name}) docked at ${destHub?.name || a.to} Terminal Hub. Tractor parked at berth and awaiting new outbound freight consignments.`, {
          title: 'HUB ARRIVAL & DOCKING',
          type: 'ops',
          priority: 1
        });
      }
    }

    if (a.kind === 'move') return;

    // --- LOGISTICS ANALYTICS: ENSURE WE DON'T DOUBLE-COUNT DEADHEADS ---
    S.loads++;
    // -----------------------------------------------------------------

    // Financials
    let finalPay = a.pay;
    
    S.money += finalPay;
    S.stats.earned += finalPay;
    S.stats.km += a.km;
    
    if (isDestinationUnlockedHub) {
      S.reputation = (S.reputation || 0) + (a.isAuctionWon ? 45 : 20);
      pushNote(S, `Consignment Delivered to ${destHub?.name || a.to} Hub: +$${finalPay.toLocaleString()}`, { title: 'PAYMENT REMITTANCE', type: 'finance' });

      // Generate immediate outbound consignments departing from this new hub
      if (t && a.to && (S.jobs || []).length < 17) {
        const destRegion = resolveTruckRegion(a.to);
        try {
          const outboundJob = FreightEngine.generate(S, {
            forceRegion: destRegion,
            forceFrom: a.to
          });
          if (outboundJob) {
            if (!S.jobs) S.jobs = [];
            S.jobs.unshift(outboundJob);
            pushNote(S, `Freight manifest ready at ${destHub?.name || a.to}: outbound to ${LOCATIONS[outboundJob.to]?.name || outboundJob.to}. Available on Freight Board.`, {
              title: 'OUTBOUND MANIFEST READY',
              type: 'ops'
            });
          }
        } catch (e) {
          console.error('Failed to generate outbound haul', e);
        }
      }
    } else if (a.isRoundTrip) {
      if (a.currentLeg === 1) {
        S.reputation = (S.reputation || 0) + 15;
        pushNote(S, `🔄 Round-Trip Segment 1 Completed: ${a.from} → ${a.to}. Outbound freight delivered. Commencing return leg with ${a.returnCargoName || 'Backhaul'}. Payment: +$${finalPay.toLocaleString()}`, {
          title: 'ROUND-TRIP LEG 1 COMPLETE',
          type: 'ops'
        });
      } else {
        S.reputation = (S.reputation || 0) + 30;
        pushNote(S, `🔄 Round-Trip Finalized: ${a.from} → ${a.to}. Net Return: +$${finalPay.toLocaleString()} (Includes Turnaround Bonus).`, {
          title: 'ROUND-TRIP TURNAROUND SUCCESS',
          type: 'ops'
        });
      }
    } else {
      S.reputation = (S.reputation || 0) + (a.isAuctionWon ? 45 : 15);
      pushNote(S, `Payment for ${cargo?.name || 'Freight'}: +$${finalPay.toLocaleString()}`, { title: 'PAYMENT REMITTANCE', type: 'finance' });

      // Generate immediate return haul from the arrival city back to departure city or regional hub
      // Only if the board isn't already overwhelmed (Limit: 17)
      if (t && a.to && (S.jobs || []).length < 17) {
        const destRegion = resolveTruckRegion(a.to);
        try {
          const returnJob = FreightEngine.generate(S, {
            forceRegion: destRegion,
            forceFrom: a.to,
            forceTo: a.from // Return leg back to origin
          });
          if (returnJob) {
            if (!S.jobs) S.jobs = [];
            S.jobs.unshift(returnJob);
            pushNote(S, `Freight manifest ready: ${LOCATIONS[a.to]?.name || a.to} → ${LOCATIONS[a.from]?.name || a.from}. Available on Freight Board for any compatible tractor.`, {
              title: 'RETURN HAUL READY',
              type: 'ops'
            });
          }
        } catch (e) {
          console.error('Failed to generate return haul', e);
        }
      }
    }

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
