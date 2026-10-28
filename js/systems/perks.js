import {get,set} from '../core/store.js';
import {toast} from '../core/ui.js';
import {PERKS} from '../data/shop.js';
export const perkLvl=k=>((get()||{}).perks||{})[k]||0;
export const disc=k=>1-perkLvl(k)*PERKS[k].per;
export const perkCost=k=>PERKS[k].base*(perkLvl(k)+1);
export const buyPerk=k=>set(S=>{const p=PERKS[k],l=S.perks[k]||0,c=p.base*(l+1);
 if(l>=p.max)return;if(S.money<c)return toast('Not enough cash');
 S.money-=c;S.perks[k]=l+1;toast(p.label+' → L'+(l+1))});
