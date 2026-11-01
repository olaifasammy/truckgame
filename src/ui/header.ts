import { $, fmt } from '../core/ui';
import { ic } from '../core/icons';
import { getCompanyProgression, renderProgressLogoRing } from '../domain/company/progression';

export function render(S: any) {
  const unreadCount = (S.notes || []).filter((n: any) => !n.read).length;
  const h = $('header');
  if (!h) return;

  const prog = getCompanyProgression(S);

  // Commercial DOT registration number derived deterministically from company name
  const dotNumber = 3800000 + (Math.abs(S.company.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) * 123) % 99999);

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
          <!-- Corporate Inbox Trigger -->
          <button class="bell" data-act="tab" data-id="notifications" style="background:var(--s2); border:1px solid rgba(255,255,255,0.1); border-radius:6px; width:28px; height:28px; display:grid; place-items:center; cursor:pointer; position:relative; padding:0; color:${unreadCount > 0 ? 'var(--gold)' : 'var(--mu)'};" title="Corporate Inbox · ${unreadCount} Unread Alerts">
            ${ic('bell')}
            ${unreadCount > 0 ? `
              <span style="position:absolute; top:-3px; right:-3px; background:var(--red); color:#fff; font-size:7px; font-weight:900; min-width:12px; height:12px; border-radius:6px; display:grid; place-items:center; padding:0 2px; font-family:monospace; border:1px solid #000;">
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
  `;
}
