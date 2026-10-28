import {ic} from '../core/icons.js';
import {action} from '../core/ui.js';
import {set} from '../core/store.js';
import {list,find} from '../stores/registry.js';
import '../stores/index.js';
action('store-open',d=>set(S=>{S.tab='store';S.storeSec=d.id}));
action('store-back',()=>set(S=>{S.storeSec=null}));
const card=s=>`<div class="scard ${s.soon?'soon':''}" ${s.soon?'':`data-act="store-open" data-id="${s.id}"`}>
 <div class="ico">${ic(s.icon)}</div><div class="info"><div class="c">${s.label}</div><div class="d">${s.desc}</div></div>${s.soon?'<small>Soon</small>':ic('chev')}</div>`;
export default{id:'store',icon:'store',label:'Store',
 render(S){
  const s=S.storeSec&&find(S.storeSec);
  if(s)return `<div class="sback" data-act="store-back">${ic('back')} Store · <b>${s.label}</b></div>`+s.render(S);
  return `<div class="sec"><span>Stores</span></div>`+list().map(card).join('');
 }};
