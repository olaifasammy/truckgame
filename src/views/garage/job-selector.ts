import { action, toast, fmt, dur } from '../../core/ui';
import { refresh } from '../../core/store';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { why, takeJob } from '../../systems/jobs';
import { ic } from '../../core/icons';
import { LOCATIONS } from '../../data/world';
import { distKm, getRouteEnv, tripMs } from '../../systems/calc';

export let activeJobSelectorTruckId: number | null = null;

export function openJobSelector(truckId: number) {
  activeJobSelectorTruckId = truckId;
  const S = (window as any).__getStore?.();
  if (S) renderJobSelectorOverlay(S);
}

export function closeJobSelector() {
  activeJobSelectorTruckId = null;
  const existing = document.getElementById('job-selector-overlay');
  if (existing) existing.remove();
}

action('select-job-dispatch', d => {
  const jobId = +(d as any).jobId;
  const truckId = +(d as any).truckId;
  takeJob(jobId, truckId);
  closeJobSelector();
  refresh();
});

export function renderJobSelectorOverlay(S: any) {
  if (activeJobSelectorTruckId === null) return;
  const truck = S.fleet.find((t: any) => t.id === activeJobSelectorTruckId);
  if (!truck) {
    closeJobSelector();
    return;
  }

  // Filter jobs: Show only what this truck can do
  const jobs = S.jobs.filter((j: any) => !why(S, truck, j));

  let existing = document.getElementById('job-selector-overlay');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'job-selector-overlay';
    document.body.appendChild(existing);
  }

  existing.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,8,18,0.94); backdrop-filter: blur(4px);
    z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  existing.innerHTML = `
    <div style="background:#0e1320; border:1px solid #1e2638; border-radius:12px; width:100%; max-width:480px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.8); overflow:hidden; position:relative; color:var(--tx);">
      
      <!-- Header -->
      <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06); background:#070a12; position:relative;">
        <button id="close-job-selector" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.06); border:none; color:var(--mu); font-size:14px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;">✕</button>
        <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace;">
          DISPATCH ASSIGNMENT MANIFEST
        </div>
        <h3 style="margin:2px 0 0; font-size:17px; font-weight:900; color:var(--tx);">
          Select Freight Cargo
        </h3>
        <div style="font-size:11px; color:var(--mu); font-family:monospace; margin-top:3px;">
          Tractor: <b style="color:var(--tx);">${truck.name}</b> · Stationed at <b style="color:var(--gold);">${truck.loc} DEPOT</b>
        </div>
      </div>

      <!-- Freight List -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">
        ${jobs.length === 0 ? `
          <div style="padding:40px 20px; text-align:center; color:var(--mu); font-size:11px; font-family:monospace;">
            No compatible freight loads currently available for this tractor's trailer equipment and maintenance status. Check Freight Board for auctions or wait for incoming manifests.
          </div>
        ` : jobs.map((j: any) => {
            const cargo = CARGO_TYPES.find(c => c.id === j.cargoId);
            const isSpecial = j.isAuctionWon;
            const dh = distKm(truck.loc, j.from);
            const env = j.env || getRouteEnv(j.from, j.to);
            const estTimeMs = tripMs(j.km + dh, 80, env);
            const weatherIcon = env.weather === 'snow' ? '❄' : env.weather === 'rain' ? '🌧' : env.weather === 'heatwave' ? '🔥' : '☀️';
            const locFrom = LOCATIONS[j.from];
            const locTo = LOCATIONS[j.to];
            
            return `
              <div class="card" style="padding:12px; border-radius:8px; border:1px solid ${isSpecial ? 'var(--grn)' : '#1e2638'}; background:#070a12; display:flex; justify-content:space-between; align-items:center; position:relative; overflow:hidden;">
                ${isSpecial ? `<div style="position:absolute; top:0; right:0; background:var(--grn); color:#070a12; font-size:7px; font-weight:900; padding:2px 8px; border-bottom-left-radius:6px; font-family:monospace;">WON CONTRACT</div>` : ''}
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                  <div style="font-size:18px; color:var(--gold); width:34px; height:34px; background:#0e1320; border:1px solid #1a2336; border-radius:6px; display:grid; place-items:center; flex-shrink:0;">
                    ${ic(cargo?.icon || 'box')}
                  </div>
                  <div style="min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-weight:900; color:var(--tx); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cargo?.name || 'Commercial Cargo'}</span>
                      <span style="font-size:8px; color:var(--mu); font-family:monospace;">${weatherIcon} ${env.roadGrade}% grade</span>
                    </div>
                    <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">
                      <span style="color:var(--gold);">${locFrom?.name || j.from}</span> → <span style="color:var(--tx);">${locTo?.name || j.to}</span> · ${j.km} km
                    </div>
                    <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                      ${dh > 0 ? `Deadhead: <b style="color:var(--gold);">${dh} km</b> · ` : ''}ETA: ~${dur(estTimeMs)} · Payload: ${j.weight}t
                    </div>
                  </div>
                </div>
                <div style="text-align:right; flex-shrink:0; margin-left:8px;">
                  <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace;">${fmt(j.pay)}</div>
                  <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-bottom:4px;">$${(j.pay / Math.max(1, j.km)).toFixed(2)}/km</div>
                  <button class="btn gold" data-act="select-job-dispatch" data-job-id="${j.id}" data-truck-id="${truck.id}" style="padding:5px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">DISPATCH</button>
                </div>
              </div>
            `;
          }).join('')}
      </div>

      <div style="padding:10px 16px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; font-size:9px; color:var(--mu); background:#070a12; font-family:monospace;">
        Showing verified loads compatible with coupled trailer configuration and mechanical tolerance.
      </div>
    </div>
  `;

  document.getElementById('close-job-selector')?.addEventListener('click', closeJobSelector);
  existing.onclick = (e) => {
    if (e.target === existing) closeJobSelector();
  };
}

