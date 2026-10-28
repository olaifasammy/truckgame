import {set,get} from '../core/store.js';
import {toast,rnd} from '../core/ui.js';
import {CITIES,COMPANIES,CARGO} from '../data/world.js';
import {MODELS,TRAILERS} from '../data/trucks.js';
import {stats,distKm,fuelPct,wearPct,applyWear,tripMs as trip} from './calc.js';
import {pushNote} from './notify.js';

const REF={cons:30,tank:400};
export const fuelCost=j=>fuelPct(j.km,REF);
export const tripMs=(j,speed)=>trip(j.km+(j.dh||0),speed);

export function makeJob(S,vip=false){
 const names=Object.keys(CITIES),from=rnd(names);let to=rnd(names);while(to===from)to=rnd(names);
 const km=200+Math.floor(Math.random()*1400);
 return{id:S.nextId++,co:rnd(COMPANIES),cargo:rnd(Object.keys(CARGO)),km,from,to,vip,pay:Math.round(km*(vip?6.5:3.5)/100)*100};
}
export function replenish(S){while(S.jobs.length<6)S.jobs.push(makeJob(S,Math.random()<.15))}

const hauls=(t,j)=>MODELS[t.model].haul.includes(CARGO[j.cargo].trailer);
export function why(S,t,j){
 if(t.status!=='idle')return 'Truck is busy';
 if(!t.driver)return 'Assign a driver first';
 if(!hauls(t,j))return 'Needs a truck that hauls '+TRAILERS[CARGO[j.cargo].trailer];
 if(t.cond<20)return 'Repair needed';
 if(t.fuel<fuelPct(j.km+distKm(t.loc,j.from),stats(S,t)))return 'Refuel needed';
 return null;
}
const ok=(S,j)=>!(j.vip&&S.vip<5);
export const findTruck=(S,j)=>S.fleet.filter(t=>!why(S,t,j)).sort((a,b)=>distKm(a.loc,j.from)-distKm(b.loc,j.from))[0];
export const bestFor=(S,t)=>S.jobs.filter(j=>ok(S,j)&&!why(S,t,j)).sort((a,b)=>b.pay-a.pay)[0];
export function blocker(S,j){
 const able=S.fleet.filter(t=>hauls(t,j));
 if(!able.length)return 'Needs a truck that hauls '+TRAILERS[CARGO[j.cargo].trailer];
 if(!able.some(t=>t.status==='idle'))return 'All suitable trucks are busy';
 if(!able.some(t=>t.status==='idle'&&t.driver))return 'Assign a driver in Garage';
 if(!findTruck(S,j))return 'Refuel or repair in Garage';
 return null;
}

export function takeJob(id,truckId){
 set(S=>{
  const j=S.jobs.find(x=>x.id===id);if(!j)return;
  if(!ok(S,j))return toast('VIP only');
  let t;
  if(truckId){t=S.fleet.find(x=>x.id===truckId);const w=t&&why(S,t,j);if(!t||w)return toast(w||'No truck')}
  else{const w=blocker(S,j);if(w)return toast(w);t=findTruck(S,j)}
  const now=Date.now(),dh=distKm(t.loc,j.from);
  S.jobs=S.jobs.filter(x=>x.id!==id);
  S.active.push({...j,truck:t.id,dh,start:now,end:now+trip(j.km+dh,stats(S,t).speed)});
  t.status='busy';replenish(S);
  pushNote(S,`Job accepted: ${j.cargo} · ${j.from} → ${j.to}`);
  toast('Job accepted: '+j.cargo);
 });
}
export function dispatchTruck(id){
 const S=get(),t=S.fleet.find(x=>x.id===id),j=t&&bestFor(S,t);
 if(!j)return toast('No eligible job');
 takeJob(j.id,id);
}

export function completeJobs(S,now){
 const done=S.active.filter(a=>a.end<=now);
 if(!done.length)return done;
 S.active=S.active.filter(a=>a.end>now);
 for(const a of done){
  const t=S.fleet.find(x=>x.id===a.truck),km=a.km+(a.dh||0);
  if(t){const st=stats(S,t);t.status='idle';t.loc=a.to;t.km+=km;
   t.fuel=Math.max(0,t.fuel-fuelPct(km,st));applyWear(t,wearPct(km,st))}
  if(a.kind==='move'){pushNote(S,`${t?t.name:'Truck'} arrived in ${a.to}`);continue}
  S.money+=a.pay;S.loads++;S.xp+=120;S.stats.earned+=a.pay;S.stats.km+=a.km;
  if(S.xp>=1000){S.xp-=1000;S.vip++;pushNote(S,'Level up: VIP '+S.vip)}
  pushNote(S,`Delivered ${a.cargo} to ${a.to} · +${a.pay.toLocaleString()}`);
 }
 return done;
}
