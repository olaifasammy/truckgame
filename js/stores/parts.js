import {ic} from '../core/icons.js';
import {action,fmt} from '../core/ui.js';
import {PERKS} from '../data/shop.js';
import {buyPerk,perkLvl,perkCost} from '../systems/perks.js';
action('perk',d=>buyPerk(d.key));
const pips=(n,m)=>`<span class="pips">${[...Array(m)].map((_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
export default{id:'parts',icon:'wrench',label:'Parts & Fuel',desc:'Discount plans for fuel and service',
 render:S=>`<div class="sec"><span>Service plans</span></div>`+Object.entries(PERKS).map(([k,p])=>{
  const l=perkLvl(k),max=l>=p.max,c=perkCost(k);
  return `<div class="shop"><div class="ico">${ic(p.icon)}</div><div class="info"><div class="c">${p.label}</div><div class="d">${p.desc}</div></div>${pips(l,p.max)}
  <button class="btn ${!max&&S.money<c?'dim':''}" data-act="perk" data-key="${k}" ${max?'disabled':''}>${max?'Max':fmt(c)}</button></div>`}).join('')};
