import { Truck } from './trucks.types';
import { GameState } from '../../types/state';

export interface UpgradeOption {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export const GEARBOX_UPGRADES: Record<string, UpgradeOption> = {
  '12spd_highway': { id: '12spd_highway', name: '12-Speed Automated Highway Transmission', cost: 0, description: 'Direct drive for fuel-efficient cruising.' },
  '16spd_crawler': { id: '16spd_crawler', name: '16-Speed Heavy Crawler Transmission', cost: 12500, description: 'Heavy-duty crawler gears for high-GVW abnormal loads.' }
};

export const AXLE_RATIO_UPGRADES: Record<string, UpgradeOption> = {
  'highway_eco': { id: 'highway_eco', name: '2.64:1 Long-Haul Highway Eco Ratio', cost: 0, description: 'Optimized for high-speed efficiency.' },
  'heavy_diff_lock': { id: 'heavy_diff_lock', name: '3.42:1 Heavy Ratio with Inter-Axle Diff Lock', cost: 8500, description: 'Maximum traction for heavy haulage.' }
};

export const TIRE_UPGRADES: Record<string, UpgradeOption> = {
  'highway_eco': { id: 'highway_eco', name: 'Low Rolling Resistance Eco Highway Tires', cost: 4500, description: 'Class-A efficiency rating.' },
  'all_terrain_winter': { id: 'all_terrain_winter', name: 'All-Terrain Winter M+S Treads', cost: 6000, description: 'Superior grip in snow and off-road conditions.' }
};

/**
 * Authoritative vehicle upgrade logic.
 * Following Engineering Constitution Section 6.1 (Physical and Mechanical Models).
 */
export const ECO_TUNING_COST_PER_LEVEL = 4200;
export const PERFORMANCE_CHIP_COST_PER_LEVEL = 5500;
export const HEAVY_DUTY_SUSPENSION_COST = 7800;

export const VehicleUpgrades = {
  upgradeGearbox(state: GameState, truckId: number, gearboxId: string): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    
    const upgrade = GEARBOX_UPGRADES[gearboxId];
    if (!upgrade) return 'Invalid gearbox configuration';
    
    if (state.money < upgrade.cost) return `Insufficient funds ($${upgrade.cost.toLocaleString()})`;
    
    state.money -= upgrade.cost;
    if (!t.upgrades) t.upgrades = {} as any;
    t.upgrades.gearbox = gearboxId as any;
    
    return null;
  },

  upgradeAxle(state: GameState, truckId: number, ratioId: string): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    
    const upgrade = AXLE_RATIO_UPGRADES[ratioId];
    if (!upgrade) return 'Invalid axle configuration';
    
    if (state.money < upgrade.cost) return `Insufficient funds ($${upgrade.cost.toLocaleString()})`;
    
    state.money -= upgrade.cost;
    if (!t.upgrades) t.upgrades = {} as any;
    t.upgrades.axleRatio = ratioId as any;
    
    return null;
  },

  upgradeTires(state: GameState, truckId: number, compoundId: string): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    
    const upgrade = TIRE_UPGRADES[compoundId];
    if (!upgrade) return 'Invalid tire compound';
    
    if (state.money < upgrade.cost) return `Insufficient funds ($${upgrade.cost.toLocaleString()})`;
    
    state.money -= upgrade.cost;
    if (!t.upgrades) t.upgrades = {} as any;
    t.upgrades.tireCompound = compoundId as any;
    t.components.tires.health = 100; // Mounting new tires restores health
    
    return null;
  },

  upgradeEcoTuning(state: GameState, truckId: number): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    if (!t.upgrades) t.upgrades = {} as any;
    const current = Number(t.upgrades.ecoTuning) || 0;
    if (current >= 3) return 'Eco-Tuning ECU is already at max Level 3';
    const cost = ECO_TUNING_COST_PER_LEVEL * (current + 1);
    if (state.money < cost) return `Insufficient funds ($${cost.toLocaleString()})`;
    state.money -= cost;
    t.upgrades.ecoTuning = current + 1;
    return null;
  },

  upgradePerformanceChip(state: GameState, truckId: number): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    if (!t.upgrades) t.upgrades = {} as any;
    const current = Number(t.upgrades.performanceChip) || 0;
    if (current >= 3) return 'Performance Chip is already at max Level 3';
    const cost = PERFORMANCE_CHIP_COST_PER_LEVEL * (current + 1);
    if (state.money < cost) return `Insufficient funds ($${cost.toLocaleString()})`;
    state.money -= cost;
    t.upgrades.performanceChip = current + 1;
    return null;
  },

  upgradeHeavyDutySuspension(state: GameState, truckId: number): string | null {
    const t = state.fleet.find(x => x.id === truckId);
    if (!t) return 'Truck not found';
    if (!t.upgrades) t.upgrades = {} as any;
    if (t.upgrades.heavyDutySuspension) return 'Heavy-Duty Air-Ride Suspension already installed';
    if (state.money < HEAVY_DUTY_SUSPENSION_COST) return `Insufficient funds ($${HEAVY_DUTY_SUSPENSION_COST.toLocaleString()})`;
    state.money -= HEAVY_DUTY_SUSPENSION_COST;
    t.upgrades.heavyDutySuspension = true;
    if (t.components?.suspension) t.components.suspension.health = 100;
    return null;
  }
};
