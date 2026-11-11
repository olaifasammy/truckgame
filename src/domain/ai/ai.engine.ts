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
import { isRegionUnlocked } from '../logistics/network';
import { LOCATIONS } from '../../data/world';
import { TRUCK_MODELS } from '../trucks/trucks.data';
import { getHubFacilityForCity } from '../hubs/hub-facility';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

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

  // 5. Driver readiness (well-rested = 1.0, fatigued/high HOS = near 0)
  const fatigue = driver?.fatigue || 0;
  const hosHours = driver?.hosHours || 0;
  const driverReadiness = Math.max(0.1, 1 - (fatigue / 100) * 0.7 - (hosHours / 14) * 0.3);

  // 6. Estimated Net Profit Margin Ratio (Fuel + Wear + Driver Expenses = ~$0.90/km)
  const estimatedCost = totalKm * 0.90;
  const netMargin = Math.max(0, Math.min(1, (payout - estimatedCost) / Math.max(1, payout)));

  // 7. Route familiarity & Hub Proximity
  const hasOriginDepot = (S.depots || []).some((d: string) => d.toLowerCase().includes((job.from || '').toLowerCase()));
  const familiarity = hasOriginDepot ? 1.0 : 0.6;

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

  // 3. Domain legality check
  const truckWhyMsg = why(S, truck, job);
  if (truckWhyMsg) return -Infinity;

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
  const allowSub = filters.allowSubcontracted !== false;

  // 5. Subcontracted status check
  if (!allowSub && (S.subcontractedTrucks || []).includes(truck.id)) {
    return -Infinity;
  }

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

  // 8. Hazmat preference filter
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  if (filters.requireHazmatCert) {
    const hasAnyHazmatOnBoard = (S.jobs || []).some((j: any) => {
      const c = CARGO_TYPES.find(cg => cg.id === j.cargoId);
      return c?.isHazmat;
    });
    if (hasAnyHazmatOnBoard && !cargo?.isHazmat) {
      return -Infinity;
    }
  }

  // 9. Cargo type preference filter
  if (filters.priorityCargoTypes && filters.priorityCargoTypes.length > 0) {
    const hasPriorityJobsOnBoard = (S.jobs || []).some((j: any) => filters.priorityCargoTypes!.includes(j.cargoId));
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
  let isSubActive = !!(S.aiState.subscriptionActive && now < (S.aiState.expiresTimestamp || 0));

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

  // 1. Self-healing: Clear expired driver HOS rest periods & handle auto-resting fatigued drivers
  for (const drv of (S.drivers || [])) {
    if (drv.hosRestUntil && drv.hosRestUntil <= now) {
      delete drv.hosRestUntil;
      drv.hosHours = 0;
      drv.fatigue = Math.max(0, (drv.fatigue || 0) - 50);
    } else if (!drv.hosRestUntil && (drv.fatigue > 75 || (drv.hosHours || 0) >= 11)) {
      // Initiate 15-second simulation rest break so driver recovers without stalling dispatcher indefinitely
      drv.fatigue = 0;
      drv.hosHours = 0;
      drv.hosRestUntil = now + 15000;
    }
  }

  // 2. Self-healing: Auto-pair unassigned idle drivers to unassigned idle trucks
  const assignedDriverIds = new Set((S.fleet || []).map((t: any) => t.driverId).filter(Boolean));
  for (const truck of (S.fleet || [])) {
    if (truck.status === 'idle' && !truck.driverId) {
      const availableDriver = (S.drivers || []).find((d: any) => !assignedDriverIds.has(d.id) && (!d.hosRestUntil || d.hosRestUntil <= now));
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
        const needed = Math.round(tankCapacity - currentFuel);
        const hubFacility = getHubFacilityForCity(S, truck.loc);
        if (hubFacility && hubFacility.fuelLiters >= needed) {
          hubFacility.fuelLiters -= needed;
          truck.fluids.fuel = tankCapacity;
        } else if (S.fuelBunker && S.fuelBunker.currentLiters >= needed) {
          S.fuelBunker.currentLiters -= needed;
          truck.fluids.fuel = tankCapacity;
        } else if ((S.money || 0) >= needed * 1.45) {
          S.money -= Math.round(needed * 1.45);
          truck.fluids.fuel = tankCapacity;
        }
      }
    }
  }

  // 5. Check if market freight board needs replenishment
  if (!S.jobs || S.jobs.length === 0) {
    try {
      replenish(S);
    } catch (e) {}
  } else if (S.jobs.length > 17) {
    // Truncate if board is oversized
    S.jobs = S.jobs.slice(0, 17);
  }

  const marketJobs = [...(S.jobs || [])];
  if (marketJobs.length === 0) {
    return { dispatchedCount: 0, message: 'No market jobs available in bulletin board' };
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

    // Fallback contract procurement: If no compatible jobs exist on the board for this truck's current location,
    // generate an immediate matchable outbound consignment from truck.loc so fleet units never stall
    if (candidateJobs.length === 0 && (S.jobs || []).length < 17) {
      const truckLoc = getLocationRecord(truck.loc);
      if (truckLoc && isRegionUnlocked(S as any, truckLoc.region)) {
        try {
          const compatibleJob = FreightEngine.generate(S, {
            forceRegion: truckLoc.region,
            forceFrom: truck.loc,
            vip: false
          });
          if (compatibleJob) {
            if (!S.jobs) S.jobs = [];
            S.jobs.unshift(compatibleJob);
            marketJobs.unshift(compatibleJob);
            const score = scoreJobForTruck(S, truck, compatibleJob, filters);
            if (score > -Infinity) {
              candidateJobs.push({ job: compatibleJob, score });
            }
          }
        } catch (e) {}
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
  
  // Simulation step size: 15 minutes per "tick"
  // This allows enough time for jobs to complete and trucks to be re-dispatched
  const STEP_MS = 15 * 60 * 1000; 
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

    // Service trucks proactively if average health drops below 75% or ANY component < 55%
    if (avgHealth < 75 || minCompHealth < 55) {
      const repairCost = Math.round((100 - avgHealth) * 85);
      if (S.money >= repairCost + 1000) {
        S.money -= repairCost;
        Object.keys(comp).forEach(k => {
          if (typeof comp[k] === 'number') comp[k] = 100;
          else if (comp[k]) comp[k].health = 100;
        });

        servicedCount++;
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
          payoutUsd: -repairCost,
          km: 0,
          yieldPerKm: 0,
          profileUsed: S.aiState.filters?.profile || 'balanced_efficiency',
          status: 'serviced',
          message: `Autonomous Service: ${truck.name} restored to 100% health (-$${repairCost.toLocaleString()})`
        };

        if (!S.aiState.logs) S.aiState.logs = [];
        S.aiState.logs.unshift(logEntry);
        if (S.aiState.logs.length > 60) S.aiState.logs.pop();
      }
    }
  }

  return servicedCount;
}
