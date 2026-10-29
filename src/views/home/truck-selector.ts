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

  // Filter trucks: Show all, but mark compatibility
  const fleet = S.fleet || [];
  
  let existing = document.getElementById('truck-selector-overlay');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'truck-selector-overlay';
    document.body.appendChild(existing);
  }

  existing.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,8,18,0.95);
    z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  existing.innerHTML = `
    <div style="background:var(--s1); border:1px solid var(--line); border-radius:16px; width:100%; max-width:480px; max-height:80vh; display:flex; flex-direction:column; box-shadow:0 25px 50px rgba(0,0,0,0.5); overflow:hidden; position:relative;">
      
      <!-- Header -->
      <div style="padding:20px; border-bottom:1px solid var(--line); background:var(--bg);">
        <button id="close-selector" style="position:absolute; top:16px; right:16px; background:none; border:none; color:var(--mu); font-size:20px; cursor:pointer; padding:4px 8px; z-index:10;">✕</button>
        <h3 style="margin:0; font-size:18px; color:var(--tx);">Dispatch Haul</h3>
        <div style="font-size:12px; color:var(--accent); font-weight:700; margin-top:4px;">
          ${cargo?.name || 'Cargo'} · ${job.from} → ${job.to}
        </div>
        <div style="font-size:10px; color:var(--mu); margin-top:2px;">REQUIRED: ${TRAILERS[trailerType as keyof typeof TRAILERS]?.toUpperCase() || 'STANDARD'}</div>
      </div>

      ${quota ? `
        <!-- Daily Bid Dispatch Quota Banner -->
        <div style="padding:10px 16px; background:${quota.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(193,154,91,0.15)'}; border-bottom:1px solid ${quota.isFree ? 'rgba(16,185,129,0.3)' : 'var(--gold)'}; display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace;">
          <span style="color:${quota.isFree ? 'var(--grn)' : 'var(--gold)'}; font-weight:800;">
            ${quota.isFree ? `✓ Daily Free Dispatches: ${quota.freeRemaining} of 5 remaining` : `🪙 Daily Free Limit Reached: Costs 4 Gold Coins`}
          </span>
          <span style="color:var(--mu);">
            Balance: <b style="color:var(--gold);">${quota.coinsBalance} Coins</b>
          </span>
        </div>
      ` : ''}

      <!-- List -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px;">
        ${fleet.length === 0 ? '<div style="padding:40px; text-align:center; color:var(--mu);">No trucks in fleet</div>' : 
          fleet.map((t: any) => {
            const reason = why(S, t, job);
            const isAble = !reason;
            const model = TRUCK_MODELS[t.modelId] || { name: 'Truck', brand: '' };
            const canAffordDispatch = !quota || quota.canAfford;
            const dispatchBtnLabel = quota 
              ? quota.isFree ? 'DISPATCH (FREE)' : quota.canAfford ? 'DISPATCH (🪙 4)' : 'NEEDS 4 COINS'
              : 'DISPATCH';
            
            return `
              <div class="card" style="padding:12px; border-radius:10px; border:1px solid ${isAble ? 'var(--line)' : 'rgba(255,255,255,0.05)'}; background:${isAble ? 'var(--bg)' : 'rgba(0,0,0,0.2)'}; opacity:${isAble ? '1' : '0.6'}; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="font-size:24px; color:${isAble ? 'var(--gold)' : 'var(--mu)'};">${ic('truck')}</div>
                  <div>
                    <div style="font-weight:700; color:var(--tx); font-size:13px;">${t.name}</div>
                    <div style="font-size:10px; color:var(--mu);">${model.brand} ${model.name} · ${t.loc}</div>
                    ${!isAble ? `<div style="font-size:10px; color:#ef4444; font-weight:700; margin-top:2px;">${reason}</div>` : ''}
                  </div>
                </div>
                ${isAble ? `
                  <button class="btn gold" data-act="select-dispatch" data-job-id="${job.id}" data-truck-id="${t.id}" style="padding:6px 12px; font-size:10px; font-weight:800; ${!canAffordDispatch ? 'opacity:0.6;' : ''}">
                    ${dispatchBtnLabel}
                  </button>
                ` : `
                  <div style="font-size:18px; color:var(--mu); padding-right:10px;">${ic('lock')}</div>
                `}
              </div>
            `;
          }).join('')}
      </div>

      <div style="padding:12px; border-top:1px solid var(--line); text-align:center; font-size:10px; color:var(--mu); background:var(--bg);">
        Compatible trucks must be idle, fueled, and have an assigned driver.
      </div>
    </div>
  `;

  document.getElementById('close-selector')?.addEventListener('click', closeTruckSelector);
}
