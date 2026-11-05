import { set } from '../../core/store';
import { toast } from '../../core/ui';
import { VehicleUpgrades } from '../../domain/trucks/upgrades';
import { VehicleMaintenance } from '../../domain/trucks/maintenance';
import { FleetManagement } from '../../domain/trucks/fleet-management';
import { GameState } from '../../types/state';

/**
 * Application service for fleet operations.
 * Coordinates domain actions and UI feedback.
 */
export const FleetService = {
  setGearbox(truckId: number, gearboxId: string) {
    set((S: GameState) => {
      const err = VehicleUpgrades.upgradeGearbox(S, truckId, gearboxId);
      if (err) return toast(err, 'err');
      toast(`Installed ${gearboxId === '16spd_crawler' ? '16-Speed Heavy Crawler Transmission' : '12-Speed Automated Highway Transmission'}`, 'success');
    });
  },

  setAxleRatio(truckId: number, ratioId: string) {
    set((S: GameState) => {
      const err = VehicleUpgrades.upgradeAxle(S, truckId, ratioId);
      if (err) return toast(err, 'err');
      toast(`Configured ${ratioId === 'heavy_diff_lock' ? '3.42:1 Heavy Ratio with Inter-Axle Diff Lock' : '2.64:1 Long-Haul Highway Eco Ratio'}`, 'success');
    });
  },

  setTires(truckId: number, compoundId: string) {
    set((S: GameState) => {
      const err = VehicleUpgrades.upgradeTires(S, truckId, compoundId);
      if (err) return toast(err, 'err');
      toast(`Mounted fresh ${compoundId === 'all_terrain_winter' ? 'All-Terrain Winter M+S Treads' : 'Low Rolling Resistance Eco Highway Tires'}`, 'success');
    });
  },

  serviceConsumables(truckId: number) {
    set((S: GameState) => {
      const err = VehicleMaintenance.serviceConsumables(S, truckId);
      if (err) return toast(err, 'err');
      toast(`Topped up AdBlue / DEF, flushed Coolant & refreshed Transmission Fluid`, 'success');
    });
  },

  assignDriver(truckId: number, driverId: number | null) {
    set((S: GameState) => {
      const err = FleetManagement.assignDriver(S, truckId, driverId);
      if (err) return toast(err, 'err');
      toast(driverId ? 'Driver assigned to unit' : 'Driver relieved from duty', 'success');
    });
  },

  hitchTrailer(truckId: number, trailerType: any) {
    set((S: GameState) => {
      const err = FleetManagement.hitchTrailer(S, truckId, trailerType);
      if (err) return toast(err, 'err');
      toast(trailerType ? 'Trailer coupled' : 'Trailer unhitched', 'success');
    });
  },

  startRepair(truckId: number, parts: string[]) {
    set((S: GameState) => {
      const err = VehicleMaintenance.startRepair(S, truckId, parts);
      if (err) return toast(err, 'err');
      
      const truck = S.fleet.find(t => t.id === truckId);
      const isScheduled = truck?.status === 'busy';
      const msg = isScheduled 
        ? 'Workshop service pre-paid and scheduled for arrival.' 
        : 'Truck hoisted into Repair Bay.';
      toast(msg, 'success');
    });
  }
};
