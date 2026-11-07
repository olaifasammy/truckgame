import { ic } from '../../core/icons';
import { Region, Driver } from '../../domain/drivers/drivers.types';
import { GameState } from '../../types/state';
import { activeTab, selectedRegion, expandedDriverId, transferModalDriverId, currentPage, DRIVERS_PER_PAGE } from './actions';
import { renderEmployedCard } from './employedCard';
import { renderPoolCard } from './poolCard';
import { renderTransferModal } from './transferModal';
import './actions'; // register actions

export default {
  id: 'drivers',
  icon: 'user',
  label: 'Drivers',
  hidden: true,
  render(S: GameState) {
    const employed: Driver[] = S.drivers || [];
    const pool: Driver[] = (S as any).pool || [];

    const filteredEmployed = selectedRegion === 'All' ? employed : employed.filter(d => (d.region || 'Africa') === selectedRegion);
    const filteredPool = selectedRegion === 'All' ? pool : pool.filter(d => (d.region || 'Africa') === selectedRegion);

    const list = activeTab === 'employed' ? filteredEmployed : filteredPool;
    let page = currentPage;
    const totalPages = Math.ceil(list.length / DRIVERS_PER_PAGE) || 1;
    if (page > totalPages) page = totalPages;
    const paginatedList = list.slice((page - 1) * DRIVERS_PER_PAGE, page * DRIVERS_PER_PAGE);

    const regions: (Region | 'All')[] = ['All', 'America', 'Europe', 'Africa', 'Asia'];
    const transferDriverObj = employed.find((d: any) => d.id === transferModalDriverId);

    return `
      <div class="view" style="padding-bottom:100px;">
        <div class="header-banner" style="background:linear-gradient(135deg, var(--s1), var(--bg)); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <div style="font-size:24px; color:var(--gold);">${ic('user')}</div>
            <div>
              <h2 style="margin:0; font-size:18px; color:var(--tx);">Global Driver Workforce</h2>
              <div style="font-size:11px; color:var(--mu);">Manage regional talent, special traits, morale, fatigue, and logistics assignments.</div>
            </div>
          </div>
        </div>

        <!-- Top Navigation Tabs (Employed vs Pool) -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
          <button class="btn ${activeTab === 'employed' ? 'gold' : 'alt'}" style="padding:10px; font-weight:800;" data-act="driver-tab" data-tab="employed">
            Employed (${employed.length})
          </button>
          <button class="btn ${activeTab === 'pool' ? 'gold' : 'alt'}" style="padding:10px; font-weight:800;" data-act="driver-tab" data-tab="pool">
            Recruitment Pool (${pool.length})
          </button>
        </div>

        <!-- Region Filter Pills -->
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px;">
          ${regions.map(r => `
            <button class="btn ${selectedRegion === r ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="driver-region" data-region="${r}">
              ${r.toUpperCase()}
            </button>
          `).join('')}
        </div>

        <!-- Driver List -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${paginatedList.length === 0 ? `<div class="card" style="padding:30px; text-align:center; color:var(--mu);">${activeTab === 'employed' ? 'No drivers found in this region.' : 'No candidates available in this region. Check back later.'}</div>` : 
            paginatedList.map((d: any) => {
              if (activeTab === 'employed') {
                const isExpanded = expandedDriverId === d.id;
                return renderEmployedCard(d, S, isExpanded);
              } else {
                return renderPoolCard(d);
              }
            }).join('')}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:20px; padding:10px;">
            <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800;" data-act="driver-page" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>PREV</button>
            <span style="font-size:11px; font-family:monospace; color:var(--mu);">PAGE ${page} / ${totalPages}</span>
            <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800;" data-act="driver-page" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>NEXT</button>
          </div>
        ` : ''}

        <!-- Transfer Region Modal -->
        ${renderTransferModal(transferDriverObj)}
      </div>
    `;
  }
};
