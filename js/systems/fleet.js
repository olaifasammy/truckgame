import {set} from '../core/store.js';
import {toast} from '../core/ui.js';
import {MODELS,UPGRADES,MAX_UP} from '../data/trucks.js';
import {stats,distKm,fuelPct,tripMs,syncCond} from './calc.js';
import {pushNote} from './notify.js';
import {disc} from './perks.js';
import {slots} from './offices.js';

export const FUEL_PRICE=2.5;
export const inspectCost=()=>Math.round(300*disc('scanner'));
export const refuelCost=t=>Math.round((100-t.fuel)/100*MODELS[t.model].spec.tank*FUEL_PRICE*disc('fuelcard'));
export const repairCost=t=>Math.round((100-t.cond)*30*disc('service'));
export const upgradeCost=(k,l)=>UPGRADES[k].base*(l+1);

export const newTruck=(S,model)=>{const m=MODELS[model];
 return{id:S.nextId++,model,name:`${m.name} #${S.fleet.length+1}`,cond:100,fuel:100,status:'idle',
  parts:{engine:100,brakes:100,tires:100,trans:100},up:{engine:0,tires:0,eco:0},driver:null,loc:'LAGOS',km:0,insp:null}};

const idle=(S,id)=>{const t=S.fleet.find(x=>x.id===id);if(!t||t.status!=='idle'){toast('Truck is busy');return null}return t};
const pay=(S,c)=>{if(S.money<c){toast('Not enough cash');return false}S.money-=c;return true};

export const refuel=id=>set(S=>{const t=idle(S,id);if(!t)return;const c=refuelCost(t);if(!c||!pay(S,c))return;t.fuel=100});
export const repair=id=>set(S=>{const t=idle(S,id);if(!t||!repairCost(t)||!pay(S,repairCost(t)))return;
 for(const k in t.parts)t.parts[k]=100;syncCond(t);t.insp=null});
export const inspect=id=>set(S=>{const t=idle(S,id);if(!t||!pay(S,inspectCost()))return;t.insp={at:Date.now(),parts:{...t.parts}}});
export const upgrade=(id,k)=>set(S=>{const t=idle(S,id);if(!t)return;const l=t.up[k];
 if(l>=MAX_UP||!pay(S,upgradeCost(k,l)))return;t.up[k]++;toast(UPGRADES[k].label+' → L'+t.up[k])});
export const assign=(id,did)=>set(S=>{const t=idle(S,id);if(!t)return;
 if(did){const o=S.fleet.find(x=>x.driver===did&&x.id!==id);
  if(o&&o.status==='busy')return toast('Driver is on a job');if(o)o.driver=null}
 t.driver=did||null});

export function transportInfo(S,t,city){
 const km=distKm(t.loc,city),st=stats(S,t),fuel=fuelPct(km,st);
 const why=t.status!=='idle'?'busy':!t.driver?'driver':t.fuel<fuel?'fuel':t.cond<20?'cond':null;
 return{km,fuel,ms:tripMs(km,st.speed),why};
}
export const transport=(id,city)=>set(S=>{
 const t=S.fleet.find(x=>x.id===id);if(!t)return;
 const i=transportInfo(S,t,city);if(i.why)return toast('Truck cannot make this trip');
 const now=Date.now();
 S.active.push({id:S.nextId++,kind:'move',cargo:'Repositioning',from:t.loc,to:city,km:i.km,dh:0,pay:0,truck:id,start:now,end:now+i.ms});
 t.status='busy';toast('Moving to '+city);
});

export function buyTruck(model){
 set(S=>{const m=MODELS[model];
  if(S.fleet.length>=slots(S))return toast('Garage full · buy an office');
  if(!pay(S,m.price))return;
  S.fleet.push(newTruck(S,model));
  pushNote(S,'Purchased '+m.name);toast('Purchased '+m.name)});
}
