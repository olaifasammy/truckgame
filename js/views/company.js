import {ic} from '../core/icons.js';
import {action,fmt} from '../core/ui.js';
import {MODELS} from '../data/trucks.js';
import {hire,fire,hireFee} from '../systems/drivers.js';
import {slots} from '../systems/offices.js';
import {OFFICES,BASE_SLOTS} from '../data/shop.js';
action('hire',d=>hire(+d.id));
action('fire',d=>fire(+d.id));
const pips=n=>`<span class="pips">${[0,1,2,3,4].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
const kpi=(k,v)=>`<div><small>${k}</small><b>${v}</b></div>`;
export default{id:'company',icon:'company',label:'Company',
 render(S){
  const value=S.fleet.reduce((a,t)=>a+MODELS[t.model].price*(.5+.5*t.cond/100),0);
  return `<div class="cohead"><div class="d">HQ LAGOS · VIP ${S.vip}</div><div class="cn">${S.company}</div>
  <div class="bar prog"><i style="width:${S.xp/10}%"></i></div><div class="d xpl"><span>Experience</span><span>${S.xp} / 1000</span></div></div>
  <div class="kpis">${kpi('Fleet value',fmt(Math.round(value)))}${kpi('Total earned',fmt(S.stats.earned))}${kpi('Loads delivered',S.loads)}
  ${kpi('Distance driven',fmt(Math.round(S.stats.km))+' km')}${kpi('Trucks',S.fleet.length)}${kpi('Drivers',S.drivers.length)}</div>
  <div class="sec"><span>Drivers</span><span>${S.drivers.length} employed</span></div>`+
  S.drivers.map(d=>{const t=S.fleet.find(x=>x.driver===d.id);
   return `<div class="drow"><div class="ico">${ic('user')}</div><div class="info"><div class="c">${d.name}</div><div class="d">${t?t.name+(t.status==='busy'?' · on job':''):'Unassigned'}</div></div>${pips(d.skill)}
   <button class="btn alt" data-act="fire" data-id="${d.id}" ${t&&t.status==='busy'?'disabled':''}>Dismiss</button></div>`}).join('')+
  `<div class="sec"><span>Recruitment</span><span>Fee by skill</span></div>`+
  S.pool.map(d=>`<div class="drow"><div class="ico">${ic('user')}</div><div class="info"><div class="c">${d.name}</div><div class="d">Skill ${d.skill}/5 · +${d.skill*2}% speed</div></div>${pips(d.skill)}
   <button class="btn ${S.money<hireFee(d)?'dim':''}" data-act="hire" data-id="${d.id}">${fmt(hireFee(d))}</button></div>`).join('')+
  `<div class="sec"><span>Offices</span><span>${S.fleet.length}/${slots(S)} truck slots</span></div>
  <div class="drow"><div class="ico">${ic('company')}</div><div class="info"><div class="c">Lagos HQ</div><div class="d">Headquarters · ${BASE_SLOTS} slots</div></div></div>`+
  S.offices.map(id=>{const o=OFFICES[id];return `<div class="drow"><div class="ico">${ic('company')}</div><div class="info"><div class="c">${o.name}</div><div class="d">+${o.slots} slots</div></div></div>`}).join('')+
  `<div class="link" data-act="store-open" data-id="offices"><div class="ico">${ic('company')}</div><div class="info"><div class="c">Buy offices</div><div class="d">Expand truck capacity</div></div>${ic('chev')}</div>`;
 }};
