import {load,get,set,subscribe,reset} from './core/store.js';
import {$,toast,dur} from './core/ui.js';
import {find} from './core/router.js';
import './views/index.js';
import * as header from './ui/header.js';
import * as nav from './ui/nav.js';
import {replenish,completeJobs} from './systems/jobs.js';
import {fillPool} from './systems/drivers.js';

if(location.search.includes('reset')){reset();history.replaceState(null,'',location.pathname)}
load();
subscribe(S=>{header.render(S);nav.render(S);$('view').innerHTML=find(S.tab).render(S)});

function tick(){
 const now=Date.now();let done=[];
 if(get().active.some(a=>a.end<=now))set(S=>{done=completeJobs(S,now)});
 if(done.length)toast(`Delivered ${done.length} load${done.length>1?'s':''}`);
 document.querySelectorAll('[data-eta]').forEach(el=>{el.textContent=dur(Math.max(0,+el.dataset.eta-now))});
 document.querySelectorAll('[data-end]').forEach(el=>{
  const s=+el.dataset.start,e=+el.dataset.end;
  el.firstElementChild.style.width=Math.min(100,(now-s)/(e-s)*100)+'%'});
}
set(S=>{replenish(S);fillPool(S);completeJobs(S,Date.now())});
setInterval(tick,1000);
