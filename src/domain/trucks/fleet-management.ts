import { Truck, TrailerType } from './trucks.types';
import { GameState } from '../../types/state';
import { TRUCK_MODELS, TRAILER_PRICES } from './trucks.data';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

/**
 * Authoritative fleet management domain logic.
 * Following Engineering Constitution Section 6.1 and 6.3.
 */
export const FleetManagement = {
  /**
   * Assigns a driver to a truck and ensures bidirectional consistency.
   */
  assignDriver(state: GameState, truckId: number, driverId: number | null): string | null {
    const truck = state.fleet.find(t => t.id === truckId);
    if (!truck) return 'Truck not found';
    if (truck.status !== 'idle') return 'Truck is currently busy';

    if (driverId) {
      // Check if driver is assigned to another truck
      const otherTruck = state.fleet.find(t => t.driverId === driverId && t.id !== truckId);
      if (otherTruck) {
        if (otherTruck.status !== 'idle') return 'Driver is currently on a job with another vehicle';
        otherTruck.driverId = null;
      }
    }

    truck.driverId = driverId;

    // Sync assignedTruckId for UI/domain consistency
    state.drivers.forEach(d => {
      const assigned = state.fleet.find(tr => tr.driverId === d.id);
      d.assignedTruckId = assigned ? assigned.id : null;
    });

    return null;
  },

  /**
   * Handles trailer hitching/unhitching with chassis compatibility validation.
   */
  hitchTrailer(state: GameState, truckId: number, trailerType: TrailerType | null): string | null {
    const truck = state.fleet.find(t => t.id === truckId);
    if (!truck) return 'Truck not found';
    if (truck.status !== 'idle') return 'Cannot change configuration while unit is busy';

    const model = TRUCK_MODELS[truck.modelId];
    
    // Unhitching current trailer
    if (truck.trailer) {
      if (!state.trailers) (state as any).trailers = [];
      (state as any).trailers.push(truck.trailer);
      truck.trailer = null;
    }

    if (!trailerType) return null;

    // Hitching new trailer
    if (!model.haul.includes(trailerType)) {
      return `Chassis ${model.axle} is not certified to haul ${trailerType} trailers`;
    }

    const yardIndex = (state as any).trailers?.indexOf(trailerType);
    if (yardIndex === -1 || yardIndex === undefined) return 'Trailer not available in HQ Storage Yard';

    (state as any).trailers.splice(yardIndex, 1);
    truck.trailer = trailerType;

    return null;
  },

  /**
   * Authoritative calculation for repair costs.
   */
  calculateRepairCost(truck: Truck): number {
    let total = 0;
    Object.values(truck.components).forEach((c: any) => {
      total += (100 - (c.health ?? 100)) * 50;
    });
    return Math.round(total);
  }
};
