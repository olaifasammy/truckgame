import { refresh } from '../../core/store';
import { action } from '../../core/ui';
import { takeJob } from '../../systems/jobs';
import { renderMap } from './map';
import { renderJobCard } from './job-card';
import { renderAuctionCard } from './auction-card';
import { openAuctionModal, renderModalOverlay, activeAuctionModalId } from './auction-modal';
import { openTruckSelector, renderSelectorOverlay, activeSelectorJobId } from './truck-selector';
import { homeState } from './state';
import { LOCATIONS, RegionName } from '../../data/world';

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
      ${filteredAuctions.length > 0 ? `
        <div class="sec" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
            REVERSE FREIGHT BIDDING ROOMS (${filteredAuctions.length})
          </span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace; color:var(--grn);">● LIVE AUCTIONS ACTIVE</span>
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
