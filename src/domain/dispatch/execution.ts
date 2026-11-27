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
import { recordHubJobDispatched } from '../hubs/characteristics';
import { isCityUnlockedHub, getHubForCity, getHubFacilityForCity } from '../hubs/hub-facility';
import { REGIONAL_HUBS } from '../logistics/network';
import { calculateTripToll } from '../economy/tolls';
import { getRegionalRetailFuelPrice } from '../economy/fuel-market';
import { getDriverPerKmRate, evaluateDriverProgression } from '../drivers/drivers.engine';
import { GOV_FEES, getTruckCode, recordViolation } from '../trucks/registration';

import { getDispatchNeuralNetwork } from '../ai/neuralNetwork';
import { initJourney, SIM_HOUR_MS } from '../trucks/trucks.journey';

/**
 * Authoritative engine for dispatch lifecycle.
 * Following Engineering Constitution Section 6.4 (Logistics and Dispatch).
 */
import { recordTransaction } from '../../core/ledger';

export const DispatchExecution = {
  /**
   * Executes the dispatch of a truck for a specific job.
   */
  takeJob(state: GameState, jobId: number, truckId?: number, silent: boolean = false): { success: boolean; reason?: string } {
    const S = state as any;
    
    // Find job in global board or hub boards
    let j = S.jobs?.find((x: any) => x.id === jobId);
    let foundInHubId: string | null = null;

    if (!j && S.hubJobs) {
      for (const hId in S.hubJobs) {
        j = S.hubJobs[hId].find((x: any) => x.id === jobId);
        if (j) {
          foundInHubId = hId;
          break;
        }
      }
    }

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
    const simDay = S.simulationDay || 1;
    const routeEnv = getRouteEnv(j.from, j.to, 0, j.km, now, simDay);
    const st = stats(S, t, j.weight, routeEnv);
    
    // For Round Trips, Segment 1 is from -> to with baseKm.
    // If it's not a round trip, j.km is the total distance.
    const leg1Km = j.isRoundTrip ? (j.baseKm || j.km / 2) : j.km;
    const totalKm = leg1Km + dh;
    
    // Rough first estimate only; initJourney() replaces `end` with the live ETA
    // (deadhead + loading + driving + unloading + predicted rests/fuel stops).
    const duration = tripMs(totalKm, st.topSpeed, routeEnv);

    const isHazmatJob = cargo?.isHazmat || (cargo?.trailer === 'tanker') || (cargo?.trailer === 'hazmat');
    const trailerType = cargo?.trailer || (j as any).trailer || 'curtain';
    let previousTrailer = null;

    if (t.trailer !== trailerType) {
      const storageIdx = (S.trailers || []).indexOf(trailerType);
      if (!isHazmatJob && storageIdx < 0) {
        const msg = `No ${trailerType} trailer available in company yard.`;
        if (!silent) toast(msg, 'err');
        return { success: false, reason: msg };
      }
      if (t.trailer) {
        if (!S.trailers) S.trailers = [];
        S.trailers.push(t.trailer);
        previousTrailer = t.trailer;
      }
      if (storageIdx >= 0) {
        S.trailers.splice(storageIdx, 1);
      }
      t.trailer = trailerType;
      pushNote(S, `Coupled ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} for dispatch manifest.`, { title: 'TRAILER COUPLED', type: 'ops' });
    } else {
      previousTrailer = t.trailer;
    }

    // 4. Execution & Finalization
    if (foundInHubId) {
      S.hubJobs[foundInHubId] = S.hubJobs[foundInHubId].filter((x: any) => x.id !== jobId);
    } else {
      S.jobs = S.jobs.filter((x: any) => x.id !== jobId);
    }
    
    // Record origin hub daily job count & payload tonnage usage
    recordHubJobDispatched(S, j.from, (j as any).weightTonnes || (j as any).weight || 20);

    const activeEntry = { 
      ...j, 
      cargo: cargo?.name || j.cargo || 'Freight', 
      truck: t.id, 
      originHub: isCityUnlockedHub(S, t.loc) ? t.loc : (isCityUnlockedHub(S, j.from) ? j.from : (S.hqCity || t.loc)),
      dh, 
      start: now, 
      end: now + duration, 
      env: routeEnv,
      simDay,
      isShipperTanker: isHazmatJob, 
      unhitchedTrailer: previousTrailer,
      km: leg1Km,
      pay: j.isRoundTrip ? (j.leg1Pay || Math.round(j.pay / 2.2)) : j.pay
    };

    if (j.isRoundTrip) {
      (activeEntry as any).currentLeg = 1;
    }

    // Boots the stage machine: deadhead -> loading -> driving -> unloading, with live fuel/ETA.
    // (Fuel was topped up above, so the tank snapshot taken here is the real departure level.)
    initJourney(activeEntry, t, now);

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
    const tankCapacity = (TRUCK_MODELS[t.modelId] as any)?.tankSize || 800;
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
    
    if (fromBunker > 0) {
      t.fluids.fuel = Math.min(tankCapacity, (t.fluids.fuel ?? 0) + fromBunker);
      pushNote(S, `${t.name}: Filled ${Math.round(fromBunker)}L from ${fuelSourceLabel} ($0 cash).`, { title: 'AUTO-REFUEL', type: 'ops' });
    }
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
    const isDone = (a: any) => a.stage === 'done' || (a.stage === undefined && a.end <= now);
    const done: any[] = S.active.filter(isDone);
    
    if (done.length > 0) {
      S.active = S.active.filter((a: any) => !isDone(a));
      for (const job of done) {
        this._finalizeJob(S, job, now);
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

  _finalizeJob(S: any, a: any, now: number = Date.now()): void {
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
      } else {
        // Truck stays at the external city after delivery
        t.loc = a.to;
      }

      // The journey engine already tracked fuel live (burn + mid-route stops). Neutralise syncUsage's
      // own fuel/roadside billing, then restore the real tank level and bill the stations we used.
      const trackedTank = typeof a.tankL === 'number';
      if (trackedTank) t.fluids.fuel = 1e9;
      t._liveFluidsSynced = Boolean(a.liveFluidsSynced);
      syncUsage(t, km, st, a.env, S);
      if (trackedTank) {
        t.fluids.fuel = Math.max(0, Math.round(a.tankL));
        const refuelL = Math.round(a.refuelLiters || 0);
        if (refuelL > 0) {
          const priceFrom = getRegionalRetailFuelPrice(a.from, S);
          const priceTo = getRegionalRetailFuelPrice(a.to, S);
          const avgRetailPrice = (priceFrom + priceTo) / 2;
          const stationCost = Math.round(refuelL * avgRetailPrice);
          recordTransaction(S, 'expense_fuel', -stationCost, `En-route diesel (${refuelL}L @ $${avgRetailPrice.toFixed(2)}/L)`);
          if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
          S.stats.spent = (S.stats.spent || 0) + stationCost;
          if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
          S.dailyStats.fuel += stationCost;
          pushNote(S, `${t.name} refueled ${refuelL}L en-route @ $${avgRetailPrice.toFixed(2)}/L (-$${stationCost.toLocaleString()}).`, { title: 'EN-ROUTE FUEL', type: 'ops' });
        }
        const defL = Math.round(a.defAddedL || 0);
        if (defL > 0) {
          const defCost = Math.round(defL * 1.5);
          recordTransaction(S, 'expense_fuel', -defCost, `En-route DEF/AdBlue top-up (${defL}L @ $1.50/L)`);
          if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
          S.stats.spent = (S.stats.spent || 0) + defCost;
          if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
          S.dailyStats.fuel += defCost;
        }
      }
      applyWear(t, km, a.weight || 0, a.env, drv);
      processScheduledRepair(S, t.id);

      if (drv) {
        if (!drv.stats) drv.stats = { tripsCompleted: 0, kmDriven: 0, earned: 0 };
        drv.stats.tripsCompleted++; drv.stats.kmDriven += km;

        // Per-km performance mileage pay (accrued for end-of-week payroll settlement)
        const perKmRate = getDriverPerKmRate(drv.skill || 1);
        const driverTripWage = Math.round(km * perKmRate);
        if (driverTripWage > 0) {
          S.accruedPayroll = (S.accruedPayroll || 0) + driverTripWage;
          drv.stats.earned = (drv.stats.earned || 0) + driverTripWage;
        }

        const hadIncidents = Array.isArray(a.incidents) && a.incidents.some((i: any) => i.severity === 'major' || i.severity === 'critical');
        const wasLate = Boolean(a.deadline && now > a.deadline);
        if (!hadIncidents && !wasLate) {
          drv.morale = Math.min(100, (drv.morale ?? 80) + 4);
          drv.stress = Math.max(0, (drv.stress ?? 10) - 5);
        } else {
          drv.morale = Math.max(5, (drv.morale ?? 80) - 5);
          drv.stress = Math.min(100, (drv.stress ?? 10) + 6);
        }
        evaluateDriverProgression(drv, S);
        
        // HOS Enforcement (only if driver somehow exceeded 11h without resting)
        if ((drv.hosHours || 0) > 11.2) {
          const fine = 1800;
          const covered = Boolean(S.insurance?.liability);
          if (!covered) S.money = S.money - fine;
          recordViolation(S, {
            type: 'hos',
            truckId: t.id,
            truckCode: getTruckCode(t),
            driverName: drv.name,
            fine,
            reason: `HOS 11h limit exceeded (${(drv.hosHours || 0).toFixed(1)}h)`,
            paid: true
          });
          pushNote(S, `${drv.name} HOS violation fine: $${fine.toLocaleString()}${covered ? ' (covered by liability insurance)' : ''}`, { title: 'DOT CITATION', type: 'compliance' });
        }
      }

      // Unregistered Commercial Operation Enforcement
      if (!t.regNo && !a.reposition) {
        const fine = GOV_FEES.UNREGISTERED_FINE;
        const code = getTruckCode(t);
        recordViolation(S, {
          type: 'unregistered',
          truckId: t.id,
          truckCode: code,
          driverName: drv?.name,
          fine,
          reason: `Operating unregistered commercial vehicle (${code}) on ${a.from} → ${a.to}`,
          paid: false
        });
        pushNote(S, `🚨 DOT WEIGHBRIDGE CITATION: Unit ${code} operated without registration plates! $${fine.toLocaleString()} fine issued (pay in Ministry of Transport).`, {
          title: 'UNREGISTERED UNIT CITATION',
          type: 'compliance',
          priority: 1
        });
      }

      // Handle Round Trip Leg Transition (2-way contract: deliver, load the backhaul, drive home)
      if (!isDestinationUnlockedHub && a.isRoundTrip && a.currentLeg === 1) {
        const simDay = S.simulationDay || 1;
        const routeEnvLeg2 = getRouteEnv(a.to, a.from, 0, a.km, now, simDay);
        const leg2: any = {
          ...a,
          currentLeg: 2,
          cargoId: a.returnCargoId || a.cargoId,
          cargo: a.returnCargoName || a.cargo,
          from: a.to,
          to: a.from,
          dh: 0,
          start: now,
          env: routeEnvLeg2,
          simDay,
          pay: (a.leg2Pay || Math.round(a.pay * 1.1)) + (a.turnaroundBonus || 0),
          km: a.km // baseKm
        };
        t.fluids.fuel = Math.max(0, Math.round(a.tankL ?? t.fluids.fuel)); // carry the real tank into leg 2
        initJourney(leg2, t, now); // fresh stage machine: load backhaul -> drive -> unload
        S.active.push(leg2);

        t.status = 'busy';
        t.loc = a.to; // Turnaround point
      } else if (!isDestinationUnlockedHub && a.kind !== 'move') {
        // Delivered to an external city on a no-return job (or after round-trip leg 2):
        // instantly start a deadhead return to the nearest user-owned hub.
        const ownedHubs = (S.depots || []).map((depotId: string) => {
          const hub = REGIONAL_HUBS.find(h => h.id === depotId);
          return hub ? hub.city : null;
        }).filter(Boolean) as string[];

        const destRegion = resolveTruckRegion(a.to);
        const regionalOwnedHubs = ownedHubs.filter(
          (h: string) => (LOCATIONS[h]?.region || resolveTruckRegion(h)) === destRegion
        );

        // Prefer the nearest user-owned hub in the destination's region/area.
        // If no user-owned hub exists in that area, return to the hub where the job was taken from.
        const originHubFallback =
          a.originHub ||
          (isCityUnlockedHub(S, a.from) ? a.from : undefined) ||
          S.hqCity ||
          ownedHubs.slice().sort((a_hub: string, b_hub: string) => distKm(a.to, a_hub) - distKm(a.to, b_hub))[0] ||
          a.from;

        const nearestHub = regionalOwnedHubs.length > 0
          ? regionalOwnedHubs
              .slice()
              .sort((a_hub: string, b_hub: string) => distKm(a.to, a_hub) - distKm(a.to, b_hub))[0]
          : originHubFallback;

        const dhKm = distKm(a.to, nearestHub);
        S.nextId = S.nextId || 1;

        const returnLeg: any = {
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
          end: now,
          env: getRouteEnv(a.to, nearestHub, 0, dhKm, now, S.simulationDay || 1),
          simDay: S.simulationDay || 1,
          status: 'returning'
        };
        initJourney(returnLeg, t, now); // empty run: short staging, drive, shutdown
        S.active.push(returnLeg);

        t.status = 'busy';
        t.loc = a.to; // Logically at destination before starting return
        pushNote(S, `⚠️ ${t.name} delivered to external city (${a.to}). Unit is deadheading to nearest terminal (${nearestHub}).`, {
          title: 'AUTO-RETURN DISPATCH',
          type: 'ops',
          priority: 1
        });
      } else {
        // Destination is an unlocked player hub (or a finished repositioning move)
        t.status = 'idle';
        t.loc = a.to;
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

    // Settle en-route road events, citations, breakdowns & accidents
    if (Array.isArray(a.incidents) && a.incidents.length > 0) {
      let incidentFees = 0;
      const unitCode = getTruckCode(t);
      for (const inc of a.incidents) {
        if (inc.fine && inc.fine > 0) {
          incidentFees += inc.fine;
          const vType =
            inc.type === 'speeding_ticket' ? 'speeding' :
            inc.type === 'hos_audit' ? 'hos' :
            inc.type === 'weighbridge_inspection' ? 'inspection_expired' : 'speeding';
          recordViolation(S, {
            type: vType,
            truckId: t.id,
            truckCode: unitCode,
            driverName: drv?.name,
            fine: inc.fine,
            reason: `${inc.title || inc.type} at ${inc.km} km (${a.from} → ${a.to})`,
            paid: true
          });
        }
        if (inc.cost && inc.cost > 0) {
          if (inc.category === 'accident' && S.insurance?.collision && inc.cost > 1000) {
            incidentFees += 1000; // Collision insurance deductible
            pushNote(S, `🛡️ Collision Insurance covered $${(inc.cost - 1000).toLocaleString()} recovery/tow costs on ${unitCode} ($1,000 deductible paid).`, {
              title: 'COLLISION CLAIM COVERED',
              type: 'finance'
            });
          } else {
            incidentFees += inc.cost;
          }
        }
      }
      if (incidentFees > 0) {
        recordTransaction(S, 'expense_incident', -incidentFees, `En-route citations, roadside repairs & recovery (${a.from} to ${a.to})`);
        if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
        S.stats.spent = (S.stats.spent || 0) + incidentFees;
      }
    }

    // Delivery SLA / Deadline Enforcement
    if (a.deadline && !a.reposition) {
      if (now <= a.deadline) {
        if (a.vip || a.kind === 'Emergency' || a.tenderId) {
          const slaBonus = Math.round(finalPay * 0.05);
          finalPay += slaBonus;
          pushNote(S, `⏱️ On-Time SLA Bonus (${a.from} → ${a.to}): +$${slaBonus.toLocaleString()}`, {
            title: 'ON-TIME DELIVERY BONUS',
            type: 'finance'
          });
        }
      } else {
        const hoursLate = (now - a.deadline) / SIM_HOUR_MS;
        const penaltyPct = Math.min(0.30, Math.max(0.05, Math.round(hoursLate * 5) / 100));
        const latePenalty = Math.round(finalPay * penaltyPct);
        finalPay = Math.max(0, finalPay - latePenalty);
        pushNote(S, `⚠️ Late Delivery (${hoursLate.toFixed(1)}h past SLA on ${a.from} → ${a.to}): -$${latePenalty.toLocaleString()} (${Math.round(penaltyPct * 100)}% penalty).`, {
          title: 'SLA BREACH PENALTY',
          type: 'finance',
          priority: 1
        });
      }
    }

    if ((a.cargoDamagePct || 0) > 0) {
      const damagePct = Math.min(30, a.cargoDamagePct);
      if (S.insurance?.cargo) {
        pushNote(S, `🛡️ Cargo Insurance covered ${damagePct}% freight damage claim on ${a.from} → ${a.to}.`, {
          title: 'INSURANCE CLAIM COVERED',
          type: 'finance'
        });
      } else {
        const penalty = Math.round(finalPay * (damagePct / 100));
        finalPay = Math.max(0, finalPay - penalty);
        pushNote(S, `📉 Freight claim (${damagePct}% cargo damage): -$${penalty.toLocaleString()} deducted from payout.`, {
          title: 'CARGO DAMAGE DEDUCTION',
          type: 'finance'
        });
      }
    }
    
    // Tolls & Customs Tariff Calculation
    const cargoWeight = a.weight || (cargo as any)?.weight || 18;
    const hasActiveEzPass = Boolean(
      (S.ezPass && (!S.ezPassExpiresAt || now <= S.ezPassExpiresAt)) ||
      S.licenses?.includes('ez_pass') ||
      (t as any).upgrades?.ezPass
    );
    const tollResult = calculateTripToll(a.km, cargoWeight, a.from, a.to, hasActiveEzPass);
    if (tollResult.totalTollCost > 0) {
      recordTransaction(S, 'expense_toll', -tollResult.totalTollCost, `Highway tolls & border tariffs: ${a.from} to ${a.to}`);
      if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
      S.stats.spent = (S.stats.spent || 0) + tollResult.totalTollCost;
      pushNote(S, `🛣️ Highway Tolls & Customs Tariffs (${a.km} km, ${cargoWeight}t): -$${tollResult.totalTollCost.toLocaleString()} ${tollResult.discountApplied ? '(EZ-Pass 30% Off)' : ''}`, {
        title: 'TOLL & BORDER TARIFF',
        type: 'finance'
      });
    }

    if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
    recordTransaction(S, 'revenue_freight', finalPay, `Consignment Payment: ${cargo?.name || 'Freight'} (${a.from} to ${a.to})`);
    S.stats.earned += finalPay;
    S.stats.km += a.km;
    
    if (isDestinationUnlockedHub && !a.isRoundTrip) {
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

      // Deadhead return leg is dispatched automatically in the truck block above.
    }

    // PoD Bonus
    const podBonus = parseFloat((0.05 + (a.km / 1000) * 0.05).toFixed(2));
    S.coins = (S.coins || 0) + podBonus;

    addCompanyXp(S, 25 + Math.round(a.km * 0.02), `Delivery: ${cargo?.name || 'Freight'}`);

    // Reclaim expired leased tractor once final delivery completes
    if (t && Array.isArray(S.leases)) {
      const leaseIdx = S.leases.findIndex((l: any) => l.truckId === t.id && l.pendingReturn);
      if (leaseIdx !== -1) {
        const lease = S.leases[leaseIdx];
        S.leases.splice(leaseIdx, 1);
        if (t.driverId) {
          const drv = (S.drivers || []).find((d: any) => d.id === t.driverId);
          if (drv) drv.assignedTruckId = null;
        }
        S.fleet = (S.fleet || []).filter((ft: any) => ft.id !== t.id);
        pushNote(S, `📄 Expired leased tractor (${lease.modelId}, Unit #${t.id}) returned to lessor after final delivery.`, {
          title: 'LEASED UNIT RETURNED',
          type: 'finance'
        });
      }
    }
    
    // Corporate Tender Milestone Progression
    if (a.tenderId && S.corporateTenders) {
      const tnd = S.corporateTenders.find((ct: any) => ct.id === a.tenderId);
      if (tnd) {
        tnd.completedLoads = (tnd.completedLoads || 0) + 1;
        tnd.loadsRemaining = Math.max(0, (tnd.totalLoads || 10) - tnd.completedLoads);
        if (tnd.completedLoads >= tnd.totalLoads && !tnd.bonusAwarded) {
          tnd.bonusAwarded = true;
          recordTransaction(S, 'revenue_bonus', tnd.bonusPayout, `30-Day Tender Performance Bonus: ${tnd.client}`);
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
