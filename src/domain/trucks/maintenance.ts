import { Truck } from './trucks.types';
import { GameState } from '../../types/state';
import { pushNote } from '../../systems/notify';

export const CONSUMABLES_SERVICE_COST = 450;

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

/**
 * Authoritative vehicle maintenance and repair logic.
 * Following Engineering Constitution Section 6.1.
 */
export const VehicleMaintenance = {
  /**
   * Performs a comprehensive consumables top-up service.
   */
  serviceConsumables(state: GameState, truckId: number): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    
    if (state.money < CONSUMABLES_SERVICE_COST) {
      return `Insufficient funds for consumables service ($${CONSUMABLES_SERVICE_COST})`;
    }
    
    state.money -= CONSUMABLES_SERVICE_COST;
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
   * Calculates repair duration in milliseconds.
   */
  calculateRepairDurationMs(truck: Truck, selectedParts: string[]): number {
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

    // 1:12 time scale: 1 in-game minute = 5 real seconds
    return Math.max(10000, Math.round(totalMinutes * 5000));
  },

  /**
   * Calculates effective repair cost factoring in warehouse stock.
   */
  getPartEffectiveCost(state: GameState, truck: Truck, part: string): { cost: number; retailCost: number; fromInventory: boolean } {
    const stock = (state as any).partsInventory?.[part] || 0;
    let retailCost = 0;

    if (['oil', 'coolant', 'adBlue'].includes(part)) {
      retailCost = PART_BASE_PRICES[part] || 150;
      if (stock > 0) return { cost: 25, retailCost, fromInventory: true };
      return { cost: retailCost, retailCost, fromInventory: false };
    }

    const comp = (truck.components as any)[part];
    const health = typeof comp === 'number' ? comp : comp?.health ?? 100;
    retailCost = this.getPartRepairCost(part, health);
    
    if (stock > 0) {
      const laborOnlyCost = Math.round(retailCost * 0.15);
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
      // Rollback stock
      partsUsedFromStock.forEach(part => { S.partsInventory[part] = (S.partsInventory[part] || 0) + 1; });
      return `Insufficient funds ($${totalCost.toLocaleString()})`;
    }

    const durationMs = this.calculateRepairDurationMs(truck, selectedParts);
    const now = Date.now();
    const isScheduled = truck.status === 'busy';

    state.money -= totalCost;
    const savedAmount = Math.max(0, retailTotal - totalCost);

    pushNote(S, `Workshop Service: Unit #${truckId} (-$${totalCost.toLocaleString()})`, {
      title: 'FINANCIAL TRANSACTION',
      type: 'finance',
      body: `Service authorization for: ${truck.name} (#${truckId})\nParts/Fluids: ${selectedParts.join(', ')}\nPaid: $${totalCost.toLocaleString()}\nSavings: $${savedAmount.toLocaleString()}\nStatus: ${isScheduled ? 'Scheduled' : 'In Progress'}`
    });

    if (!S.repairs) S.repairs = [];
    S.repairs.push({
      id: S.nextId++,
      truckId: truck.id,
      truckName: truck.name,
      parts: selectedParts,
      cost: totalCost,
      saved: savedAmount,
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
      rep.end = now + rep.durationMs;
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
    
    const finished = S.repairs.filter((r: any) => !r.scheduled && r.end <= now);
    if (finished.length === 0) return 0;

    S.repairs = S.repairs.filter((r: any) => r.scheduled || r.end > now);

    for (const rep of finished) {
      const truck = state.fleet.find(t => t.id === rep.truckId);
      if (truck) {
        truck.status = 'idle';
        rep.parts.forEach((part: string) => {
          if (['oil', 'coolant', 'adBlue'].includes(part)) {
            (truck.fluids as any)[part] = 100;
          } else {
            const comp = (truck.components as any)[part];
            if (comp) comp.health = 100;
          }
        });
        pushNote(S, `Workshop service completed for Unit #${truck.id} (${truck.name}).`, { title: 'SERVICE COMPLETED', type: 'ops' });
      }
    }

    return finished.length;
  }
};
