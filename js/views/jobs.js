import {ic} from '../core/icons.js';
import {action,dur} from '../core/ui.js';
import {refresh} from '../core/store.js';
import {CITIES,CARGO} from '../data/world.js';
import {TRAILERS} from '../data/trucks.js';
import {blocker,takeJob,fuelCost,tripMs} from '../systems/jobs.js';

let open=null;
action('job-toggle',d=>{open=open===+d.id?null:+d.id;refresh()});
action('job-take',d=>takeJob(+d.id));

const line=(a,b,c,w,dash='')=>`<line x1="${CITIES[a][0]}" y1="${CITIES[a][1]}" x2="${CITIES[b][0]}" y2="${CITIES[b][1]}" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;

function map(S){
 const oj=S.jobs.find(j=>j.id===open),ends=oj?[oj.from,oj.to]:[];
 const base=S.jobs.filter(j=>j.id!==open).map(j=>line(j.from,j.to,'#2a323d',1)).join('');
 const act=S.active.map(j=>line(j.from,j.to,'#3b82f6',1.5,'3 3')).join('');
 const hl=oj?line(oj.from,oj.to,'#d9a441',2,'5 4'):'';
 const nodes=Object.entries(CITIES).map(([c,p])=>{const on=ends.includes(c);
  return `<circle cx="${p[0]}" cy="${p[1]}" r="${on?5:3.5}" fill="${on?'#d9a441':'#3b82f6'}" stroke="#0d1117" stroke-width="1.5"/><text x="${p[0]}" y="${p[1]+15}" text-anchor="middle" font-size="9" fill="${on?'#e6e9ee':'#7d8794'}" font-family="sans-serif" letter-spacing=".5">${c}</text>`}).join('');
 return `<div class="mapc"><div class="maph"><span>Network map</span><b>${oj?oj.km+' km':S.jobs.length+' routes'}</b></div>
 <svg viewBox="0 0 370 190">${base}${act}${hl}${nodes}</svg></div>`;
}

const det=(j,why)=>`<div class="det">
 <div><small>Distance</small>${j.km} km</div><div><small>Duration</small>${dur(tripMs(j,1))}</div><div><small>Rate</small>${(j.pay/j.km).toFixed(1)}/km</div>
 <div><small>Client</small>${j.co}</div><div><small>Trailer</small>${TRAILERS[CARGO[j.cargo].trailer]}</div><div><small>Fuel use</small>${fuelCost(j)}%</div>
 ${why?`<div class="warn">${why}</div>`:''}</div>`;

const card=(S,j)=>{const c=CARGO[j.cargo],why=blocker(S,j);
 return `<div class="job ${j.vip?'vipj':''} ${open===j.id?'open':''}" data-act="job-toggle" data-id="${j.id}">
 <div class="jrow"><div class="ico">${ic(c.icon)}</div>
 <div class="info"><div class="c">${j.cargo}${c.trailer==='hazmat'?'<i>HAZMAT</i>':''}<em>${j.co}</em></div><div class="d">${j.from} → ${j.to} · ${j.km} km</div></div>
 <div class="pay"><b>${j.pay.toLocaleString()}</b><button class="btn ${why?'dim':''}" data-act="job-take" data-id="${j.id}">Take</button></div></div>
 ${open===j.id?det(j,why):''}</div>`};

export default{id:'jobs',icon:'pin',label:'Jobs',
 render:S=>map(S)+`<div class="sec"><span>Freight board</span><span>${S.active.length} active</span></div>`+S.jobs.map(j=>card(S,j)).join('')};
