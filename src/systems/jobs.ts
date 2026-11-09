import { set } from '../core/store';
import { toast } from '../core/ui';
import { FreightEngine } from '../domain/freight/engine/generator';
import { BiddingEngine } from '../domain/freight/bids/engine';
import { getDispatchEligibilityError } from '../domain/dispatch/validation';
import { DispatchActions } from '../domain/dispatch/actions';
import { DispatchExecution } from '../domain/dispatch/execution';
import { OperatingCosts } from '../domain/economy/operating-costs';
import { EconomySimulation } from '../domain/economy/simulation';
import { GameState } from '../types/state';
import { Truck } from '../domain/trucks/trucks.types';
import { distKm } from './calc';
import { LOCATIONS } from '../data/world';
import { isRegionUnlocked } from '../domain/logistics/network';

/**
 * NexHaul Logistics - Jobs Application Service
 * Coordinates dispatch, economy, and freight operations.
 * 
 * Following Engineering Constitution Section 3.3, this application service
 * coordinates operations but DOES NOT duplicate domain calculations.
 */

export const fuelCost = (job: { km: number, weight: number }, truck?: Truck) => 
  OperatingCosts.calculateFuelCost(job.km, job.weight, truck);

export const replenish = (S: GameState) => FreightEngine.replenish(S);
export const makeJob = (S: GameState, vip = false) => FreightEngine.generate(S, { vip });

export const recallTruck = (S: GameState, truckId: number) => 
  DispatchActions.recallTruck(S, truckId);

export const placeBid = (auctionId: number, amount: number) => {
  set((S: GameState) => {
    const success = BiddingEngine.placePlayerBid(S as any, auctionId, amount);
    if (success) {
      toast(`Tender Submitted: $${amount.toLocaleString()}`, 'success');
    } else {
      toast('Invalid bid (must undercut current lowest tender or auction closed)', 'err');
    }
  });
};

export const why = (S: GameState, t: Truck, j: any) => {
  const driver = S.drivers.find(d => d.id === t.driverId);
  return getDispatchEligibilityError(S, t, j, driver);
};

export const findTruck = (S: GameState, j: any) => 
  S.fleet.filter((t: Truck) => !why(S, t, j))
    .sort((a, b) => distKm(a.loc, j.from) - distKm(b.loc, j.from))[0];

export function blocker(S: GameState, j: any) {
  const locFrom = LOCATIONS[j.from];
  const locTo = LOCATIONS[j.to];
  if (locFrom && !isRegionUnlocked(S as any, locFrom.region)) return `Origin region (${locFrom.region}) locked.`;
  if (locTo && !isRegionUnlocked(S as any, locTo.region)) return `Destination region (${locTo.region}) locked.`;

  const trucksInRegion = (S.fleet || []).filter((t: Truck) => LOCATIONS[t.loc]?.region === locFrom?.region);
  if (trucksInRegion.length === 0) {
    return `No tractors stationed in ${locFrom?.region || 'region'} (Cross-continental deadhead prohibited).`;
  }

  if (!findTruck(S, j)) return 'No eligible idle truck in region with required trailer/endorsements.';
  return null;
}

export const takeJob = (id: number, truckId?: number) => 
  set((S: GameState) => DispatchExecution.takeJob(S, id, truckId));

export const completeJobs = (S: GameState, now: number) => 
  DispatchExecution.completeJobs(S, now);

export const processEconomics = (S: GameState, now: number) => 
  EconomySimulation.processTick(S, now);
