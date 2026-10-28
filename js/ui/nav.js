import {$,action} from '../core/ui.js';
import {ic} from '../core/icons.js';
import {set} from '../core/store.js';
import {list} from '../core/router.js';
action('tab',d=>set(S=>{S.tab=d.id}));
export const render=S=>{$('nav').innerHTML=list().map(v=>`<div class="tab ${v.id===S.tab?'on':''}" data-act="tab" data-id="${v.id}">${ic(v.icon)}${v.label}</div>`).join('')};
