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

action('quick-refuel', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const t = S.fleet.find((x: any) => x.id === +(d as any).truckId);
  if (!t) return;
  const cost = 150;
  if (S.money < cost) {
    return toast(`Insufficient funds for fuel refill. Need $${cost}`, 'err');
  }
  S.money -= cost;
  t.fluids.fuel = 800; // Refueled
  toast(`Refueled ${t.name} to 100% tank!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('quick-certify-driver', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const t = S.fleet.find((x: any) => x.id === +(d as any).truckId);
  if (!t || !t.driverId) return;
  const drv = S.drivers.find((x: any) => x.id === t.driverId);
  if (!drv) return;
  const certId = (d as any).cert || 'ADR Hazmat';
  const certCost = certId === 'ADR Hazmat' ? 6500 : 3500;
  if (S.money < certCost) {
    return toast(`Insufficient funds for ${certId} course. Need $${certCost}`, 'err');
  }
  S.money -= certCost;
  if (!drv.certifications) drv.certifications = [];
  if (!drv.certifications.includes(certId)) drv.certifications.push(certId);
  toast(`Awarded ${certId} certification to ${drv.name}!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('batch-refuel', () => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const lowFuelTractors = (S.fleet || []).filter((t: any) => t.fluids.fuel < 100);
  if (lowFuelTractors.length === 0) return toast('All fleet vehicles already fully fueled!', 'info');
  const totalCost = lowFuelTractors.length * 150;
  if (S.money < totalCost) return toast(`Insufficient funds for fleet refuel ($${totalCost})`, 'err');
  
  S.money -= totalCost;
  lowFuelTractors.forEach((t: any) => { t.fluids.fuel = 800; });
  toast(`Refueled ${lowFuelTractors.length} fleet tractors!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('batch-hitch-trailer', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const targetType = (d as any).trailer;
  if (!targetType) return;
  
  const unhitched = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.trailer !== targetType);
  if (unhitched.length === 0) return toast('No idle bobtail tractors available to hitch', 'info');
  
  unhitched.forEach((t: any) => { t.trailer = targetType; });
  toast(`Hitched ${TRAILERS[targetType as keyof typeof TRAILERS] || targetType} to ${unhitched.length} idle tractors!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('batch-certify-drivers', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const certId = (d as any).cert || 'ADR Hazmat';
  const uncertified = (S.fleet || []).filter((t: any) => {
    if (!t.driverId) return false;
    const drv = S.drivers.find((x: any) => x.id === t.driverId);
    return drv && (!drv.certifications || !drv.certifications.includes(certId)) && drv.skill < 3;
  });
  if (uncertified.length === 0) return toast(`All assigned drivers hold ${certId} qualification!`, 'info');
  
  const costPerCert = certId === 'ADR Hazmat' ? 6500 : 3500;
  const totalCost = uncertified.length * costPerCert;
  if (S.money < totalCost) return toast(`Insufficient funds to certify drivers ($${totalCost})`, 'err');
  
  S.money -= totalCost;
  uncertified.forEach((t: any) => {
    const drv = S.drivers.find((x: any) => x.id === t.driverId);
    if (drv) {
      if (!drv.certifications) drv.certifications = [];
      if (!drv.certifications.includes(certId)) drv.certifications.push(certId);
    }
  });
  toast(`Certified ${uncertified.length} drivers in ${certId}!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('quick-refuel', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const t = S.fleet.find((x: any) => x.id === +(d as any).truckId);
  if (!t) return;
  const cost = 150;
  if (S.money < cost) {
    return toast(`Insufficient funds for fuel refill. Need $${cost}`, 'err');
  }
  S.money -= cost;
  t.fluids.fuel = 800; // Refueled
  toast(`Refueled ${t.name} to 100% tank!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('quick-certify-driver', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const t = S.fleet.find((x: any) => x.id === +(d as any).truckId);
  if (!t || !t.driverId) return;
  const drv = S.drivers.find((x: any) => x.id === t.driverId);
  if (!drv) return;
  const certId = (d as any).cert || 'ADR Hazmat';
  const certCost = certId === 'ADR Hazmat' ? 6500 : 3500;
  if (S.money < certCost) {
    return toast(`Insufficient funds for ${certId} course. Need $${certCost}`, 'err');
  }
  S.money -= certCost;
  if (!drv.certifications) drv.certifications = [];
  if (!drv.certifications.includes(certId)) drv.certifications.push(certId);
  toast(`Awarded ${certId} certification to ${drv.name}!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
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
    position: fixed; inset: 0; background: rgba(5,8,18,0.88); backdrop-filter: blur(8px);
    z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  existing.innerHTML = `
    <div class="modal-card" style="background:#0b101d; border:2px solid var(--gold); border-radius:14px; width:100%; max-width:560px; max-height:86vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.9); overflow:hidden; position:relative; color:var(--tx);">
      
      <!-- Header -->
      <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08); background:#060a14; position:relative;">
        <button id="close-selector" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; color:var(--mu); font-size:16px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center; z-index:10;">✕</button>
        <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace; letter-spacing:0.8px;">
          DISPATCH TRACTOR SELECTION MODAL
        </div>
        <h3 style="margin:3px 0 2px; font-size:17px; color:var(--tx); font-weight:900;">
          ${cargo?.name || 'Commercial Freight Contract'}
        </h3>
        <div style="font-size:11px; color:var(--mu); font-family:monospace; display:flex; align-items:center; gap:6px;">
          <span style="color:var(--gold); font-weight:800;">${job.from} → ${job.to}</span>
          <span>·</span>
          <span>${job.km} km (${job.weight}t)</span>
        </div>
        <div style="font-size:10px; color:var(--mu); margin-top:4px; font-family:monospace; display:flex; align-items:center; gap:6px;">
          <span>COUPLING: <b style="color:var(--tx);">${TRAILERS[trailerType as keyof typeof TRAILERS]?.toUpperCase() || 'STANDARD'}</b></span>
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

      <!-- Compatible Trucks List & Smart Fleet Diagnostic -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">
        <!-- Eligible Trucks Listed First -->
        ${compatibleFleet.map((t: any) => {
            const model = TRUCK_MODELS[t.modelId] || { name: 'Truck', brand: 'Heavy' };
            const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
            const canAffordDispatch = !quota || quota.canAfford;
            const dispatchBtnLabel = quota 
              ? quota.isFree ? 'DISPATCH (FREE)' : quota.canAfford ? 'DISPATCH (🪙 4)' : 'NEEDS 4 COINS'
              : 'DISPATCH';
            const trailerDesc = t.trailer ? (TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer) : 'Bobtail (Tractor Only)';
            const trailerEmoji = t.trailer === 'reefer' ? '❄️' : t.trailer === 'lowboy' ? '🏗️' : t.trailer === 'flatbed' ? '📦' : t.trailer === 'tipper' ? '⛰️' : t.trailer === 'double_trailer' ? '🚛' : '🚚';
            
            return `
              <div class="card" style="padding:10px 12px; border-radius:8px; border:1px solid #10b981; background:#070b14; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                  <div style="font-size:20px; color:var(--grn); width:34px; height:34px; background:#0e1320; border:1px solid rgba(16,185,129,0.3); border-radius:6px; display:grid; place-items:center; flex-shrink:0;">
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
                      Driver: <b style="color:var(--tx);">${drv ? drv.name : 'Unassigned'}</b> · Fuel: <b style="color:var(--grn);">${t.fluids.fuel}L</b>
                    </div>
                  </div>
                </div>

                <button class="btn gold" style="padding:8px 14px; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; ${!canAffordDispatch ? 'opacity:0.6;' : ''}" data-act="select-dispatch" data-job-id="${job.id}" data-truck-id="${t.id}">
                  ${dispatchBtnLabel}
                </button>
              </div>
            `;
        }).join('')}

        <!-- Grouped Smart Ineligible Fleet Diagnostics -->
        ${(() => {
          const ineligible = fleet.filter((t: any) => why(S, t, job));
          if (ineligible.length === 0) return '';

          const busy = ineligible.filter((t: any) => t.status === 'busy');
          const noDriver = ineligible.filter((t: any) => t.status !== 'busy' && !t.driverId);
          const needsFuel = ineligible.filter((t: any) => t.status !== 'busy' && t.fluids.fuel < 100);
          const wrongTrailer = ineligible.filter((t: any) => t.status !== 'busy' && t.driverId && why(S, t, job)?.includes('Requires'));
          const needsCert = ineligible.filter((t: any) => t.status !== 'busy' && t.driverId && why(S, t, job)?.includes('Certification'));

          let certRequired = 'ADR Hazmat';
          if (cargo?.tempControlled) certRequired = 'Cold Chain';
          if (trailerType === 'lowboy') certRequired = 'Heavy Haul';
          if (trailerType === 'double_trailer') certRequired = 'Double Trailer LCV';

          return `
            <div style="margin-top:10px; background:#070a12; border:1px solid #1a2336; border-radius:10px; padding:12px; font-family:monospace; font-size:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
                <span style="font-weight:900; color:var(--gold); text-transform:uppercase;">
                  FLEET STATUS SUMMARY (${ineligible.length} INELIGIBLE / ${fleet.length} TOTAL)
                </span>
                <span style="font-size:9px; color:var(--mu);">${compatibleFleet.length} READY TO DISPATCH</span>
              </div>

              <!-- Grouped Categories -->
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${busy.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:6px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">🚚 <b>${busy.length} Vehicles</b> busy on active transits en-route</span>
                    <span style="color:var(--gold); font-size:9px; font-weight:800;">EN-ROUTE</span>
                  </div>
                ` : ''}

                ${noDriver.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:6px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">👤 <b>${noDriver.length} Vehicles</b> have no CDL driver assigned</span>
                    <button class="btn alt" style="padding:3px 8px; font-size:8px; font-weight:800;" onclick="document.getElementById('truck-selector-overlay')?.remove(); window.dispatchEvent(new CustomEvent('nav-tab', {detail:{tab:'garage'}}));">ASSIGN IN GARAGE</button>
                  </div>
                ` : ''}

                ${needsFuel.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:6px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">⛽ <b>${needsFuel.length} Vehicles</b> low fuel level</span>
                    <button class="btn gold" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="batch-refuel">REFUEL ALL ($${needsFuel.length * 150})</button>
                  </div>
                ` : ''}

                ${wrongTrailer.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:6px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">🔗 <b>${wrongTrailer.length} Tractors</b> need ${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType} trailer</span>
                    <button class="btn gold" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="batch-hitch-trailer" data-trailer="${trailerType}">AUTO-HITCH ALL</button>
                  </div>
                ` : ''}

                ${needsCert.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:6px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">🎓 <b>${needsCert.length} Drivers</b> require ${certRequired} endorsement</span>
                    <button class="btn gold" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="batch-certify-drivers" data-cert="${certRequired}">CERTIFY ALL</button>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        })()}
      </div>
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
