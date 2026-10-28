import {ic} from '../core/icons.js';
import {action,fmt} from '../core/ui.js';
import {MODELS} from '../data/trucks.js';
import {buyTruck} from '../systems/fleet.js';
import {slots} from '../systems/offices.js';
action('buy',d=>buyTruck(d.model));
const item=(S,k,m)=>`<div class="shop"><div class="ico">${ic('truck')}</div>
 <div class="info"><div class="c">${m.name}</div><div class="d">${m.speed}x speed · ${m.wear}x wear · ${m.haul.includes('hazmat')?'Hazmat':'No hazmat'}</div></div>
 <button class="btn ${S.money<m.price?'dim':''}" data-act="buy" data-model="${k}">${fmt(m.price)}</button></div>`;
export default{id:'dealership',icon:'truck',label:'Dealership',desc:'Trucks and trailers',
 render:S=>`<div class="sec"><span>Trucks</span><span>${S.fleet.length}/${slots(S)} slots</span></div>`+Object.entries(MODELS).map(([k,m])=>item(S,k,m)).join('')};
