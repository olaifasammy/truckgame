import { REGIONAL_HUBS, RegionalHub, RegionName } from '../../domain/logistics/network';
import {
  HubFacility,
  getHubFacility,
  getHubTotalBerths,
  getTrucksAtHub,
  getHubMaxFacilityLevel,
  upgradeHubFacility,
  expandHubBerths,
  expandHubFuelTank,
  orderHubWholesaleFuel,
  getPendingFuelOrdersForHub,
  bulkRefuelHubFleet,
  getHubFacilityUpgradeCost,
  getHubBerthUpgradeCost,
  getHubFuelTankUpgradeCost
} from '../../domain/hubs/hub-facility';
import {
  getHubCharacteristics,
  getHubEffectiveDailyTonnageCapacity,
  getHubDailyUsage,
  getHubEffectiveDailyJobLimit,
  isHubDailyLimitReached
} from '../../domain/hubs/characteristics';
import { action, fmt, toast } from '../../core/ui';
import { set, refresh } from '../../core/store';
import { getHubWholesaleFuelPrice } from '../../domain/economy/fuel-market';
import { renderJobCard } from '../home/job-card';
import { replenishHub } from '../../systems/jobs';

export let activeGarageHubId: string = ''; // Active unlocked hub ID e.g. 'hub_lagos', 'hub_chicago'
let wholesaleFuelModalHubId: string | null = null;
let showHubJobsBoard: boolean = false;
let hubSelectorPage: number = 1;
const HUBS_PER_PAGE = 6;

export function setActiveGarageHub(hubId: string) {
  activeGarageHubId = hubId;
  showHubJobsBoard = false;
  if (!hubId) hubSelectorPage = 1;
  refresh();
}

action('garage-hub-page-prev', () => {
  if (hubSelectorPage > 1) {
    hubSelectorPage--;
    refresh();
  }
});

action('garage-hub-page-next', () => {
  hubSelectorPage++;
  refresh();
});

action('garage-hub-select', d => {
  activeGarageHubId = (d as any).hubId || '';
  showHubJobsBoard = false;
  refresh();
});

action('toggle-garage-hub-jobs', () => {
  showHubJobsBoard = !showHubJobsBoard;
  refresh();
});

action('garage-refresh-hub-jobs', d => {
  const hubId = (d as any).hubId;
  if (!hubId) return;
  set(S => {
    const cost = 250;
    if (S.money < cost) return toast(`Insufficient funds to refresh hub board. Need $${cost}`, 'err');
    S.money -= cost;
    if (!S.hubJobs) S.hubJobs = {};
    S.hubJobs[hubId] = [];
    replenishHub(S, hubId, 6);
    toast('Hub freight board refreshed ($250 fee paid)!', 'success');
  });
});

action('hub-upgrade-facility', d => {
  const hubId = (d as any).hubId;
  set(S => {
    upgradeHubFacility(S, hubId);
  });
  refresh();
});

action('hub-expand-berths', d => {
  const hubId = (d as any).hubId;
  set(S => {
    upgradeHubFacility(S, hubId);
  });
  refresh();
});

action('hub-expand-fuel-tank', d => {
  const hubId = (d as any).hubId;
  set(S => {
    upgradeHubFacility(S, hubId);
  });
  refresh();
});

action('open-hub-fuel-modal', d => {
  wholesaleFuelModalHubId = (d as any).hubId;
  refresh();
});

action('close-hub-fuel-modal', () => {
  wholesaleFuelModalHubId = null;
  refresh();
});

action('hub-order-wholesale-fuel', d => {
  const hubId = (d as any).hubId;
  const inputEl = document.getElementById('wholesale-fuel-custom-input') as HTMLInputElement;
  const liters = inputEl ? parseInt(inputEl.value, 10) : +(d as any).liters;
  if (!liters || isNaN(liters) || liters <= 0) {
    toast('Please enter a valid fuel quantity in liters', 'err');
    return;
  }
  set(S => {
    orderHubWholesaleFuel(S, hubId, liters);
  });
  wholesaleFuelModalHubId = null;
  refresh();
});

action('hub-bulk-refuel-fleet', d => {
  const hubId = (d as any).hubId;
  set(S => {
    bulkRefuelHubFleet(S, hubId);
  });
  refresh();
});

export function renderWholesaleFuelModal(S: any): string {
  if (!wholesaleFuelModalHubId) return '';
  const hub = REGIONAL_HUBS.find(h => h.id === wholesaleFuelModalHubId);
  if (!hub) return '';
  const facility = getHubFacility(S, hub.id);
  const wholesaleRate = getHubWholesaleFuelPrice(hub.id, S);

  const curL = facility.fuelLiters || 0;
  const maxL = facility.fuelCapacity || 15000;
  const pendingOrders = getPendingFuelOrdersForHub(S, hub.id);
  const pendingLiters = pendingOrders.reduce((sum, o) => sum + o.liters, 0);
  const room = Math.max(0, maxL - (curL + pendingLiters));

  const defaultOrderLiters = Math.min(room, 5000);
  const initialCost = Math.round(defaultOrderLiters * wholesaleRate);
  const initialEstSec = Math.max(45, Math.min(240, Math.round(defaultOrderLiters * 12)));

  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.85); backdrop-filter:blur(3px); z-index:1300; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0e1320; border:1px solid var(--gold); border-radius:12px; width:100%; max-width:440px; padding:18px; box-shadow:0 16px 48px rgba(0,0,0,0.7); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px; font-family:monospace;">WHOLESALE TANKER DISPATCH</div>
            <h3 style="margin:2px 0 0; font-size:16px; font-weight:900; color:var(--tx);">${hub.name}</h3>
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">Terminal Fuel Tank · Bulk Rate: $${wholesaleRate.toFixed(2)}/L</div>
          </div>
          <button style="background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer;" data-act="close-hub-fuel-modal">✕</button>
        </div>

        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:10px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:10px; font-family:monospace; margin-bottom:4px;">
            <span style="color:var(--mu);">CURRENT TANK STORAGE</span>
            <span style="color:var(--tx); font-weight:800;">${curL.toLocaleString()} / ${maxL.toLocaleString()} L</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="width:${Math.min(100, (curL / maxL) * 100)}%; height:100%; background:linear-gradient(90deg, #f59e0b, #10b981); border-radius:3px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--mu); font-family:monospace; margin-top:6px;">
            <span>In-Transit Deliveries: <b style="color:var(--gold);">${pendingLiters.toLocaleString()} L</b></span>
            <span>Available Capacity: <b style="color:var(--grn);">${room.toLocaleString()} L</b></span>
          </div>
        </div>

        <!-- CUSTOM QUANTITY INPUT -->
        <div style="margin-bottom:12px;">
          <label style="font-size:9.5px; font-weight:800; color:var(--tx); text-transform:uppercase; display:block; margin-bottom:4px;">Custom Order Liters:</label>
          <div style="display:flex; gap:6px;">
            <input type="number" id="wholesale-fuel-custom-input" min="100" max="${room}" value="${defaultOrderLiters}" 
              style="flex:1; padding:8px 10px; background:#080c16; border:1px solid var(--gold); border-radius:6px; color:var(--tx); font-family:monospace; font-size:13px; font-weight:800;"
              oninput="
                const val = parseFloat(this.value) || 0;
                const cost = Math.round(val * ${wholesaleRate});
                const sec = Math.max(45, Math.min(240, Math.round(val * 12)));
                document.getElementById('fuel-modal-cost').innerText = '$' + cost.toLocaleString();
                document.getElementById('fuel-modal-eta').innerText = '~' + sec + 's';
              "
            />
            <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:800; font-family:monospace;" onclick="document.getElementById('wholesale-fuel-custom-input').value = ${room}; document.getElementById('wholesale-fuel-custom-input').dispatchEvent(new Event('input'));">
              MAX (${room.toLocaleString()}L)
            </button>
          </div>
        </div>

        <!-- QUICK PRESETS -->
        <div style="display:flex; gap:4px; margin-bottom:14px;">
          <button class="btn alt" style="flex:1; padding:4px; font-size:8.5px; font-weight:800; font-family:monospace;" onclick="document.getElementById('wholesale-fuel-custom-input').value = Math.min(${room}, 1000); document.getElementById('wholesale-fuel-custom-input').dispatchEvent(new Event('input'));">1,000 L</button>
          <button class="btn alt" style="flex:1; padding:4px; font-size:8.5px; font-weight:800; font-family:monospace;" onclick="document.getElementById('wholesale-fuel-custom-input').value = Math.min(${room}, 5000); document.getElementById('wholesale-fuel-custom-input').dispatchEvent(new Event('input'));">5,000 L</button>
          <button class="btn alt" style="flex:1; padding:4px; font-size:8.5px; font-weight:800; font-family:monospace;" onclick="document.getElementById('wholesale-fuel-custom-input').value = Math.min(${room}, 10000); document.getElementById('wholesale-fuel-custom-input').dispatchEvent(new Event('input'));">10,000 L</button>
        </div>

        <!-- REAL-TIME CALCULATION SUMMARY CARD -->
        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:10px 12px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:10px; color:var(--mu);">Wholesale Total Cost:</span>
            <span style="font-size:14px; font-weight:900; color:var(--gold); font-family:monospace;" id="fuel-modal-cost">$${initialCost.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:var(--mu); font-family:monospace;">
            <span>Road Tanker Transit Time:</span>
            <span style="color:var(--grn); font-weight:800;" id="fuel-modal-eta">~${initialEstSec}s</span>
          </div>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn alt" style="flex:1; padding:8px; font-size:10px; font-weight:800;" data-act="close-hub-fuel-modal">
            CANCEL
          </button>
          <button class="btn gold" style="flex:1; padding:8px; font-size:10px; font-weight:900;" data-act="hub-order-wholesale-fuel" data-hub-id="${hub.id}">
            🚛 DISPATCH TANKER
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderHubConsole(S: any, currentRegion: RegionName): string {
  // STRICT RULE: Only show hubs that the user has unlocked/acquired
  const unlockedHubsInRegion = REGIONAL_HUBS.filter(h => h.region === currentRegion && (S.depots || []).includes(h.id));

  const hasNoHubs = unlockedHubsInRegion.length === 0;
  const totalHubPages = Math.max(1, Math.ceil(unlockedHubsInRegion.length / HUBS_PER_PAGE));
  if (hubSelectorPage > totalHubPages) hubSelectorPage = totalHubPages;
  if (hubSelectorPage < 1) hubSelectorPage = 1;
  const hubStartIdx = (hubSelectorPage - 1) * HUBS_PER_PAGE;
  const pagedHubs = unlockedHubsInRegion.slice(hubStartIdx, hubStartIdx + HUBS_PER_PAGE);
  
  const hubSelectorBar = `
    <!-- LEVEL 2: REGION >> UNLOCKED HUB SELECTOR BAR -->
    <div style="background:#0a0f1d; border:1px solid #1a2336; border-radius:10px; padding:10px 12px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:11px;">🏢</span>
          <span style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.8px; font-family:monospace;">
            ${currentRegion.toUpperCase()} TERMINAL HUBS (${unlockedHubsInRegion.length})
          </span>
        </div>
        ${totalHubPages > 1 ? `
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="btn alt" style="padding:2px 8px; font-size:9px; font-weight:800;" data-act="garage-hub-page-prev" ${hubSelectorPage <= 1 ? 'disabled style="opacity:0.35;"' : ''}>←</button>
            <span style="font-size:9px; color:var(--mu); font-family:monospace; font-weight:800;">PAGE ${hubSelectorPage}/${totalHubPages}</span>
            <button class="btn alt" style="padding:2px 8px; font-size:9px; font-weight:800;" data-act="garage-hub-page-next" ${hubSelectorPage >= totalHubPages ? 'disabled style="opacity:0.35;"' : ''}>→</button>
          </div>
        ` : `<span style="font-size:8px; color:var(--mu); font-family:monospace;">SELECT OPERATIONAL HUB</span>`}
      </div>

      <!-- Hub Selector Buttons -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; padding-bottom:2px;">
        <button class="btn ${!activeGarageHubId ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; border-radius:6px; display:flex; align-items:center; gap:6px;" data-act="garage-hub-select" data-hub-id="">
          <span>🛰️</span>
          <span>EN-ROUTE</span>
        </button>
        ${pagedHubs.map(hub => {
          const totalBerths = getHubTotalBerths(S, hub.id);
          const trucksAtThisHub = getTrucksAtHub(S, hub.city);
          const isSelected = activeGarageHubId === hub.id;

          return `
            <button class="btn ${isSelected ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; border-radius:6px; display:flex; align-items:center; gap:6px;" data-act="garage-hub-select" data-hub-id="${hub.id}">
              <span>${hub.icon}</span>
              <span>${hub.name.split(' ')[0]}</span>
              <span style="font-size:8px; font-family:monospace; background:${isSelected ? '#0e1320' : 'rgba(16,185,129,0.18)'}; color:${isSelected ? 'var(--gold)' : 'var(--grn)'}; border:1px solid ${isSelected ? 'rgba(193,154,91,0.4)' : 'rgba(16,185,129,0.4)'}; padding:1px 5px; border-radius:3px; font-weight:800;">
                ${trucksAtThisHub.length}/${totalBerths}
              </span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (hasNoHubs && !activeGarageHubId) {
    return hubSelectorBar + `
      <div style="background:#0a0f1d; border:1px dashed #1a2336; border-radius:10px; padding:18px 16px; margin-bottom:14px; text-align:center;">
        <div style="font-size:22px; margin-bottom:6px;">🏢</div>
        <div style="font-size:12px; font-weight:900; color:var(--tx); text-transform:uppercase;">No Terminal Hubs Acquired in ${currentRegion}</div>
        <div style="font-size:10px; color:var(--mu); font-family:monospace; margin:4px auto 12px; max-width:420px; line-height:1.4;">
          You hold commercial operating authority in ${currentRegion}. Acquire a regional terminal hub in the Network view to unlock parking berths, dedicated fuel bunkers, and local freight staging.
        </div>
        <button class="btn gold" style="padding:6px 16px; font-size:10px; font-weight:900;" data-act="tab" data-id="network">
          ACQUIRE ${currentRegion.toUpperCase()} TERMINAL HUBS
        </button>
      </div>
    `;
  }

  if (!activeGarageHubId) {
    return hubSelectorBar;
  }

  const selectedHub = unlockedHubsInRegion.find(h => h.id === activeGarageHubId);
  if (!selectedHub) return hubSelectorBar; // Fallback if hub somehow not found or not owned

  const facility = getHubFacility(S, selectedHub.id);
  const char = getHubCharacteristics(selectedHub.id);
  const maxLvl = getHubMaxFacilityLevel(selectedHub.id);
  const wholesaleRate = getHubWholesaleFuelPrice(selectedHub.id, S);
  const pendingOrders = getPendingFuelOrdersForHub(S, selectedHub.id);
  const facilityCost = getHubFacilityUpgradeCost(facility, S);
  const facilityLvl = facility.level || 1;
  const yieldBonusPct = (facilityLvl - 1) * 4;
  const maxTonnage = getHubEffectiveDailyTonnageCapacity(S, selectedHub.id);
  const extraTonnageCount = (facilityLvl - 1) * 500;
  const isMaxLvl = facilityLvl >= maxLvl;

  const usage = getHubDailyUsage(S, selectedHub.id);
  const maxJobs = getHubEffectiveDailyJobLimit(S, selectedHub.id);
  const limitReached = isHubDailyLimitReached(S, selectedHub.id);
  const usageRatio = maxTonnage > 0 ? (usage.tonnageCount / maxTonnage) : 0;
  const isNearingLimit = usageRatio >= 0.8 && !limitReached;
  const showCapacityBanner = limitReached || isNearingLimit;

  const lastDayTs = S.lastAccountingDayTimestamp || Date.now();
  const nextDayTs = lastDayTs + 43200000;
  const diffMs = Math.max(0, nextDayTs - Date.now());
  const totalSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedEta = `${hrs}:${pad(mins)}:${pad(secs)}`;

  return `
    ${hubSelectorBar}

    <!-- COMPACT HUB CONSOLE -->
    <div style="background:#0e1320; border:1px solid rgba(193,154,91,0.4); border-radius:10px; padding:10px 12px; margin-bottom:12px; box-shadow:0 6px 20px rgba(0,0,0,0.35);">
      <!-- Hub Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">${selectedHub.icon}</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <h3 style="margin:0; font-size:13.5px; font-weight:900; color:var(--tx);">${selectedHub.name}</h3>
              <span style="font-size:8.5px; color:var(--gold); font-family:monospace; background:#080c16; border:1px solid rgba(193,154,91,0.3); padding:1px 5px; border-radius:3px;">${selectedHub.city}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:8px; font-weight:900; color:var(--gold); background:rgba(193,154,91,0.12); border:1px solid var(--gold); padding:2px 6px; border-radius:3px; font-family:monospace;">
            LEVEL ${facilityLvl}/${maxLvl} (${char?.tierLabel || 'Tier 2'})
          </span>
          <span style="font-size:8px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.12); border:1px solid var(--grn); padding:2px 6px; border-radius:3px; font-family:monospace;">
            ✓ ACTIVE
          </span>
        </div>
      </div>

      <!-- IN-TRANSIT TANKER DELIVERIES INDICATOR -->
      ${pendingOrders.length > 0 ? `
        <div style="background:#080c16; border:1px solid var(--gold); border-radius:6px; padding:6px 10px; margin-bottom:8px;">
          ${pendingOrders.map(ord => {
            const remSec = Math.max(0, Math.round((ord.deliverAt - Date.now()) / 1000));
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; font-family:monospace;">
                <span style="color:var(--gold); font-weight:800;">🚛 Tanker In-Transit: ${ord.liters.toLocaleString()}L ordered at $${ord.wholesaleRate}/L</span>
                <span style="color:var(--grn); font-weight:900;">ETA: ~${remSec}s</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- DAILY FREIGHT CAPACITY & USAGE STATUS BANNER (Shown only when nearing limit or reached) -->
      ${showCapacityBanner ? `
        <div style="background:${limitReached ? 'rgba(239,68,68,0.12)' : 'rgba(193,154,91,0.1)'}; border:1px solid ${limitReached ? 'rgba(239,68,68,0.45)' : 'rgba(193,154,91,0.4)'}; border-radius:8px; padding:8px 10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">${limitReached ? '⚠️' : '⚡'}</span>
            <div>
              <div style="font-size:9.5px; font-weight:900; color:${limitReached ? '#ef4444' : 'var(--gold)'}; text-transform:uppercase; letter-spacing:0.3px;">
                ${limitReached ? `Max Hub payload tonnage reached for today (${usage.tonnageCount.toLocaleString()} / ${maxTonnage.toLocaleString()} Tonnes)` : `Hub Nearing Daily Tonnage Capacity (${Math.round(usageRatio * 100)}% Used)`}
              </div>
              <div style="font-size:8.5px; color:var(--mu); font-family:monospace; margin-top:2px;">
                ${limitReached ? `Dispatches will resume in <b style="color:var(--gold);" data-hub-reset-eta="${nextDayTs}">${formattedEta}</b>` : `Payload: <b style="color:var(--tx);">${usage.tonnageCount.toLocaleString()} / ${maxTonnage.toLocaleString()} Tonnes</b> · Upgrade hub facility to expand capacity.`}
              </div>
            </div>
          </div>
          <div style="font-size:8.5px; font-weight:800; font-family:monospace; color:${limitReached ? '#ef4444' : 'var(--gold)'}; background:${limitReached ? 'rgba(239,68,68,0.2)' : 'rgba(193,154,91,0.2)'}; border:1px solid ${limitReached ? 'rgba(239,68,68,0.5)' : 'rgba(193,154,91,0.5)'}; padding:3px 8px; border-radius:4px; white-space:nowrap;">
            ${limitReached ? 'CAPACITY REACHED' : 'NEAR CAPACITY'}
          </div>
        </div>
      ` : ''}

      <!-- UNIFIED HUB FACILITY UPGRADE HEADER CARD -->
      <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:8px 10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9.5px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:0.3px;">
            Hub Terminal Level ${facilityLvl} / ${maxLvl}
          </div>
          <div style="font-size:8.5px; color:var(--grn); font-family:monospace; margin-top:2px;">
            Yield Boost: <b style="color:var(--gold);">+${yieldBonusPct}% $/km</b> · Daily Max Freight Volume: <b style="color:var(--gold);">${maxTonnage.toLocaleString()} T/day</b> (+${extraTonnageCount} T/day)
          </div>
        </div>
        ${isMaxLvl ? `
          <span style="font-size:8.5px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.15); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace;">
            ✓ MAX LEVEL REACHED
          </span>
        ` : `
          <button class="btn gold" style="padding:4px 10px; font-size:8.5px; font-weight:900;" data-act="hub-upgrade-facility" data-hub-id="${selectedHub.id}" ${S.money < facilityCost ? 'disabled style="opacity:0.4;"' : ''} title="Upgrade Hub Facility (+2 Berths, +10kL Fuel Storage, +500 T/day Max Freight Volume, +4% Yield)">
            🏛️ UPGRADE TO LVL ${facilityLvl + 1} (${fmt(facilityCost)})
          </button>
        `}
      </div>

      <!-- Hub Controls Grid: Berths & Fuel Tank -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        
        <!-- CARD 1: BERTHS -->
        ${(() => {
          const occ = getTrucksAtHub(S, selectedHub.city).length;
          const cap = getHubTotalBerths(S, selectedHub.id);
          const overflow = Math.max(0, occ - cap);
          return `
        <div style="background:#080c16; border:1px solid ${overflow > 0 ? 'rgba(239,68,68,0.45)' : '#1a2336'}; border-radius:6px; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
            <span style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase;">PARKING BERTHS</span>
            <span style="font-size:9.5px; font-weight:900; color:${overflow > 0 ? '#ef4444' : 'var(--tx)'}; font-family:monospace;">
              ${occ} / ${cap} Occupied
            </span>
          </div>
          <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; margin-bottom:6px;">
            <div style="width:${Math.min(100, (occ / Math.max(1, cap)) * 100)}%; height:100%; background:${overflow > 0 ? '#ef4444' : 'var(--gold)'}; border-radius:2px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">Base: ${selectedHub.berths} (+${facility.extraBerths || 0})</div>
            ${overflow > 0
              ? `<span style="font-size:8px; font-weight:800; color:#ef4444; font-family:monospace;">OVERFLOW +${overflow} (-$${overflow * 60}/d)</span>`
              : `<span style="font-size:8px; font-weight:800; color:var(--grn); font-family:monospace;">+2 Berths / Lvl</span>`
            }
          </div>
        </div>`;
        })()}

        <!-- CARD 2: DIESEL TANK -->
        <div style="background:#080c16; border:1px solid #1a2336; border-radius:6px; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
            <span style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase;">DIESEL TANK</span>
            <span style="font-size:9.5px; font-weight:900; color:${(facility.fuelLiters || 0) < 2000 ? '#ef4444' : 'var(--grn)'}; font-family:monospace;">
              ${Math.round(facility.fuelLiters || 0).toLocaleString()} / ${(facility.fuelCapacity || 15000).toLocaleString()} L
            </span>
          </div>
          <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; margin-bottom:6px;">
            <div style="width:${Math.min(100, ((facility.fuelLiters || 0) / (facility.fuelCapacity || 15000)) * 100)}%; height:100%; background:linear-gradient(90deg, #f59e0b, #10b981); border-radius:2px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">
              Bulk: <b style="color:var(--tx);">$${wholesaleRate.toFixed(2)}/L</b>
            </div>
            <button class="btn gold" style="padding:2px 8px; font-size:7.5px; font-weight:900;" data-act="open-hub-fuel-modal" data-hub-id="${selectedHub.id}">
              ⛽ ORDER WHOLESALE
            </button>
          </div>
        </div>

      </div>

      <!-- Quick Hub Fleet Action Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; background:#080c16; border:1px solid #1a2336; border-radius:5px; padding:6px 8px;">
        <div style="font-size:8.5px; color:var(--mu); font-family:monospace; display:flex; align-items:center; gap:4px;">
          <span>⚡</span>
          <span>Auto-refuels parked fleet at departure.</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn ${showHubJobsBoard ? 'gold' : 'alt'}" style="padding:3px 10px; font-size:7.5px; font-weight:900; ${showHubJobsBoard ? '' : 'color:var(--gold); border-color:rgba(193,154,91,0.5);'}" data-act="toggle-garage-hub-jobs">
            📦 HUB JOBS (${(S.hubJobs?.[selectedHub.id] || []).length})
          </button>
          <button class="btn alt" style="padding:3px 8px; font-size:7.5px; font-weight:800; color:var(--grn); border-color:rgba(16,185,129,0.4);" data-act="hub-bulk-refuel-fleet" data-hub-id="${selectedHub.id}">
            ⚡ REFUEL FLEET (${selectedHub.city})
          </button>
        </div>
      </div>

      ${showHubJobsBoard ? (() => {
        const hubJobs = S.hubJobs?.[selectedHub.id] || [];
        return `
          <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(193,154,91,0.25);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="font-size:10px; font-weight:900; color:var(--gold); letter-spacing:0.8px; text-transform:uppercase; font-family:monospace;">
                📦 ${selectedHub.city} TERMINAL FREIGHT BOARD (${hubJobs.length} / 10)
              </span>
              <div style="display:flex; gap:6px;">
                <button class="btn alt" style="padding:4px 10px; font-size:8.5px; font-weight:800; border-color:var(--gold); color:var(--gold);" data-act="garage-refresh-hub-jobs" data-hub-id="${selectedHub.id}">
                  🔄 Refresh $250
                </button>
                <button class="btn alt" style="padding:4px 8px; font-size:8.5px; font-weight:800;" data-act="toggle-garage-hub-jobs">
                  ✕
                </button>
              </div>
            </div>

            ${hubJobs.length > 0 ? hubJobs.map((j: any) => renderJobCard(S, j)).join('') : `
              <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:20px; text-align:center; color:var(--mu); font-size:10px; font-family:monospace;">
                NO HUB-ORIGINATED LOADS CURRENTLY AVAILABLE AT ${selectedHub.city.toUpperCase()}.
                <br/><br/>
                <button class="btn gold" style="padding:6px 14px; font-size:9.5px; font-weight:900;" data-act="garage-refresh-hub-jobs" data-hub-id="${selectedHub.id}">
                  GENERATE LOADS ($250)
                </button>
              </div>
            `}
          </div>
        `;
      })() : ''}
    </div>

    ${renderWholesaleFuelModal(S)}
  `;
}
