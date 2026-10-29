import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { set, refresh } from '../core/store';
import { fillPool } from '../systems/drivers';
import { getCompanyProgression, renderProgressLogoRing } from '../domain/company/progression';
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
    const prog = getCompanyProgression(S);
    const avgSkill = S.drivers.length > 0
      ? (S.drivers.reduce((acc: number, d: any) => acc + (d.skill || 1), 0) / S.drivers.length).toFixed(1)
      : '1.0';

    // Aggregate storage yard trailers
    const yardTrailers: Record<string, number> = {};
    (S.trailers || []).forEach((t: string) => {
      yardTrailers[t] = (yardTrailers[t] || 0) + 1;
    });
    const totalYardTrailers = (S.trailers || []).length;

    return `
      <div class="profile-wrap" style="background:linear-gradient(180deg, #111827 0%, #0a0f1d 100%); border-bottom:1px solid #1f293d; padding:28px 16px 20px; text-align:center;">
        <!-- Circular Progress Ring Encircled Logo -->
        <div style="margin:0 auto 14px; display:inline-block;">
          ${renderProgressLogoRing(S, 84, 5)}
        </div>

        <div class="avatar-tx" style="font-size:18px; font-weight:900; color:var(--tx); letter-spacing:0.3px; text-transform:uppercase;">
          ${S.company}
        </div>
        <div style="display:inline-flex; align-items:center; gap:6px; background:${prog.color}18; border:1px solid ${prog.color}50; border-radius:4px; padding:3px 10px; margin-top:8px;">
          <span style="font-size:11px; font-weight:900; color:${prog.color}; font-family:monospace; letter-spacing:0.5px;">
            CARRIER RANK: ${prog.title.toUpperCase()} (TIER ${prog.tier})
          </span>
        </div>

        <!-- Progress Bar Line Towards Next Rank -->
        <div style="max-width:320px; margin:16px auto 0; background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:10px 14px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace; margin-bottom:6px;">
            <span style="color:var(--mu);">PROGRESSION TO <b style="color:var(--tx);">${prog.nextTitle.toUpperCase()}</b></span>
            <span style="color:${prog.color}; font-weight:800;">${prog.percent}%</span>
          </div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="width:${prog.percent}%; height:100%; background:linear-gradient(90deg, ${prog.strokeGrad[0]}, ${prog.strokeGrad[1]}); transition:width 0.5s ease; border-radius:3px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:var(--mu); font-family:monospace; margin-top:5px;">
            <span>${prog.xpInTier} XP</span>
            <span>Target: ${prog.targetXp} XP</span>
          </div>
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

      <!-- Executive Operations & Logistics Gateway Hub -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">OPERATIONS & LOGISTICS DEPARTMENTS</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">CARRIER INFRASTRUCTURE</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <!-- 1. Dedicated Link: Drivers Management & Recruitment View -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="tab" data-id="drivers">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(193,154,91,0.12); border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:20px; flex-shrink:0;">
                ${ic('user')}
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Commercial Drivers & CDL Academy
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--tx);">${S.drivers.length}</b> Employed · Avg Skill <b style="color:var(--gold);">${avgSkill}★</b> · <b style="color:var(--grn);">${S.pool.length}</b> Recruits
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>MANAGE CREW</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 2. Dedicated Link: Central Storage & Logistics Depot -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="tab" data-id="storage">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(56,189,248,0.12); border:1px solid #38bdf8; border-radius:8px; display:grid; place-items:center; color:#38bdf8; font-size:20px; flex-shrink:0;">
                📦
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Central Storage & Logistics Depot
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--gold);">${totalYardTrailers}</b> Unhitched Trailers · <b style="color:var(--tx);">${Object.values(S.partsInventory || {}).reduce((a: number, b: any) => a + Number(b), 0)}</b> Spares in Stock
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>OPEN STORAGE</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 3. Dedicated Link: OEM Commercial Trailer Equipment Depot -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid var(--gold); border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="open-trailer-depot">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:20px; flex-shrink:0;">
                🏗️
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--gold); letter-spacing:0.3px;">
                  Commercial Trailer Equipment Depot
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  Order Lowboys, Reefers, Tippers, LCV Doubles & Tankers
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>TRAILER DEPOT</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 4. Dedicated Link: Commercial Freight Licenses & Operating Authorities -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="open-storage-subtab" data-subtab="licenses">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(34,197,94,0.12); border:1px solid var(--grn); border-radius:8px; display:grid; place-items:center; color:var(--grn); font-size:20px; flex-shrink:0;">
                📜
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Freight Licenses & Regulatory Compliance
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--grn);">${(S.licenses || ['standard']).length}</b> Active Permits · ADR Hazmat, Cold Chain & Heavy Haul
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>VIEW PERMITS</span>
              ${ic('chev')}
            </div>
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

