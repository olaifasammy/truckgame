import { action, toast } from '../../core/ui';
import { refresh, set } from '../../core/store';
import { DriverService } from '../../application/services/drivers';
import { sendDriverOnRest, awardDriverBonus, assignMentorship } from '../../domain/regulations/hos';
import { Region } from '../../domain/drivers/drivers.types';
import { GameState } from '../../types/state';

export let activeTab: 'employed' | 'pool' = 'employed';
export let selectedRegion: Region | 'All' = 'All';
export let expandedDriverId: number | null = null;
export let transferModalDriverId: number | null = null;
export let currentPage = 1;
export const DRIVERS_PER_PAGE = 10;

action('driver-tab', d => { activeTab = (d as any).tab; currentPage = 1; refresh(); });
action('driver-region', d => { selectedRegion = (d as any).region; currentPage = 1; refresh(); });
action('driver-page', d => { currentPage = +(d as any).page; refresh(); });
action('toggle-driver-expand', d => {
  const id = +(d as any).id;
  expandedDriverId = expandedDriverId === id ? null : id;
  refresh();
});

action('hire-driver', d => DriverService.hireDriver(+(d as any).id));
action('fire-driver', d => DriverService.fireDriver(+(d as any).id));

action('train-driver-skill', d => {
  DriverService.upgradeSkill(+(d as any).id);
  refresh();
});

action('certify-driver', d => {
  DriverService.addCertification(+(d as any).id, (d as any).cert);
  refresh();
});

action('send-driver-rest', d => {
  set((S: GameState) => {
    const drv = S.drivers.find(x => x.id === +(d as any).id);
    if (drv) {
      const res = sendDriverOnRest(drv as any, S as any, true);
      toast(res.message, res.success ? 'success' : 'err');
    }
  });
});

action('award-driver-bonus', d => {
  set((S: GameState) => {
    const drv = S.drivers.find(x => x.id === +(d as any).id);
    if (drv) {
      const res = awardDriverBonus(drv as any, S as any, 500);
      toast(res.message, res.success ? 'success' : 'err');
    }
  });
});

action('pair-mentor', d => {
  set((S: GameState) => {
    const rookie = S.drivers.find(x => x.id === +(d as any).rookieId);
    const mentor = S.drivers.find(x => x.id === +(d as any).mentorId);
    if (rookie && mentor) {
      const res = assignMentorship(mentor as any, rookie as any);
      toast(res.message, res.success ? 'success' : 'err');
    }
  });
});

action('open-transfer-modal', d => {
  transferModalDriverId = +(d as any).id;
  refresh();
});

action('close-transfer-modal', () => {
  transferModalDriverId = null;
  refresh();
});

action('execute-transfer', d => {
  const driverId = +(d as any).driverId;
  const newRegion = (d as any).region as Region;
  DriverService.transferRegion(driverId, newRegion);
  transferModalDriverId = null;
  refresh();
});
