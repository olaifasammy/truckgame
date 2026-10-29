import { refresh } from '../../core/store';
import { action, toast } from '../../core/ui';
import { takeJob } from '../../systems/jobs';
import { renderMap } from './map';
import { renderJobCard } from './job-card';
import { renderAuctionCard } from './auction-card';
import { openAuctionModal, renderModalOverlay, activeAuctionModalId } from './auction-modal';
import { openTruckSelector, renderSelectorOverlay, activeSelectorJobId } from './truck-selector';
import { homeState } from './state';
import { LOCATIONS, RegionName } from '../../data/world';
import { getCompanyProgression } from '../../domain/company/progression';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';

action('home-toggle', d => {
  homeState.openJobId = homeState.openJobId === +(d as any).id ? null : +(d as any).id;
  refresh();
});

action('home-take', d => {
  const id = +(d as any).id;
  openTruckSelector(id);
});

action('open-auction', d => {
  const S = (window as any).__getStore?.();
  if (S) {
    const prog = getCompanyProgression(S);
    if (prog.tier < 3) {
      return toast(`Job Bidding unlocks at VIP Rank (Tier 3+). Current rank: ${prog.title}`, 'err');
    }
  }
  openAuctionModal(+(d as any).id);
});

action('locked-vip-bid', () => {
  const S = (window as any).__getStore?.();
  const prog = S ? getCompanyProgression(S) : { title: 'Newbie', tier: 0 };
  toast(`Job Bidding unlocks at VIP Rank (Tier 3+). Current: ${prog.title} (Tier ${prog.tier}/3)`, 'err');
});

action('home-region', d => {
  homeState.selectedRegion = (d as any).region as (RegionName | 'All');
  refresh();
});

export default {
  id: 'home',
  icon: 'home',
  label: 'Home',
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

    const prog = getCompanyProgression(S);
    const isVip = prog.tier >= 3;
    const quota = getDailyBidDispatchQuota(S);

    const regions: (RegionName | 'All')[] = ['All', 'Africa', 'Europe', 'America', 'Asia'];

    return `
      ${renderMap(S)}

      <!-- Global Region Selector Filter -->
      <div style="display:flex; gap:6px; margin-bottom:14px; overflow-x:auto; padding-bottom:4px;">
        ${regions.map(r => `
          <button class="btn ${currentRegion === r ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; border-radius:6px;" data-act="home-region" data-region="${r}">
            ${r === 'All' ? 'Global Grid (All)' : r}
          </button>
        `).join('')}
      </div>

      <!-- Live Bidding & Reverse Freight Auctions Section -->
      ${!isVip ? `
        <!-- VIP Gated Notice for Non-VIP Carriers -->
        <div style="background:linear-gradient(135deg, #111827 0%, #0c1220 100%); border:1px solid rgba(193,154,91,0.3); border-radius:10px; padding:14px 16px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px; min-width:0;">
              <div style="width:38px; height:38px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:8px; display:grid; place-items:center; color:#ef4444; font-size:18px; flex-shrink:0;">
                🔒
              </div>
              <div style="min-width:0;">
                <div style="font-size:12px; font-weight:900; color:var(--tx); letter-spacing:0.3px; text-transform:uppercase;">
                  REVERSE FREIGHT BIDDING ROOMS · <span style="color:#ef4444;">VIP EXCLUSIVE</span>
                </div>
                <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">
                  Access unlocks at <b style="color:var(--gold);">VIP Rank (VIP 1)</b>. Current Rank: <b style="color:${prog.color};">${prog.title.toUpperCase()} (Tier ${prog.tier}/3)</b>
                </div>
              </div>
            </div>
            <div style="flex-shrink:0; text-align:right;">
              <span style="font-size:9px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; color:var(--gold); font-family:monospace; font-weight:700;">
                Deliver standard loads to reach VIP
              </span>
            </div>
          </div>
        </div>
        ${filteredAuctions.length > 0 ? `
          <div style="opacity:0.65; pointer-events:none;">
            ${filteredAuctions.map((j: any) => renderAuctionCard(S, j)).join('')}
          </div>
        ` : ''}
      ` : filteredAuctions.length > 0 ? `
        <div class="sec" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
              REVERSE FREIGHT BIDDING ROOMS (${filteredAuctions.length})
            </span>
            <span style="font-size:8px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 6px; border-radius:3px; font-weight:800; font-family:monospace;">
              VIP ${prog.tier - 2} PRIVILEGE · HIGH-PAYING ONLY
            </span>
          </div>
          <div style="font-size:9px; font-family:monospace; color:${quota.isFree ? 'var(--grn)' : 'var(--gold)'}; display:flex; align-items:center; gap:6px;">
            <span>DAILY FREE DISPATCHES: <b>${quota.freeRemaining}/5</b> ${!quota.isFree ? '(Excess: 4 Coins)' : ''}</span>
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
      <div style="height:20px;"></div>
    `;
  }
};
