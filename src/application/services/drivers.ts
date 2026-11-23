import { set } from '../../core/store';
import { toast } from '../../core/ui';
import { pushNote } from '../../systems/notify';
import { DriverManagement } from '../../domain/drivers/management';
import { DriverCertifications } from '../../domain/drivers/certifications';
import { fillDriverPool, forceRefreshDriverPool } from '../../domain/drivers/drivers.engine';
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
      fillDriverPool(S as any, 2, 12, Date.now());
      
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

  refreshMarketPool() {
    set((S: GameState) => {
      const agencyFee = 2500;
      if (S.money < agencyFee) return toast(`Insufficient funds for agency search ($${agencyFee.toLocaleString()})`, 'err');
      S.money -= agencyFee;
      forceRefreshDriverPool(S, Date.now());
      pushNote(S as any, `Engaged recruitment agency. Fresh candidate pool populated across all regions (-$${agencyFee.toLocaleString()}).`, {
        title: 'RECRUITMENT AGENCY',
        type: 'ops'
      });
      toast('Recruitment market refreshed across all operating regions!', 'success');
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
