import { Driver, Region } from './drivers.types';
import { GameState } from '../../types/state';

export const HIRE_FEE_MULTIPLIER = 1500;
export const REGIONAL_TRANSFER_FEE = 5000;
export const MAX_SKILL_LEVEL = 5;

/**
 * Authoritative driver management domain logic.
 * Following Engineering Constitution Section 6.2 (Driver Simulation).
 */
export const DriverManagement = {
  /**
   * Calculates the one-time acquisition fee for a driver.
   */
  calculateHireFee(driver: Driver): number {
    return driver.skill * HIRE_FEE_MULTIPLIER;
  },

  /**
   * Transfers a driver to a different regional operating base.
   */
  transferRegion(state: GameState, driverId: number, newRegion: Region): string | null {
    const d = state.drivers.find(x => x.id === driverId);
    if (!d) return 'Driver not found';
    if (d.region === newRegion) return `Driver is already based in ${newRegion}`;
    
    if (state.money < REGIONAL_TRANSFER_FEE) {
      return `Insufficient funds for regional transfer ($${REGIONAL_TRANSFER_FEE.toLocaleString()})`;
    }

    const t = state.fleet.find(x => x.driverId === d.id);
    if (t && t.status === 'busy') {
      return 'Cannot transfer driver while on an active job';
    }

    state.money -= REGIONAL_TRANSFER_FEE;
    d.region = newRegion;
    return null;
  },

  /**
   * Calculates the cost to upgrade a driver's skill level.
   */
  calculateSkillUpgradeCost(currentSkill: number): number {
    return Math.min(15000, currentSkill * 3000);
  },

  /**
   * Promotes a driver through the Master CDL Academy.
   */
  upgradeSkill(state: GameState, driverId: number): string | null {
    const d = state.drivers.find(x => x.id === driverId);
    if (!d) return 'Driver not found';
    if (d.skill >= MAX_SKILL_LEVEL) return 'Driver is already at maximum Master CDL skill (5 Stars)';

    const cost = this.calculateSkillUpgradeCost(d.skill);
    if (state.money < cost) return `Insufficient funds ($${cost.toLocaleString()})`;

    state.money -= cost;
    d.skill++;
    d.salary = Math.round((d.salary || 250) * 1.15);
    d.morale = 100;
    
    return null;
  }
};
