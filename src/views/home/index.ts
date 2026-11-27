import { refresh, set } from '../../core/store';
import { action, toast } from '../../core/ui';
import { renderMap } from './map';
import { renderAuctionCard } from './auction-card';
import { openAuctionModal, renderModalOverlay, activeAuctionModalId } from './auction-modal';
import { openTruckSelector, renderSelectorOverlay, activeSelectorJobId } from './truck-selector';
import { homeState } from './state';
import { LOCATIONS, RegionName } from '../../data/world';
import { getCompanyProgression } from '../../domain/company/progression';
import { getDailyBidDispatchQuota } from '../../domain/freight/bids/quota';
import { renderTelematicsOverlay } from '../telematics-modal';

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

    // Filter by region if a specific region is active
    const filteredAuctions = allAuctions.filter((a: any) => {
      if (currentRegion === 'All') return true;
      const locFrom = LOCATIONS[a.from];
      const locTo = LOCATIONS[a.to];
      return locFrom?.region === currentRegion || locTo?.region === currentRegion;
    });

    const quota = getDailyBidDispatchQuota(S);

    return `
      ${renderMap(S)}

      <!-- Live Bidding & Reverse Freight Auctions Section -->
      <div class="sec" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
        <div style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
          LIVE BID AUCTIONS (${filteredAuctions.length})
        </div>
        <div style="font-size:9px; font-family:monospace; color:var(--grn); font-weight:800;">
          ${quota.freeRemaining}/5 Free Dispatches
        </div>
      </div>

      ${filteredAuctions.length > 0 ? filteredAuctions.map((j: any) => renderAuctionCard(S, j)).join('') : `
        <div style="background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:24px; text-align:center; color:var(--mu); font-size:11px; font-family:monospace;">
          NO LIVE BID AUCTIONS IN THIS SECTOR RIGHT NOW. REGULAR FREIGHT IS MANAGED PER HUB IN YOUR GARAGE.
        </div>
      `}

      ${renderTelematicsOverlay(S)}
      <div style="height:20px;"></div>
    `;
  }
};
