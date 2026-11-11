import { REGIONAL_HUBS, RegionalHub, RegionName } from '../../domain/logistics/network';
import {
  HubFacility,
  getHubFacility,
  getHubTotalBerths,
  getTrucksAtHub,
  expandHubBerths,
  expandHubFuelTank,
  buyHubWholesaleFuel,
  bulkRefuelHubFleet,
  getHubBerthUpgradeCost,
  getHubFuelTankUpgradeCost
} from '../../domain/hubs/hub-facility';
import { action, fmt, toast } from '../../core/ui';
import { set, refresh } from '../../core/store';

export let activeGarageHubId: string = ''; // Active unlocked hub ID e.g. 'hub_lagos', 'hub_chicago'
let wholesaleFuelModalHubId: string | null = null;

export function setActiveGarageHub(hubId: string) {
  activeGarageHubId = hubId;
  refresh();
}

action('garage-hub-select', d => {
  activeGarageHubId = (d as any).hubId || '';
  refresh();
});

action('hub-expand-berths', d => {
  const hubId = (d as any).hubId;
  set(S => {
    expandHubBerths(S, hubId);
  });
  refresh();
});

action('hub-expand-fuel-tank', d => {
  const hubId = (d as any).hubId;
  set(S => {
    expandHubFuelTank(S, hubId);
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
  const liters = +(d as any).liters;
  set(S => {
    buyHubWholesaleFuel(S, hubId, liters);
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

  const curL = facility.fuelLiters || 0;
  const maxL = facility.fuelCapacity || 15000;
  const room = Math.max(0, maxL - curL);

  const orderOptions = [
    { label: '5,000 Liters', liters: 5000, cost: Math.round(5000 * 0.85) },
    { label: '10,000 Liters', liters: 10000, cost: Math.round(10000 * 0.85) },
    { label: `Fill Tank to Max (${room.toLocaleString()}L)`, liters: room, cost: Math.round(room * 0.85) }
  ].filter(opt => opt.liters > 0);

  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.85); backdrop-filter:blur(3px); z-index:1300; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0e1320; border:1px solid var(--gold); border-radius:12px; width:100%; max-width:440px; padding:18px; box-shadow:0 16px 48px rgba(0,0,0,0.7); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px; font-family:monospace;">WHOLESALE REFINERY DISPATCH</div>
            <h3 style="margin:2px 0 0; font-size:16px; font-weight:900; color:var(--tx);">${hub.name}</h3>
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">Terminal Fuel Bunker Tank · $0.85/L Wholesale Rate</div>
          </div>
          <button style="background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer;" data-act="close-hub-fuel-modal">✕</button>
        </div>

        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:10px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; font-size:10px; font-family:monospace; margin-bottom:4px;">
            <span style="color:var(--mu);">CURRENT TANK STORAGE</span>
            <span style="color:var(--tx); font-weight:800;">${curL.toLocaleString()} / ${maxL.toLocaleString()} L</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="width:${Math.min(100, (curL / maxL) * 100)}%; height:100%; background:linear-gradient(90deg, #f59e0b, #10b981); border-radius:3px;"></div>
          </div>
          <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:6px; text-align:right;">
            Available Empty Capacity: <b style="color:var(--gold);">${room.toLocaleString()} L</b>
          </div>
        </div>

        <div style="font-size:10px; font-weight:800; color:var(--tx); margin-bottom:8px; text-transform:uppercase;">Select Tanker Delivery Volume:</div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
          ${orderOptions.map(opt => {
            const canAfford = S.money >= opt.cost;
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px;">
                <div>
                  <div style="font-size:12px; font-weight:800; color:var(--tx);">${opt.label}</div>
                  <div style="font-size:9px; color:var(--grn); font-family:monospace; margin-top:2px;">
                    ✓ Saves ~$${(opt.liters * (2.50 - 0.85)).toLocaleString()} vs commercial road pumps ($2.50/L)
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace; margin-bottom:3px;">$${opt.cost.toLocaleString()}</div>
                  <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:900;" data-act="hub-order-wholesale-fuel" data-hub-id="${hub.id}" data-liters="${opt.liters}" ${!canAfford ? 'disabled style="opacity:0.4;"' : ''}>
                    ORDER TANKER
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn alt" style="width:100%; padding:8px; font-size:10px; font-weight:800;" data-act="close-hub-fuel-modal">
          CANCEL
        </button>
      </div>
    </div>
  `;
}

export function renderHubConsole(S: any, currentRegion: RegionName): string {
  // STRICT RULE: Only show hubs that the user has unlocked/acquired
  const unlockedHubsInRegion = REGIONAL_HUBS.filter(h => h.region === currentRegion && (S.depots || []).includes(h.id));

  // We no longer auto-select the first hub if empty, because empty means "Enroute View"
  
  // If no hubs are unlocked in this region yet
  if (unlockedHubsInRegion.length === 0) {
    return `
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

  const selectedHub = unlockedHubsInRegion.find(h => h.id === activeGarageHubId) || unlockedHubsInRegion[0];
  const facility = getHubFacility(S, selectedHub.id);

  return `
    <!-- LEVEL 2: REGION >> UNLOCKED HUB SELECTOR BAR -->
    <div style="background:#0a0f1d; border:1px solid #1a2336; border-radius:10px; padding:10px 12px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:11px;">🏢</span>
          <span style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.8px; font-family:monospace;">
            ${currentRegion.toUpperCase()} TERMINAL HUBS (${unlockedHubsInRegion.length})
          </span>
        </div>
        <span style="font-size:8px; color:var(--mu); font-family:monospace;">SELECT OPERATIONAL HUB</span>
      </div>

      <!-- Hub Selector Buttons -->
      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;">
        <button class="btn ${!activeGarageHubId ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; border-radius:6px; display:flex; align-items:center; gap:6px;" data-act="garage-hub-select" data-hub-id="">
          <span>🛰️</span>
          <span>EN-ROUTE</span>
        </button>
        ${unlockedHubsInRegion.map(hub => {
          const totalBerths = getHubTotalBerths(S, hub.id);
          const trucksAtThisHub = getTrucksAtHub(S, hub.city);
          const isSelected = activeGarageHubId === hub.id;

          return `
            <button class="btn ${isSelected ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; border-radius:6px; display:flex; align-items:center; gap:6px;" data-act="garage-hub-select" data-hub-id="${hub.id}">
              <span>${hub.icon}</span>
              <span>${hub.name.split(' ')[0]} (${hub.city})</span>
              <span style="font-size:8px; font-family:monospace; background:${isSelected ? '#0e1320' : 'rgba(16,185,129,0.18)'}; color:${isSelected ? 'var(--gold)' : 'var(--grn)'}; border:1px solid ${isSelected ? 'rgba(193,154,91,0.4)' : 'rgba(16,185,129,0.4)'}; padding:1px 5px; border-radius:3px; font-weight:800;">
                ${trucksAtThisHub.length}/${totalBerths}
              </span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- DEDICATED HUB MANAGEMENT CONSOLE FOR SELECTED HUB -->
    <div style="background:#0e1320; border:1px solid rgba(193,154,91,0.4); border-radius:12px; padding:14px; margin-bottom:14px; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
      <!-- Hub Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:40px; height:40px; background:#080c16; border:1px solid #1a2336; border-radius:8px; display:grid; place-items:center; font-size:22px; flex-shrink:0;">
            ${selectedHub.icon}
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <h3 style="margin:0; font-size:15px; font-weight:900; color:var(--tx);">${selectedHub.name}</h3>
              <span style="font-size:9px; color:var(--gold); font-family:monospace; background:#080c16; border:1px solid rgba(193,154,91,0.3); padding:1px 6px; border-radius:3px;">${selectedHub.city}</span>
            </div>
            <div style="font-size:9px; color:var(--mu); margin-top:2px; font-family:monospace;">
              ${selectedHub.desc}
            </div>
          </div>
        </div>

        <div>
          <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.12); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace; display:inline-flex; align-items:center; gap:4px;">
            <span>✓</span> OPERATIONAL HUB
          </span>
        </div>
      </div>

      <!-- Hub Controls Grid: Berths & Fuel Tank -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        
        <!-- CARD 1: HUB BERTHS / PARKING SLOTS -->
        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:10px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase;">TERMINAL PARKING BERTHS</span>
            <span style="font-size:10px; font-weight:900; color:var(--tx); font-family:monospace;">
              ${getTrucksAtHub(S, selectedHub.city).length} / ${getHubTotalBerths(S, selectedHub.id)} Occupied
            </span>
          </div>
          <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:2.5px; overflow:hidden; margin-bottom:8px;">
            <div style="width:${Math.min(100, (getTrucksAtHub(S, selectedHub.city).length / getHubTotalBerths(S, selectedHub.id)) * 100)}%; height:100%; background:var(--gold); border-radius:2.5px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">Base: ${selectedHub.berths} · Expanded: +${facility.extraBerths || 0}</div>
            <button class="btn alt" style="padding:3px 8px; font-size:8px; font-weight:800; color:var(--gold); border-color:rgba(193,154,91,0.4);" data-act="hub-expand-berths" data-hub-id="${selectedHub.id}" ${S.money < getHubBerthUpgradeCost(facility) ? 'disabled style="opacity:0.4;"' : ''}>
              + EXPAND (+2 BERTHS: $${fmt(getHubBerthUpgradeCost(facility))})
            </button>
          </div>
        </div>

        <!-- CARD 2: DEDICATED DIESEL FUEL BUNKER TANK -->
        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:10px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase;">HUB DIESEL FUEL TANK</span>
            <span style="font-size:10px; font-weight:900; color:${(facility.fuelLiters || 0) < 2000 ? '#ef4444' : 'var(--grn)'}; font-family:monospace;">
              ${Math.round(facility.fuelLiters || 0).toLocaleString()} / ${(facility.fuelCapacity || 15000).toLocaleString()} L
            </span>
          </div>
          <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:2.5px; overflow:hidden; margin-bottom:8px;">
            <div style="width:${Math.min(100, ((facility.fuelLiters || 0) / (facility.fuelCapacity || 15000)) * 100)}%; height:100%; background:linear-gradient(90deg, #f59e0b, #10b981); border-radius:2.5px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">
              Wholesale: <b style="color:var(--tx);">$0.85/L</b>
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn alt" style="padding:3px 6px; font-size:8px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.4);" data-act="hub-expand-fuel-tank" data-hub-id="${selectedHub.id}" ${S.money < getHubFuelTankUpgradeCost(facility) ? 'disabled style="opacity:0.4;"' : ''} title="Expand Tank Storage">
                +10kL TANK ($${(getHubFuelTankUpgradeCost(facility) / 1000).toFixed(0)}k)
              </button>
              <button class="btn gold" style="padding:3px 8px; font-size:8px; font-weight:900;" data-act="open-hub-fuel-modal" data-hub-id="${selectedHub.id}">
                ⛽ ORDER FUEL
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Quick Hub Fleet Action Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#080c16; border:1px solid #1a2336; border-radius:6px; padding:6px 10px;">
        <div style="font-size:9px; color:var(--mu); font-family:monospace; display:flex; align-items:center; gap:6px;">
          <span>⚡</span>
          <span>Trucks parked here automatically refuel from this tank at $0 cash on departure.</span>
        </div>
        <button class="btn alt" style="padding:4px 10px; font-size:8px; font-weight:800; color:var(--grn); border-color:rgba(16,185,129,0.4);" data-act="hub-bulk-refuel-fleet" data-hub-id="${selectedHub.id}">
          ⚡ REFUEL ALL TRUCKS AT ${selectedHub.city}
        </button>
      </div>
    </div>

    ${renderWholesaleFuelModal(S)}
  `;
}
