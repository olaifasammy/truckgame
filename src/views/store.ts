import { ic } from '../core/icons';
import { action } from '../core/ui';
import { set } from '../core/store';
import { list, find } from '../stores/registry';
import '../stores/index';

action('store-open', d => set(S => { S.tab = 'store'; S.storeSec = (d as any).id; }));
action('store-back', () => set(S => { S.storeSec = null; }));

const card = (s: any) => `<div class="card row" style="cursor:pointer; ${s.soon ? 'opacity:0.6;filter:grayscale(1);' : ''}" ${s.soon ? '' : `data-act="store-open" data-id="${s.id}"`}>
 <div class="ico">${ic(s.icon)}</div>
 <div class="info"><div class="c">${s.label}</div><div class="d">${s.desc}</div></div>
 ${s.soon ? '<span style="font-size:9px;font-weight:900;color:var(--mu);">COMING SOON</span>' : ic('chev')}
</div>`;

export default {
  id: 'store',
  icon: 'store',
  label: 'Store',
  render(S: any) {
    const s = S.storeSec && find(S.storeSec);
    if (s) return `<div class="top" style="background:var(--bg);border:none;"><div class="row" data-act="store-back" style="cursor:pointer;">${ic('back')} <span style="font-weight:800;font-size:16px;">${s.label}</span></div></div>` + s.render(S);
    return `<div class="sec"><span>Logistics Marketplace</span><span class="mu-tx">STORES</span></div>` + list().map(card).join('');
  }
};
