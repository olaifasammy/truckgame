import {MODELS} from '../data/trucks.js';
import {CITIES} from '../data/world.js';
export const PARTS={engine:.9,brakes:1.3,tires:1.1,trans:.7};
export const PART_LABELS={engine:'Engine',brakes:'Brakes',tires:'Tires',trans:'Transmission'};
export const distKm=(a,b)=>{const p=CITIES[a],q=CITIES[b];return Math.round(Math.hypot(p[0]-q[0],p[1]-q[1])*5.3/5)*5};
export function stats(S,t){
 const m=MODELS[t.model],d=S.drivers.find(x=>x.id===t.driver);
 return{speed:m.speed*(1+.06*t.up.engine)*(1+.02*(d?d.skill:0)),
  wear:m.wear*(1-.08*t.up.tires),cons:m.spec.cons*(1-.07*t.up.eco),tank:m.spec.tank};
}
// game-scale fuel use (assumes en-route stops)
export const fuelPct=(km,st)=>Math.min(100,Math.ceil(km*st.cons/st.tank*.45));
export const wearPct=(km,st)=>Math.ceil(km/100*st.wear);
export const tripMs=(km,speed)=>Math.round(km*60/speed);
export const syncCond=t=>{const v=Object.values(t.parts);t.cond=Math.round(v.reduce((a,b)=>a+b,0)/v.length)};
export function applyWear(t,w){for(const k in PARTS)t.parts[k]=Math.max(0,Math.round(t.parts[k]-w*PARTS[k]));syncCond(t)}
