import { action, toast, fmt } from '../../core/ui';
import { refresh, set } from '../../core/store';
import { CARGO_TYPES } from '../../domain/freight/cargo/registry';
import { renderCargoBadge } from '../../domain/freight/cargo/cargo-svgs';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../../domain/trucks/trucks.data';
import { TrailerType } from '../../domain/trucks/trucks.types';
import { why, takeJob } from '../../systems/jobs';
import { ic } from '../../core/icons';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';
import { FREIGHT_LICENSES, hasLicense, buyLicense } from '../../domain/freight/licenses';
import { distKm } from '../../systems/calc';
import { LOCATIONS } from '../../data/world';

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
  const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
  const needed = Math.max(0, model.tankSize - (t.fluids?.fuel || 0));
  if (needed <= 0) return toast('Tank is already full', 'info');

  let fromBunker = 0;
  if (S.fuelBunker && S.fuelBunker.currentLiters > 0) {
    fromBunker = Math.min(S.fuelBunker.currentLiters, needed);
    S.fuelBunker.currentLiters -= fromBunker;
  }
  const remaining = needed - fromBunker;
  let stationCost = 0;
  if (remaining > 0) {
    stationCost = Math.round(remaining * 2.5);
    if (S.money < stationCost) {
      if (S.fuelBunker) S.fuelBunker.currentLiters += fromBunker;
      return toast(`Insufficient funds for station fuel top-off ($${stationCost})`, 'err');
    }
    S.money -= stationCost;
  }
  t.fluids.fuel = model.tankSize;
  const msg = fromBunker > 0 
    ? (remaining > 0 ? `Refueled: ${Math.round(fromBunker)}L Bunker + ${Math.round(remaining)}L Station ($${stationCost})` : `Refueled ${Math.round(fromBunker)}L from HQ Bunker!`)
    : `Refueled ${Math.round(needed)}L at Commercial Station ($${stationCost})`;
  toast(msg, 'success');
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
  const lowFuelTractors = (S.fleet || []).filter((t: any) => (t.fluids?.fuel || 0) < 150);
  if (lowFuelTractors.length === 0) return toast('All fleet vehicles already have sufficient fuel!', 'info');

  let totalFromBunker = 0;
  let totalStationLiters = 0;
  let totalCost = 0;

  for (const t of lowFuelTractors) {
    const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
    const needed = Math.max(0, model.tankSize - (t.fluids?.fuel || 0));
    let fromBunker = 0;
    if (S.fuelBunker && S.fuelBunker.currentLiters > 0) {
      fromBunker = Math.min(S.fuelBunker.currentLiters, needed);
      S.fuelBunker.currentLiters -= fromBunker;
      totalFromBunker += fromBunker;
    }
    const remaining = needed - fromBunker;
    if (remaining > 0) {
      totalStationLiters += remaining;
      totalCost += Math.round(remaining * 2.5);
    }
  }

  if (totalCost > 0 && S.money < totalCost) {
    if (S.fuelBunker) S.fuelBunker.currentLiters += totalFromBunker;
    return toast(`Insufficient funds for station fuel ($${totalCost})`, 'err');
  }

  if (totalCost > 0) S.money -= totalCost;
  lowFuelTractors.forEach((t: any) => { 
    const model = TRUCK_MODELS[t.modelId] || { tankSize: 800 };
    t.fluids.fuel = model.tankSize; 
  });

  const msg = totalFromBunker > 0
    ? `Refueled ${lowFuelTractors.length} tractors (${Math.round(totalFromBunker)}L Bunker, ${Math.round(totalStationLiters)}L Station -$${totalCost})`
    : `Refueled ${lowFuelTractors.length} fleet tractors (-$${totalCost})!`;
  toast(msg, 'success');
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

  const fleet = S.fleet || [];
  // Show only idle tractors in this continent/region, prioritized by proximity (0 km deadhead first)
  const compatibleFleet = fleet
    .filter((t: any) => t.status === 'idle' && !why(S, t, job))
    .sort((a: any, b: any) => {
      const aAtLoc = a.loc === job.from ? 1 : 0;
      const bAtLoc = b.loc === job.from ? 1 : 0;
      if (aAtLoc !== bAtLoc) return bAtLoc - aAtLoc;
      return distKm(a.loc, job.from) - distKm(b.loc, job.from);
    });
  
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
        
        <div style="display:flex; align-items:center; gap:12px;">
          ${renderCargoBadge(cargo?.id || job.cargoId || 'general_freight', { size: 44, isAuctionWon: isAuctionWon })}
          <div style="min-width:0; flex:1; padding-right:24px;">
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace; letter-spacing:0.8px; margin-bottom:2px;">
              DISPATCH TRACTOR SELECTION
            </div>
            <h3 style="margin:0 0 4px; font-size:16px; color:var(--tx); font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${cargo?.name || 'Commercial Freight Contract'}
            </h3>
            <div style="font-size:11px; color:var(--mu); font-family:monospace; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="color:var(--gold); font-weight:800;">${job.from} ${job.isRoundTrip ? '⇄' : '→'} ${job.to}</span>
              <span>·</span>
              <span>${job.km} km ${job.isRoundTrip ? '(Round-Trip)' : ''} (${job.weight}t)</span>
              <span>·</span>
              <span style="color:var(--grn); font-weight:800;">${fmt(job.pay || 0)}</span>
              ${job.isRoundTrip ? '<span style="color:#06b6d4; font-weight:800; background:rgba(6,182,212,0.15); padding:1px 6px; border-radius:4px; font-size:9px;">🔄 2-WAY TURNAROUND (+15% BONUS)</span>' : ''}
            </div>
            <div style="font-size:10px; color:var(--mu); margin-top:4px; font-family:monospace; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span>COUPLING: <b style="color:var(--tx);">${TRAILERS[trailerType as keyof typeof TRAILERS]?.toUpperCase() || 'STANDARD'}</b></span>
              ${cargo?.isHazmat ? ' · <span style="color:#ef4444; font-weight:800;">SHIPPER TANKER SUPPLIED</span>' : ''}
            </div>
            ${job.isRoundTrip ? `
              <div style="margin-top:6px; padding:5px 8px; background:rgba(6,182,212,0.08); border-left:2px solid #06b6d4; font-size:9.5px; color:#a5f3fc; font-family:monospace; line-height:1.4;">
                🔄 <b>TURNAROUND ROUTE:</b> Outbound <b>${job.from} → ${job.to}</b> (${cargo?.name || 'Primary Cargo'}) & Inbound Return <b>${job.to} → ${job.from}</b> (${job.returnCargoName || 'Backhaul Freight'}). Tractor returns to <b>${job.from}</b> with +15% turnaround bonus!
              </div>
            ` : ''}
          </div>
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
                        <span>Station: <b style="color:var(--gold);">${LOCATIONS[t.loc]?.name || t.loc}</b></span>
                        ${t.loc === job.from 
                          ? ' · <span style="color:var(--grn); font-weight:800; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.4); padding:1px 5px; border-radius:3px;">🔄 AT ORIGIN</span>' 
                          : ` · Deadhead: <b style="color:var(--gold);">${distKm(t.loc, job.from)} km</b>`}
                      </div>
                      <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                        Driver: <b style="color:var(--tx);">${drv ? drv.name : 'Unassigned'}</b> · Fuel: <b style="color:var(--grn);">${Math.round(t.fluids?.fuel || 0)}L</b>
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
          ${(() => {
            const jobRegion = LOCATIONS[job.from]?.region || 'job region';
            const trucksInRegion = fleet.filter((t: any) => LOCATIONS[t.loc]?.region === jobRegion);
            const isCrossContinentBlocked = fleet.length > 0 && trucksInRegion.length === 0;

            return `
              <div style="padding:16px 14px; text-align:center; background:#070a12; border:1px dashed #1e2638; border-radius:8px;">
                <div style="font-size:24px; margin-bottom:4px;">${isCrossContinentBlocked ? '🌍' : '🚛'}</div>
                <div style="font-weight:800; font-size:12px; color:${isCrossContinentBlocked ? '#ef4444' : 'var(--gold)'};">
                  ${isCrossContinentBlocked ? `No Tractors Stationed in ${jobRegion}` : 'No Compatible Tractors Ready For Dispatch'}
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:4px; font-family:monospace; line-height:1.4;">
                  ${isCrossContinentBlocked 
                    ? `Your fleet tractors are stationed in other regions. Cross-continental highway deadhead is prohibited (e.g. America to Europe). Station or purchase a tractor in ${jobRegion} to haul this cargo.` 
                    : 'Ensure you have idle trucks in this region with the correct trailer coupling and qualified CDL drivers assigned in the Garage.'}
                </div>
              </div>
            `;
          })()}
        `}

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
