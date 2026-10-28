import {ic} from '../core/icons.js';
import {action,fmt,dur} from '../core/ui.js';
import {refresh} from '../core/store.js';
import {MODELS,TRAILERS,UPGRADES,MAX_UP} from '../data/trucks.js';
import {CITIES} from '../data/world.js';
import {stats,PART_LABELS} from '../systems/calc.js';
import {refuel,repair,inspect,upgrade,assign,transport,refuelCost,repairCost,upgradeCost,transportInfo,inspectCost} from '../systems/fleet.js';
import {bestFor,dispatchTruck} from '../systems/jobs.js';
import {slots} from '../systems/offices.js';

let openId=null,panel=null;
action('truck-toggle',d=>{openId=openId===+d.id?null:+d.id;panel=null;refresh()});
action('panel',d=>{panel=panel===d.kind?null:d.kind;refresh()});
action('refuel',d=>refuel(+d.id));
action('repair',d=>repair(+d.id));
action('inspect',d=>inspect(+d.id));
action('dispatch',d=>dispatchTruck(+d.id));
action('upgrade',d=>upgrade(+d.id,d.key));
action('assign',d=>assign(+d.id,d.driver?+d.driver:null));
action('move',d=>transport(+d.id,d.city));

const tone=v=>v<25?'low':v<55?'mid':'';
const meter=(l,v,txt)=>`<div class="meter"><small><span>${l}</span><span>${txt}</span></small><div class="bar ${tone(v)}"><i style="width:${v}%"></i></div></div>`;
const cell=(k,v)=>`<div><small>${k}</small>${v}</div>`;
const pips=(n,max)=>`<span class="pips">${[...Array(max)].map((_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
const tb=(act,icon,label,sub,attrs='',dis=false,on=false)=>`<button class="tb ${on?'on':''}" data-act="${act}" ${attrs} ${dis?'disabled':''}>${ic(icon)}<span>${label}</span><em>${sub||'&nbsp;'}</em></button>`;

function panelHtml(S,t,busy){
 if(panel==='upgrade')return `<div class="panel">`+Object.entries(UPGRADES).map(([k,u])=>{
  const l=t.up[k],max=l>=MAX_UP,c=upgradeCost(k,l);
  return `<div class="prow"><div class="info"><div class="c">${u.label}</div><div class="d">${u.desc}</div></div>${pips(l,MAX_UP)}
  <button class="btn alt" data-act="upgrade" data-id="${t.id}" data-key="${k}" ${max||busy||S.money<c?'disabled':''}>${max?'Max':fmt(c)}</button></div>`}).join('')+`</div>`;
 if(panel==='driver')return `<div class="panel">`+S.drivers.map(d=>{
  const cur=t.driver===d.id,o=S.fleet.find(x=>x.driver===d.id&&x.id!==t.id),lock=o&&o.status==='busy';
  return `<div class="prow"><div class="info"><div class="c">${d.name}</div><div class="d">Skill ${d.skill}/5 · ${o?'On '+o.name:cur?'This truck':'Available'}</div></div>
  <button class="btn alt" data-act="assign" data-id="${t.id}" data-driver="${d.id}" ${cur||busy||lock?'disabled':''}>${cur?'Assigned':'Assign'}</button></div>`}).join('')+
  (t.driver?`<div class="prow"><div class="info d">Remove current driver</div><button class="btn alt" data-act="assign" data-id="${t.id}" data-driver="" ${busy?'disabled':''}>Unassign</button></div>`:'')+
  `<div class="prow"><div class="d">More drivers: recruit in Company</div></div></div>`;
 if(panel==='move')return `<div class="panel"><div class="prow"><div class="d">Reposition from ${t.loc} · no pay${t.driver?'':' · assign a driver first'}</div></div><div class="cgrid">`+
  Object.keys(CITIES).filter(c=>c!==t.loc).map(c=>{const i=transportInfo(S,t,c);
   return `<button class="city" data-act="move" data-id="${t.id}" data-city="${c}" ${i.why?'disabled':''}><b>${c}</b><span>${i.km} km · ${dur(i.ms)} · ${i.fuel}% fuel</span></button>`}).join('')+`</div></div>`;
 return '';
}

function body(S,t,m,a,now){
 const sp=m.spec,st=stats(S,t),busy=!!a,bj=bestFor(S,t),drv=S.drivers.find(x=>x.id===t.driver);
 const pct=a?Math.min(100,(now-a.start)/(a.end-a.start)*100):0;
 const rep=t.insp?`<div class="rep"><div class="rt">Inspection report · ${dur(now-t.insp.at)} ago</div><div class="meters">${Object.entries(PART_LABELS).map(([k,l])=>meter(l,t.insp.parts[k],t.insp.parts[k]+'%')).join('')}</div></div>`:'';
 return `<div class="tbody">
 ${a?`<div class="leg"><span>${a.cargo} · ${a.from} → ${a.to}${a.dh?` (+${a.dh} km positioning)`:''}</span><span data-eta="${a.end}">${dur(Math.max(0,a.end-now))}</span></div><div class="bar prog" data-start="${a.start}" data-end="${a.end}"><i style="width:${pct}%"></i></div>`:''}
 <div class="meters">${meter('Fuel',t.fuel,`${t.fuel}% · ${Math.round(t.fuel*sp.tank/100)} L`)}${meter('Condition',t.cond,t.cond+'%')}</div>
 ${rep}
 <div class="spec">${cell('Engine',sp.engine)}${cell('Power',`${sp.power} hp / ${Math.round(sp.power*.7457)} kW`)}${cell('Torque',sp.torque.toLocaleString()+' Nm')}
 ${cell('Transmission',sp.trans)}${cell('Drive',sp.axle)}${cell('Emissions',sp.emis)}
 ${cell(sp.axle==='4x2'?'GVW':'GCW',sp.gvw+' t')}${cell('Payload',sp.payload+' t')}${cell('Fuel tank',sp.tank+' L')}
 ${cell('Consumption',st.cons.toFixed(1)+' L/100 km')}${cell('Range',Math.round(sp.tank/st.cons*100)+' km')}${cell('Odometer',Math.round(t.km).toLocaleString()+' km')}</div>
 <div class="cert">Speed ${st.speed.toFixed(2)}x · Wear ${st.wear.toFixed(2)}x · ${drv?'Driver skill '+drv.skill+'/5':'No driver'}<br>Certified: ${m.haul.map(h=>TRAILERS[h]).join(' · ')}</div>
 <button class="btn dsp" data-act="dispatch" data-id="${t.id}" ${bj?'':'disabled'}>${ic('send')} ${bj?`Dispatch · ${bj.cargo} · ${bj.pay.toLocaleString()}`:'Dispatch · no eligible job'}</button>
 <div class="agrid">
 ${tb('refuel','fuel','Refuel',t.fuel<100?fmt(refuelCost(t)):'Full',`data-id="${t.id}"`,busy||t.fuel>=100)}
 ${tb('repair','wrench','Repair',t.cond<100?fmt(repairCost(t)):'Good',`data-id="${t.id}"`,busy||t.cond>=100)}
 ${tb('inspect','search','Inspect',fmt(inspectCost()),`data-id="${t.id}"`,busy)}
 ${tb('panel','up','Upgrade','',`data-kind="upgrade"`,false,panel==='upgrade')}
 ${tb('panel','user','Driver',drv?drv.name.split(' ')[0]:'None',`data-kind="driver"`,false,panel==='driver')}
 ${tb('panel','route','Transport',t.loc,`data-kind="move"`,false,panel==='move')}
 </div>${panelHtml(S,t,busy)}</div>`;
}

function truck(S,t){
 const m=MODELS[t.model],a=S.active.find(x=>x.truck===t.id),now=Date.now(),o=openId===t.id;
 const drv=S.drivers.find(x=>x.id===t.driver);
 const st=a?[a.kind==='move'?'Moving':'On job','busy']:drv?['Idle','idle']:['No driver','warn'];
 return `<div class="truck ${o?'open':''}"><div class="thead" data-act="truck-toggle" data-id="${t.id}">
 <div class="ico">${ic('truck')}</div>
 <div class="info"><div class="c">${t.name}</div><div class="d">${m.name} · ${a?a.from+' → '+a.to:t.loc} · ${drv?drv.name:'Unassigned'}</div></div>
 <div class="tr"><span class="state ${st[1]}">${st[0]}</span><div class="mm"><div class="bar ${tone(t.fuel)}"><i style="width:${t.fuel}%"></i></div><div class="bar ${tone(t.cond)}"><i style="width:${t.cond}%"></i></div></div></div></div>
 ${o?body(S,t,m,a,now):''}</div>`;
}

export default{id:'garage',icon:'garage',label:'Garage',
 render(S){
  const busy=S.fleet.filter(t=>t.status==='busy').length;
  return `<div class="gsum"><div><small>Fleet</small><b>${S.fleet.length}/${slots(S)}</b></div><div><small>Idle</small><b>${S.fleet.length-busy}</b></div><div><small>On job</small><b>${busy}</b></div></div>
  <div class="sec"><span>Your trucks</span><span>Tap to expand</span></div>${S.fleet.map(t=>truck(S,t)).join('')}
  <div class="link" data-act="store-open" data-id="dealership"><div class="ico">${ic('truck')}</div><div class="info"><div class="c">Dealership</div><div class="d">Buy new trucks</div></div>${ic('chev')}</div>`;
 }};
