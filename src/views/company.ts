import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { set } from '../core/store';
import { fillPool } from '../systems/drivers';

action('logout', () => {
  set(S => {
    S.isAuthenticated = false;
  });
  toast('Logged out successfully');
  setTimeout(() => location.reload(), 500);
});

export default {
  id: 'company',
  icon: 'company',
  label: 'HQ Depot',
  render: (S: any) => {
    fillPool(S);
    const avgSkill = S.drivers.length > 0
      ? (S.drivers.reduce((acc: number, d: any) => acc + (d.skill || 1), 0) / S.drivers.length).toFixed(1)
      : '1.0';

    return `
      <div class="profile-wrap" style="background:linear-gradient(180deg, #111827 0%, #0a0f1d 100%); border-bottom:1px solid #1f293d; padding:24px 16px; text-align:center;">
        <div class="avatar" style="width:68px; height:68px; background:var(--gold); border-radius:16px; margin:0 auto 12px; display:grid; place-items:center; font-size:32px; color:#0a0f1d; font-weight:900; font-family:monospace;">
          ${S.company.charAt(0).toUpperCase()}
        </div>
        <div class="avatar-tx" style="font-size:18px; font-weight:900; color:var(--tx); letter-spacing:0.3px; text-transform:uppercase;">
          ${S.company}
        </div>
        <div style="font-size:10px; font-weight:800; color:var(--gold); letter-spacing:1px; margin-top:4px; font-family:monospace;">
          CORPORATE LOGISTICS HEADQUARTERS · TIER ${S.level || 1}
        </div>
      </div>

      <!-- Executive Operations & Financial KPIs -->
      <div class="grid2" style="padding:14px; gap:10px;">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace;">${S.loads}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Completed Loads</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace;">${S.drivers.length}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Active Personnel</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--grn); font-family:monospace;">$${(S.stats?.earned || 0).toLocaleString()}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Gross Freight Revenue</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--gold); font-family:monospace;">${(S.stats?.km || 0).toLocaleString()} km</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Highway Logged</span>
        </div>
      </div>

      <!-- Dedicated Link Gateway to Full Driver Management & Recruitment View -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">HUMAN RESOURCES & CREW OPERATIONS</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">CDL PORTAL</span>
        </div>

        <div class="card" style="padding:16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid var(--gold); border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; box-shadow:0 6px 18px rgba(0,0,0,0.4); transition:all 0.2s;" data-act="tab" data-id="drivers">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:46px; height:46px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:22px; flex-shrink:0;">
              ${ic('user')}
            </div>
            <div>
              <div style="font-size:14px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                Drivers Management & Recruitment
              </div>
              <div style="font-size:11px; color:var(--mu); margin-top:3px; font-family:monospace;">
                <b style="color:var(--tx);">${S.drivers.length}</b> Employed · Avg Skill <b style="color:var(--gold);">${avgSkill}★</b> · <b style="color:var(--grn);">${S.pool.length}</b> in Recruitment Pool
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:11px; font-weight:900; flex-shrink:0;">
            <span>MANAGE CREW</span>
            ${ic('chev')}
          </div>
        </div>
      </div>

      <!-- Priority Operations Log -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">OPERATIONS & DISPATCH LOG</span>
        </div>
        ${S.notes.slice(0, 5).map((n: any, idx: number) => `
          <div class="card" style="padding:12px; margin-bottom:8px; background:#111827; border:1px solid #1f293d; border-radius:8px; font-size:11px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:9px; font-family:monospace; color:var(--mu);">
              <span style="color:var(--gold); font-weight:700;">TRANSMISSION LOG #${String(idx + 1).padStart(2, '0')}</span>
              <span>RECORDED</span>
            </div>
            <div style="font-weight:600; color:var(--tx); line-height:1.4;">${n.t}</div>
          </div>
        `).join('')}
      </div>

      <!-- System Sign Out -->
      <div style="padding:14px;">
        <button class="btn alt" style="width:100%; padding:10px; font-size:11px; font-weight:800; letter-spacing:0.5px; border-radius:6px; text-transform:uppercase;" data-act="logout">
          Sign Out of Carrier System
        </button>
      </div>
      <div style="height:20px;"></div>
    `;
  }
};
