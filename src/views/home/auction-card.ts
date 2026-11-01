import { ic } from '../../core/icons';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { COMPANIES } from '../../domain/freight/companies/registry';
import { TRAILERS } from '../../domain/trucks/trucks.data';
import { dur, fmt } from '../../core/ui';
import { LOCATIONS } from '../../data/world';
import { getCompanyProgression } from '../../domain/company/progression';

export function renderAuctionCard(S: any, j: any) {
  const auc = (S.auctions || []).find((a: any) => a.id === j.id);
  if (!auc || !auc.expiresAt) return '';

  const prog = getCompanyProgression(S);
  const isVip = prog.tier >= 3;

  const cargo = CARGO_TYPES.find(c => c.id === auc.cargoId);
  const company = COMPANIES.find(c => c.id === auc.companyId);
  const timeLeft = Math.max(0, auc.expiresAt - Date.now());
  const isWinning = auc.currentWinner === 'player';
  const locFrom = LOCATIONS[auc.from || j.from];
  const locTo = LOCATIONS[auc.to || j.to];

  return `
    <div class="card auction-card" style="margin-bottom:6px; background:#0e1320; border:1px solid ${isWinning ? 'var(--grn)' : 'rgba(193,154,91,0.5)'}; border-radius:8px; padding:6px 10px; position:relative; overflow:hidden;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <!-- Left: Icon & Auction Details -->
        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
          <div style="width:28px; height:28px; background:#080c16; border:1px solid var(--gold); border-radius:6px; display:grid; place-items:center; color:var(--gold); font-size:14px; flex-shrink:0;">
            ${ic(cargo?.icon || 'box')}
          </div>
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-weight:900; font-size:11px; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${cargo?.name || 'High-Value Contract'}
              </span>
              <span style="font-size:7px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); color:var(--gold); padding:0 4px; border-radius:2px; font-weight:800; font-family:monospace;">
                REVERSE BID
              </span>
            </div>
            
            <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
              <span style="color:var(--gold); font-weight:700;">${locFrom?.name || auc.from || j.from}</span>
              <span>→</span>
              <span style="color:var(--tx); font-weight:700;">${locTo?.name || auc.to || j.to}</span>
              <span>· ${auc.km || j.km}km · ${auc.weight || j.weight}t · </span>
              <span style="color:${isWinning ? 'var(--grn)' : 'var(--mu)'};">${isWinning ? '★ Winning' : auc.currentWinnerName}</span>
            </div>
          </div>
        </div>

        <!-- Right: Lowest Bid, Countdown & Enter Button -->
        <div style="text-align:right; flex-shrink:0; display:flex; align-items:center; gap:10px;">
          <div style="line-height:1.2;">
            <div style="font-size:13px; font-weight:900; color:${isWinning ? 'var(--grn)' : 'var(--gold)'}; font-family:monospace;" data-auc-bid="${auc.id}">
              ${fmt(auc.currentBid || 0)}
            </div>
            <div style="font-size:8px; color:${timeLeft < 20000 ? '#ef4444' : 'var(--mu)'}; font-weight:800; font-family:monospace;">
              ⏱️ <span data-eta="${auc.expiresAt}">${dur(timeLeft)}</span>
            </div>
          </div>
          ${isVip ? `
            <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:900; letter-spacing:0.5px; border-radius:4px; text-transform:uppercase;" data-act="open-auction" data-id="${auc.id}">
              BID →
            </button>
          ` : `
            <button class="btn alt" style="padding:4px 8px; font-size:8px; font-weight:800; border-radius:4px; text-transform:uppercase; color:#ef4444; border-color:rgba(239,68,68,0.4);" data-act="locked-vip-bid" data-id="${auc.id}">
              🔒 VIP
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
