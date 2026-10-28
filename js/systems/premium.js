import {set} from '../core/store.js';
import {toast} from '../core/ui.js';
import {GOLD,EXCH} from '../data/shop.js';
import {replenish,makeJob} from './jobs.js';
import {pushNote} from './notify.js';
const FX={
 refresh:S=>{S.jobs=[];replenish(S)},
 vipjobs:S=>{S.jobs.push(makeJob(S,true),makeJob(S,true))},
 xp:S=>{S.xp+=400;while(S.xp>=1000){S.xp-=1000;S.vip++;pushNote(S,'Level up: VIP '+S.vip)}}};
export const exchange=()=>set(S=>{if(S.money<EXCH)return toast('Not enough cash');S.money-=EXCH;S.coins++;toast('+1 gold')});
export const spend=k=>set(S=>{const g=GOLD[k];if(!g)return;if(S.coins<g.cost)return toast('Not enough gold');
 S.coins-=g.cost;FX[k](S);toast(g.label)});
