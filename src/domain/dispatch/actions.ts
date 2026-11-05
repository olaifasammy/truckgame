import { ActiveJob } from '../jobs/jobs.types';
import { Truck } from '../trucks/trucks.types';
import { pushNote } from '../../systems/notify';

/**
 * Handles administrative and operational dispatch actions.
 */
export const DispatchActions = {
  /**
   * Recalls a truck from its current transit, cancelling the active job.
   * 
   * Following Rule 6.4, this preserves the state of the vehicle 
   * while clearing the dispatch assignment.
   */
  recallTruck(state: { active: ActiveJob[], fleet: Truck[] }, truckId: number): void {
    const activeJobIndex = state.active.findIndex(a => a.truck === truckId);
    if (activeJobIndex === -1) return;
    
    const job = state.active[activeJobIndex];
    const truck = state.fleet.find(t => t.id === truckId);
    
    if (truck) {
      truck.status = 'idle';
      pushNote(state, `Unit #${truckId} (${truck.name}) has been ordered to abort transit. Consignment for ${job.cargo} cancelled.`, {
        title: 'FLEET RECALL',
        type: 'ops',
        priority: 1
      });
    }
    
    state.active.splice(activeJobIndex, 1);
  }
};
