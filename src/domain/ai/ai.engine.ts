/**
 * AI Dispatch & Fleet Automation Engine
 * Real-time job matching, fleet health inspection, and dispatch execution.
 * 
 * STRICT DOMAIN RULE: The AI Engine evaluates ONLY real, existing market jobs from state.jobs.
 * It NEVER invents, hallucinates, or synthetically creates jobs on its own.
 */

import { AiFilterConfig, AiDispatchProfile, AiLogEntry } from './ai.types';
import { blocker, why, findTruck, takeJob } from '../../systems/jobs';
import { distKm } from '../../systems/calc';
import { CARGO_TYPES } from '../freight/cargo/registry';

/**
 * Score a candidate job for a specific truck based on active filter criteria.
 * Returns -Infinity if ineligible.
 */
export function scoreJobForTruck(S: any, truck: any, job: any, filters: AiFilterConfig): number {
  // 1. Domain legality check - job level blocker
  const jobBlockerMsg = blocker(S, job);
  if (jobBlockerMsg) return -Infinity;

  // 2. Domain legality check - truck level suitability
  const truckWhyMsg = why(S, truck, job);
  if (truckWhyMsg) return -Infinity;

  const minPayout = filters.minPayoutUsd ?? 0;
  const minYpk = filters.minYieldUsdPerKm ?? 0;
  const maxDist = filters.maxDistanceKm ?? 25000;
  const minHealth = filters.minTruckHealthPct ?? 0;
  const allowSub = filters.allowSubcontracted !== false; // true by default

  // 3. Subcontracted status check
  if (!allowSub && (S.subcontractedTrucks || []).includes(truck.id)) {
    return -Infinity;
  }

  // 4. Truck health check
  if (minHealth > 0) {
    const comp = truck.components || {};
    const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
    const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
    if (avgHealth < minHealth) {
      return -Infinity;
    }
  }

  // 5. Job pay and distance filters
  const payout = job.pay || 0;
  const km = Math.max(1, job.km || 1);
  const yieldPerKm = payout / km;

  if (payout < minPayout) return -Infinity;
  if (yieldPerKm < minYpk) return -Infinity;
  if (km > maxDist) return -Infinity;

  // 6. Hazmat preference filter
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  if (filters.requireHazmatCert && !cargo?.isHazmat) {
    return -Infinity;
  }

  // 7. Cargo type preference filter
  if (filters.priorityCargoTypes && filters.priorityCargoTypes.length > 0) {
    if (!filters.priorityCargoTypes.includes(job.cargoId)) {
      return -Infinity;
    }
  }

  // 8. Distance to origin (deadhead)
  const deadheadKm = distKm(truck.loc, job.from);

  // 9. Score calculation according to strategy profile
  switch (filters.profile) {
    case 'highest_payout':
      return payout * 10 - deadheadKm * 2;
    case 'highest_yield_per_km':
      return yieldPerKm * 1000 - deadheadKm * 2;
    case 'nearest_origin':
      return 10000 - deadheadKm * 10 + payout * 0.01;
    case 'shortest_distance':
      return 10000 - km * 5 + payout * 0.01;
    case 'balanced_efficiency':
    default:
      return (yieldPerKm * 500) + (payout * 0.05) - (deadheadKm * 3);
  }
}

/**
 * Execute a single auto-dispatch tick across idle trucks and real market jobs.
 * MUST NOT generate fake jobs. Uses ONLY S.jobs.
 */
export function runAiAutoDispatch(S: any): { dispatchedCount: number; message: string } {
  if (!S.aiState) return { dispatchedCount: 0, message: 'AI State uninitialized' };
  
  const now = Date.now();
  const isSubActive = S.aiState.subscriptionActive && now < S.aiState.expiresTimestamp;
  if (!isSubActive) {
    return { dispatchedCount: 0, message: 'AI Subscription Inactive or Expired' };
  }

  const filters: AiFilterConfig = S.aiState.filters || {};
  if (!filters.enabled) {
    return { dispatchedCount: 0, message: 'AI Auto-Dispatch Engine Paused' };
  }

  // Identify idle trucks with assigned drivers
  const idleTrucks = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.driverId);
  if (idleTrucks.length === 0) {
    return { dispatchedCount: 0, message: 'No idle trucks with drivers available' };
  }

  // Get REAL market jobs from S.jobs and won auctions
  const marketJobs = [...(S.jobs || [])];
  if (marketJobs.length === 0) {
    return { dispatchedCount: 0, message: 'No market jobs available in bulletin board' };
  }

  let dispatchedCount = 0;
  const dispatchedJobIds = new Set<number>();

  for (const truck of idleTrucks) {
    // Find best job from real market jobs that has not been claimed this cycle
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

      // Dispatch real job using authoritative takeJob system
      takeJob(bestJob.id, truck.id);
      dispatchedJobIds.add(bestJob.id);
      dispatchedCount++;

      // Log dispatch action
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
        message: `Matched ${truck.name} → ${cargoName} (${bestJob.from} to ${bestJob.to}) for $${payout.toLocaleString()}`
      };

      if (!S.aiState.logs) S.aiState.logs = [];
      S.aiState.logs.unshift(logEntry);
      if (S.aiState.logs.length > 50) S.aiState.logs.pop();

      S.aiState.totalDispatchedCount = (S.aiState.totalDispatchedCount || 0) + 1;
      S.aiState.totalRevenueGeneratedUsd = (S.aiState.totalRevenueGeneratedUsd || 0) + payout;
    }
  }

  const msg = dispatchedCount > 0
    ? `Successfully auto-dispatched ${dispatchedCount} unit${dispatchedCount > 1 ? 's' : ''}`
    : 'No eligible market jobs matched current fleet filters';

  return { dispatchedCount, message: msg };
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

    // Service trucks if average health drops below 60% and money is available
    if (avgHealth < 60) {
      const repairCost = Math.round((100 - avgHealth) * 85);
      if (S.money >= repairCost + 5000) { // Keep safety margin of $5,000
        S.money -= repairCost;
        // Restore components to 100%
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
        if (S.aiState.logs.length > 50) S.aiState.logs.pop();
      }
    }
  }

  return servicedCount;
}
