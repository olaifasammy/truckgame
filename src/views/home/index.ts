import { refresh, set } from '../../core/store';
import { action, toast, fmt, dur } from '../../core/ui';
import { takeJob, replenish } from '../../systems/jobs';
import { renderMap } from './map';
import { renderJobCard } from './job-card';
import { renderAuctionCard } from './auction-card';
import { openAuctionModal, renderModalOverlay, activeAuctionModalId } from './auction-modal';
import { openTruckSelector, renderSelectorOverlay, activeSelectorJobId } from './truck-selector';
import { homeState } from './state';
import { LOCATIONS, RegionName } from '../../data/world';
import { getCompanyProgression } from '../../domain/company/progression';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';
import { SAMPLE_TENDERS, SUBCONTRACT_DAILY_RATE, isRegionUnlocked, REGION_AUTHORITIES } from '../../domain/logistics/network';
import { renderTelematicsOverlay } from '../telematics-modal';
import { TRUCK_MODELS } from '../../domain/trucks/trucks.data';

let homeBoardMode: 'spot' | 'tenders' | 'subcontract' = 'spot';

action('home-board-mode', d => {
  homeBoardMode = (d as any).mode;
  refresh();
});

action('home-toggle', d => {
  homeState.openJobId = homeState.openJobId === +(d as any).id ? null : +(d as any).id;
  refresh();
});

action('home-take', d => {
  const id = +(d as any).id;
  openTruckSelector(id);
});

action('open-auction', d => {
  openAuctionModal(+(d as any).id);
});

action('locked-vip-bid', () => {
  const S = (window as any).__getStore?.();
  const prog = S ? getCompanyProgression(S) : { title: 'Newbie', tier: 0 };
  toast(`Job Bidding unlocks at VIP Rank (Tier 3+). Current: ${prog.title} (Tier ${prog.tier}/3)`, 'err');
});

action('refresh-freight-board', () => {
  set(S => {
    const cost = 250;
    if (S.money < cost) return toast(`Insufficient funds to refresh freight board. Need $${cost}`, 'err');
    S.money -= cost;
    S.jobs = [];
    replenish(S);
    toast('Freight exchange board refreshed ($250 fee paid)!', 'success');
  });
});

action('home-region', d => {
  homeState.selectedRegion = (d as any).region as (RegionName | 'All');
  refresh();
});

action('inspect-city', d => {
  const city = (d as any).city;
  homeState.inspectCity = homeState.inspectCity === city ? null : city;
  refresh();
});

action('close-city-inspect', () => {
  homeState.inspectCity = null;
  refresh();
});

action('set-map-layer', d => {
  homeState.mapLayer = (d as any).layer;
  refresh();
});

action('map-zoom-in', () => {
  homeState.zoomLevel = Math.min(4, +(homeState.zoomLevel + 0.5).toFixed(1));
  refresh();
});

action('map-zoom-out', () => {
  homeState.zoomLevel = Math.max(1, +(homeState.zoomLevel - 0.5).toFixed(1));
  if (homeState.zoomLevel === 1) {
    homeState.panX = 0;
    homeState.panY = 0;
  }
  refresh();
});

action('map-zoom-reset', () => {
  homeState.zoomLevel = 1;
  homeState.panX = 0;
  homeState.panY = 0;
  refresh();
});

action('map-pan', d => {
  const dir = (d as any).dir;
  const step = 20 / (homeState.zoomLevel || 1);
  if (dir === 'up') homeState.panY -= step;
  if (dir === 'down') homeState.panY += step;
  if (dir === 'left') homeState.panX -= step;
  if (dir === 'right') homeState.panX += step;
  refresh();
});

action('accept-tender', d => {
  const tenderId = (d as any).id;
  set(S => {
    const tenderDef = SAMPLE_TENDERS.find(t => t.id === tenderId);
    if (!tenderDef) return;

    if (!S.corporateTenders) S.corporateTenders = [];
    if (S.corporateTenders.some((t: any) => t.id === tenderId)) {
      return toast('You already hold an active contract of affreightment with this corporate partner', 'err');
    }

    S.corporateTenders.push({
      ...tenderDef,
      startDate: Date.now()
    });

    toast(`Contract of Affreightment Signed: ${tenderDef.client}! Daily scheduled loads active.`, 'success');
  });
});

action('toggle-subcontract', d => {
  const truckId = +(d as any).id;
  set(S => {
    if (!S.subcontractedTrucks) S.subcontractedTrucks = [];
    const idx = S.subcontractedTrucks.indexOf(truckId);
    if (idx >= 0) {
      S.subcontractedTrucks.splice(idx, 1);
      toast(`Unit #${truckId} returned from charter sub-contracting to company active roster`, 'success');
    } else {
      const truck = S.fleet.find((t: any) => t.id === truckId);
      if (truck?.status === 'busy') return toast('Cannot sublease tractor currently in active transit', 'err');
      S.subcontractedTrucks.push(truckId);
      toast(`Unit #${truckId} leased out to partner carrier network for guaranteed $${SUBCONTRACT_DAILY_RATE}/day retainer!`, 'success');
    }
  });
});

export default {
  id: 'home',
  icon: 'briefcase',
  label: 'Jobs',
  render: (S: any) => {
    // Re-render modal overlays if active
    if (activeAuctionModalId !== null) {
      setTimeout(() => renderModalOverlay(S), 0);
    }
    if (activeSelectorJobId !== null) {
      setTimeout(() => renderSelectorOverlay(S), 0);
    }

    const currentRegion = homeState.selectedRegion;
    const allAuctions = S.auctions || [];
    const allJobs = S.jobs || [];

    // Filter by region if a specific region is active
    const filteredAuctions = allAuctions.filter((a: any) => {
      if (currentRegion === 'All') return true;
      const locFrom = LOCATIONS[a.from];
      const locTo = LOCATIONS[a.to];
      return locFrom?.region === currentRegion || locTo?.region === currentRegion;
    });

    const filteredJobs = allJobs.filter((j: any) => {
      if (currentRegion === 'All') return true;
      const locFrom = LOCATIONS[j.from];
      const locTo = LOCATIONS[j.to];
      return locFrom?.region === currentRegion || locTo?.region === currentRegion;
    });

    // Sort: Auctions Won > Return Hauls (To & Fro) for stationed trucks > Tenders > VIP > Rest
    filteredJobs.sort((a: any, b: any) => {
      const aLocal = (S.fleet || []).some((t: any) => t.status === 'idle' && t.loc === a.from);
      const bLocal = (S.fleet || []).some((t: any) => t.status === 'idle' && t.loc === b.from);
      const score = (j: any, isLocal: boolean) => (
        j.isAuctionWon ? 120 :
        (isLocal ? 80 : 0) +
        (j.isBackhaul ? 40 : 0) +
        (j.tenderId ? 30 : 0) +
        (j.vip ? 10 : 0)
      );
      return score(b, bLocal) - score(a, aLocal);
    });

    const prog = getCompanyProgression(S);
    const quota = getDailyBidDispatchQuota(S);

    return `
      ${renderMap(S)}

      <!-- Redesigned Mode Selector Navigation Bar -->
      <div style="background: linear-gradient(180deg, #111827 0%, #0a0f1d 100%); border: 1px solid #1f293d; border-radius: 12px; padding: 6px; margin-bottom: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
          <button class="btn ${homeBoardMode === 'spot' ? 'gold' : 'alt'}" style="padding: 10px 4px; font-size: 10px; font-weight: 800; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 2px;" data-act="home-board-mode" data-mode="spot">
            <span>SPOT BOARD</span>
            <span style="font-size: 9px; opacity: 0.85; font-family: monospace;">(${allJobs.length} Manifests)</span>
          </button>

          <button class="btn ${homeBoardMode === 'tenders' ? 'gold' : 'alt'}" style="padding: 10px 4px; font-size: 10px; font-weight: 800; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 2px;" data-act="home-board-mode" data-mode="tenders">
            <span>30-DAY TENDERS</span>
            <span style="font-size: 9px; opacity: 0.85; font-family: monospace;">(${SAMPLE_TENDERS.length} Contracts)</span>
          </button>

          <button class="btn ${homeBoardMode === 'subcontract' ? 'gold' : 'alt'}" style="padding: 10px 4px; font-size: 10px; font-weight: 800; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 2px;" data-act="home-board-mode" data-mode="subcontract">
            <span>SUB-CONTRACTING</span>
            <span style="font-size: 9px; opacity: 0.85; font-family: monospace;">(${(S.subcontractedTrucks || []).length} Rigs)</span>
          </button>
        </div>
      </div>

      ${homeBoardMode === 'spot' ? `
          <!-- Live Bidding & Reverse Freight Auctions Section -->
          ${filteredAuctions.length > 0 ? `
            <div class="sec" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
                  REVERSE FREIGHT BIDDING ROOMS (${filteredAuctions.length})
                </span>
                <span style="font-size:8px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 6px; border-radius:3px; font-weight:800; font-family:monospace;">
                  SPOT CLEARANCE · HIGH VALUE CONTRACTS
                </span>
              </div>
              <div style="font-size:9px; font-family:monospace; color:${quota.isFree ? 'var(--grn)' : 'var(--gold)'}; display:flex; align-items:center; gap:6px;">
                <span>DAILY FREE DISPATCHES: <b>${quota.freeRemaining}/5</b></span>
                <span style="color:rgba(255,255,255,0.2);">|</span>
                <span style="color:var(--grn);">● LIVE AUCTIONS ACTIVE</span>
              </div>
            </div>
            ${filteredAuctions.map((j: any) => renderAuctionCard(S, j)).join('')}
          ` : ''}

          <!-- Contract Freight Load Board Section -->
          <div class="sec" style="display:flex; justify-content:space-between; align-items:center; margin:14px 0 8px;">
            <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
              FREIGHT CONTRACT MANIFESTS (${filteredJobs.length})
            </span>
            <span class="mu-tx" style="font-size:9px; font-family:monospace;">${S.active.length} DISPATCHED EN ROUTE</span>
          </div>

          ${filteredJobs.length > 0 ? filteredJobs.map((j: any) => renderJobCard(S, j)).join('') : `
            <div style="background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:24px; text-align:center; color:var(--mu); font-size:11px; font-family:monospace;">
              NO AVAILABLE CONTRACTS IN THIS REGIONAL SECTOR. CHECK OTHER REGIONS OR WAIT FOR DISPATCH REPLENISHMENT.
            </div>
          `}

          <!-- Freight Board Refresh Button ($250 fee) -->
          <div style="margin-top:16px; margin-bottom:14px; text-align:center;">
            <button class="btn alt" style="width:100%; padding:10px; font-size:11px; font-weight:800; border-color:var(--gold); color:var(--gold);" data-act="refresh-freight-board">
              🔄 Refresh $250
            </button>
          </div>
        ` : homeBoardMode === 'tenders' ? `
          <!-- Mode 2: 30-Day Long-Term Corporate Tenders -->
          <div style="background:#0f172a; border:1px solid var(--gold); border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">CONTRACTS OF AFFREIGHTMENT</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">Exclusive Corporate Linehaul Partnerships</div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px; line-height:1.4;">
              Sign exclusive 30-day enterprise shipping contracts with manufacturing conglomerates. Complete all scheduled consignments within strict SLA thresholds to unlock massive completion bonuses.
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            ${SAMPLE_TENDERS.map(tender => {
              const activeTender = (S.corporateTenders || []).find((t: any) => t.id === tender.id);
              const isSigned = !!activeTender;
              const completed = activeTender ? activeTender.completedLoads : 0;
              const remaining = activeTender ? activeTender.loadsRemaining : tender.totalLoads;

              return `
                <div style="background:#111827; border:1px solid ${isSigned ? 'rgba(34,197,94,0.4)' : '#1f293d'}; border-radius:10px; padding:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <span style="font-size:24px;">${tender.icon}</span>
                      <div>
                        <div style="font-size:13px; font-weight:800; color:var(--tx);">${tender.client}</div>
                        <div style="font-size:9px; color:var(--mu);">${tender.industry} · 30-Day Linehaul</div>
                      </div>
                    </div>
                    <div>
                      ${isSigned ? `
                        <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.12); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace;">
                          ✓ ACTIVE PARTNERSHIP
                        </span>
                      ` : `
                        <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900;" data-act="accept-tender" data-id="${tender.id}">
                          ACCEPT TENDER
                        </button>
                      `}
                    </div>
                  </div>

                  <div style="font-size:10px; color:var(--tx); margin-bottom:8px; line-height:1.4;">${tender.desc}</div>

                  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; background:#0a0f1d; padding:8px 10px; border-radius:6px; margin-bottom:8px;">
                    <div>
                      <div style="font-size:8px; color:var(--mu); font-weight:700;">PAY PER LOAD</div>
                      <div style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace;">$${tender.ratePerDelivery.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="font-size:8px; color:var(--mu); font-weight:700;">SLA TARGET</div>
                      <div style="font-size:12px; font-weight:900; color:var(--grn); font-family:monospace;">${tender.slaTarget}% ON-TIME</div>
                    </div>
                    <div>
                      <div style="font-size:8px; color:var(--mu); font-weight:700;">COMPLETION BONUS</div>
                      <div style="font-size:12px; font-weight:900; color:#38bdf8; font-family:monospace;">+$${tender.bonusPayout.toLocaleString()}</div>
                    </div>
                  </div>

                  ${isSigned ? `
                    <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-bottom:4px;">
                      Progress: ${completed} / ${tender.totalLoads} Consignments Completed (${remaining} remaining)
                    </div>
                    <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                      <div style="width:${(completed / tender.totalLoads) * 100}%; height:100%; background:var(--grn); border-radius:3px;"></div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Mode 3: Fleet Sub-Contracting -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">THIRD-PARTY FLEET CHARTER LEASING</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">Sub-Contract Idle Trucks to Logistics Firms</div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px; line-height:1.4;">
              When freight exchange spot rates are low, sublease your idle rigs and CDL drivers to major logistics alliances (DHL Global Forwarding, FedEx Freight, Maersk) for guaranteed daily retainer revenue ($${SUBCONTRACT_DAILY_RATE.toLocaleString()}/day per rig).
            </div>
          </div>

          <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase; margin-bottom:8px;">
            Company Fleet Asset Roster (${S.fleet.length} Units)
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            ${S.fleet.map((t: any) => {
              const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
              const isSubcontracted = (S.subcontractedTrucks || []).includes(t.id);
              const isBusy = t.status === 'busy';

              return `
                <div style="background:#111827; border:1px solid ${isSubcontracted ? 'rgba(34,197,94,0.4)' : '#1f293d'}; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:13px; font-weight:800; color:var(--tx);">${t.name}</div>
                    <div style="font-size:10px; color:var(--mu); margin-top:1px;">
                      ${m.brand} ${m.name} · Base: ${t.loc} · Status: <b style="color:${isSubcontracted ? 'var(--grn)' : isBusy ? '#38bdf8' : 'var(--gold)'};">${isSubcontracted ? 'SUB-CONTRACTED (CHARTER)' : isBusy ? 'IN TRANSIT' : 'IDLE IN DEPOT'}</b>
                    </div>
                  </div>
                  <div>
                    <button class="btn ${isSubcontracted ? 'alt' : 'gold'}" style="padding:6px 12px; font-size:10px; font-weight:800; ${isSubcontracted ? 'color:var(--grn); border-color:var(--grn);' : ''}" data-act="toggle-subcontract" data-id="${t.id}" ${isBusy && !isSubcontracted ? 'disabled' : ''}>
                      ${isSubcontracted ? `RECALL TO DEPOT (+$${SUBCONTRACT_DAILY_RATE}/d)` : `SUBLEASE (+$${SUBCONTRACT_DAILY_RATE}/day)`}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

      ${renderTelematicsOverlay(S)}
      <div style="height:20px;"></div>
    `;
  }
};
