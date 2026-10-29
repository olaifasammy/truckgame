import { $, fmt, action } from '../core/ui';
import { ic } from '../core/icons';
import { set, refresh } from '../core/store';
import { getCompanyProgression, renderProgressLogoRing } from '../domain/company/progression';

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

  const prog = getCompanyProgression(S);

  // Commercial DOT registration number derived deterministically from company name
  const dotNumber = 3800000 + (Math.abs(S.company.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) * 123) % 99999);
  const activeLoads = (S.active || []).filter((a: any) => a.kind !== 'move').length;
  const safetyRating = Math.min(99.8, Math.max(94.2, 98.4 + (prog.tier || 0) * 0.1)).toFixed(1);

  h.innerHTML = `
    <div style="width:100%; display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <!-- Left: Logo Ring & Carrier Identity with Rank -->
      <div style="display:flex; align-items:center; gap:8px; min-width:0; cursor:pointer;" data-act="tab" data-id="company" title="Logistics HQ · Current Rank: ${prog.title}">
        ${renderProgressLogoRing(S, 34, 2.5)}
        <div style="min-width:0;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:12px; font-weight:900; color:var(--tx); letter-spacing:0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-transform:uppercase;">
              ${S.company}
            </span>
            <span style="font-size:8px; font-family:monospace; color:var(--mu); opacity:0.75;">DOT#${dotNumber}</span>
          </div>
          <div style="display:flex; align-items:center; gap:5px; margin-top:1px;">
            <span style="display:inline-flex; align-items:center; background:${prog.color}15; color:${prog.color}; border:1px solid ${prog.color}45; padding:0 4px; border-radius:3px; font-weight:800; font-family:monospace; font-size:9px; letter-spacing:0.3px;">
              RANK: ${prog.title.toUpperCase()}
            </span>
            <span style="font-size:8px; color:var(--mu); font-family:monospace;">
              ${prog.percent}% XP
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Operating Capital, Bonds & Tactical Controls -->
      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
        <div style="text-align:right; font-family:monospace; line-height:1.2;">
          <div style="font-size:12px; font-weight:900; color:var(--grn);" id="hdr-cash-val" title="Operating Cash">
            ${fmt(S.money)}
          </div>
          <div style="font-size:9px; font-weight:800; color:var(--gold); display:flex; align-items:center; justify-content:flex-end; gap:2px;" title="Fleet Bonds">
            <span style="color:var(--mu); font-size:8px;">BONDS:</span>
            <span id="hdr-coin-val">${S.coins}</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:4px;">
          <!-- Dispatch Telex Alert Trigger -->
          <button class="bell" data-act="bell" style="background:var(--s2); border:1px solid rgba(255,255,255,0.1); border-radius:6px; width:28px; height:28px; display:grid; place-items:center; cursor:pointer; position:relative; padding:0;" title="Dispatch Telex / Alerts">
            ${ic('radio')}
            ${unreadCount > 0 ? `
              <span style="position:absolute; top:-3px; right:-3px; background:var(--red); color:#fff; font-size:7px; font-weight:900; min-width:12px; height:12px; border-radius:6px; display:grid; place-items:center; padding:0 2px; font-family:monospace;">
                ${unreadCount}
              </span>
            ` : ''}
          </button>

          <!-- Carrier Rankings -->
          <button class="rank-btn" data-act="tab" data-id="rankings" style="background:var(--s2); border:1px solid rgba(255,255,255,0.1); border-radius:6px; width:28px; height:28px; display:grid; place-items:center; cursor:pointer; color:var(--gold); padding:0;" title="Global Leaderboard Rankings">
            ${ic('up')}
          </button>
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
