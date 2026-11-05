import { ic } from '../core/icons';
import { action, fmt } from '../core/ui';
import { GOLD, EXCH } from '../data/shop';
import { exchange, spend } from '../systems/premium';

action('exch', d => exchange((d as any)?.qty !== undefined ? +(d as any).qty : undefined));
action('spend', d => spend((d as any).item));

export default {
  id: 'premium',
  icon: 'bolt',
  label: 'Exchange',
  desc: 'Premium assets and boosts',
  render: (S: any) => {
    const maxCoins = Math.max(0, Math.floor(S.money / EXCH));

    return `
      <div class="card" style="display:flex; flex-direction:column; gap:8px; padding:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="ico">${ic('cash')}</div>
          <div class="info" style="flex:1;">
            <div class="c">Gold Exchange</div>
            <div class="d">${fmt(EXCH)} cash = 1 gold coin</div>
          </div>
        </div>

        <div style="display:flex; gap:6px; margin-top:4px;">
          <input type="number" id="premium-exchange-qty-input" placeholder="Coins Qty (e.g. 5)" min="1" step="1"
            style="flex:1; padding:6px 8px; background:#0b0f19; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:11px;" />
          <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900; white-space:nowrap;" data-act="exch" ${S.money < EXCH ? 'disabled' : ''}>
            EXCHANGE
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
          <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:800;" data-act="exch" data-qty="1" ${S.money < EXCH ? 'disabled' : ''}>+1 Gold</button>
          <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:800;" data-act="exch" data-qty="5" ${S.money < EXCH * 5 ? 'disabled' : ''}>+5 Gold</button>
          <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:800;" data-act="exch" data-qty="10" ${S.money < EXCH * 10 ? 'disabled' : ''}>+10 Gold</button>
          <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:800;" data-act="exch" data-qty="${maxCoins}" ${maxCoins <= 0 ? 'disabled' : ''}>MAX (${maxCoins})</button>
        </div>
      </div>

      <div class="sec" style="margin-top:12px;"><span>Gold Reserve</span><span class="mu-tx">${S.coins || 0} COINS</span></div>
      
      ${Object.entries(GOLD).map(([k, g]) => `
        <div class="card row" style="margin-top:6px;">
          <div class="ico" style="color:var(--gold);">${ic(g.icon)}</div>
          <div class="info"><div class="c">${g.label}</div><div class="d">${g.desc}</div></div>
          <button class="btn gold" style="min-width:80px;" data-act="spend" data-item="${k}" ${(S.coins || 0) < g.cost ? 'disabled' : ''}>${g.cost} Gold</button>
        </div>
      `).join('')}
    `;
  }
};
