import { ic } from '../core/icons';
import { action, fmt } from '../core/ui';
import { OFFICES } from '../data/shop';
import { buyOffice } from '../systems/offices';

action('office', d => buyOffice((d as any).office));

const item = (S: any, k: string, o: any) => {
  const owned = S.offices.includes(k);
  return `<div class="card row"><div class="ico">${ic('pin')}</div>
 <div class="info"><div class="c">${o.name}</div><div class="d">${o.slots} truck slots · Requires VIP ${o.vip}</div></div>
 <button class="btn gold" style="min-width:90px;" data-act="office" data-office="${k}" ${owned ? 'disabled' : ''}>${owned ? 'OWNED' : fmt(o.price)}</button></div>`;
};

export default {
  id: 'offices',
  icon: 'pin',
  label: 'Real Estate',
  desc: 'Expand network and slots',
  render: (S: any) => `<div class="sec"><span>Logistics Hubs</span><span class="mu-tx">${S.offices.length} OWNED</span></div>` + Object.entries(OFFICES).map(([k, o]) => item(S, k, o)).join('')
};
