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
  }
};
