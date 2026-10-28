import { ic } from '../core/icons';
import { action, fmt } from '../core/ui';
import { PERKS } from '../data/shop';
import { perkLvl, perkCost, buyPerk } from '../systems/perks';

action('perk', d => buyPerk((d as any).perk));

const item = (k: string, p: any) => {
  const l = perkLvl(k), max = l >= p.max;
  return `<div class="card row"><div class="ico">${ic(p.icon)}</div>
 <div class="info"><div class="c">${p.label} <span class="mu-tx" style="font-size:10px;">L${l}/${p.max}</span></div><div class="d">${p.desc}</div></div>
 <button class="btn gold" style="min-width:80px;" data-act="perk" data-perk="${k}" ${max ? 'disabled' : ''}>${max ? 'MAX' : fmt(perkCost(k))}</button></div>`;
};

export default {
  id: 'parts',
  icon: 'wrench',
  label: 'Tech Upgrades',
  desc: 'Company perks and efficiency',
  render: () => `<div class="sec"><span>Enterprise Perks</span><span class="mu-tx">PASSIVE BONUSES</span></div>` + Object.entries(PERKS).map(([k, p]) => item(k, p)).join('')
};
