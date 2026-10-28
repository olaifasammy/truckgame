import { ic } from '../../core/icons';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { COMPANIES } from '../../domain/freight/companies/registry';
import { TRAILERS } from '../../domain/trucks/trucks.data';
import { dur, fmt } from '../../core/ui';
import { LOCATIONS } from '../../data/world';

export function renderAuctionCard(S: any, j: any) {
  const auc = (S.auctions || []).find((a: any) => a.id === j.id);
  if (!auc || !auc.expiresAt) return '';

  const cargo = CARGO_TYPES.find(c => c.id === auc.cargoId);
  const company = COMPANIES.find(c => c.id === auc.companyId);
  const timeLeft = Math.max(0, auc.expiresAt - Date.now());
  const isWinning = auc.currentWinner === 'player';
  const locFrom = LOCATIONS[auc.from || j.from];
  const locTo = LOCATIONS[auc.to || j.to];

  return `
    <div class="card auction-card" style="margin-bottom:10px; background:#0e1320; border:1px solid ${isWinning ? 'var(--grn)' : 'var(--gold)'}; border-radius:10px; padding:12px 14px; position:relative; overflow:hidden;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <!-- Left: Icon & Auction Details -->
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <div style="width:38px; height:38px; background:#080c16; border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:18px; flex-shrink:0;">
            ${ic(cargo?.icon || 'box')}
          </div>
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-weight:900; font-size:13px; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${cargo?.name || 'High-Value Contract'}
              </span>
              <span style="font-size:8px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 5px; border-radius:3px; font-weight:900; font-family:monospace;">
                LIVE REVERSE AUCTION
              </span>
            </div>
            
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">
              <span style="color:var(--gold); font-weight:700;">${locFrom?.name || auc.from || j.from}</span>
              <span>→</span>
              <span style="color:var(--tx); font-weight:700;">${locTo?.name || auc.to || j.to}</span>
              <span>·</span>
              <span>${auc.km || j.km} km</span>
              <span>·</span>
              <span>${auc.weight || j.weight}t</span>
            </div>

            <div style="font-size:9px; color:var(--mu); margin-top:2px; font-family:monospace;">
              Leader: <b style="color:${isWinning ? 'var(--grn)' : 'var(--tx)'};">${isWinning ? '★ Your Company' : auc.currentWinnerName}</b>
            </div>
          </div>
        </div>

        <!-- Right: Current Winning Bid & Action -->
        <div style="text-align:right; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end;">
          <div style="font-size:9px; color:var(--mu); text-transform:uppercase; font-family:monospace;">LOWEST BID</div>
          <div style="font-size:16px; font-weight:900; color:${isWinning ? 'var(--grn)' : 'var(--gold)'}; font-family:monospace;">
            ${fmt(auc.currentBid || 0)}
          </div>
          <div style="font-size:10px; color:${timeLeft < 20000 ? '#ef4444' : 'var(--mu)'}; font-weight:800; font-family:monospace; margin:2px 0 4px;">
            ⏱️ <span data-eta="${auc.expiresAt}">${dur(timeLeft)}</span>
          </div>
          <button class="btn gold" style="padding:4px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px; border-radius:4px; text-transform:uppercase;" data-act="open-auction" data-id="${auc.id}">
            ENTER BID ROOM →
          </button>
        </div>
      </div>
    </div>
  `;
}
