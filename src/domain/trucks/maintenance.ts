import { Truck } from './trucks.types';
import { GameState } from '../../types/state';
import { pushNote } from '../../systems/notify';
import { REGIONAL_HUBS } from '../logistics/network';
import { TRUCK_MODELS } from './trucks.data';
import { recordTransaction } from '../../core/ledger';

export const CONSUMABLES_SERVICE_COST = 450;
export const THIRD_PARTY_REPAIR_SURCHARGE = 1.40; // +40% mobile mechanic / outside dealer markup
export const THIRD_PARTY_DURATION_MULT = 1.25;

export const PART_BASE_PRICES: Record<string, number> = {
  engine: 15000,
  transmission: 8000,
  brakes: 3500,
  tires: 2500,
  windshield: 1200,
  oilFilter: 400,
  fuelFilter: 500,
  airFilter: 350,
  suspension: 5000,
  oil: 150,
  coolant: 100,
  adBlue: 200
};

export interface RepairFacilityInfo {
  city: string;
  atOwnedHub: boolean;
  hubId: string | null;
  workshopLevel: number;
  costMultiplier: number;
  durationMultiplier: number;
  canUseInventory: boolean;
  label: string;
}

/**
 * Authoritative vehicle maintenance and repair logic.
 * Following Engineering Constitution Section 6.1.
 */
export const VehicleMaintenance = {
  /**
   * Resolves whether a truck will be serviced at an owned hub workshop
   * or at a 3rd-party regional dealer (+40% surcharge, no HQ inventory access).
   */
  getRepairFacilityInfo(state: GameState, truck: Truck): RepairFacilityInfo {
    const city = (truck.status === 'busy' && (truck as any).activeJob?.to)
      ? String((truck as any).activeJob.to)
      : String(truck.loc || 'LAGOS');

    const depots = (state as any)?.depots;
    if (!Array.isArray(depots)) {
      return {
        city,
        atOwnedHub: true,
        hubId: null,
        workshopLevel: 1,
        costMultiplier: 1.0,
        durationMultiplier: 1.0,
        canUseInventory: true,
        label: `Owned Hub Workshop (${city})`
      };
    }

    const hub = REGIONAL_HUBS.find(h => h.city.toUpperCase() === city.toUpperCase());
    const atOwnedHub = Boolean(hub && depots.includes(hub.id));

    if (atOwnedHub && hub) {
      const workshopLevel = Number((state as any).hubFacilities?.[hub.id]?.workshopLevel || 1);
      const upgraded = workshopLevel >= 2;
      return {
        city,
        atOwnedHub: true,
        hubId: hub.id,
        workshopLevel,
        costMultiplier: upgraded ? 0.90 : 1.0,
        durationMultiplier: upgraded ? 0.85 : 1.0,
        canUseInventory: true,
        label: upgraded
          ? `Upgraded Hub Workshop (${city}, -10% Cost)`
          : `Owned Hub Workshop (${city})`
      };
    }

    return {
      city,
      atOwnedHub: false,
      hubId: null,
      workshopLevel: 0,
      costMultiplier: THIRD_PARTY_REPAIR_SURCHARGE,
      durationMultiplier: THIRD_PARTY_DURATION_MULT,
      canUseInventory: false,
      label: `3rd-Party Dealer (${city}, +40% Surcharge)`
    };
  },

  /**
   * Performs a comprehensive consumables top-up service.
   */
  serviceConsumables(state: GameState, truckId: number): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';

    const facility = this.getRepairFacilityInfo(state, t);
    const cost = Math.round(CONSUMABLES_SERVICE_COST * facility.costMultiplier);

    if (state.money < cost) {
      return `Insufficient funds for consumables service ($${cost})`;
    }

    recordTransaction(state as any, 'expense_maintenance', -cost, `Consumables service: ${t.name} (${facility.city})`);
    if ((state as any).dailyStats) {
      (state as any).dailyStats.maintenance = ((state as any).dailyStats.maintenance || 0) + cost;
    }
    const model = TRUCK_MODELS[t.modelId];
    t.fluids.oil = model?.oilCapacity || 40;
    t.fluids.adBlue = 100;
    t.fluids.coolant = 100;
    if (t.fluids.transmissionOil !== undefined) {
      t.fluids.transmissionOil = 100;
    }

    return null;
  },

  /**
   * Calculates repair cost for a part based on its current health.
   */
  getPartRepairCost(partKey: string, health: number): number {
    const base = PART_BASE_PRICES[partKey] || 1000;
    if (health >= 100) return 0;
    const damageRatio = (100 - health) / 100;
    return Math.round(base * damageRatio);
  },

  /**
   * Calculates repair duration in milliseconds, adjusted for hub vs. 3rd-party workshop.
   */
  calculateRepairDurationMs(truck: Truck, selectedParts: string[], state?: GameState): number {
    if (!selectedParts || selectedParts.length === 0) return 0;

    let totalMinutes = 0;
    selectedParts.forEach(part => {
      if (['oil', 'coolant', 'adBlue'].includes(part)) {
        totalMinutes += 1;
        return;
      }
      const comp = (truck.components as any)[part];
      const health = typeof comp === 'number' ? comp : comp?.health ?? 100;
      const damage = 100 - health;

      switch (part) {
        case 'engine': totalMinutes += 10 + (damage / 5); break;
        case 'transmission': totalMinutes += 8 + (damage / 6); break;
        case 'suspension': totalMinutes += 6 + (damage / 8); break;
        case 'brakes':
        case 'tires': totalMinutes += 4 + (damage / 10); break;
        default: totalMinutes += 2; break;
      }
    });

    const mult = state ? this.getRepairFacilityInfo(state, truck).durationMultiplier : 1.0;
    // 1:24 time scale: 1 in-game minute = 2.5 real seconds
    return Math.max(10000, Math.round(totalMinutes * 2500 * mult));
  },

  /**
   * Calculates effective repair cost factoring in workshop location and warehouse stock.
   */
  getPartEffectiveCost(state: GameState, truck: Truck, part: string): { cost: number; retailCost: number; fromInventory: boolean } {
    const facility = this.getRepairFacilityInfo(state, truck);
    const stock = facility.canUseInventory ? ((state as any).partsInventory?.[part] || 0) : 0;
    let retailCost = 0;

    if (['oil', 'coolant', 'adBlue'].includes(part)) {
      retailCost = Math.round((PART_BASE_PRICES[part] || 150) * facility.costMultiplier);
      if (stock > 0) return { cost: 25, retailCost, fromInventory: true };
      return { cost: retailCost, retailCost, fromInventory: false };
    }

    const comp = (truck.components as any)[part];
    const health = typeof comp === 'number' ? comp : comp?.health ?? 100;
    const basePartCost = this.getPartRepairCost(part, health);
    retailCost = Math.round(basePartCost * facility.costMultiplier);

    if (stock > 0) {
      const laborOnlyCost = Math.round(basePartCost * 0.15);
      return { cost: laborOnlyCost, retailCost, fromInventory: true };
    }
    return { cost: retailCost, retailCost, fromInventory: false };
  },

  /**
   * Authoritative start of a repair process.
   */
  startRepair(state: GameState, truckId: number, selectedParts: string[]): string | null {
    const truck = state.fleet.find(t => t.id === truckId);
    if (!truck) return 'Truck not found';

    const S = state as any;
    if (S.repairs?.some((r: any) => r.truckId === truckId)) {
      return `Truck #${truckId} already has an active service in the queue.`;
    }
    if (truck.status === 'repair') return 'Truck is already undergoing maintenance.';
    if (!selectedParts || selectedParts.length === 0) return 'Select at least one part to service.';

    if (!S.partsInventory) S.partsInventory = {};

    const facility = this.getRepairFacilityInfo(state, truck);
    let totalCost = 0;
    let retailTotal = 0;
    const partsUsedFromStock: string[] = [];

    selectedParts.forEach(part => {
      const eff = this.getPartEffectiveCost(state, truck, part);
      totalCost += eff.cost;
      retailTotal += eff.retailCost;
      if (eff.fromInventory) {
        partsUsedFromStock.push(part);
        S.partsInventory[part] = Math.max(0, S.partsInventory[part] - 1);
      }
    });

    if (state.money < totalCost) {
      partsUsedFromStock.forEach(part => { S.partsInventory[part] = (S.partsInventory[part] || 0) + 1; });
      return `Insufficient funds ($${totalCost.toLocaleString()})`;
    }

    const durationMs = this.calculateRepairDurationMs(truck, selectedParts, state);
    const now = Date.now();
    const isScheduled = truck.status === 'busy';

    recordTransaction(S, 'expense_maintenance', -totalCost, `${facility.label}: Unit #${truckId}`);
    if (S.dailyStats) {
      S.dailyStats.maintenance = (S.dailyStats.maintenance || 0) + totalCost;
    }
    const savedAmount = Math.max(0, retailTotal - totalCost);

    pushNote(S, `${facility.label}: Unit #${truckId} (-$${totalCost.toLocaleString()})`, {
      title: 'FINANCIAL TRANSACTION',
      type: 'finance',
      body: `Service authorization for: ${truck.name} (#${truckId})\nFacility: ${facility.label}\nParts/Fluids: ${selectedParts.join(', ')}\nPaid: $${totalCost.toLocaleString()}\nSavings: $${savedAmount.toLocaleString()}\nStatus: ${isScheduled ? 'Scheduled' : 'In Progress'}`
    });

    if (!S.repairs) S.repairs = [];
    S.repairs.push({
      id: S.nextId++,
      truckId: truck.id,
      truckName: truck.name,
      parts: selectedParts,
      cost: totalCost,
      saved: savedAmount,
      facility: facility.label,
      start: isScheduled ? 0 : now,
      end: isScheduled ? 0 : now + durationMs,
      scheduled: isScheduled,
      durationMs
    });

    if (!isScheduled) truck.status = 'repair';

    return null;
  },

  /**
   * Transitions a scheduled repair to active status.
   */
  processArrival(state: GameState, truckId: number): void {
    const S = state as any;
    if (!S.repairs) return;
    const rep = S.repairs.find((r: any) => r.truckId === truckId && r.scheduled);
    if (rep) {
      const now = Date.now();
      rep.scheduled = false;
      rep.start = now;
      rep.end = now + (rep.durationMs || 10000);
      const truck = state.fleet.find(t => t.id === truckId);
      if (truck) truck.status = 'repair';
    }
  },

  /**
   * Finalizes completed repairs during tick.
   */
  completeRepairs(state: GameState, now: number): number {
    const S = state as any;
    if (!S.repairs || S.repairs.length === 0) return 0;

    const remaining: any[] = [];
    let completedCount = 0;

    for (const rep of S.repairs) {
      if (rep.scheduled) {
        const truck = state.fleet.find(t => t.id === rep.truckId);
        if (truck && truck.status !== 'busy') {
          rep.scheduled = false;
          rep.start = now;
          rep.end = now + (rep.durationMs || 10000);
          truck.status = 'repair';
        }
        remaining.push(rep);
        continue;
      }

      if (now >= rep.end) {
        completedCount++;
        const truck = state.fleet.find(t => t.id === rep.truckId);
        if (truck) {
          truck.status = 'idle';
          const model = TRUCK_MODELS[truck.modelId];
          rep.parts.forEach((part: string) => {
            if (part === 'oil') {
              truck.fluids.oil = model?.oilCapacity || 40;
            } else if (part === 'coolant') {
              truck.fluids.coolant = 100;
            } else if (part === 'adBlue') {
              truck.fluids.adBlue = 100;
            } else if (part === 'transmission') {
              const comp = (truck.components as any).transmission;
              if (comp) comp.health = 100;
              if (truck.fluids) truck.fluids.transmissionOil = 100;
            } else {
              const comp = (truck.components as any)[part];
              if (comp) comp.health = 100;
            }
          });
          pushNote(S, `Workshop service completed for Unit #${truck.id} (${truck.name}).`, {
            title: 'SERVICE COMPLETED',
            type: 'ops'
          });
        }
      } else {
        remaining.push(rep);
      }
    }

    S.repairs = remaining;
    return completedCount;
  }
};
