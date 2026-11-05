import { set } from '../../core/store';
import { toast } from '../../core/ui';
import { pushNote } from '../../systems/notify';
import { DriverManagement } from '../../domain/drivers/management';
import { DriverCertifications } from '../../domain/drivers/certifications';
import { fillDriverPool } from '../../domain/drivers/drivers.engine';
import { GameState } from '../../types/state';
import { Region } from '../../domain/drivers/drivers.types';

/**
 * Application service for driver operations.
 */
export const DriverService = {
  hireDriver(driverId: number) {
    set((S: GameState) => {
      const d = (S as any).pool?.find((x: any) => x.id === driverId);
      if (!d) return;
      
      const fee = DriverManagement.calculateHireFee(d);
      if (S.money < fee) return toast(`Insufficient funds ($${fee.toLocaleString()})`, 'err');

      S.money -= fee;
      (S as any).pool = (S as any).pool.filter((x: any) => x.id !== driverId);
      S.drivers.push(d);
      fillDriverPool(S as any, 8);
      
      pushNote(S as any, `Contracted new driver ${d.name} for regional fleet operations.`, { title: 'RECRUITMENT', type: 'ops' });
      toast('Successfully hired ' + d.name, 'success');
    });
  },

  fireDriver(driverId: number) {
    set((S: GameState) => {
      const truck = S.fleet.find(t => t.driverId === driverId);
      if (truck && truck.status === 'busy') return toast('Cannot fire driver while on an active job', 'err');
      
      if (truck) truck.driverId = null;
      const d = S.drivers.find(x => x.id === driverId);
      S.drivers = S.drivers.filter(x => x.id !== driverId);
      
      if (d) toast(`Fired ${d.name}`, 'success');
    });
  },

  transferRegion(driverId: number, newRegion: Region) {
    set((S: GameState) => {
      const err = DriverManagement.transferRegion(S, driverId, newRegion);
      if (err) return toast(err, 'err');
      toast(`Successfully transferred driver to ${newRegion}`, 'success');
    });
  },

  upgradeSkill(driverId: number) {
    set((S: GameState) => {
      const d = S.drivers.find(x => x.id === driverId);
      if (!d) return;
      
      const err = DriverManagement.upgradeSkill(S, driverId);
      if (err) return toast(err, 'err');
      
      pushNote(S as any, `${d.name} graduated and reached Skill Level ${d.skill}★!`, { title: 'DRIVER ACADEMY', type: 'ops', priority: 1 });
      toast(`Promoted ${d.name} to Skill Level ${d.skill}★!`, 'success');
    });
  },

  addCertification(driverId: number, certId: string) {
    set((S: GameState) => {
      const d = S.drivers.find(x => x.id === driverId);
      if (!d) return;
      
      const err = DriverCertifications.addCertification(S, driverId, certId);
      if (err) return toast(err, 'err');
      
      toast(`Endorsed ${d.name} with ${certId}`, 'success');
    });
  }
};
