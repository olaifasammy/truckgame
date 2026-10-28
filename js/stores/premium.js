import {ic} from '../core/icons.js';
import {action,fmt} from '../core/ui.js';
import {GOLD,EXCH} from '../data/shop.js';
import {exchange,spend} from '../systems/premium.js';
action('exchange',()=>exchange());
action('gold',d=>spend(d.key));
export default{id:'premium',icon:'coin',label:'Premium',desc:'Gold exchange and boosts',
 render:S=>`<div class="sec"><span>Exchange</span><span>${S.coins} gold</span></div>
 <div class="shop"><div class="ico">${ic('cash')}</div><div class="info"><div class="c">Buy 1 gold</div><div class="d">Convert cash to gold</div></div>
 <button class="btn ${S.money<EXCH?'dim':''}" data-act="exchange">${fmt(EXCH)}</button></div>
 <div class="sec"><span>Boosts</span></div>`+
 Object.entries(GOLD).map(([k,g])=>`<div class="shop"><div class="ico">${ic(g.icon)}</div><div class="info"><div class="c">${g.label}</div><div class="d">${g.desc}</div></div>
 <button class="btn ${S.coins<g.cost?'dim':''}" data-act="gold" data-key="${k}">${g.cost} ${ic('coin')}</button></div>`).join('')};
