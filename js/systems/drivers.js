import {set} from '../core/store.js';
import {toast,rnd} from '../core/ui.js';
import {pushNote} from './notify.js';
const F=['Chidi','Amina','Tunde','Ngozi','Ibrahim','Funke','Emeka','Hauwa','Segun','Zainab'];
const L=['Okafor','Bello','Adeyemi','Eze','Musa','Balogun','Nwosu','Yusuf','Ojo','Abubakar'];
export const hireFee=d=>d.skill*1500;
export function fillPool(S){while(S.pool.length<3)S.pool.push({id:S.nextId++,name:rnd(F)+' '+rnd(L),skill:1+Math.floor(Math.random()*5)})}
export const hire=id=>set(S=>{
 const d=S.pool.find(x=>x.id===id);if(!d)return;
 if(S.money<hireFee(d))return toast('Not enough cash');
 S.money-=hireFee(d);S.pool=S.pool.filter(x=>x.id!==id);S.drivers.push(d);fillPool(S);
 pushNote(S,'Hired driver '+d.name);toast('Hired '+d.name);
});
export const fire=id=>set(S=>{
 const t=S.fleet.find(x=>x.driver===id);
 if(t&&t.status==='busy')return toast('Driver is on a job');
 if(t)t.driver=null;
 S.drivers=S.drivers.filter(x=>x.id!==id);
});
