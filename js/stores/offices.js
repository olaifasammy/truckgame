import {ic} from '../core/icons.js';
import {action,fmt} from '../core/ui.js';
import {OFFICES,BASE_SLOTS} from '../data/shop.js';
import {buyOffice,slots} from '../systems/offices.js';
action('office',d=>buyOffice(d.id));
export default{id:'offices',icon:'company',label:'Offices',desc:'More offices, more truck slots',
 render:S=>`<div class="sec"><span>Truck slots</span><span>${S.fleet.length}/${slots(S)} used</span></div>`+
 Object.entries(OFFICES).map(([k,o])=>{const own=S.offices.includes(k),lock=S.vip<o.vip;
  return `<div class="shop"><div class="ico">${ic('company')}</div><div class="info"><div class="c">${o.name}</div><div class="d">+${o.slots} slots${o.vip?' · VIP '+o.vip:''}</div></div>
  <button class="btn ${!own&&(lock||S.money<o.price)?'dim':''}" data-act="office" data-id="${k}" ${own?'disabled':''}>${own?'Owned':lock?'VIP '+o.vip:fmt(o.price)}</button></div>`}).join('')+
 `<div class="d" style="padding:4px 16px">HQ includes ${BASE_SLOTS} slots.</div>`};
