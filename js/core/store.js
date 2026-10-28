const KEY='sam.v2';
const DEF=()=>({company:'Sam Logistics',money:16100,coins:6,vip:7,xp:0,loads:0,tab:'jobs',nextId:100,
 jobs:[],active:[],notes:[{t:'Welcome to Sam Logistics',r:0}],pool:[],stats:{earned:0,km:0},
 fleet:[{id:1,model:'s1',name:'Hauler S1 #1',cond:100,fuel:100,status:'idle'}]});
let S;const subs=new Set();
function fix(S){
 if(!S.drivers)S.drivers=[{id:1,name:'Sam Okafor',skill:3}];
 if(!S.pool)S.pool=[];
 if(!S.perks)S.perks={};
 if(!S.offices)S.offices=[];
 if(!S.stats)S.stats={earned:0,km:0};
 S.fleet.forEach((t,i)=>{
  const c=t.cond??100;
  if(!t.parts)t.parts={engine:c,brakes:c,tires:c,trans:c};
  if(!t.up)t.up={engine:0,tires:0,eco:0};
  if(t.driver===undefined)t.driver=i===0?S.drivers[0].id:null;
  if(!t.loc)t.loc='LAGOS';
  if(t.km===undefined)t.km=0;
  if(t.insp===undefined)t.insp=null;
 });
}
export function load(){try{S={...DEF(),...JSON.parse(localStorage.getItem(KEY))}}catch(e){S=DEF()}fix(S);return S}
export const get=()=>S;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
export function set(fn){fn(S);save();subs.forEach(f=>f(S))}
export const refresh=()=>subs.forEach(f=>f(S));
export const subscribe=f=>{subs.add(f);return()=>subs.delete(f)};
export const reset=()=>{try{localStorage.removeItem(KEY)}catch(e){}};
