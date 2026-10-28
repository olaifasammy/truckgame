import { ic } from '../core/icons';
import { fmt } from '../core/ui';

export default {
  id: 'finance',
  icon: 'cash',
  label: 'Finance',
  render: (S: any) => {
    return `
      <div class="profile-wrap" style="padding: 20px 16px;">
        <div style="font-size: 10px; color: var(--gold); font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Company Financials</div>
        <div style="font-size: 24px; font-weight: 900; color: var(--tx);">Cash Flow</div>
      </div>

      <div class="grid2">
        <div class="stat-box">
          <span class="stat-lab">Total Revenue</span>
          <span class="stat-val" style="color:var(--grn);">${fmt(S.stats.earned)}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lab">Current Balance</span>
          <span class="stat-val">${fmt(S.money)}</span>
        </div>
      </div>

      <div class="sec"><span>Operations History</span><span class="mu-tx">RECENT INVOICES</span></div>
      
      <div style="padding: 0 12px;">
        ${S.active.length > 0 ? S.active.map((a: any) => `
          <div class="card row" style="margin: 0 0 8px 0; padding: 12px;">
            <div class="ico" style="background:var(--s2);color:var(--mu);">${ic('clock')}</div>
            <div class="info">
              <div class="c" style="font-size:13px;">${a.cargo}</div>
              <div class="d">PENDING: ${a.from} → ${a.to}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; font-weight: 800; color: var(--mu);">$${a.pay.toLocaleString()}</div>
            </div>
          </div>
        `).join('') : '<div style="text-align:center; padding:20px; color:var(--mu); font-size:11px;">No pending invoices.</div>'}
      </div>
      
      <div class="sec"><span>Financial Assets</span><span class="mu-tx">ENTERPRISE VALUE</span></div>
      <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div class="row" style="justify-content: space-between;">
          <span class="mu-tx">Fleet Value</span>
          <span style="font-weight: 700;">${fmt(S.fleet.length * 125000)}</span>
        </div>
        <div class="row" style="justify-content: space-between;">
          <span class="mu-tx">Depot Assets</span>
          <span style="font-weight: 700;">${fmt(S.offices.length * 50000)}</span>
        </div>
        <div style="border-top: 1px solid var(--line); padding-top: 12px; display: flex; justify-content: space-between;">
          <span style="font-weight: 800; color: var(--gold);">TOTAL EQUITY</span>
          <span style="font-weight: 800; color: var(--gold);">${fmt(S.money + (S.fleet.length * 125000) + (S.offices.length * 50000))}</span>
        </div>
      </div>
    `;
  }
};
