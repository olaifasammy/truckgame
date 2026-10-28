import { ic } from '../core/icons';
import { action, fmt } from '../core/ui';
import { GOLD, EXCH } from '../data/shop';
import { exchange, spend } from '../systems/premium';

action('exch', () => exchange());
action('spend', d => spend((d as any).item));

export default {
  id: 'premium',
  icon: 'bolt',
  label: 'Exchange',
  desc: 'Premium assets and boosts',
  render: (S: any) => `
 <div class="card row">
   <div class="ico">${ic('cash')}</div>
   <div class="info"><div class="c">Gold Exchange</div><div class="d">${fmt(EXCH)} cash = 1 gold coin</div></div>
   <button class="btn gold" style="min-width:80px;" data-act="exch" ${S.money < EXCH ? 'disabled' : ''}>Exchange</button>
 </div>
 <div class="sec"><span>Gold Reserve</span><span class="mu-tx">${S.coins} COINS</span></div>` +
 Object.entries(GOLD).map(([k, g]) => `<div class="card row">
 <div class="ico" style="color:var(--gold);">${ic(g.icon)}</div>
 <div class="info"><div class="c">${g.label}</div><div class="d">${g.desc}</div></div>
 <button class="btn gold" style="min-width:80px;" data-act="spend" data-item="${k}" ${S.coins < g.cost ? 'disabled' : ''}>${g.cost} Gold</button></div>`).join('')
};
