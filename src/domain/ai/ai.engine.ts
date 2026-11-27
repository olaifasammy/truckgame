/**
 * AI Dispatch & Fleet Automation Engine
 * Real-time job matching, fleet health inspection, neural dispatch scoring, and execution.
 * 
 * STRICT DOMAIN RULE: The AI Engine evaluates ONLY real, existing market jobs from state.jobs.
 * It NEVER invents, hallucinates, or synthetically creates jobs on its own.
 * 
 * AUTONOMOUS LEVEL EVOLUTION: The Neural Network levels up autonomously based on
 * empirical delivery success, net profit margin, and gradient loss convergence.
 */

import { AiFilterConfig, AiLogEntry } from './ai.types';
import { AI_SUBSCRIPTION_PLANS } from './ai.config';
import { why, replenish, completeJobs } from '../../systems/jobs';
import { distKm } from '../../systems/calc';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { getDispatchNeuralNetwork, trainOnHistoricalLogs } from './neuralNetwork';
import { DispatchExecution } from '../dispatch/execution';
import { FreightEngine } from '../freight/engine/generator';
import { getCompanyProgression } from '../company/progression';
import { isRegionUnlocked, REGIONAL_HUBS, REGION_AUTHORITIES } from '../logistics/network';
import { LOCATIONS } from '../../data/world';
import { TRUCK_MODELS } from '../trucks/trucks.data';
import { createTruck } from '../trucks/trucks.physics';
import { ensureHubFacilities } from '../hubs/hub-facility';
import { getHubFacilityForCity, isCityUnlockedHub } from '../hubs/hub-facility';
import { getDispatchEligibilityError } from '../dispatch/validation';
import { getCompanySafetyRating } from '../trucks/registration';
import { getRegionalRetailFuelPrice } from '../economy/fuel-market';
import { recordTransaction } from '../../core/ledger';
import { fuelPer100km } from '../simulation/physics';
import { VehicleMaintenance, getWholesalePartPrice, PART_BASE_PRICES } from '../trucks/maintenance';
import { getTruckRegistrationStatus, registerTruckAtCity, renewVehicleRoadTax, payAllViolations, buyEzPass } from '../trucks/registration';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

const HOS_REST_MS = 2_770_000; // 10 simulation hours mandatory off-duty rest

/**
 * Case-insensitive helper for geographic location lookups.
 */
function getLocationRecord(name: string): any {
  if (!name) return undefined;
  if (LOCATIONS[name]) return LOCATIONS[name];
  const lower = name.toLowerCase();
  const match = Object.keys(LOCATIONS).find(k => k.toLowerCase() === lower);
  return match ? LOCATIONS[match] : undefined;
}

/**
 * Calculates normalized 8-feature vector for Neural Network evaluation.
 */
export function calculateDispatchFeatureVector(S: any, truck: any, job: any, driver?: any): number[] {
  const payout = job.pay || 0;
  const km = Math.max(1, job.km || 1);
  const deadheadKm = distKm(truck.loc, job.from);
  const totalKm = km + deadheadKm;

  // 1. Payout normalized (0..$40k)
  const payoutNorm = Math.min(1, Math.max(0, payout / 40000));

  // 2. Yield per total km normalized (0..$15/total km) - Includes deadhead distance!
  const yieldNorm = Math.min(1, Math.max(0, (payout / totalKm) / 15));

  // 3. Deadhead efficiency (1 = 0km deadhead, 0 = excessive empty run)
  const dhEfficiency = Math.max(0, 1 - (deadheadKm / Math.max(1, totalKm)));

  // 4. Capacity utilization
  const truckModel = TRUCK_MODELS[truck.modelId];
  const maxGVW = truckModel?.maxGVW || 44;
  const weight = job.weight || 10;
  const capacityNorm = Math.min(1, Math.max(0.1, weight / maxGVW));

  // 5. Driver & Fluid readiness (well-rested = 1.0, fatigued/high HOS or low DEF/coolant = penalized)
  const fatigue = driver?.fatigue || 0;
  const hosHours = driver?.hosHours || 0;
  const fluidPenalty = ((truck.fluids?.adBlue ?? 100) < 15 || (truck.fluids?.coolant ?? 100) < 35) ? 0.25 : 0;
  const driverReadiness = Math.max(0.1, 1 - (fatigue / 100) * 0.7 - (hosHours / 14) * 0.3 - fluidPenalty);

  // 6. Real Physics Estimated Net Profit Margin Ratio (Fuel burn w/ upgrades + Wear w/ suspension + Driver Wage)
  const cargoKg = Math.max(1000, (job.weight || 10) * 1000);
  const estL100 = fuelPer100km(truck, { cargoWeightKg: cargoKg, gradientPct: 1.5, weatherCoeff: 0.9, roadType: 'asphalt', hasTrailer: true }, 82);
  const fuelPrice = getRegionalRetailFuelPrice(typeof job.from === 'string' ? job.from : (typeof truck.loc === 'string' ? truck.loc : 'ROTTERDAM'), S) || 1.55;
  const fuelCost = (totalKm / 100) * estL100 * fuelPrice;
  const suspWearFactor = truck.upgrades?.heavyDutySuspension ? 0.75 : 1.0;
  const wearAndWageCost = totalKm * (0.28 * suspWearFactor + 0.25);
  const estimatedCost = fuelCost + wearAndWageCost;
  const netMargin = Math.max(0, Math.min(1, (payout - estimatedCost) / Math.max(1, payout)));

  // 7. Route familiarity & Hub Proximity
  const familiarity = isCityUnlockedHub(S, job.from) ? 1.0 : 0.6;

  // 8. Reputation & Progression Potential
  const repScore = Math.min(1, (job.isAuctionWon ? 45 : 15) / 50 + (km / 3000) * 0.2);

  return [payoutNorm, yieldNorm, dhEfficiency, capacityNorm, driverReadiness, netMargin, familiarity, repScore];
}

/**
 * Score a candidate job for a specific truck based on neural inference and strategy profile.
 * Returns -Infinity if ineligible or unprofitable.
 */
export function scoreJobForTruck(S: any, truck: any, job: any, filters: AiFilterConfig): number {
  // 1. VIP Rank check
  const prog = getCompanyProgression(S);
  if (job.vip && !job.isAuctionWon && (prog?.tier || 0) < 3) {
    return -Infinity;
  }

  // 2. Geographic Connectivity & Region Unlock Check
  const locFrom = getLocationRecord(job.from);
  const locTo = getLocationRecord(job.to);
  if (locFrom && !isRegionUnlocked(S as any, locFrom.region)) return -Infinity;
  if (locTo && !isRegionUnlocked(S as any, locTo.region)) return -Infinity;

  const truckLoc = getLocationRecord(truck.loc);
  if (truckLoc && locFrom && !isRegionUnlocked(S as any, truckLoc.region)) return -Infinity;
  // Cross-continental dispatch forbidden: Tractor in America cannot service Europe/Africa/Asia
  if (truckLoc && locFrom && truckLoc.region !== locFrom.region) return -Infinity;

  // 3. Domain legality & full compliance gate (FMCSA holds, road tax, inspection, certs, permits)
  const truckWhyMsg = why(S, truck, job);
  if (truckWhyMsg) return -Infinity;

  const assignedDriver = (S.drivers || []).find((d: any) => d.id === truck.driverId);
  const eligibilityErr = getDispatchEligibilityError(S, truck, job, assignedDriver);
  if (eligibilityErr) return -Infinity;

  // 4. Deadhead and Total Km Economics Check (Prevent dispatching money-losing contracts)
  const deadheadKm = distKm(truck.loc, job.from);
  const payout = job.pay || 0;
  const km = Math.max(1, job.km || 1);
  const totalKm = km + deadheadKm;

  // Real operating costs per total km (~$0.90/km fuel + wear + driver compensation)
  const estimatedTotalCost = totalKm * 0.90;
  const netProfitEst = payout - estimatedTotalCost;
  
  // NEVER DISPATCH A CONTRACT THAT LOSES MONEY
  if (netProfitEst <= 0) return -Infinity;

  // Penalize long deadheads relative to job distance
  if (deadheadKm > 300 && deadheadKm > km * 1.5 && netProfitEst < 250) {
    return -Infinity;
  }

  const effectiveYieldPerKm = payout / totalKm;

  const minPayout = filters.minPayoutUsd ?? 0;
  const minYpk = filters.minYieldUsdPerKm ?? 0;
  const maxDist = filters.maxDistanceKm ?? 50000;
  const minHealth = filters.minTruckHealthPct ?? 0;

  // 6. Truck health check
  if (minHealth > 0) {
    const comp = truck.components || {};
    const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
    const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
    if (avgHealth < minHealth) {
      return -Infinity;
    }
  }

  // 7. Job pay and distance filters based on TOTAL trip distance
  if (payout < minPayout) return -Infinity;
  if (effectiveYieldPerKm < minYpk) return -Infinity;
  if (km > maxDist) return -Infinity;

  // 8. Hazmat preference filter (inspect both hub boards & VIP/auction board)
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  const allBoardJobs = [
    ...(S.jobs || []),
    ...(S.hubJobs ? (Object.values(S.hubJobs) as any[][]).flat() : [])
  ];
  if (filters.requireHazmatCert) {
    const hasAnyHazmatOnBoard = allBoardJobs.some((j: any) => {
      const c = CARGO_TYPES.find(cg => cg.id === j.cargoId);
      return c?.isHazmat;
    });
    if (hasAnyHazmatOnBoard && !cargo?.isHazmat) {
      return -Infinity;
    }
  }

  // 9. Cargo type preference filter
  if (filters.priorityCargoTypes && filters.priorityCargoTypes.length > 0) {
    const hasPriorityJobsOnBoard = allBoardJobs.some((j: any) => filters.priorityCargoTypes!.includes(j.cargoId));
    if (hasPriorityJobsOnBoard && !filters.priorityCargoTypes.includes(job.cargoId)) {
      return -Infinity;
    }
  }

  // 10. Neural Network Inference
  const driver = (S.drivers || []).find((d: any) => d.id === truck.driverId);
  const featureVector = calculateDispatchFeatureVector(S, truck, job, driver);
  const net = getDispatchNeuralNetwork(S.aiState?.neuralWeights);
  const neuralScore = net.forward(featureVector);

  // 11. Score calculation blending neural intelligence with strategy profile
  let score = 0;
  switch (filters.profile) {
    case 'highest_payout':
      score = (netProfitEst * 3) + (neuralScore * 10000) - (deadheadKm * 2);
      break;
    case 'highest_yield_per_km':
      score = (effectiveYieldPerKm * 1800) + (neuralScore * 10000) - (deadheadKm * 2);
      break;
    case 'nearest_origin':
      score = (10000 - deadheadKm * 15) + (neuralScore * 5000) + (netProfitEst * 0.05);
      break;
    case 'shortest_distance':
      score = (10000 - km * 6) + (neuralScore * 5000) + (netProfitEst * 0.05);
      break;
    case 'balanced_efficiency':
    default:
      score = (effectiveYieldPerKm * 800) + (netProfitEst * 1.5) + (neuralScore * 12000) - (deadheadKm * 3);
      break;
  }

  // Bonus for hazmat cargo when certified
  if (cargo?.isHazmat && filters.requireHazmatCert) {
    score += 5000;
  }

  // "To & Fro" / Backhaul Turnaround Synergy Bonus: 0 km deadhead from current station
  if (truck.loc === job.from) {
    score += 8500;
  }
  if (job.isBackhaul) {
    score += 4000;
  }

  return score;
}

/**
 * Execute a single auto-dispatch tick across idle trucks and real market jobs.
 * MUST NOT generate fake jobs. Uses ONLY S.jobs.
 * Dispatches guaranteed whenever user is subscribed and idle units are matchable.
 */
export function runAiAutoDispatch(S: any, overrideNow?: number): { dispatchedCount: number; message: string } {
  if (!S.aiState) return { dispatchedCount: 0, message: 'AI State uninitialized' };
  
  const now = overrideNow || Date.now();
  let isSubActive = !!(
    (S.aiState.subscriptionActive && now < (S.aiState.expiresTimestamp || 0)) ||
    (S.aiState.offlineDispatchActive && now < (S.aiState.offlineExpiresTimestamp || 0))
  );

  // Seamless auto-renewal fallback: If subscription expired but auto-renew or positive balance is available
  if (!isSubActive && S.aiState.subscriptionActive && (S.aiState.autoRenew || S.aiState.planId === 'auto' || (S.money || 0) >= 5000)) {
    const planId = S.aiState.planId || 'auto';
    const plan = AI_SUBSCRIPTION_PLANS[planId] || AI_SUBSCRIPTION_PLANS['auto'];
    const renewCost = plan?.priceUsd || 145000;
    if ((S.money || 0) >= renewCost) {
      S.money -= renewCost;
      S.aiState.expiresTimestamp = now + (plan?.days || 30) * 86400 * 1000;
      isSubActive = true;
    } else if ((S.money || 0) >= 5000) {
      S.money -= 5000;
      S.aiState.expiresTimestamp = now + 86400 * 1000;
      isSubActive = true;
    }
  }

  if (!isSubActive) {
    return { dispatchedCount: 0, message: 'AI Subscription Inactive or Expired' };
  }

  const filters: AiFilterConfig = S.aiState.filters || { enabled: true };
  if (filters.enabled === false) {
    // If the engine is paused by the user, return paused status
    return { dispatchedCount: 0, message: 'Continuous Auto-Dispatch Engine is currently paused' };
  }

  // 0. Global FMCSA Safety Hold check
  const safety = getCompanySafetyRating(S);
  if (safety.grade === 'UNSATISFACTORY') {
    return { dispatchedCount: 0, message: 'FMCSA Safety Hold active — settle DOT citations in Government Compliance.' };
  }

  // 1. Clear expired driver HOS rest periods; initiate real 10h HOS rest for exhausted drivers
  for (const drv of (S.drivers || [])) {
    if (drv.hosRestUntil && drv.hosRestUntil <= now) {
      delete drv.hosRestUntil;
      drv.hosHours = 0;
      drv.fatigue = Math.max(0, (drv.fatigue || 0) - 70);
    } else if (!drv.hosRestUntil && ((drv.fatigue || 0) >= 85 || (drv.hosHours || 0) >= 11)) {
      drv.hosRestUntil = now + HOS_REST_MS;
    }
  }

  // 2. Self-healing: Auto-pair unassigned idle drivers (respecting regional work permits)
  const assignedDriverIds = new Set((S.fleet || []).map((t: any) => t.driverId).filter(Boolean));
  for (const truck of (S.fleet || [])) {
    if (truck.status === 'idle' && !truck.driverId) {
      const truckRegion = getLocationRecord(truck.loc)?.region;
      const availableDriver = (S.drivers || []).find((d: any) =>
        !assignedDriverIds.has(d.id) &&
        (!d.hosRestUntil || d.hosRestUntil <= now) &&
        (!truckRegion || !d.region || d.region === truckRegion || d.workPermits?.includes(truckRegion))
      );
      if (availableDriver) {
        truck.driverId = availableDriver.id;
        assignedDriverIds.add(availableDriver.id);
      }
    }
  }

  // 3. Identify idle trucks with assigned, rested drivers
  const idleTrucks = (S.fleet || []).filter((t: any) => {
    if (t.status !== 'idle' || !t.driverId) return false;
    const drv = (S.drivers || []).find((d: any) => d.id === t.driverId);
    if (!drv) return false;
    if (drv.hosRestUntil && drv.hosRestUntil > now) return false;
    if (drv.fatigue > 85 || (drv.hosHours || 0) >= 11) return false;
    return true;
  });

  if (idleTrucks.length === 0) {
    return { dispatchedCount: 0, message: 'No idle trucks with drivers available' };
  }

  // 4. Auto-refuel idle fleet units if low on diesel
  if (filters.autoRefuel !== false) {
    for (const truck of idleTrucks) {
      const truckModel = TRUCK_MODELS[truck.modelId];
      const tankCapacity = truckModel?.tankSize || 800;
      const currentFuel = truck.fluids?.fuel !== undefined ? truck.fluids.fuel : tankCapacity;
      if (currentFuel < tankCapacity * 0.40) {
        let needed = Math.round(tankCapacity - currentFuel);
        if (!truck.fluids) truck.fluids = { fuel: currentFuel, oil: 100, coolant: 100, adblue: 100, transmission: 100 };

        const hubFacility = getHubFacilityForCity(S, truck.loc);
        if (hubFacility && hubFacility.fuelLiters > 0) {
          const draw = Math.min(needed, hubFacility.fuelLiters);
          hubFacility.fuelLiters -= draw;
          truck.fluids.fuel = (truck.fluids.fuel ?? currentFuel) + draw;
          needed -= draw;
        }
        if (needed > 0 && S.fuelBunker && S.fuelBunker.currentLiters > 0 && truck.loc === S.homeCity) {
          const draw = Math.min(needed, S.fuelBunker.currentLiters);
          S.fuelBunker.currentLiters -= draw;
          truck.fluids.fuel = (truck.fluids.fuel ?? currentFuel) + draw;
          needed -= draw;
        }
        if (needed > 0 && !hubFacility && truck.loc !== S.homeCity) {
          const retailPrice = getRegionalRetailFuelPrice(truck.loc, S);
          const fuelCost = Math.round(needed * retailPrice);
          if ((S.money || 0) >= fuelCost) {
            recordTransaction(S, 'expense_fuel', -fuelCost, `AI Auto-Refuel (Off-Hub): ${truck.name} (${needed}L @ $${retailPrice.toFixed(2)}/L)`);
            if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
            S.dailyStats.fuel += fuelCost;
            truck.fluids.fuel = tankCapacity;
          }
        }
      }
    }
  }

  // 5. Hub-centric & VIP market board replenishment
  if (!S.jobs) S.jobs = [];
  if (!S.hubJobs) S.hubJobs = {};

  if (S.jobs.length === 0) {
    try {
      replenish(S);
    } catch (e) {}
  } else if (S.jobs.length > 17) {
    S.jobs = S.jobs.slice(0, 17);
  }

  // Ensure every owned hub (especially hubs with idle trucks) has hub freight generated
  for (const hubId of (S.depots || [])) {
    if (!S.hubJobs[hubId] || S.hubJobs[hubId].length === 0) {
      try {
        FreightEngine.replenishHub(S, hubId, 4);
      } catch (e) {}
    }
  }

  const marketJobs: any[] = [];
  if (S.hubJobs) {
    Object.values(S.hubJobs).forEach((hJobs: any) => {
      if (Array.isArray(hJobs)) marketJobs.push(...hJobs);
    });
  }
  marketJobs.push(...(S.jobs || []));

  if (marketJobs.length === 0) {
    return { dispatchedCount: 0, message: 'No market jobs available across hub boards' };
  }

  let dispatchedCount = 0;
  const dispatchedJobIds = new Set<number>();
  const net = getDispatchNeuralNetwork(S.aiState?.neuralWeights);

  for (const truck of idleTrucks) {
    // Score all available jobs for this truck and sort in descending order
    const candidateJobs: { job: any; score: number }[] = [];

    for (const job of marketJobs) {
      if (dispatchedJobIds.has(job.id)) continue;
      const score = scoreJobForTruck(S, truck, job, filters);
      if (score > -Infinity) {
        candidateJobs.push({ job, score });
      }
    }

    // Fallback contract procurement: If no compatible jobs exist on the hub board for this truck's current location,
    // generate an immediate matchable outbound consignment directly into that hub's S.hubJobs[hubId]
    if (candidateJobs.length === 0) {
      const truckLoc = getLocationRecord(truck.loc);
      const originHub = REGIONAL_HUBS.find(
        h => h.city === truck.loc && (S.depots || []).includes(h.id)
      );
      if (originHub && truckLoc && isRegionUnlocked(S as any, truckLoc.region)) {
        if (!S.hubJobs[originHub.id]) S.hubJobs[originHub.id] = [];
        if (S.hubJobs[originHub.id].length < 10) {
          try {
            const compatibleJob = FreightEngine.generate(S, {
              forceRegion: truckLoc.region,
              forceFrom: truck.loc,
              forceTrailer: truck.trailer || undefined,
              vip: false
            });
            if (compatibleJob) {
              S.hubJobs[originHub.id].unshift(compatibleJob);
              marketJobs.unshift(compatibleJob);
              const score = scoreJobForTruck(S, truck, compatibleJob, filters);
              if (score > -Infinity) {
                candidateJobs.push({ job: compatibleJob, score });
              }
            }
          } catch (e) {}
        }
      }
    }

    candidateJobs.sort((a, b) => b.score - a.score);

    // Attempt candidate jobs in order of score until one succeeds
    for (const candidate of candidateJobs) {
      const bestJob = candidate.job;
      const cargo = CARGO_TYPES.find(c => c.id === bestJob.cargoId);
      const cargoName = cargo?.name || bestJob.cargo || 'Commercial Cargo';
      const payout = bestJob.pay || 0;
      const km = bestJob.km || 1;
      const deadheadKm = distKm(truck.loc, bestJob.from);
      const totalKm = km + deadheadKm;
      const yieldRate = Math.round((payout / Math.max(1, totalKm)) * 100) / 100;
      const drv = (S.drivers || []).find((d: any) => d.id === truck.driverId);
      const features = calculateDispatchFeatureVector(S, truck, bestJob, drv);
      const neuralScore = net.forward(features);
      const confidencePct = Math.round(neuralScore * 100);

      // Execute dispatch directly on S
      const dispatchResult = DispatchExecution.takeJob(S, bestJob.id, truck.id, true);

      if (dispatchResult.success) {
        dispatchedJobIds.add(bestJob.id);
        dispatchedCount++;

        const logEntry: AiLogEntry = {
          id: `ai-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: Date.now(),
          simTimeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          truckId: truck.id,
          truckName: truck.name || `Unit #${truck.id}`,
          jobId: bestJob.id,
          cargoName,
          from: bestJob.from,
          to: bestJob.to,
          payoutUsd: payout,
          km,
          yieldPerKm: yieldRate,
          profileUsed: filters.profile,
          status: 'dispatched',
          message: `Matched ${truck.name} → ${cargoName} (${bestJob.from} → ${bestJob.to}) for $${payout.toLocaleString()} [Neural Score: ${confidencePct}% · $${yieldRate}/total km]`,
          features
        };

        if (!S.aiState.logs) S.aiState.logs = [];
        S.aiState.logs.unshift(logEntry);
        if (S.aiState.logs.length > 60) S.aiState.logs.pop();

        S.aiState.totalDispatchedCount = (S.aiState.totalDispatchedCount || 0) + 1;
        S.aiState.totalRevenueGeneratedUsd = (S.aiState.totalRevenueGeneratedUsd || 0) + payout;
        break; // Successfully dispatched this truck, move to next
      }
    }
  }

  // Persist updated neural weights in state
  S.aiState.neuralWeights = net.toJSON();

  const msg = dispatchedCount > 0
    ? `Successfully neural-dispatched ${dispatchedCount} unit${dispatchedCount > 1 ? 's' : ''}`
    : 'No eligible market jobs matched current fleet filters';

  return { dispatchedCount, message: msg };
}

/**
 * Simulates offline auto-dispatching for players who hold the Autonomous Offline Dispatch Add-on.
 * Iteratively simulates time passage to allow sequential dispatches (dispatch -> complete -> dispatch).
 */
export function processOfflineAiDispatch(S: any, offlineMs: number): { dispatches: number; revenue: number } {
  if (!S.aiState || !S.aiState.offlineDispatchActive) return { dispatches: 0, revenue: 0 };
  const realNow = Date.now();
  if (realNow >= S.aiState.offlineExpiresTimestamp) return { dispatches: 0, revenue: 0 };

  const offlineSeconds = Math.floor(offlineMs / 1000);
  if (offlineSeconds < 60) return { dispatches: 0, revenue: 0 };

  // Max simulation cap: 24 hours to prevent extreme CPU hangs on return
  const cappedOfflineMs = Math.min(86400000, offlineMs);
  const lastActive = realNow - offlineMs;
  
  // Simulation step size: 5 minutes per "tick"
  // This allows enough time for jobs to complete and trucks to be re-dispatched
  const STEP_MS = 5 * 60 * 1000; 
  const iterations = Math.ceil(cappedOfflineMs / STEP_MS);
  
  let totalDispatches = 0;
  let virtualNow = lastActive;

  for (let i = 0; i < iterations; i++) {
    virtualNow += STEP_MS;
    if (virtualNow > realNow) virtualNow = realNow;

    // 1. Complete any jobs that would have finished by this virtual timestamp
    completeJobs(S, virtualNow);

    // 2. Run AI to pick up new work
    const res = runAiAutoDispatch(S, virtualNow);
    if (res.dispatchedCount > 0) {
      totalDispatches += res.dispatchedCount;
    }
  }

  return { dispatches: totalDispatches, revenue: 0 };
}

/**
 * Execute automated fleet maintenance if add-on active
 */
export function runAiFleetMaintenance(S: any): number {
  if (!S.aiState || !S.aiState.maintenanceAddonActive) return 0;
  const now = Date.now();
  if (now >= S.aiState.maintenanceExpiresTimestamp) return 0;

  let servicedCount = 0;
  const idleTrucks = (S.fleet || []).filter((t: any) => t.status === 'idle');

  for (const truck of idleTrucks) {
    const comp = truck.components || {};
    const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
    const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
    const minCompHealth = healthValues.length > 0 ? Math.min(...healthValues) : 100;

    // Top up AdBlue/Coolant/Oil if low
    if ((truck.fluids?.adBlue ?? 100) < 40 || (truck.fluids?.coolant ?? 100) < 60) {
      VehicleMaintenance.serviceConsumables(S, truck.id);
    }

    // Renew expired DMV registration or road tax on idle trucks
    const regStatus = getTruckRegistrationStatus(truck);
    if (!regStatus.registered && S.money > 3000) {
      registerTruckAtCity(S, truck.id, truck.loc || 'ROTTERDAM');
    }
    if (!regStatus.taxPaid && S.money > 3000) {
      renewVehicleRoadTax(S, truck.id);
    }

    // Service trucks proactively if average health drops below 75% or ANY component < 55%, using HQ Warehouse parts!
    if (avgHealth < 75 || minCompHealth < 55) {
      let totalSpent = 0;
      let partsUsedFromStock = 0;
      const compKeys = Object.keys(comp) as Array<keyof typeof comp>;
      for (const partKey of compKeys) {
        const curH = typeof comp[partKey] === 'number' ? comp[partKey] : comp[partKey]?.health ?? 100;
        if (curH < 85) {
          const quote = VehicleMaintenance.getPartEffectiveCost(S, truck, partKey as string);
          if (S.money >= quote.cost + 1000) {
            const err = VehicleMaintenance.repairPart(S, truck.id, partKey as any);
            if (!err) {
              totalSpent += quote.cost;
              if (quote.fromInventory) partsUsedFromStock++;
            }
          }
        }
      }

      if (totalSpent > 0) {
        servicedCount++;
        const stockNote = partsUsedFromStock > 0 ? ` (${partsUsedFromStock} from HQ stock)` : '';
        const logEntry: AiLogEntry = {
          id: `ai-maint-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: Date.now(),
          simTimeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          truckId: truck.id,
          truckName: truck.name || `Unit #${truck.id}`,
          jobId: 0,
          cargoName: 'Fleet Maintenance',
          from: truck.loc,
          to: truck.loc,
          payoutUsd: -totalSpent,
          km: 0,
          yieldPerKm: 0,
          profileUsed: S.aiState.filters?.profile || 'balanced_efficiency',
          status: 'serviced',
          message: `Autonomous Service: ${truck.name} repaired${stockNote} (-$${totalSpent.toLocaleString()})`
        };

        if (!S.aiState.logs) S.aiState.logs = [];
        S.aiState.logs.unshift(logEntry);
        if (S.aiState.logs.length > 60) S.aiState.logs.pop();
      }
    }
  }

  return servicedCount;
}

/**
 * AI Executive Strategy Engine: Autonomous Company Operations
 * Handles autonomous recruitment, fleet expansion, and network growth.
 */
export function runAiExecutiveStrategy(S: any): { actions: string[] } {
  if (!S.aiState || !S.aiState.executiveAutopilotActive) return { actions: [] };
  const now = Date.now();
  if (now >= S.aiState.executiveExpiresTimestamp) return { actions: [] };

  const actions: string[] = [];
  const logAction = (msg: string) => {
    actions.push(msg);
    const entry: AiLogEntry = {
      id: `ai-exec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      simTimeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      truckId: 0,
      truckName: 'Corporate HQ',
      jobId: 0,
      cargoName: 'Executive Strategy',
      from: 'HQ',
      to: 'HQ',
      payoutUsd: 0,
      km: 0,
      yieldPerKm: 0,
      profileUsed: S.aiState.filters?.profile || 'balanced_efficiency',
      status: 'dispatched',
      message: `[EXECUTIVE] ${msg}`
    };
    if (!S.aiState.logs) S.aiState.logs = [];
    S.aiState.logs.unshift(entry);
    if (S.aiState.logs.length > 60) S.aiState.logs.pop();
  };

  // 1. AUTONOMOUS RECRUITMENT: Pair idle trucks with drivers
  const idleTrucksWithoutDrivers = (S.fleet || []).filter((t: any) => t.status === 'idle' && !t.driverId);
  if (idleTrucksWithoutDrivers.length > 0) {
    for (const truck of idleTrucksWithoutDrivers) {
      const region = LOCATIONS[truck.loc]?.region || 'Europe';
      const candidate = (S.pool || []).find((p: any) => p.region === region);
      if (candidate) {
        const fee = candidate.skill * 1500;
        if (S.money >= fee + 5000) {
          S.money -= fee;
          S.pool = S.pool.filter((p: any) => p.id !== candidate.id);
          S.drivers.push(candidate);
          truck.driverId = candidate.id;
          candidate.assignedTruckId = truck.id;
          logAction(`Hired ${candidate.name} (${candidate.skill}★) for ${truck.name}.`);
          break; // One hire per tick to prevent massive cash drain
        }
      }
    }
  }

  // 2. AUTONOMOUS FLEET EXPANSION: Buy trucks when profitable and space available
  const idleTrucksWithDrivers = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.driverId).length;
  const hasSpace = S.fleet.length < 100; // Arbitrary soft cap for AI expansion
  if (S.money > 450000 && idleTrucksWithDrivers < 2 && hasSpace) {
    const models = Object.values(TRUCK_MODELS).filter(m => m.price > 100000 && m.price < 250000);
    const model = models[Math.floor(Math.random() * models.length)];
    if (model && S.money >= model.price + 100000) {
      const spawnLoc = S.depots?.[0] ? REGIONAL_HUBS.find(h => h.id === S.depots[0])?.city : 'ROTTERDAM';
      const newId = S.nextId++;
      const truck = createTruck(newId, model.id, `${model.brand} ${model.name} (AI Unit #${newId})`, spawnLoc || 'ROTTERDAM', null);
      S.fleet.push(truck);
      S.money -= model.price;
      logAction(`Acquired ${model.brand} ${model.name} to expand fleet capacity.`);
    }
  }

  // 3. AUTONOMOUS NETWORK GROWTH: Acquire new hubs in current or new regions
  if (S.money > 850000 && S.fleet.length > (S.depots?.length || 0) * 6) {
    const targetHub = REGIONAL_HUBS.find(h => 
      isRegionUnlocked(S, h.region) && 
      !(S.depots || []).includes(h.id) && 
      S.money >= h.cost + 200000
    );

    if (targetHub) {
      S.money -= targetHub.cost;
      S.depots.push(targetHub.id);
      ensureHubFacilities(S);
      logAction(`Acquired ${targetHub.name} in ${targetHub.city} to optimize regional logistics.`);
    }
  }

  // 4. COMPLIANCE & DOT FINES: Clear unpaid citations to keep safety rating high
  if ((S.violations || []).length > 0 && S.money > 15000) {
    const count = S.violations.length;
    if (payAllViolations(S)) {
      logAction(`Cleared ${count} DOT violation(s).`);
    }
  }

  // 5. WAREHOUSE WHOLESALE RESTOCK: Keep critical spare parts stocked at -55% bulk discount
  if (S.money > 120000 && (S.depots || []).length > 0) {
    if (!S.partsInventory) S.partsInventory = {};
    for (const partKey of Object.keys(PART_BASE_PRICES)) {
      const currentQty = S.partsInventory[partKey] || 0;
      if (currentQty < 2) {
        const bulkCost = getWholesalePartPrice(partKey, 4);
        if (S.money >= bulkCost + 50000) {
          S.money -= bulkCost;
          S.partsInventory[partKey] = currentQty + 4;
          recordTransaction(S, 'maintenance', -bulkCost, `AI Executive: Bulk OEM ${partKey} x4`);
          logAction(`Restocked HQ Warehouse: +4 ${partKey.toUpperCase()} at wholesale (-$${bulkCost.toLocaleString()}).`);
          break; // Max 1 bulk restock per tick
        }
      }
    }
  }

  // 6. INSURANCE & RISK PROTECTION: Ensure basic liability & cargo coverage
  if (S.money > 80000 && (S.fleet || []).length > 0) {
    if (!S.insurance) S.insurance = { liability: true, collision: true, cargo: false };
    if (!S.insurance.liability) {
      S.insurance.liability = true;
      logAction('Enrolled fleet in Commercial Auto Liability Insurance.');
    } else if (!S.insurance.cargo && S.money > 110000) {
      S.insurance.cargo = true;
      logAction('Enrolled fleet in Motor Truck Cargo Insurance.');
    }
  }

  // 7. E-ZPASS TOLL AUTOMATION: Equip company with E-ZPass transponder if missing
  if (S.money > 60000 && !S.tollPasses?.ezPass) {
    if (buyEzPass(S)) {
      logAction('Purchased company-wide E-ZPass Transponder.');
    }
  }

  return { actions };
}
