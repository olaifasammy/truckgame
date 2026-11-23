import { toast } from '../core/ui';
import { PART_BASE_PRICES, VehicleMaintenance } from '../domain/trucks/maintenance';

export { PART_BASE_PRICES };

export function getPartRepairCost(partKey: string, health: number): number {
  return VehicleMaintenance.getPartRepairCost(partKey, health);
}

export function calculateRepairDurationMs(truck: any, selectedParts: string[], S?: any): number {
  return VehicleMaintenance.calculateRepairDurationMs(truck, selectedParts, S);
}

export function getPartEffectiveCost(S: any, truck: any, part: string): { cost: number; retailCost: number; fromInventory: boolean } {
  return VehicleMaintenance.getPartEffectiveCost(S, truck, part);
}

export function startRepair(S: any, truckId: number, selectedParts: string[]): boolean {
  const err = VehicleMaintenance.startRepair(S, truckId, selectedParts);
  if (err) {
    toast(err, 'err');
    return false;
  }
  const truck = S.fleet.find((t: any) => t.id === truckId);
  const rep = S.repairs?.find((r: any) => r.truckId === truckId);
  const isScheduled = rep?.scheduled;
  const savedAmount = rep?.saved || 0;
  const savingsMsg = savedAmount > 0 ? ` (Saved $${savedAmount.toLocaleString()} using inventory!)` : '';
  const statusMsg = isScheduled
    ? `Pre-paid & scheduled workshop service for Unit #${truckId}! Hoist will start immediately upon arrival at ${truck?.loc || 'hub'}.`
    : `Truck placed on Hydraulic Lift Bay! Estimated service time: ${Math.round((rep?.durationMs || 10000) / 1000)}s`;
  toast(`${statusMsg}${savingsMsg}`, 'success');
  return true;
}

export function processScheduledRepair(S: any, truckId: number) {
  VehicleMaintenance.processArrival(S, truckId);
}

export function completeRepairs(S: any, now: number): number {
  return VehicleMaintenance.completeRepairs(S, now);
}
