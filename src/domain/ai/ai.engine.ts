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
import { why, replenish } from '../../systems/jobs';
import { distKm } from '../../systems/calc';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { getDispatchNeuralNetwork } from './neuralNetwork';
import { DispatchExecution } from '../dispatch/execution';
import { getCompanyProgression } from '../company/progression';
import { isRegionUnlocked } from '../logistics/network';
import { LOCATIONS } from '../../data/world';
import { TRUCK_MODELS } from '../trucks/trucks.data';
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

  // 2. Yield per km normalized (0..$30/km)
  const yieldNorm = Math.min(1, Math.max(0, (payout / km) / 30));

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

  // 6. Estimated Net Profit Margin Ratio
  const fuelLitersEst = totalKm * 0.40;
  const fuelCostEst = fuelLitersEst * 1.25;
  const netMargin = Math.max(0, Math.min(1, (payout - fuelCostEst) / Math.max(1, payout)));

  // 7. Route familiarity & Hub Proximity
  const hasOriginDepot = (S.depots || []).some((d: string) => d.toLowerCase().includes((job.from || '').toLowerCase()));
  const familiarity = hasOriginDepot ? 1.0 : 0.6;

  // 8. Reputation & Progression Potential
  const repScore = Math.min(1, (job.isAuctionWon ? 45 : 15) / 50 + (km / 3000) * 0.2);

  return [payoutNorm, yieldNorm, dhEfficiency, capacityNorm, driverReadiness, netMargin, familiarity, repScore];
}

/**
 * Score a candidate job for a specific truck based on neural inference and strategy profile.
 * Returns -Infinity if ineligible.
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
  if (locFrom && locTo && locFrom.region !== locTo.region) return -Infinity;

  const truckLoc = getLocationRecord(truck.loc);
  if (truckLoc && locFrom && truckLoc.region !== locFrom.region) return -Infinity;

  // 3. Domain legality check
  const truckWhyMsg = why(S, truck, job);
  if (truckWhyMsg) return -Infinity;

  const minPayout = filters.minPayoutUsd ?? 0;
  const minYpk = filters.minYieldUsdPerKm ?? 0;
  const maxDist = filters.maxDistanceKm ?? 50000;
  const minHealth = filters.minTruckHealthPct ?? 0;
  const allowSub = filters.allowSubcontracted !== false;

  // 4. Subcontracted status check
  if (!allowSub && (S.subcontractedTrucks || []).includes(truck.id)) {
    return -Infinity;
  }

  // 5. Truck health check
  if (minHealth > 0) {
    const comp = truck.components || {};
    const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
    const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
    if (avgHealth < minHealth) {
      return -Infinity;
    }
  }

  // 6. Job pay and distance filters
  const payout = job.pay || 0;
  const km = Math.max(1, job.km || 1);
  const yieldPerKm = payout / km;

  if (payout < minPayout) return -Infinity;
  if (yieldPerKm < minYpk) return -Infinity;
  if (km > maxDist) return -Infinity;

  // 7. Hazmat preference filter:
  // If hazmat jobs exist on the board, prioritize or filter; if none exist, don't stall the fleet
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

  // 8. Cargo type preference filter
  if (filters.priorityCargoTypes && filters.priorityCargoTypes.length > 0) {
    const hasPriorityJobsOnBoard = (S.jobs || []).some((j: any) => filters.priorityCargoTypes!.includes(j.cargoId));
    if (hasPriorityJobsOnBoard && !filters.priorityCargoTypes.includes(job.cargoId)) {
      return -Infinity;
    }
  }

  // 9. Deadhead transit distance
  const deadheadKm = distKm(truck.loc, job.from);

  // 10. Neural Network Inference
  const driver = (S.drivers || []).find((d: any) => d.id === truck.driverId);
  const featureVector = calculateDispatchFeatureVector(S, truck, job, driver);
  const net = getDispatchNeuralNetwork(S.aiState?.neuralWeights);
  const neuralScore = net.forward(featureVector);

  // 11. Score calculation blending neural intelligence with strategy profile
  let score = 0;
  switch (filters.profile) {
    case 'highest_payout':
      score = (payout * 2) + (neuralScore * 10000) - (deadheadKm * 2);
      break;
    case 'highest_yield_per_km':
      score = (yieldPerKm * 1500) + (neuralScore * 10000) - (deadheadKm * 2);
      break;
    case 'nearest_origin':
      score = (10000 - deadheadKm * 15) + (neuralScore * 5000) + (payout * 0.01);
      break;
    case 'shortest_distance':
      score = (10000 - km * 6) + (neuralScore * 5000) + (payout * 0.01);
      break;
    case 'balanced_efficiency':
    default:
      score = (yieldPerKm * 600) + (neuralScore * 12000) - (deadheadKm * 3) + (payout * 0.04);
      break;
  }

  // Bonus for hazmat cargo when certified
  if (cargo?.isHazmat && filters.requireHazmatCert) {
    score += 5000;
  }

  return score;
}

/**
 * Execute a single auto-dispatch tick across idle trucks and real market jobs.
 * MUST NOT generate fake jobs. Uses ONLY S.jobs.
 * Dispatches guaranteed whenever user is subscribed and idle units are matchable.
 */
export function runAiAutoDispatch(S: any): { dispatchedCount: number; message: string } {
  if (!S.aiState) return { dispatchedCount: 0, message: 'AI State uninitialized' };
  
  const now = Date.now();
  const isSubActive = !!(S.aiState.subscriptionActive && now < (S.aiState.expiresTimestamp || 0));
  if (!isSubActive) {
    return { dispatchedCount: 0, message: 'AI Subscription Inactive or Expired' };
  }

  const filters: AiFilterConfig = S.aiState.filters || { enabled: true };
  if (filters.enabled === false) {
    // If the engine is paused by the user, return paused status
    return { dispatchedCount: 0, message: 'Continuous Auto-Dispatch Engine is currently paused' };
  }

  // 1. Self-healing: Clear expired driver HOS rest periods
  for (const drv of (S.drivers || [])) {
    if (drv.hosRestUntil && drv.hosRestUntil <= now) {
      delete drv.hosRestUntil;
      drv.hosHours = 0;
      drv.fatigue = Math.max(0, (drv.fatigue || 0) - 50);
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

  // 3. Identify idle trucks with assigned drivers
  const idleTrucks = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.driverId);
  if (idleTrucks.length === 0) {
    return { dispatchedCount: 0, message: 'No idle trucks with drivers available' };
  }

  // 4. Check if market freight board needs replenishment
  if (!S.jobs || S.jobs.length === 0) {
    try {
      replenish(S);
    } catch (e) {}
  }

  const marketJobs = [...(S.jobs || [])];
  if (marketJobs.length === 0) {
    return { dispatchedCount: 0, message: 'No market jobs available in bulletin board' };
  }

  let dispatchedCount = 0;
  const dispatchedJobIds = new Set<number>();
  const net = getDispatchNeuralNetwork(S.aiState?.neuralWeights);

  for (const truck of idleTrucks) {
    let bestJob: any = null;
    let bestScore = -Infinity;

    for (const job of marketJobs) {
      if (dispatchedJobIds.has(job.id)) continue;
      const score = scoreJobForTruck(S, truck, job, filters);
      if (score > bestScore && score > -Infinity) {
        bestScore = score;
        bestJob = job;
      }
    }

    if (bestJob) {
      const cargo = CARGO_TYPES.find(c => c.id === bestJob.cargoId);
      const cargoName = cargo?.name || bestJob.cargo || 'Commercial Cargo';
      const payout = bestJob.pay || 0;
      const km = bestJob.km || 1;
      const yieldRate = Math.round((payout / Math.max(1, km)) * 100) / 100;
      const drv = (S.drivers || []).find((d: any) => d.id === truck.driverId);
      const features = calculateDispatchFeatureVector(S, truck, bestJob, drv);
      const neuralScore = net.forward(features);
      const confidencePct = Math.round(neuralScore * 100);

      // Execute dispatch directly on S
      const dispatchResult = DispatchExecution.takeJob(S, bestJob.id, truck.id, true);

      if (dispatchResult.success) {
        dispatchedJobIds.add(bestJob.id);
        dispatchedCount++;

        // Autonomous reinforcement learning: train the neural dispatch model
        net.train(features, 0.96, 0.04);
        S.aiState.neuralTrainingEpochs = (S.aiState.neuralTrainingEpochs || 24) + 1;

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
          message: `Matched ${truck.name} → ${cargoName} (${bestJob.from} → ${bestJob.to}) for $${payout.toLocaleString()} [Neural Score: ${confidencePct}% · $${yieldRate}/km]`
        };

        if (!S.aiState.logs) S.aiState.logs = [];
        S.aiState.logs.unshift(logEntry);
        if (S.aiState.logs.length > 60) S.aiState.logs.pop();

        S.aiState.totalDispatchedCount = (S.aiState.totalDispatchedCount || 0) + 1;
        S.aiState.totalRevenueGeneratedUsd = (S.aiState.totalRevenueGeneratedUsd || 0) + payout;
      } else {
        const failEntry: AiLogEntry = {
          id: `ai-fail-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
          status: 'failed',
          message: `Dispatch blocked for ${truck.name}: ${dispatchResult.reason || 'Eligibility check'}`
        };

        if (!S.aiState.logs) S.aiState.logs = [];
        S.aiState.logs.unshift(failEntry);
        if (S.aiState.logs.length > 60) S.aiState.logs.pop();
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
 */
export function processOfflineAiDispatch(S: any, offlineMs: number): { dispatches: number; revenue: number } {
  if (!S.aiState || !S.aiState.offlineDispatchActive) return { dispatches: 0, revenue: 0 };
  const now = Date.now();
  if (now >= S.aiState.offlineExpiresTimestamp) return { dispatches: 0, revenue: 0 };

  const offlineSeconds = Math.min(86400 * 2, Math.floor(offlineMs / 1000));
  if (offlineSeconds < 30) return { dispatches: 0, revenue: 0 };

  const simulatedTicks = Math.min(25, Math.floor(offlineSeconds / 20));
  let totalDispatches = 0;
  let totalRevenue = 0;

  for (let i = 0; i < simulatedTicks; i++) {
    const res = runAiAutoDispatch(S);
    if (res.dispatchedCount > 0) {
      totalDispatches += res.dispatchedCount;
    }
  }

  return { dispatches: totalDispatches, revenue: totalRevenue };
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
