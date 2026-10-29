import { action, toast } from '../../core/ui';
import { refresh } from '../../core/store';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { TRUCK_MODELS, TRAILERS } from '../../domain/trucks/trucks.data';
import { why, takeJob } from '../../systems/jobs';
import { ic } from '../../core/icons';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';

export let activeSelectorJobId: number | null = null;

export function openTruckSelector(jobId: number) {
  activeSelectorJobId = jobId;
  const S = (window as any).__getStore?.();
  if (S) renderSelectorOverlay(S);
}

export function closeTruckSelector() {
  activeSelectorJobId = null;
  const existing = document.getElementById('truck-selector-overlay');
  if (existing) existing.remove();
}

action('select-dispatch', d => {
  const jobId = +(d as any).jobId;
  const truckId = +(d as any).truckId;
  takeJob(jobId, truckId);
  closeTruckSelector();
  refresh();
});

export function renderSelectorOverlay(S: any) {
  if (activeSelectorJobId === null) return;
  const job = S.jobs.find((j: any) => j.id === activeSelectorJobId);
  if (!job) {
    closeTruckSelector();
    return;
  }

  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  const trailerType = cargo?.trailer || job.trailer || 'curtain';
  const isAuctionWon = (job as any).isAuctionWon;
  const quota = isAuctionWon ? getDailyBidDispatchQuota(S) : null;

  // ONLY list vehicles that are 100% compatible with this manifest
  const fleet = S.fleet || [];
  const compatibleFleet = fleet.filter((t: any) => !why(S, t, job));
  
  let existing = document.getElementById('truck-selector-overlay');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'truck-selector-overlay';
    document.body.appendChild(existing);
  }

  existing.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,8,18,0.95); backdrop-filter: blur(4px);
    z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  existing.innerHTML = `
    <div style="background:var(--s1); border:1px solid var(--line); border-radius:14px; width:100%; max-width:480px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.8); overflow:hidden; position:relative;">
      
      <!-- Header -->
      <div style="padding:16px 20px; border-bottom:1px solid var(--line); background:#070a12; position:relative;">
        <button id="close-selector" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.06); border:none; color:var(--mu); font-size:16px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;">✕</button>
        <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace; letter-spacing:0.5px;">
          DISPATCH TRACTOR SELECTION
        </div>
        <h3 style="margin:2px 0 0; font-size:16px; color:var(--tx); font-weight:900;">
          Assign Compatible Transport
        </h3>
        <div style="font-size:11px; color:var(--mu); font-family:monospace; margin-top:3px; display:flex; align-items:center; gap:6px;">
          <span style="color:var(--gold); font-weight:700;">${cargo?.name || 'Cargo'}</span>
          <span>·</span>
          <span>${job.from} → ${job.to}</span>
          <span>·</span>
          <span>${job.km} km (${job.weight}t)</span>
        </div>
        <div style="font-size:10px; color:var(--mu); margin-top:3px; font-family:monospace;">
          REQUIRED COUPLING: <b style="color:var(--tx);">${TRAILERS[trailerType as keyof typeof TRAILERS]?.toUpperCase() || 'STANDARD'}</b>
          ${cargo?.isHazmat ? ' · <span style="color:#ef4444; font-weight:800;">SHIPPER TANKER SUPPLIED</span>' : ''}
        </div>
      </div>

      ${quota ? `
        <!-- Daily Bid Dispatch Quota Banner -->
        <div style="padding:8px 16px; background:${quota.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(193,154,91,0.15)'}; border-bottom:1px solid ${quota.isFree ? 'rgba(16,185,129,0.3)' : 'var(--gold)'}; display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace;">
          <span style="color:${quota.isFree ? 'var(--grn)' : 'var(--gold)'}; font-weight:800;">
            ${quota.isFree ? `✓ Daily Free Dispatches: ${quota.freeRemaining} of 5 remaining` : `🪙 Daily Limit Exceeded: Costs 4 Gold Coins`}
          </span>
          <span style="color:var(--mu);">
            Balance: <b style="color:var(--gold);">${quota.coinsBalance} Coins</b>
          </span>
        </div>
      ` : ''}

      <!-- Compatible Trucks List -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">
        ${compatibleFleet.length === 0 ? `
          <div style="padding:32px 16px; text-align:center; background:#070a12; border:1px solid #1e2638; border-radius:10px; margin:4px 0;">
            <div style="font-size:28px; margin-bottom:8px;">🚫</div>
            <div style="font-size:13px; font-weight:900; color:var(--tx); margin-bottom:4px;">NO COMPATIBLE VEHICLES AVAILABLE</div>
            <div style="font-size:10px; color:var(--mu); line-height:1.5; font-family:monospace; max-width:360px; margin:0 auto 16px;">
              To dispatch this cargo, you need an idle tractor equipped with <b>${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}</b>, sufficient fuel, an assigned driver with required certification, and corporate license authority.
            </div>
            <div style="display:flex; justify-content:center; gap:8px;">
              <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:800;" onclick="document.getElementById('truck-selector-overlay')?.remove(); window.dispatchEvent(new CustomEvent('nav-tab', {detail:{tab:'garage'}}));">
                MANAGE GARAGE
              </button>
              <button class="btn alt" style="padding:6px 14px; font-size:10px; font-weight:800;" onclick="document.getElementById('truck-selector-overlay')?.remove(); window.dispatchEvent(new CustomEvent('nav-tab', {detail:{tab:'company'}}));">
                HQ Depot & Trailers
              </button>
            </div>
          </div>
        ` : compatibleFleet.map((t: any) => {
            const model = TRUCK_MODELS[t.modelId] || { name: 'Truck', brand: 'Heavy' };
            const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
            const canAffordDispatch = !quota || quota.canAfford;
            const dispatchBtnLabel = quota 
              ? quota.isFree ? 'DISPATCH (FREE)' : quota.canAfford ? 'DISPATCH (🪙 4)' : 'NEEDS 4 COINS'
              : 'DISPATCH';
            const trailerDesc = t.trailer ? (TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer) : 'Bobtail (Tractor Only)';
            const trailerEmoji = t.trailer === 'reefer' ? '❄️' : t.trailer === 'lowboy' ? '🏗️' : t.trailer === 'flatbed' ? '📦' : t.trailer === 'tipper' ? '⛰️' : t.trailer === 'double_trailer' ? '🚛' : '🚚';
            
            return `
              <div class="card" style="padding:10px 12px; border-radius:8px; border:1px solid #1e2638; background:#070a12; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                  <div style="font-size:20px; color:var(--gold); width:34px; height:34px; background:#0e1320; border:1px solid #1a2336; border-radius:6px; display:grid; place-items:center; flex-shrink:0;">
                    ${ic('truck')}
                  </div>
                  <div style="min-width:0;">
                    <div style="font-weight:900; color:var(--tx); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${t.name} · <span style="font-size:10px; color:var(--mu); font-weight:600;">${model.brand} ${model.name}</span>
                    </div>
                    <div style="font-size:9px; color:var(--gold); font-family:monospace; margin-top:2px; display:flex; align-items:center; gap:4px;">
                      <span>${trailerEmoji}</span>
                      <span>HITCHED: <b>${trailerDesc.toUpperCase()}</b></span>
                    </div>
                    <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                      Driver: <b style="color:var(--tx);">${drv ? drv.name : 'Assigned'}</b> · Stationed at <b>${t.loc}</b>
                    </div>
                  </div>
                </div>

                <div style="flex-shrink:0; margin-left:8px;">
                  <button class="btn gold" data-act="select-dispatch" data-job-id="${job.id}" data-truck-id="${t.id}" style="padding:6px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; ${!canAffordDispatch ? 'opacity:0.6;' : ''}">
                    ${dispatchBtnLabel}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
      </div>

      <div style="padding:10px 16px; border-top:1px solid var(--line); text-align:center; font-size:9px; color:var(--mu); background:#070a12; font-family:monospace;">
        Displaying verified compatible tractors only (${compatibleFleet.length} matched).
      </div>
    </div>
  `;

  document.getElementById('close-selector')?.addEventListener('click', closeTruckSelector);
  existing.onclick = (e) => {
    if (e.target === existing) closeTruckSelector();
  };
}
