import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { toast } from '../core/ui';
import { pushNote } from './notify';

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
 * Calculates repair cost for a part based on its current health.
 * Lower health = higher cost proportional to base price.
 */
export function getPartRepairCost(partKey: string, health: number): number {
  const base = PART_BASE_PRICES[partKey] || 1000;
  if (health >= 100) return 0;
  const damageRatio = (100 - health) / 100;
  return Math.round(base * damageRatio);
}

/**
 * Calculates repair duration in milliseconds based on selected parts and their damage.
 */
export function calculateRepairDurationMs(truck: any, selectedParts: string[]): number {
  if (!selectedParts || selectedParts.length === 0) return 0;
  
  let totalMinutes = 0;
  selectedParts.forEach(part => {
    if (['oil', 'coolant', 'adBlue'].includes(part)) {
      totalMinutes += 1; // 1 minute for fluid top-up
      return;
    }
    const comp = truck.components[part];
    const damage = comp ? (100 - comp.health) : 50;
    
    switch (part) {
      case 'engine': totalMinutes += 10 + (damage / 5); break;
      case 'transmission': totalMinutes += 8 + (damage / 6); break;
      case 'suspension': totalMinutes += 6 + (damage / 8); break;
      case 'brakes':
      case 'tires': totalMinutes += 4 + (damage / 10); break;
      default: totalMinutes += 2; break;
    }
  });

  // Physical repair time: 1 in-game minute = 5 real seconds (1:12 time scale)
  return Math.max(10000, Math.round(totalMinutes * 5000));
}

/**
 * Calculates effective repair cost for a part, factoring in available warehouse stock.
 */
export function getPartEffectiveCost(S: any, truck: any, part: string): { cost: number; retailCost: number; fromInventory: boolean } {
  const stock = (S.partsInventory && S.partsInventory[part]) || 0;
  let retailCost = 0;

  if (['oil', 'coolant', 'adBlue'].includes(part)) {
    retailCost = PART_BASE_PRICES[part] || 150;
    if (stock > 0) {
      return { cost: 25, retailCost, fromInventory: true }; // Flat $25 labor fee
    }
    return { cost: retailCost, retailCost, fromInventory: false };
  }

  const comp = truck.components ? truck.components[part] : null;
  retailCost = getPartRepairCost(part, comp ? comp.health : 100);
  if (stock > 0) {
    const laborOnlyCost = Math.round(retailCost * 0.15); // 85% discount by supplying customer parts
    return { cost: laborOnlyCost, retailCost, fromInventory: true };
  }
  return { cost: retailCost, retailCost, fromInventory: false };
}

/**
 * Initiates repair process in the Repair Bay. Consumes available inventory parts from HQ Storage.
 */
export function startRepair(S: any, truckId: number, selectedParts: string[]): boolean {
  const truck = S.fleet.find((t: any) => t.id === truckId);
  if (!truck) {
    toast('Truck not found', 'err');
    return false;
  }
  if (truck.status === 'repair' || truck.status === 'busy') {
    toast('Truck is currently busy or already in repair bay', 'err');
    return false;
  }
  if (!selectedParts || selectedParts.length === 0) {
    toast('Select at least one part to repair or service', 'err');
    return false;
  }

  if (!S.partsInventory) S.partsInventory = {};

  // Calculate total cost and track inventory usage
  let totalCost = 0;
  let retailTotal = 0;
  const partsUsedFromStock: string[] = [];

  selectedParts.forEach(part => {
    const eff = getPartEffectiveCost(S, truck, part);
    totalCost += eff.cost;
    retailTotal += eff.retailCost;
    if (eff.fromInventory) {
      partsUsedFromStock.push(part);
      S.partsInventory[part] = Math.max(0, (S.partsInventory[part] || 1) - 1);
    }
  });

  if (S.money < totalCost) {
    // Roll back consumed inventory if insufficient funds
    partsUsedFromStock.forEach(part => {
      S.partsInventory[part] = (S.partsInventory[part] || 0) + 1;
    });
    toast(`Insufficient funds. Need $${totalCost.toLocaleString()}`, 'err');
    return false;
  }

  const durationMs = calculateRepairDurationMs(truck, selectedParts);
  const now = Date.now();
  const endsAt = now + durationMs;

  // Deduct money
  S.money -= totalCost;
  const savedAmount = Math.max(0, retailTotal - totalCost);

  pushNote(S, `Workshop Service: Unit #${truckId} (-$${totalCost.toLocaleString()})${savedAmount > 0 ? ` [Saved $${savedAmount.toLocaleString()} using warehouse stock]` : ''}`, {
    title: 'Financial Transaction',
    type: 'finance',
    body: `Service authorization for Unit: ${truck.name} (#${truckId})\nParts/Fluids: ${selectedParts.join(', ')}\nParts from Inventory: ${partsUsedFromStock.length > 0 ? partsUsedFromStock.join(', ') : 'None'}\nAmount Paid: $${totalCost.toLocaleString()}\nSavings: $${savedAmount.toLocaleString()}\nStatus: Maintenance in Progress`
  });

  // Set truck status to repair
  truck.status = 'repair';

  // Add to repair queue
  S.repairs = S.repairs || [];
  S.repairs.push({
    id: S.nextId++,
    truckId: truck.id,
    truckName: truck.name,
    parts: selectedParts,
    cost: totalCost,
    saved: savedAmount,
    start: now,
    end: endsAt
  });

  const savingsMsg = savedAmount > 0 ? ` (Saved $${savedAmount.toLocaleString()} using inventory!)` : '';
  toast(`Truck sent to Repair Bay. Estimated time: ${Math.round(durationMs / 1000)}s${savingsMsg}`, 'success');
  return true;
}

/**
 * Checks and completes finished repairs during game tick.
 */
export function completeRepairs(S: any, now: number): number {
  if (!S.repairs || S.repairs.length === 0) return 0;
  
  const remaining: any[] = [];
  let completedCount = 0;
  S.repairs.forEach((rep: any) => {
    if (now >= rep.end) {
      completedCount++;
      // Complete repair
      const truck = S.fleet.find((t: any) => t.id === rep.truckId);
      if (truck) {
        truck.status = 'idle';
        rep.parts.forEach((part: string) => {
          if (part === 'oil') {
            const model = TRUCK_MODELS[truck.modelId];
            truck.fluids.oil = model?.oilCapacity || 40;
          } else if (part === 'coolant') {
            truck.fluids.coolant = 100;
          } else if (part === 'adBlue') {
            truck.fluids.adBlue = 100;
          } else if (truck.components[part]) {
            truck.components[part].health = 100;
          }
        });
        toast(`Repair Bay completed service on ${truck.name}!`, 'success');
      }
    } else {
      remaining.push(rep);
    }
  });
  S.repairs = remaining;
  return completedCount;
}
