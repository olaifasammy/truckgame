import { placeBid } from '../../systems/jobs';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { COMPANIES } from '../../domain/freight/companies/registry';
import { TRAILERS } from '../../domain/trucks/trucks.data';
import { dur, fmt } from '../../core/ui';
import { ic } from '../../core/icons';
import { LOCATIONS } from '../../data/world';
import { getRouteEnv } from '../../systems/calc';

export let activeAuctionModalId: number | null = null;

export function openAuctionModal(auctionId: number) {
  activeAuctionModalId = auctionId;
  const S = (window as any).__getStore?.();
  if (S) renderModalOverlay(S);
}

export function closeAuctionModal() {
  activeAuctionModalId = null;
  const existing = document.getElementById('auction-modal-overlay');
  if (existing) existing.remove();
}

export function renderModalOverlay(S: any) {
  if (activeAuctionModalId === null) return;
  const auc = (S.auctions || []).find((a: any) => a.id === activeAuctionModalId);
  if (!auc) {
    closeAuctionModal();
    return;
  }

  const cargo = CARGO_TYPES.find(c => c.id === auc.cargoId);
  const company = COMPANIES.find(c => c.id === auc.companyId);
  const timeLeft = Math.max(0, auc.expiresAt - Date.now());
  const isWinning = auc.currentWinner === 'player';
  const locFrom = LOCATIONS[auc.from];
  const locTo = LOCATIONS[auc.to];
  const routeEnv = getRouteEnv(auc.from, auc.to);

  // Financial Telematics: Operating Cost Estimate
  const estFuelLiters = (auc.km / 100) * (32 + (auc.weight * 0.4));
  const estFuelCost = Math.round(estFuelLiters * 2.5);
  const estDriverPay = Math.round((auc.km * 0.35));
  const totalCost = estFuelCost + estDriverPay;
  const netProfit = Math.max(0, auc.currentBid - totalCost);
  const profitMargin = Math.round((netProfit / Math.max(1, auc.currentBid)) * 100);

  // Quick undercut options
  const under1 = Math.max(totalCost + 100, auc.currentBid - 150);
  const under2 = Math.max(totalCost + 100, auc.currentBid - 350);
  const under3 = Math.max(totalCost + 100, auc.currentBid - 750);

  const existingInput = document.getElementById('custom-bid-input') as HTMLInputElement;
  const isInputFocused = existingInput && document.activeElement === existingInput;
  const preservedInputValue = existingInput ? existingInput.value : '';

  let existing = document.getElementById('auction-modal-overlay');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'auction-modal-overlay';
    document.body.appendChild(existing);
  }

  existing.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,8,18,0.92); backdrop-filter: blur(4px);
    z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  const defaultBidVal = preservedInputValue || String(Math.max(totalCost + 100, auc.currentBid - 250));

  existing.innerHTML = `
    <div id="auc-modal-content" style="background:#0e1320; border:2px solid var(--gold); border-radius:12px; width:100%; max-width:440px; max-height:92vh; overflow-y:auto; padding:18px; box-shadow:0 25px 60px rgba(0,0,0,0.9); position:relative; color:var(--tx);">
      <!-- Close Button -->
      <button id="close-auc-modal" style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:var(--mu); font-size:14px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center; z-index:10;">✕</button>
      
      <!-- Auction Header -->
      <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:6px; font-size:10px; color:var(--gold); font-family:monospace; text-transform:uppercase; font-weight:800;">
          <span>REVERSE FREIGHT BIDDING ROOM</span>
          <span>·</span>
          <span>SEALED TENDER</span>
        </div>
        <h3 style="margin:2px 0 1px; font-size:17px; font-weight:900; color:var(--tx);">
          ${cargo?.name || 'Commercial Freight Contract'}
        </h3>
        <div style="font-size:11px; color:var(--mu); font-family:monospace;">
          Client: <b style="color:var(--tx);">${company?.name || 'Shipper Consortium'}</b> · ${auc.from} → ${auc.to} (${auc.km} km · ${auc.weight}t)
        </div>
      </div>

      <!-- Live Auction Telematics Box -->
      <div style="background:#070a12; border:1px solid ${isWinning ? 'var(--grn)' : '#1e2638'}; border-radius:8px; padding:12px; text-align:center; margin-bottom:12px;">
        <div style="font-size:9px; color:var(--mu); text-transform:uppercase; letter-spacing:1px; font-family:monospace;">
          CURRENT WINNING LOWEST BID
        </div>
        <div style="font-size:28px; font-weight:900; color:${isWinning ? 'var(--grn)' : 'var(--gold)'}; font-family:monospace; margin:4px 0;">
          ${fmt(auc.currentBid || 0)}
        </div>
        <div style="font-size:11px; color:var(--tx); font-family:monospace;">
          Leading Carrier: <b style="color:${isWinning ? 'var(--grn)' : 'var(--gold)'};">${isWinning ? '★ Your Fleet (Lowest Bidder)' : auc.currentWinnerName}</b>
        </div>
        <div style="font-size:11px; font-weight:800; color:${timeLeft < 20000 ? 'var(--red)' : 'var(--mu)'}; font-family:monospace; margin-top:4px;">
          ⏱️ Contract Closes In: <b>${dur(timeLeft)}</b>
        </div>
      </div>

      <!-- Financial Cost & Profit Telematics -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:10px; font-family:monospace;">
        <div style="font-size:8px; font-weight:800; color:var(--gold); text-transform:uppercase; margin-bottom:6px;">
          OPERATIONAL MARGIN ANALYSIS
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:var(--mu);">
          <span>Est. Diesel Expense:</span>
          <span style="color:var(--tx);">${fmt(estFuelCost)} (${Math.round(estFuelLiters)} L)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--mu);">
          <span>Est. CDL Driver Payroll:</span>
          <span style="color:var(--tx);">${fmt(estDriverPay)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; font-weight:800;">
          <span style="color:var(--tx);">Projected Operating Profit:</span>
          <span style="color:${netProfit > 0 ? 'var(--grn)' : 'var(--red)'};">${fmt(netProfit)} (${profitMargin}%)</span>
        </div>
      </div>

      <!-- Smart Undercut Quick Bid Buttons -->
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:9px; color:var(--mu); font-family:monospace; text-transform:uppercase;">
            Smart Bid Undercut Options
          </span>
          ${isWinning ? `<span style="font-size:8px; color:var(--grn); font-weight:800; font-family:monospace;">● LOWEST TENDER SECURED</span>` : ''}
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
          <button id="bid-opt-1" class="btn alt" style="padding:8px 4px; font-size:10px; font-weight:800;" ${under1 >= auc.currentBid || isWinning ? 'disabled' : ''}>
            -$150<br><span style="font-size:9px; color:var(--gold); font-family:monospace;">${fmt(under1)}</span>
          </button>
          <button id="bid-opt-2" class="btn alt" style="padding:8px 4px; font-size:10px; font-weight:800;" ${under2 >= auc.currentBid || isWinning ? 'disabled' : ''}>
            -$350<br><span style="font-size:9px; color:var(--gold); font-family:monospace;">${fmt(under2)}</span>
          </button>
          <button id="bid-opt-3" class="btn alt" style="padding:8px 4px; font-size:10px; font-weight:800;" ${under3 >= auc.currentBid || isWinning ? 'disabled' : ''}>
            -$750<br><span style="font-size:9px; color:var(--gold); font-family:monospace;">${fmt(under3)}</span>
          </button>
        </div>
      </div>

      <!-- Custom Bid Input & Submit -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px; margin-bottom:14px; display:flex; gap:8px; align-items:center;">
        <div style="flex:1;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace; margin-bottom:2px;">Custom Bid ($ USD)</div>
          <input id="custom-bid-input" type="number" value="${defaultBidVal}" min="1000" max="${auc.currentBid - 1}" 
            style="width:100%; background:#070a12; border:1px solid #1f293d; border-radius:4px; padding:6px 10px; color:var(--tx); font-family:monospace; font-size:13px; font-weight:800; outline:none;" />
        </div>
        <button id="submit-custom-bid" class="btn gold" style="padding:10px 14px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; height:auto; align-self:flex-end;">
          PLACE BID
        </button>
      </div>

      <!-- Live Competitor Bidding Log -->
      <div style="font-size:10px; font-weight:800; color:var(--mu); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
        Live Tender Audit Log
      </div>
      <div style="max-height:100px; overflow-y:auto; background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:8px; font-size:10px; font-family:monospace;">
        ${auc.bidHistory.length === 0 ? `
          <div style="color:var(--mu); text-align:center; padding:8px;">No tenders recorded yet. Place the opening bid!</div>
        ` : auc.bidHistory.map((h: any, i: number) => `
          <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="color:${i === 0 ? 'var(--grn)' : h.bidderId === 'player' ? 'var(--gold)' : 'var(--tx)'}; font-weight:${i === 0 ? '800' : '500'};">
              ${i === 0 ? '👑 ' : ''}${h.bidderName}
            </span>
            <span style="font-weight:800; color:${i === 0 ? 'var(--grn)' : 'var(--mu)'};">${fmt(h.amount)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Attach event listeners
  const closeBtn = document.getElementById('close-auc-modal');
  if (closeBtn) closeBtn.onclick = () => closeAuctionModal();

  existing.onclick = (e) => {
    if (e.target === existing) closeAuctionModal();
  };

  const b1 = document.getElementById('bid-opt-1');
  if (b1) b1.onclick = () => { placeBid(auc.id, under1); };

  const b2 = document.getElementById('bid-opt-2');
  if (b2) b2.onclick = () => { placeBid(auc.id, under2); };

  const b3 = document.getElementById('bid-opt-3');
  if (b3) b3.onclick = () => { placeBid(auc.id, under3); };

  const customInput = document.getElementById('custom-bid-input') as HTMLInputElement;
  const customSubmit = document.getElementById('submit-custom-bid');
  
  const submitCustom = () => {
    if (!customInput) return;
    const val = parseInt(customInput.value, 10);
    if (val && val < auc.currentBid) {
      placeBid(auc.id, val);
    }
  };

  if (customSubmit) customSubmit.onclick = submitCustom;
  if (customInput) {
    customInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCustom();
      }
    };
    if (isInputFocused) {
      customInput.focus();
    }
  }
}

