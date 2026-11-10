import { ic } from '../../core/icons';
import { action, fmt, toast } from '../../core/ui';
import { refresh } from '../../core/store';
import { TRUCK_MODELS } from '../../domain/trucks/trucks.data';
import { PART_LABELS } from '../../systems/calc';
import { LOCATIONS, RegionName, resolveTruckRegion } from '../../data/world';

export type DiagFilter = 'all' | 'critical' | 'warning' | 'optimal';
export type DiagSort = 'wear' | 'health_asc' | 'health_desc' | 'id' | 'odo';

let diagFilter: DiagFilter = 'all';
let diagSort: DiagSort = 'wear';
let diagSearch: string = '';
let diagPage: number = 1;
const UNITS_PER_PAGE = 6;

// Export setter for search input
if (typeof window !== 'undefined') {
  (window as any).__setDiagSearch = (val: string) => {
    diagSearch = val.toLowerCase().trim();
    diagPage = 1;
    refresh();
  };
}

action('set-diag-filter', d => {
  diagFilter = (d as any).filter as DiagFilter;
  diagPage = 1;
  refresh();
});

action('set-diag-sort', d => {
  diagSort = (d as any).sort as DiagSort;
  diagPage = 1;
  refresh();
});

action('diag-page-prev', () => {
  if (diagPage > 1) {
    diagPage--;
    refresh();
  }
});

action('diag-page-next', () => {
  diagPage++;
  refresh();
});

action('diag-clear-search', () => {
  diagSearch = '';
  diagPage = 1;
  const input = document.getElementById('diag-search-input') as HTMLInputElement | null;
  if (input) input.value = '';
  refresh();
});

export function calculateTruckHealth(t: any) {
  const comp = t.components || {};
  const vals: number[] = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
  const avgHealth = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 100;
  const minHealth = vals.length > 0 ? Math.round(Math.min(...vals)) : 100;
  const lowFluids = (t.fluids?.coolant || 100) < 60 || (t.fluids?.oil || 40) < 25 || (t.fluids?.adBlue || 100) < 50;
  const statusTier = (minHealth < 40 || avgHealth < 50) ? 'critical' : (minHealth < 75 || avgHealth < 85 || lowFluids) ? 'warning' : 'optimal';
  return { avgHealth, minHealth, lowFluids, statusTier };
}

export function renderDiagnosticTable(S: any, repairsQueue: any[], lastScanTimestamp: number, regionFilter: RegionName | 'All' = 'All'): string {
  const allFleet = S.fleet || [];
  const fleet = regionFilter === 'All' ? allFleet : allFleet.filter((t: any) => resolveTruckRegion(t) === regionFilter);

  // 1. Calculate stats across fleet in selected region
  let critCount = 0;
  let warnCount = 0;
  let optCount = 0;

  const fleetWithStats = fleet.map((t: any) => {
    const stats = calculateTruckHealth(t);
    if (stats.statusTier === 'critical') critCount++;
    else if (stats.statusTier === 'warning') warnCount++;
    else optCount++;
    return { truck: t, ...stats };
  });

  // 2. Filter
  let filtered = fleetWithStats.filter((item: any) => {
    const t = item.truck;
    if (diagFilter === 'critical' && item.statusTier !== 'critical') return false;
    if (diagFilter === 'warning' && item.statusTier !== 'warning') return false;
    if (diagFilter === 'optimal' && item.statusTier !== 'optimal') return false;

    if (diagSearch) {
      const tm = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
      const locName = LOCATIONS[t.loc]?.name || t.loc || '';
      const searchTarget = `${t.id} ${t.name} ${tm?.name || ''} ${tm?.brand || ''} ${locName}`.toLowerCase();
      if (!searchTarget.includes(diagSearch)) return false;
    }
    return true;
  });

  // 3. Sort
  filtered.sort((a: any, b: any) => {
    if (diagSort === 'wear') {
      // Lowest individual component health first
      return a.minHealth - b.minHealth;
    }
    if (diagSort === 'health_asc') {
      return a.avgHealth - b.avgHealth;
    }
    if (diagSort === 'health_desc') {
      return b.avgHealth - a.avgHealth;
    }
    if (diagSort === 'odo') {
      return (b.truck.odometer || 0) - (a.truck.odometer || 0);
    }
    return a.truck.id - b.truck.id;
  });

  // 4. Pagination
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / UNITS_PER_PAGE));
  if (diagPage > totalPages) diagPage = totalPages;
  const startIndex = (diagPage - 1) * UNITS_PER_PAGE;
  const pageUnits = filtered.slice(startIndex, startIndex + UNITS_PER_PAGE);

  return `
    <div style="display:flex; flex-direction:column; gap:12px;">
      
      <!-- Diagnostic Controls Header: Search, Filter Tabs, and Sorter -->
      <div style="background:#0e1320; border:1px solid #1f293d; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:10px;">
        
        <!-- Top bar: Title + OBD Scan Telemetry Status -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:12px; font-weight:900; color:var(--tx); letter-spacing:0.5px;">
              FLEET OBD-II TELEMETRY SCANNER
            </div>
            <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
              Monitoring ${fleet.length} active tractor power units ${regionFilter !== 'All' ? `stationed in ${regionFilter}` : ''} · Showing ${totalItems} matched
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:9px; color:var(--mu); font-family:monospace;">
              Telemetry Sync: ${new Date(lastScanTimestamp).toLocaleTimeString()}
            </span>
            <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="run-fleet-scan">
              ${ic('activity')} RESCAN ALL
            </button>
          </div>
        </div>

        <!-- Filter Chips Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px solid #1a2336; padding-top:10px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn ${diagFilter === 'all' ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="set-diag-filter" data-filter="all">
              ALL UNITS (${fleet.length})
            </button>
            <button class="btn ${diagFilter === 'critical' ? 'danger' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800; color:${diagFilter === 'critical' ? '#fff' : '#ef4444'};" data-act="set-diag-filter" data-filter="critical">
              🔴 CRITICAL (${critCount})
            </button>
            <button class="btn ${diagFilter === 'warning' ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800; color:${diagFilter === 'warning' ? '#000' : 'var(--gold)'};" data-act="set-diag-filter" data-filter="warning">
              🟡 SERVICE DUE (${warnCount})
            </button>
            <button class="btn ${diagFilter === 'optimal' ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800; color:${diagFilter === 'optimal' ? '#000' : 'var(--grn)'};" data-act="set-diag-filter" data-filter="optimal">
              🟢 ROAD READY (${optCount})
            </button>
          </div>

          <!-- Sort Selector -->
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:9px; color:var(--mu); font-family:monospace; text-transform:uppercase;">SORT BY:</span>
            <select style="background:#080c16; border:1px solid #1f293d; color:var(--tx); font-size:9px; font-weight:700; padding:4px 8px; border-radius:6px; outline:none;" onchange="window.__actions?.get('set-diag-sort')?.({ sort: this.value })">
              <option value="wear" ${diagSort === 'wear' ? 'selected' : ''}>⚠️ Highest Component Wear First (Recommended)</option>
              <option value="health_asc" ${diagSort === 'health_asc' ? 'selected' : ''}>Lowest Overall Health First</option>
              <option value="health_desc" ${diagSort === 'health_desc' ? 'selected' : ''}>Highest Health First</option>
              <option value="odo" ${diagSort === 'odo' ? 'selected' : ''}>Highest Odometer First</option>
              <option value="id" ${diagSort === 'id' ? 'selected' : ''}>Unit ID Ascending</option>
            </select>
          </div>
        </div>

        <!-- Live Search Input -->
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="position:relative; flex:1;">
            <input 
              id="diag-search-input"
              type="text" 
              placeholder="Search tractor by Unit #, Model, Brand, or Location..."
              value="${diagSearch}"
              oninput="window.__setDiagSearch?.(this.value)"
              style="width:100%; background:#080c16; border:1px solid #1f293d; color:var(--tx); font-size:10px; padding:6px 10px; border-radius:6px; outline:none; box-sizing:border-box;"
            />
          </div>
          ${diagSearch ? `
            <button class="btn alt" style="padding:6px 10px; font-size:9px;" data-act="diag-clear-search">
              CLEAR
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Units List -->
      ${pageUnits.length === 0 ? `
        <div class="card" style="padding:32px; text-align:center; color:var(--mu); background:#0b1120; border-radius:10px;">
          <div style="font-size:24px; margin-bottom:8px;">🔍</div>
          <div style="font-size:12px; font-weight:800; color:var(--tx);">${fleet.length === 0 ? `No tractors currently stationed in ${regionFilter}` : 'No tractors found matching filter or search criteria'}</div>
          <div style="font-size:10px; color:var(--mu); margin-top:4px;">${fleet.length === 0 ? `Transfer trucks to ${regionFilter} from the Fleet Depot or select "ALL" to inspect other divisions.` : 'Try selecting "ALL UNITS" or clearing your search query.'}</div>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${pageUnits.map((item: any) => {
            const t = item.truck;
            const tm = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
            const locInfo = LOCATIONS[t.loc];
            const avgHealth = item.avgHealth;
            const statusTier = item.statusTier;
            const isUnderRepair = t.status === 'repair' || repairsQueue.some((r: any) => r.truckId === t.id && !r.scheduled);
            const isScheduled = repairsQueue.some((r: any) => r.truckId === t.id && r.scheduled);
            const isBusy = t.status === 'busy';

            // Collect flagged worn components
            const wornIssues: string[] = [];
            Object.entries(t.components || {}).forEach(([compKey, compVal]: [string, any]) => {
              const h = typeof compVal === 'number' ? compVal : compVal?.health ?? 100;
              if (h < 50) {
                wornIssues.push(`<span style="color:#ef4444; font-weight:800;">🔴 ${PART_LABELS[compKey] || compKey} (${Math.round(h)}%)</span>`);
              } else if (h < 75) {
                wornIssues.push(`<span style="color:var(--gold); font-weight:700;">🟡 ${PART_LABELS[compKey] || compKey} (${Math.round(h)}%)</span>`);
              }
            });

            if ((t.fluids?.coolant || 100) < 30) wornIssues.push('<span style="color:#ef4444; font-weight:800;">🔴 Coolant Critical</span>');
            else if ((t.fluids?.coolant || 100) < 60) wornIssues.push('<span style="color:var(--gold); font-weight:700;">🟡 Coolant Low</span>');
            
            if ((t.fluids?.adBlue || 100) < 30) wornIssues.push('<span style="color:var(--gold); font-weight:700;">🟡 DEF/AdBlue Low</span>');
            if ((t.fluids?.oil || 40) < 15) wornIssues.push('<span style="color:#ef4444; font-weight:800;">🔴 Engine Oil Deficit</span>');

            const statusColor = statusTier === 'critical' ? '#ef4444' : statusTier === 'warning' ? 'var(--gold)' : 'var(--grn)';
            const statusBadgeText = isUnderRepair ? '🛠️ UNDER REPAIR' : statusTier === 'critical' ? '🔴 CRITICAL SERVICE' : statusTier === 'warning' ? '🟡 WEAR DETECTED' : '🟢 OPTIMAL MINT';

            return `
              <div style="background:#0e1320; border:1px solid ${statusTier === 'critical' ? 'rgba(239,68,68,0.45)' : statusTier === 'warning' ? 'rgba(193,154,91,0.45)' : '#1f293d'}; border-radius:8px; padding:10px 12px;">
                <!-- Vehicle Header Row -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:10px; font-family:monospace; color:var(--gold); font-weight:900;">UNIT #${t.id}</span>
                      <span style="font-size:12px; font-weight:900; color:var(--tx);">${t.name}</span>
                      <span style="font-size:8px; font-weight:800; color:${statusColor}; background:${statusColor}18; border:1px solid ${statusColor}40; padding:1px 6px; border-radius:4px; font-family:monospace;">
                        ${statusBadgeText}
                      </span>
                    </div>
                    <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                      ${tm.brand} ${tm.name} (${tm.engine.hp} HP) · Base: <b>${locInfo?.name || t.loc}</b> <span style="color:var(--gold); font-size:8px; font-weight:800;">[${resolveTruckRegion(t).toUpperCase()}]</span> · Odo: <span data-truck-odo="${t.id}" class="tabular-nums font-mono">${Math.round(t.odometer).toLocaleString()} km</span>
                    </div>
                  </div>
                  
                  <div style="text-align:right;">
                    <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">HEALTH</div>
                    <div style="font-size:14px; font-weight:900; color:${statusColor}; font-family:monospace;">${avgHealth}%</div>
                  </div>
                </div>

                <!-- Health Progress Bar -->
                <div style="height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; margin-bottom:6px;">
                  <div style="width:${avgHealth}%; height:100%; background:${statusColor}; border-radius:3px; transition:width 0.4s ease;"></div>
                </div>

                <!-- Component Wear Telemetry Readout -->
                <div style="background:#080c16; border:1px solid #1a2336; border-radius:6px; padding:5px 8px; margin-bottom:8px; font-size:9px; font-family:monospace;">
                  ${wornIssues.length > 0 
                    ? `<div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
                         <span style="color:var(--mu); font-weight:800;">DIAGNOSTIC FAULTS:</span>
                         ${wornIssues.join(' · ')}
                       </div>`
                    : `<span style="color:var(--grn); font-weight:700;">✓ All powertrain, braking, suspension & fluids nominal. No servicing required.</span>`}
                </div>

                <!-- Footer & Action Row -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                  <div style="font-size:9px; color:var(--mu); font-family:monospace;">
                    ${isUnderRepair ? '🛠️ Occupying hydraulic hoist bay' : isScheduled ? '🕒 Scheduled for repair upon hub arrival' : isBusy ? '🛣️ In transit on highway' : '📍 Staged at depot berth, ready for hoist'}
                  </div>
                  <button class="btn ${statusTier === 'optimal' && !isScheduled ? 'alt' : 'gold'}" style="padding:5px 12px; font-size:9px; font-weight:900; letter-spacing:0.5px;" data-act="hoist-truck-to-bay" data-id="${t.id}">
                    ${isUnderRepair ? 'VIEW BAY PROGRESS →' : isScheduled ? 'VIEW SCHEDULED QUEUE →' : isBusy ? 'PRE-PAY & SCHEDULE →' : statusTier === 'optimal' ? 'INSPECT SPECIFICATIONS' : 'HOIST TO REPAIR BAY →'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Pagination Footer -->
      ${totalPages > 1 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#0e1320; border:1px solid #1f293d; border-radius:8px; padding:8px 12px; margin-top:4px;">
          <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="diag-page-prev" ${diagPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
            ← PREVIOUS
          </button>
          <div style="font-size:9px; color:var(--mu); font-family:monospace;">
            PAGE <span style="color:var(--tx); font-weight:900;">${diagPage}</span> OF <span style="color:var(--tx); font-weight:900;">${totalPages}</span> (${totalItems} UNITS)
          </div>
          <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="diag-page-next" ${diagPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
            NEXT →
          </button>
        </div>
      ` : ''}

    </div>
  `;
}
