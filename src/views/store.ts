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

    // Filter list to only show registered and active stores (Dealership & Parts)
    const storeItems = list().map(card).join('');

    return `
      <div style="padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <div style="display:flex; flex-direction:column;">
            <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">Logistics Marketplace</span>
            <span class="mu-tx" style="font-size:9px; font-family:monospace;">COMMERCIAL PROCUREMENT</span>
          </div>
          <div style="text-align:right;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace;">OPERATING CAPITAL</div>
            <div style="font-size:14px; font-weight:900; color:var(--grn); font-family:monospace;">$${(S.money || 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${storeItems}
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: rgba(193,154,91,0.05); border: 1px dashed rgba(193,154,91,0.2); border-radius: 12px; text-align: center;">
          <div style="font-size: 10px; color: var(--mu); font-family: monospace; line-height: 1.4;">
            Marketplace expansion pending regulatory approval. <br/> 
            Only authorized OEM Dealerships and Parts Suppliers currently active.
          </div>
        </div>
      </div>
    `;
  }
};
