import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { toast } from '../core/ui';

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
 * Initiates repair process in the Repair Bay.
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

  // Calculate total cost
  let totalCost = 0;
  selectedParts.forEach(part => {
    if (['oil', 'coolant', 'adBlue'].includes(part)) {
      totalCost += PART_BASE_PRICES[part] || 150;
    } else {
      const comp = truck.components[part];
      totalCost += getPartRepairCost(part, comp ? comp.health : 100);
    }
  });

  if (S.money < totalCost) {
    toast(`Insufficient funds. Need $${totalCost.toLocaleString()}`, 'err');
    return false;
  }

  const durationMs = calculateRepairDurationMs(truck, selectedParts);
  const now = Date.now();
  const endsAt = now + durationMs;

  // Deduct money
  S.money -= totalCost;

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
    start: now,
    end: endsAt
  });

  toast(`Truck sent to Repair Bay. Estimated time: ${Math.round(durationMs / 1000)}s`, 'success');
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
