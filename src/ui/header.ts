import { $, fmt, action } from '../core/ui';
import { ic } from '../core/icons';
import { set, refresh } from '../core/store';

let open = false;

action('bell', () => {
  open = !open;
  if (open) {
    set(S => { S.notes.forEach((n: any) => { n.r = 1; }); });
  } else {
    refresh();
  }
});

document.addEventListener('click', e => {
  if (open && !(e.target as HTMLElement).closest('#header')) {
    open = false;
    refresh();
  }
});

export function render(S: any) {
  const unreadCount = S.notes.filter((n: any) => !n.r).length;
  const h = $('header');
  if (!h) return;

  // Commercial DOT registration number derived deterministically from company name
  const dotNumber = 3800000 + (Math.abs(S.company.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) * 123) % 99999);
  const activeLoads = (S.active || []).filter((a: any) => a.kind !== 'move').length;
  const safetyRating = Math.min(99.8, Math.max(94.2, 98.4 + (S.level || 1) * 0.2)).toFixed(1);

  h.innerHTML = `
    <div style="width:100%; display:flex; flex-direction:column; gap:8px;">
      <!-- Top Authority & Compliance Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--mu); letter-spacing:0.5px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--grn); box-shadow:0 0 6px var(--grn);"></span>
          <span style="font-weight:700; color:var(--tx); text-transform:uppercase;">FMS TELEMATICS</span>
          <span style="color:rgba(255,255,255,0.2);">|</span>
          <span style="font-family:monospace; color:var(--gold);">USDOT #${dotNumber}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-family:monospace; font-size:10px;">
          <span>SAFETY: <b style="color:var(--grn);">${safetyRating}%</b></span>
          <span style="color:rgba(255,255,255,0.2);">|</span>
          <span>TRANSIT: <b style="color:var(--tx);">${activeLoads}</b></span>
        </div>
      </div>

      <!-- Main Command Console Row -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <!-- Company Identity -->
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <div style="width:36px; height:36px; background:#0f172a; border:1px solid rgba(193,154,91,0.4); border-radius:6px; display:grid; place-items:center; flex-shrink:0;">
            <span style="font-weight:900; font-size:13px; color:var(--gold); font-family:monospace; letter-spacing:0.5px;">
              ${S.company.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div style="min-width:0;">
            <div style="font-size:14px; font-weight:800; color:var(--tx); letter-spacing:0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-transform:uppercase;">
              ${S.company}
            </div>
            <div style="font-size:10px; color:var(--mu); display:flex; align-items:center; gap:4px; margin-top:1px;">
              <span>Class 8 Motor Carrier</span>
              <span>·</span>
              <span style="color:var(--gold); font-weight:700;">TIER ${S.level || 1}</span>
            </div>
          </div>
        </div>

        <!-- Corporate Ledger & Telematics Actions -->
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <!-- Financial Balances -->
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
            <div style="display:flex; align-items:center; gap:4px; font-family:monospace; font-size:13px; font-weight:800; color:var(--grn);" title="Operating Capital">
              <span style="font-size:10px; color:var(--mu); font-family:sans-serif; font-weight:600;">CASH</span>
              <span>${fmt(S.money)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:4px; font-family:monospace; font-size:11px; font-weight:700; color:var(--gold);" title="Fleet Reserve Credits">
              <span style="font-size:9px; color:var(--mu); font-family:sans-serif; font-weight:600;">BONDS</span>
              <span>${S.coins}</span>
            </div>
          </div>

          <!-- Dispatch Telex Alert Trigger -->
          <div style="display:flex; align-items:center; gap:4px; margin-left:4px;">
            <button class="bell" data-act="bell" style="background:var(--s2); border:1px solid rgba(255,255,255,0.1); border-radius:6px; width:34px; height:34px; display:grid; place-items:center; cursor:pointer; position:relative;" title="Dispatch Telex / Alerts">
              ${ic('radio')}
              ${unreadCount > 0 ? `
                <span style="position:absolute; top:-4px; right:-4px; background:var(--red); color:#fff; font-size:8px; font-weight:900; min-width:14px; height:14px; border-radius:7px; display:grid; place-items:center; padding:0 3px; font-family:monospace;">
                  ${unreadCount}
                </span>
              ` : ''}
            </button>

            <!-- Carrier Rankings -->
            <button class="rank-btn" data-act="tab" data-id="rankings" style="background:var(--s2); border:1px solid rgba(255,255,255,0.1); border-radius:6px; width:34px; height:34px; display:grid; place-items:center; cursor:pointer; color:var(--gold);" title="Carrier Safety & Tonnage Rankings">
              ${ic('up')}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dispatch Telex Drawer -->
    <div class="np ${open ? 'on' : ''}" style="position:absolute; top:calc(100% + 4px); left:0; width:100%; background:#0f172a; border-bottom:2px solid var(--gold); border-top:1px solid var(--line); box-shadow:0 16px 40px rgba(0,0,0,0.85); z-index:1500; max-height:300px; overflow-y:auto; padding:0;">
      <div style="background:#141f36; padding:8px 16px; font-size:10px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase; display:flex; justify-content:space-between; align-items:center;">
        <span>PRIORITY DISPATCH TELEX & OPERATIONS LOG</span>
        <span style="font-family:monospace; color:var(--mu);">${S.notes.length} ENTRIES</span>
      </div>
      <div>
        ${S.notes.length > 0 ? S.notes.map((n: any, idx: number) => `
          <div style="padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.06); font-size:11px; line-height:1.4; color:var(--tx); display:flex; gap:10px; align-items:flex-start;">
            <span style="font-family:monospace; color:var(--mu); font-size:9px; margin-top:2px; flex-shrink:0;">#${String(idx + 1).padStart(2, '0')}</span>
            <div style="flex:1;">
              <div>${n.t}</div>
              <div style="font-size:9px; color:var(--mu); margin-top:3px; font-family:monospace;">ACKNOWLEDGED BY FMS ENGINE</div>
            </div>
          </div>
        `).join('') : `
          <div style="padding:20px; text-align:center; color:var(--mu); font-size:11px; font-family:monospace;">
            ALL DISPATCH CHANNELS NOMINAL · NO UNRESOLVED TELEX MESSAGES
          </div>
        `}
      </div>
    </div>
  `;
}
