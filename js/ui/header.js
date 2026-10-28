import {$,action,fmt} from '../core/ui.js';
import {ic} from '../core/icons.js';
import {set,refresh} from '../core/store.js';
let open=false;
action('bell',()=>{open=!open;open?set(S=>S.notes.forEach(n=>n.r=1)):refresh()});
document.addEventListener('click',e=>{if(open&&!e.target.closest('#header')){open=false;refresh()}});
const chip=(icon,val,cls='')=>`<div class="chip ${cls}">${ic(icon)}<span>${val}</span><button data-act="tab" data-id="store">${ic('plus')}</button></div>`;
export function render(S){
 const un=S.notes.filter(n=>!n.r).length;
 const ini=S.company.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
 $('header').innerHTML=`
 <div class="ring"><svg viewBox="0 0 48 48"><circle class="bg" cx="24" cy="24" r="21"/><circle class="fg" cx="24" cy="24" r="21" stroke-linecap="round" style="stroke-dashoffset:${132*(1-S.xp/1000)}"/></svg><div class="av">${ini}</div><span class="badge">VIP ${S.vip}</span></div>
 <div class="who"><div class="rowt"><div class="co">${S.company}</div>
 <button class="bell" data-act="bell">${ic('bell')}${un?`<em>${un}</em>`:''}</button></div>
 <div class="cur">${chip('coin',S.coins)}${chip('cash',fmt(S.money),'m')}</div></div>
 <div class="np ${open?'on':''}">${S.notes.map(n=>`<div>${n.t}</div>`).join('')||'<div>No notifications</div>'}</div>`;
}
