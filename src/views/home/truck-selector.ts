import { action, toast, fmt } from '../../core/ui';
import { refresh, set } from '../../core/store';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../../domain/trucks/trucks.data';
import { TrailerType } from '../../domain/trucks/trucks.types';
import { why, takeJob } from '../../systems/jobs';
import { ic } from '../../core/icons';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';
import { FREIGHT_LICENSES, hasLicense, buyLicense } from '../../domain/freight/licenses';

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

action('close-truck-selector', () => {
  closeTruckSelector();
});

action('select-dispatch', d => {
  const jobId = +(d as any).jobId;
  const truckId = +(d as any).truckId;
  takeJob(jobId, truckId);
  closeTruckSelector();
  refresh();
});

action('quick-buy-license', d => {
  const licId = (d as any).license;
  if (!licId) return;
  const success = buyLicense(licId);
  if (success) {
    const S = (window as any).__getStore?.();
    if (S && activeSelectorJobId !== null) renderSelectorOverlay(S);
  }
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
  const targetType = (d as any).trailer as TrailerType;
  if (!targetType) return;
  
  const unhitched = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.trailer !== targetType);
  if (unhitched.length === 0) return toast('No idle bobtail tractors available to hitch', 'info');
  
  // Count available trailers of this type in storage
  const availableCount = (S.trailers || []).filter((t: string) => t === targetType).length;
  
  if (availableCount === 0) {
    return toast(`No ${TRAILERS[targetType] || targetType} available in HQ Storage Yard. Buy one in HQ/Storage.`, 'err');
  }

  let hitchedCount = 0;
  unhitched.forEach((t: any) => {
    if (hitchedCount < availableCount) {
      // Unhitch current trailer if any
      if (t.trailer) {
        if (!S.trailers) S.trailers = [];
        S.trailers.push(t.trailer);
      }
      
      // Remove from storage
      const idx = S.trailers.indexOf(targetType);
      if (idx >= 0) S.trailers.splice(idx, 1);
      
      t.trailer = targetType;
      hitchedCount++;
    }
  });

  toast(`Successfully hitched ${hitchedCount} ${TRAILERS[targetType] || targetType} trailers from storage!`, 'success');
  if (activeSelectorJobId !== null) renderSelectorOverlay(S);
});

action('quick-buy-trailer', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const type = (d as any).trailer as TrailerType;
  const price = (TRAILER_PRICES as any)[type] || 15000;
  
  if (S.money < price) return toast(`Insufficient funds for trailer. Need $${price.toLocaleString()}`, 'err');
  
  S.money -= price;
  if (!S.trailers) S.trailers = [];
  S.trailers.push(type);
  
  toast(`Purchased 1x ${TRAILERS[type] || type} for HQ Storage!`, 'success');
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

  // Determine required commercial authority
  let requiredLicenseId: string | null = null;
  if (cargo?.isHazmat) requiredLicenseId = 'adr_hazmat';
  else if (cargo?.tempControlled) requiredLicenseId = 'cold_chain';
  else if (trailerType === 'lowboy') requiredLicenseId = 'heavy_haul';
  else if (trailerType === 'double_trailer') requiredLicenseId = 'lcv_double';
  else if (trailerType === 'tipper') requiredLicenseId = 'bulk_tipper';
  else if (cargo?.isFragile && (cargo.baseValue || 0) > 30) requiredLicenseId = 'high_value';

  const missingLicense = requiredLicenseId && !hasLicense(S, requiredLicenseId) ? FREIGHT_LICENSES[requiredLicenseId] : null;

  // Compatible Fleet
  const fleet = S.fleet || [];
  const compatibleFleet = fleet.filter((t: any) => !why(S, t, job));
  
  let existing = document.getElementById('truck-selector-overlay');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'truck-selector-overlay';
    document.body.appendChild(existing);
  }

  existing.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,8,18,0.92); backdrop-filter: blur(8px);
    z-index: 1200; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 12px; box-sizing: border-box; overflow-y: auto;
  `;

  existing.innerHTML = `
    <div class="modal-card" style="background:#0b101d; border:2px solid var(--gold); border-radius:14px; width:100%; max-width:540px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.9); overflow:hidden; position:relative; color:var(--tx); box-sizing:border-box; margin:auto;">
      
      <!-- Header -->
      <div style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.08); background:#060a14; position:relative; flex-shrink:0;">
        <button data-act="close-truck-selector" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.08); border:none; color:var(--mu); font-size:16px; cursor:pointer; width:30px; height:30px; border-radius:6px; display:grid; place-items:center; z-index:10; transition:background 0.2s;">✕</button>
        
        <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace; letter-spacing:0.8px; margin-bottom:2px;">
          DISPATCH TRACTOR SELECTION
        </div>
        <h3 style="margin:0 0 4px; font-size:16px; color:var(--tx); font-weight:900; padding-right:32px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${cargo?.name || 'Commercial Freight Contract'}
        </h3>
        <div style="font-size:11px; color:var(--mu); font-family:monospace; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="color:var(--gold); font-weight:800;">${job.from} → ${job.to}</span>
          <span>·</span>
          <span>${job.km} km (${job.weight}t)</span>
          <span>·</span>
          <span style="color:var(--grn); font-weight:800;">${fmt(job.pay || 0)}</span>
        </div>
        <div style="font-size:10px; color:var(--mu); margin-top:4px; font-family:monospace; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span>COUPLING: <b style="color:var(--tx);">${TRAILERS[trailerType as keyof typeof TRAILERS]?.toUpperCase() || 'STANDARD'}</b></span>
          ${cargo?.isHazmat ? ' · <span style="color:#ef4444; font-weight:800;">SHIPPER TANKER SUPPLIED</span>' : ''}
        </div>
      </div>

      ${quota ? `
        <!-- Daily Bid Dispatch Quota Banner -->
        <div style="padding:8px 16px; background:${quota.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(193,154,91,0.15)'}; border-bottom:1px solid ${quota.isFree ? 'rgba(16,185,129,0.3)' : 'var(--gold)'}; display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace; flex-shrink:0;">
          <span style="color:${quota.isFree ? 'var(--grn)' : 'var(--gold)'}; font-weight:800;">
            ${quota.isFree ? `✓ Daily Free Dispatches: ${quota.freeRemaining} of 5 remaining` : `🪙 Daily Limit Exceeded: Costs 4 Gold Coins`}
          </span>
          <span style="color:var(--mu);">
            Balance: <b style="color:var(--gold);">${quota.coinsBalance} Coins</b>
          </span>
        </div>
      ` : ''}

      <!-- Body: Scrollable -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px;">

        <!-- Missing Authority Alert Banner (if applicable) -->
        ${missingLicense ? `
          <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:12px; font-family:monospace;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:16px;">${missingLicense.icon}</span>
                <span style="color:#ef4444; font-weight:800; font-size:11px;">REQUIRED COMMERCIAL AUTHORITY MISSING</span>
              </div>
              <span style="color:var(--gold); font-weight:800; font-size:11px;">$${missingLicense.price.toLocaleString()}</span>
            </div>
            <div style="color:var(--tx); font-size:11px; font-weight:700; margin-bottom:3px;">
              ${missingLicense.name} (${missingLicense.code})
            </div>
            <div style="color:var(--mu); font-size:9px; margin-bottom:8px; line-height:1.4;">
              ${missingLicense.description}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <span style="color:var(--mu); font-size:9px;">
                ${S.money >= missingLicense.price ? '✓ Sufficient Company Treasury' : `Needs $${(missingLicense.price - S.money).toLocaleString()} more`}
              </span>
              <button class="btn gold" style="padding:6px 14px; font-size:9px; font-weight:900;" data-act="quick-buy-license" data-license="${missingLicense.id}" ${S.money < missingLicense.price ? 'disabled style="opacity:0.5;"' : ''}>
                BUY AUTHORITY ($${missingLicense.price.toLocaleString()})
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Compatible Tractors Ready For Dispatch -->
        ${compatibleFleet.length > 0 ? `
          <div style="font-size:10px; font-weight:800; color:var(--grn); font-family:monospace; text-transform:uppercase; letter-spacing:0.5px;">
            READY FOR DISPATCH (${compatibleFleet.length} TRACTORS)
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
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
                <div class="card" style="padding:10px 12px; border-radius:8px; border:1px solid #10b981; background:#070b14; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                  <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                    <div style="font-size:20px; color:var(--grn); width:36px; height:36px; background:#0e1320; border:1px solid rgba(16,185,129,0.3); border-radius:6px; display:grid; place-items:center; flex-shrink:0;">
                      ${ic('truck')}
                    </div>
                    <div style="min-width:0; flex:1;">
                      <div style="font-weight:900; color:var(--tx); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${t.name} · <span style="font-size:10px; color:var(--mu); font-weight:600;">${model.brand} ${model.name}</span>
                      </div>
                      <div style="font-size:9px; color:var(--gold); font-family:monospace; margin-top:2px; display:flex; align-items:center; gap:4px;">
                        <span>${trailerEmoji}</span>
                        <span>HITCHED: <b>${trailerDesc.toUpperCase()}</b></span>
                      </div>
                      <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                        Driver: <b style="color:var(--tx);">${drv ? drv.name : 'Unassigned'}</b> · Fuel: <b style="color:var(--grn);">${t.fluids?.fuel || 0}L</b> <span style="color:var(--mu); font-size:8px;">(Auto-refills)</span>
                      </div>
                    </div>
                  </div>

                  <button class="btn gold" style="padding:8px 14px; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; flex-shrink:0; ${!canAffordDispatch ? 'opacity:0.6;' : ''}" data-act="select-dispatch" data-job-id="${job.id}" data-truck-id="${t.id}">
                    ${dispatchBtnLabel}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- No Compatible Trucks Notice -->
          <div style="padding:16px 14px; text-align:center; background:#070a12; border:1px dashed #1e2638; border-radius:8px;">
            <div style="font-size:24px; margin-bottom:4px;">🚛</div>
            <div style="font-weight:800; font-size:12px; color:var(--gold);">No Fully Compatible Tractors Ready Right Now</div>
            <div style="font-size:10px; color:var(--mu); margin-top:4px; font-family:monospace; line-height:1.4;">
              ${missingLicense ? 'Your company needs to acquire the regulatory freight authority above to transport this class.' : 'Resolve driver endorsement or trailer coupling requirements below to dispatch.'}
            </div>
          </div>
        `}

        <!-- Ineligible Fleet Diagnostics & Quick Resolution Section -->
        ${(() => {
          const ineligible = fleet.filter((t: any) => why(S, t, job));
          if (ineligible.length === 0) return '';

          const busy = ineligible.filter((t: any) => t.status === 'busy');
          const noDriver = ineligible.filter((t: any) => t.status !== 'busy' && !t.driverId);
          const wrongTrailer = ineligible.filter((t: any) => t.status !== 'busy' && t.driverId && (why(S, t, job)?.includes('Requires') || why(S, t, job)?.includes('trailer')));
          const needsCert = ineligible.filter((t: any) => t.status !== 'busy' && t.driverId && (why(S, t, job)?.includes('Certification') || why(S, t, job)?.includes('Endorsement')));

          let certRequired = 'ADR Hazmat';
          if (cargo?.tempControlled) certRequired = 'Cold Chain';
          if (trailerType === 'lowboy') certRequired = 'Heavy Haul';
          if (trailerType === 'double_trailer') certRequired = 'Double Trailer LCV';

          return `
            <div style="background:#070a12; border:1px solid #1a2336; border-radius:10px; padding:12px; font-family:monospace; font-size:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
                <span style="font-weight:900; color:var(--gold); text-transform:uppercase;">
                  FLEET DIAGNOSTIC (${ineligible.length} INELIGIBLE / ${fleet.length} TOTAL)
                </span>
                <span style="font-size:9px; color:${compatibleFleet.length > 0 ? 'var(--grn)' : 'var(--mu)'};">
                  ${compatibleFleet.length} READY TO DISPATCH
                </span>
              </div>

              <!-- Actionable Resolution Categories -->
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${busy.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:8px 10px; border-radius:6px; border:1px solid #1e2638;">
                    <span style="color:var(--mu);">🚚 <b>${busy.length} Vehicles</b> currently in transit en-route</span>
                    <span style="color:var(--gold); font-size:9px; font-weight:800;">EN-ROUTE</span>
                  </div>
                ` : ''}

                ${noDriver.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:8px 10px; border-radius:6px; border:1px solid #1e2638; gap:8px;">
                    <span style="color:var(--mu);">👤 <b>${noDriver.length} Vehicles</b> have no CDL driver assigned</span>
                    <button class="btn alt" style="padding:4px 8px; font-size:8px; font-weight:800; flex-shrink:0;" onclick="document.getElementById('truck-selector-overlay')?.remove(); window.dispatchEvent(new CustomEvent('nav-tab', {detail:{tab:'garage'}}));">ASSIGN IN GARAGE</button>
                  </div>
                ` : ''}

                ${wrongTrailer.length > 0 ? (() => {
                  const availableCount = (S.trailers || []).filter((t: string) => t === trailerType).length;
                  const trailerName = TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType;
                  const price = (TRAILER_PRICES as any)[trailerType] || 15000;

                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:8px 10px; border-radius:6px; border:1px solid #1e2638; gap:8px;">
                      <div style="min-width:0; flex:1;">
                        <span style="color:var(--mu);">🔗 <b>${wrongTrailer.length} Tractors</b> need ${trailerName}</span>
                        <div style="font-size:8px; color:${availableCount > 0 ? 'var(--grn)' : '#f87171'}; font-weight:800; margin-top:2px;">
                          ${availableCount > 0 ? `✓ ${availableCount} available in HQ Storage` : `⚠ None in Storage (Requires $${price.toLocaleString()} purchase)`}
                        </div>
                      </div>
                      ${availableCount > 0 ? `
                        <button class="btn gold" style="padding:4px 8px; font-size:8px; font-weight:800; flex-shrink:0;" data-act="batch-hitch-trailer" data-trailer="${trailerType}">AUTO-HITCH ALL</button>
                      ` : `
                        <button class="btn gold" style="padding:4px 8px; font-size:8px; font-weight:800; flex-shrink:0;" data-act="quick-buy-trailer" data-trailer="${trailerType}" ${S.money < price ? 'disabled' : ''}>BUY 1x ($${(price/1000).toFixed(1)}k)</button>
                      `}
                    </div>
                  `;
                })() : ''}

                ${needsCert.length > 0 ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; padding:8px 10px; border-radius:6px; border:1px solid #1e2638; gap:8px;">
                    <span style="color:var(--mu);">🎓 <b>${needsCert.length} Drivers</b> require ${certRequired}</span>
                    <button class="btn gold" style="padding:4px 8px; font-size:8px; font-weight:800; flex-shrink:0;" data-act="batch-certify-drivers" data-cert="${certRequired}">CERTIFY ALL</button>
                  </div>
                ` : ''}
              </div>

              <!-- Individual Fleet Listing with Per-Tractor Status -->
              <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                <div style="font-size:9px; color:var(--mu); font-weight:800; margin-bottom:6px; text-transform:uppercase;">
                  Individual Tractor Roster:
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; max-height:160px; overflow-y:auto;">
                  ${fleet.map((t: any) => {
                    const reason = why(S, t, job);
                    const isOk = !reason;
                    const drv = (S.drivers || []).find((x: any) => x.id === t.driverId);
                    return `
                      <div style="background:#090d18; border:1px solid ${isOk ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.04)'}; border-radius:6px; padding:6px 8px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div style="min-width:0; flex:1;">
                          <div style="font-size:10px; font-weight:800; color:${isOk ? 'var(--grn)' : 'var(--tx)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${t.name} ${drv ? `(${drv.name})` : '(No Driver)'}
                          </div>
                          <div style="font-size:8px; color:${isOk ? 'var(--grn)' : '#f87171'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${isOk ? '✓ Eligible and ready' : reason}
                          </div>
                        </div>

                        ${!isOk && t.driverId && reason?.includes('Certification') ? `
                          <button class="btn gold" style="padding:2px 6px; font-size:8px; font-weight:800; flex-shrink:0;" data-act="quick-certify-driver" data-truck-id="${t.id}" data-cert="${certRequired}">CERTIFY ($${certRequired === 'ADR Hazmat' ? '6.5k' : '3.5k'})</button>
                        ` : ''}

                        ${!isOk && (t.fluids?.fuel || 0) < 100 && t.status !== 'busy' ? `
                          <button class="btn gold" style="padding:2px 6px; font-size:8px; font-weight:800; flex-shrink:0;" data-act="quick-refuel" data-truck-id="${t.id}">REFUEL ($150)</button>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        })()}

      </div>

      <!-- Footer (Inside modal-card) -->
      <div style="padding:10px 16px; border-top:1px solid rgba(255,255,255,0.08); text-align:center; font-size:9px; color:var(--mu); background:#060a14; font-family:monospace; flex-shrink:0;">
        Displaying verified compatible tractors only (${compatibleFleet.length} matched).
      </div>

    </div>
  `;

  // Close when clicking outside modal card
  existing.onclick = (e) => {
    if (e.target === existing) closeTruckSelector();
  };
}
