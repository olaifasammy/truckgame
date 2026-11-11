import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { TRUCK_MODELS, TRAILERS, getTrailerIcon } from '../domain/trucks/trucks.data';
import { CITIES, LOCATIONS, REGIONS, RegionName, resolveTruckRegion } from '../data/world';
import { stats, distKm } from '../systems/calc';
import { refuel, repair, inspect, transport, refuelCost, repairCost, transportInfo, inspectCost } from '../systems/fleet';
import { why } from '../systems/jobs';
import { slots, upgradeGarage, upgradeGarageCost } from '../systems/offices';
import { openJobSelector, renderJobSelectorOverlay, activeJobSelectorTruckId } from './garage/job-selector';
import { getTruckSilhouetteSvg } from '../domain/trucks/trucks.visuals';
import { getManufacturerLogoSvg } from '../domain/trucks/trucks.logos';
import { renderTelematicsOverlay } from './telematics-modal';
import { getTruckTelematics, getDrivingStateBadge } from '../domain/trucks/trucks.telematics';
import { FleetService } from '../application/services/fleet';
import { Truck } from '../domain/trucks/trucks.types';
import { GameState } from '../types/state';
import { DEEPWATER_PORTS, getMaritimeShippingQuote, bookMaritimeShipping } from '../domain/fleet/shipping';
import { isRegionUnlocked, REGIONAL_HUBS } from '../domain/logistics/network';
import { renderHubConsole, activeGarageHubId, setActiveGarageHub } from './garage/hub-console';
import { isCityUnlockedHub, getHubForCity, getTrucksAtHub } from '../domain/hubs/hub-facility';
import { DispatchActions } from '../domain/dispatch/actions';
import { CARGO_TYPES } from '../domain/freight/cargo/registry';
import { renderCargoBadge } from '../domain/freight/cargo/cargo-svgs';

let openId: number | null = null, panel: string | null = null;
let hitchModalTruckId: number | null = null;
let garagePage = 1;
const TRUCKS_PER_PAGE = 10;
let garageFilter: 'all' | 'parked' | 'transit' | 'repair' = 'all';
export let garageRegionFilter: RegionName = 'Africa';

export function setGarageRegionFilter(r: RegionName) {
  garageRegionFilter = r;
  setActiveGarageHub(''); // Default to Enroute when changing regions
  garagePage = 1;
  refresh();
}

const getLocInfo = (locKey: string) => {
  if (!locKey) return null;
  const upper = String(locKey).toUpperCase();
  if (LOCATIONS[upper]) return LOCATIONS[upper];
  for (const k of Object.keys(LOCATIONS)) {
    if (k.toUpperCase() === upper || LOCATIONS[k].name.toUpperCase() === upper) {
      return LOCATIONS[k];
    }
  }
  const reg = resolveTruckRegion(locKey);
  return {
    name: locKey,
    region: reg,
    country: REGIONS[reg]?.countryList?.split(',')[0]?.trim() || reg,
    coords: [150, 50] as [number, number],
    latLng: [50, 5] as [number, number],
    elevation: 10,
    typicalWeather: 'clear' as const,
    terrain: 'highway' as const,
    avgTemp: 15,
    roadGrade: 1,
    description: `${reg} regional logistics depot`
  };
};

action('garage-page-prev', () => {
  if (garagePage > 1) {
    garagePage--;
    refresh();
  }
});

action('garage-page-next', () => {
  garagePage++;
  refresh();
});

action('garage-filter', d => {
  garageFilter = (d as any).filter || 'all';
  garagePage = 1;
  refresh();
});

action('garage-region', d => {
  const reg = (d as any).region || 'Africa';
  garageRegionFilter = reg as RegionName;
  setActiveGarageHub('');
  garagePage = 1;
  refresh();
});

action('garage-region-select', d => {
  const val = (d as any).value || 'Africa';
  garageRegionFilter = val as RegionName;
  setActiveGarageHub('');
  garagePage = 1;
  refresh();
});

action('truck-toggle', d => { openId = openId === +(d as any).id ? null : +(d as any).id; panel = null; refresh(); });
action('panel', d => { panel = panel === (d as any).kind ? null : (d as any).kind; refresh(); });
action('refuel', d => refuel(+(d as any).id));
action('set-truck-color', d => FleetService.setTruckColor(+(d as any).id, (d as any).color));

action('set-powertrain-gearbox', d => FleetService.setGearbox(+(d as any).id, (d as any).gearbox));
action('set-powertrain-axle', d => FleetService.setAxleRatio(+(d as any).id, (d as any).ratio));
action('set-powertrain-tires', d => FleetService.setTires(+(d as any).id, (d as any).compound));
action('top-up-consumables', d => FleetService.serviceConsumables(+(d as any).id));

action('repair', d => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.repairTruckId = +(d as any).id;
    S.workshopTab = 'bay';
    S.tab = 'repair';
    refresh();
  }
});
action('open-workshop-scan', () => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.repairTruckId = null;
    S.workshopTab = 'scan';
    S.tab = 'repair';
    refresh();
  }
});
action('hoist-truck-to-bay', d => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.repairTruckId = +(d as any).id;
    S.workshopTab = 'bay';
    S.tab = 'repair';
    refresh();
  }
});
action('inspect', d => inspect(+(d as any).id));
action('dispatch', d => openJobSelector(+(d as any).id));
action('assign', d => FleetService.assignDriver(+(d as any).id, (d as any).driver ? +(d as any).driver : null));
action('move', d => transport(+(d as any).id, (d as any).city));
action('upgrade-garage', () => upgradeGarage());

action('recall-truck', d => {
  const truckId = +(d as any).id;
  set((S: GameState) => {
    DispatchActions.recallTruck(S, truckId);
    toast(`Truck #${truckId} recalled to garage.`, 'success');
  });
});

let sellTruckConfirmId: number | null = null;
let sellTruckTimeout: any = null;

action('sell-truck', d => {
  const truckId = +(d as any).id;
  if (sellTruckConfirmId !== truckId) {
    sellTruckConfirmId = truckId;
    if (sellTruckTimeout) clearTimeout(sellTruckTimeout);
    
    set((S: GameState) => {
      const t = (S.fleet || []).find((x: any) => x.id === truckId);
      const model = t ? TRUCK_MODELS[t.modelId] : null;
      const resaleValue = Math.round((model?.price || 150000) * 0.65);
      toast(`⚠️ Tap SELL again within 4s to confirm selling Truck #${truckId} for $${resaleValue.toLocaleString()}`, 'err');
    });

    sellTruckTimeout = setTimeout(() => {
      sellTruckConfirmId = null;
    }, 4000);
  } else {
    sellTruckConfirmId = null;
    if (sellTruckTimeout) clearTimeout(sellTruckTimeout);

    set((S: GameState) => {
      const idx = (S.fleet || []).findIndex((x: any) => x.id === truckId);
      if (idx === -1) {
        toast(`Truck #${truckId} not found.`, 'err');
        return;
      }
      const truck = S.fleet[idx];
      const model = TRUCK_MODELS[truck.modelId];
      const resaleValue = Math.round((model?.price || 150000) * 0.65);

      if (truck.driverId) {
        const drv = (S.drivers || []).find((x: any) => x.id === truck.driverId);
        if (drv) {
          drv.assignedTruckId = null;
        }
      }
      
      S.money += resaleValue;
      S.fleet.splice(idx, 1);
      toast(`Truck sold for $${resaleValue.toLocaleString()}. Funds credited to treasury.`, 'success');
    });
    refresh();
  }
});

action('open-hitch-modal', d => { hitchModalTruckId = +(d as any).id; refresh(); });
action('close-hitch-modal', () => { hitchModalTruckId = null; refresh(); });

action('hitch-trailer', d => {
  const truckId = +(d as any).id;
  const trailerType = (d as any).trailer;
  set(S => {
    const t = S.fleet.find((x: any) => x.id === truckId);
    if (!t) return;
    const yardIdx = (S.trailers || []).indexOf(trailerType);
    if (yardIdx === -1) return toast('Trailer no longer in HQ yard.', 'err');
    if (t.trailer) S.trailers.push(t.trailer);
    t.trailer = trailerType;
    S.trailers.splice(yardIdx, 1);
    toast(`Trailer coupled to Unit #${truckId}.`, 'success');
  });
  hitchModalTruckId = null;
  refresh();
});

action('unhitch-trailer', d => {
  const truckId = +(d as any).id;
  set(S => {
    const t = S.fleet.find((x: any) => x.id === truckId);
    if (!t || !t.trailer) return;
    if (!S.trailers) S.trailers = [];
    S.trailers.push(t.trailer);
    t.trailer = null;
    toast(`Trailer unhitched and returned to HQ storage yard.`, 'info');
  });
  refresh();
});

action('book-roro-shipping', d => {
  const truckId = +(d as any).id;
  const destCity = (d as any).city;
  set(S => {
    bookMaritimeShipping(S, truckId, destCity);
  });
  refresh();
});

const bar = (label: string, value: number, barColor: string, formattedText: string, isAlert?: boolean) => {
  return `
    <div style="margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:3px; font-size:9px; font-family:monospace;">
        <span style="color:var(--mu); font-weight:700;">${label}</span>
        <span style="color:${isAlert ? 'var(--red)' : 'var(--tx)'}; font-family:monospace; font-weight:800;">${formattedText}</span>
      </div>
      <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
        <div style="width:${Math.min(100, Math.max(0, value))}%; height:100%; background:${barColor}; border-radius:2px; transition:width 0.3s ease;"></div>
      </div>
    </div>
  `;
};

const cell = (label: string, value: string, subvalue?: string) => `
  <div style="background:#0a0f1d; padding:6px 8px; border-radius:6px; border:1px solid #1f293d; min-width:0; display:flex; flex-direction:column; justify-content:center;">
    <div style="font-size:7px; text-transform:uppercase; color:var(--mu); letter-spacing:0.4px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${label}</div>
    <div style="font-size:10px; font-weight:800; color:var(--tx); font-family:monospace; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</div>
    ${subvalue ? `<div style="font-size:7px; color:var(--mu); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subvalue}</div>` : ''}
  </div>
`;

function panelHtml(S: GameState, t: Truck, busy: boolean) {
  if (panel === 'driver') {
    return `
      <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); background:#0a0f1d; padding:12px; border-radius:8px; border:1px solid #1f293d;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">COMMERCIAL DRIVER ROSTER & DISPATCH</span>
          <span style="font-size:9px; color:var(--mu); font-family:monospace;">CDL CLASS-A LICENSED</span>
        </div>
        ${(() => {
          const list = S.drivers.filter((d: any) => {
            const cur = t.driverId === d.id;
            const assignedToOther = S.fleet.find((x: any) => x.driverId === d.id && x.id !== t.id);
            return cur || !assignedToOther;
          });

          if (list.length === 0) return `
            <div style="padding:14px; text-align:center; color:var(--mu); font-size:10px; font-family:monospace;">
              NO AVAILABLE CDL DRIVERS. ALL PERSONNEL CURRENTLY ASSIGNED TO OTHER RIGS.
            </div>
          `;

          return list.map((d: any) => {
            const cur = t.driverId === d.id;
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; margin-bottom:6px; background:#111827; border:1px solid #1f293d; border-radius:6px;">
                <div>
                  <div style="font-size:12px; font-weight:800; color:var(--tx);">${d.name}</div>
                  <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                    Skill Level ${d.skill}/5 · ${cur ? 'Currently in Command' : 'Off-Duty Standby'}
                  </div>
                </div>
                <button class="btn ${cur ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="assign" data-id="${t.id}" data-driver="${d.id}" ${cur || busy ? 'disabled' : ''}>
                  ${cur ? 'ASSIGNED' : 'ASSIGN'}
                </button>
              </div>
            `;
          }).join('');
        })()}
        ${t.driverId ? `
          <div style="margin-top:8px;">
            <button class="btn alt" style="width:100%; padding:6px; font-size:10px; font-weight:800; color:var(--red); border-color:rgba(239,68,68,0.3);" data-act="assign" data-id="${t.id}" data-driver="" ${busy ? 'disabled' : ''}>
              RELIEVE ASSIGNED DRIVER (RETURN TO POOL)
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (panel === 'move') {
    const originPort = DEEPWATER_PORTS[t.loc];
    const overseasPorts = originPort 
      ? Object.values(DEEPWATER_PORTS).filter(p => p.region !== originPort.region && isRegionUnlocked(S, p.region))
      : [];

    const truckRegion = LOCATIONS[t.loc]?.region;
    // Filter available destinations to ONLY owned hubs in the SAME region
    const ownedHubsInRegion = (S.depots || []).map((depotId: string) => {
      const cityKey = depotId.replace('hub_', '').toUpperCase();
      // Handle special cases if city keys don't match exactly
      if (cityKey === 'LOS ANGELES') return 'LOS_ANGELES';
      return cityKey;
    }).filter((cityKey: string) => {
      return cityKey !== t.loc && LOCATIONS[cityKey]?.region === truckRegion;
    });

    return `
      <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); background:#0a0f1d; padding:12px; border-radius:8px; border:1px solid #1f293d;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">TERMINAL DEADHEAD / RELOCATION</span>
          <span style="font-size:9px; color:var(--mu); font-family:monospace;">BILL OF LADING TRANSIT</span>
        </div>

        <!-- Terminal Transfer Dropdown -->
        <div style="margin-bottom:12px; background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:12px;">
          <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>📍 SELECT DESTINATION TERMINAL</span>
            <span style="font-size:7px; color:var(--gold); background:rgba(193,154,91,0.1); padding:2px 6px; border-radius:4px;">OWNED HUBS ONLY</span>
          </div>
          
          ${ownedHubsInRegion.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px;">
              <select id="transfer-city-${t.id}" style="width:100%; background:#0e1320; border:1px solid #1f293d; color:var(--tx); font-size:11px; font-weight:700; padding:10px; border-radius:8px; outline:none; appearance:none;">
                ${ownedHubsInRegion.map(c => {
                  const loc = LOCATIONS[c];
                  const info = transportInfo(S, t, c);
                  return `<option value="${c}">${loc?.name || c} — ${info.km}km (ETA: ${dur(info.ms)})</option>`;
                }).join('')}
              </select>
              <button class="btn gold" style="width:100%; padding:10px; font-size:11px; font-weight:900; letter-spacing:0.5px;" onclick="const sel = document.getElementById('transfer-city-${t.id}'); if(sel) { window.__actions?.get('move')?.({ id: '${t.id}', city: sel.value }); }">
                CONFIRM RELOCATION & DISPATCH
              </button>
            </div>
          ` : `
            <div style="padding:16px; text-align:center; background:rgba(239,68,68,0.05); border:1px dashed rgba(239,68,68,0.3); border-radius:8px;">
              <div style="font-size:11px; font-weight:800; color:#f87171;">NO OTHER HUBS IN ${truckRegion?.toUpperCase()}</div>
              <div style="font-size:9px; color:var(--mu); margin-top:4px; line-height:1.4;">
                To relocate this tractor via highway, you must first purchase another hub terminal in the same region.
              </div>
            </div>
          `}
        </div>

        <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-top:6px; text-align:center; padding:0 12px; line-height:1.4;">
          ✓ Intra-regional relocation only · Payout includes deadhead fuel compensation · Fleet maintenance active at destination hub
        </div>

        ${originPort ? `
          <!-- Intercontinental Maritime Ro-Ro Shipping -->
          <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:14px;">🚢</span>
                <span style="font-size:10px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">
                  INTERCONTINENTAL MARITIME RO-RO SHIPPING
                </span>
              </div>
              <span style="font-size:8px; color:var(--gold); font-family:monospace;">PORT: ${originPort.portName}</span>
            </div>

            ${overseasPorts.length > 0 ? `
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${overseasPorts.map(p => {
                  const q = getMaritimeShippingQuote(t.loc, p.cityKey);
                  if (!q) return '';
                  const canAfford = S.money >= q.totalCost;
                  return `
                    <div style="background:#070b14; border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-size:11px; font-weight:800; color:var(--tx);">
                          ${p.portName} <span style="font-size:8px; color:#38bdf8; font-family:monospace;">[${p.region.toUpperCase()}]</span>
                        </div>
                        <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                          ${q.vesselName} · ${q.seaMiles} Sea Miles · ETA ~3m
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:11px; font-weight:800; color:var(--gold); font-family:monospace;">$${q.totalCost.toLocaleString()}</div>
                        <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.5); margin-top:2px; ${!canAfford ? 'opacity:0.5;' : ''}" data-act="book-roro-shipping" data-id="${t.id}" data-city="${p.cityKey}" ${!canAfford ? 'disabled' : ''}>
                          🚢 BOOK RO-RO VESSEL
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="padding:8px; background:rgba(56,189,248,0.06); border:1px dashed rgba(56,189,248,0.2); border-radius:6px; font-size:9px; color:var(--mu); font-family:monospace; line-height:1.4;">
                No overseas operating regions unlocked yet. Unlock Europe, America, or Asia in the Network view to sail across oceans.
              </div>
            `}
          </div>
        ` : `
          <div style="margin-top:10px; padding:8px; background:rgba(56,189,248,0.06); border:1px dashed rgba(56,189,248,0.3); border-radius:6px; font-size:9px; color:var(--mu); font-family:monospace; line-height:1.4;">
            🚢 <b>Intercontinental Shipping Tip:</b> To book overseas ocean shipping to Europe, America, or Asia, first deadhead this tractor to your regional ocean port (e.g. Lagos, Rotterdam, Los Angeles, Tokyo).
          </div>
        `}
      </div>
    `;
  }

  return '';
}

function body(S: GameState, t: Truck, m: any, a: any, now: number) {
  if (t.status === 'delivering') {
    const isRoRo = t.shippingMode === 'maritime_roro';
    const totalTime = isRoRo ? 180000 : 15 * 60 * 1000;
    const remaining = Math.max(0, (t.availableAt || now) - now);
    const progress = 100 - (remaining / totalTime * 100);

    return `
      <div style="margin-top:14px; background:#0f172a; border:1px solid ${isRoRo ? '#38bdf8' : 'var(--gold)'}; border-radius:10px; padding:20px; text-align:center;">
        <div style="font-size:32px; margin-bottom:12px;">🚢</div>
        <div style="font-size:11px; font-weight:800; color:${isRoRo ? '#38bdf8' : 'var(--gold)'}; letter-spacing:1px; text-transform:uppercase;">
          ${isRoRo ? 'Intercontinental Maritime Ro-Ro Transit' : 'Vehicle in Logistics Transit'}
        </div>
        <div style="font-size:13px; font-weight:900; color:var(--tx); margin:4px 0 12px;">
          ${isRoRo ? `${t.shippingOrigin || 'Origin Port'} ➔ ${LOCATIONS[t.loc]?.name || t.loc} Deepwater Pier` : 'FACTORY-TO-DEPOT DELIVERY'}
        </div>
        ${isRoRo ? `
          <div style="font-size:10px; color:var(--gold); font-family:monospace; margin-bottom:8px;">
            Aboard Vessel: <b>${t.shippingVessel || 'Ro-Ro Ocean Carrier'}</b>
          </div>
        ` : ''}
        
        <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-bottom:6px; display:flex; justify-content:space-between;">
          <span>EST. PORT DOCKING: ${new Date(t.availableAt || now).toLocaleTimeString()} (${dur(remaining)})</span>
          <span>${Math.round(progress)}%</span>
        </div>
        <div class="bar" style="height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
          <div style="width:${progress}%; height:100%; background:${isRoRo ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : 'var(--gold)'}; border-radius:4px; transition:width 1s linear;"></div>
        </div>
        
        <div style="font-size:9px; color:var(--mu); margin-top:12px; line-height:1.4;">
          ${isRoRo 
            ? 'Ocean car-carrier vessel is navigating international deepwater sea lanes. Upon arrival, unit will complete customs discharge and dock at destination terminal.' 
            : 'Professional merchandise transport is currently repositioning this unit from the manufacturer regional distribution hub to your local terminal.'}
        </div>
      </div>
    `;
  }

  const st = stats(S, t);
  const busy = !!a;
  const drv = (S?.drivers || []).find((x: any) => x.id === t?.driverId);
  const pct = a ? Math.min(100, (now - a.start) / (a.end - a.start) * 100) : 0;
  const telem = getTruckTelematics(t, a, drv, now);
  
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgCond = Math.round(healthValues.reduce((sum: number, b: any) => sum + b, 0) / healthValues.length);
  const fuelPctVal = Math.round((t.fluids.fuel / m.tankSize) * 100);
  const estimatedHours = Math.round(t.odometer / 58);
  const estimatedRangeKm = Math.round((t.fluids.fuel / (st.fuelConsumption || 32)) * 100);

  const getCompHealth = (id: string) => {
    const c = t.components[id as keyof typeof t.components];
    if (typeof c === 'number') return c;
    return c?.health ?? 100;
  };

  return `
    <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
      <!-- Real-time Active Consignment Bar -->
      ${a ? `
        <div style="background:#0f172a; border:1px solid ${telem.stateBadgeColor}80; border-radius:8px; padding:10px 12px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <div style="font-size:9px; color:var(--blu); font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">
                  ACTIVE TRANSIT · ${telem.phase.toUpperCase()}
                </div>
                ${getDrivingStateBadge(telem.state, true)}
              </div>
              <div style="font-size:12px; font-weight:800; color:var(--tx); margin-top:2px;">
                ${a.cargo} · ${a.from} → ${a.to}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:9px; color:var(--mu);">SPEED · ETA</div>
              <div style="font-size:12px; font-weight:800; color:var(--gold); font-family:monospace; display:flex; align-items:center; justify-content:flex-end; gap:4px;">
                <span data-truck-speed="${t.id}" style="color:#34d399;">${telem.speedKmh > 0 ? `${telem.speedKmh} km/h` : ''}</span>
                <span data-eta="${a.end}">${dur(Math.max(0, a.end - now))}</span>
              </div>
            </div>
          </div>
          <div class="bar" style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;" data-start="${a.start}" data-end="${a.end}">
            <div style="width:${pct}%; height:100%; background:var(--blu); border-radius:3px; transition:width 0.5s linear;"></div>
          </div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="btn alt" style="flex:1; padding:6px 10px; font-size:10px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.4); display:flex; align-items:center; justify-content:center; gap:6px;" data-act="open-telematics" data-id="${t.id}" data-truck-telem-btn="${t.id}">
              <span>🛰️</span> LIVE TELEMATICS · ${telem.stateLabel} (${telem.speedKmh} KM/H)
            </button>
            <button class="btn" style="padding:6px 10px; font-size:9px; font-weight:900; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); letter-spacing:0.5px;" data-act="recall-truck" data-id="${t.id}">
              RECALL
            </button>
          </div>
        </div>
      ` : `
        <button class="btn alt" style="width:100%; margin-bottom:12px; padding:6px 10px; font-size:10px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.3); display:flex; align-items:center; justify-content:center; gap:6px;" data-act="open-telematics" data-id="${t.id}">
          <span>🛰️</span> OPEN TELEMETRICS & DASHCAM DIAGNOSTICS · ${telem.stateLabel}
        </button>
      `}

      <!-- Heavy Vehicle Technical Specification Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(85px, 1fr)); gap:4px; margin-bottom:12px;">
        ${cell('ENGINE', m.engine.name, `${m.engine.displacement}L · ${m.engine.cylinders === 8 ? 'V8' : 'I6'}`)}
        ${cell('POWER', `${m.engine.hp} HP`, `@ 1,900 RPM`)}
        ${cell('TORQUE', `${m.engine.torque} Nm`, `Peak Output`)}
        ${cell('GEARBOX', t.upgrades?.gearbox === '16spd_crawler' ? '16-Spd Crawler' : '12-Spd Auto', t.upgrades?.gearbox === '16spd_crawler' ? 'Vocational' : 'Direct')}
        ${cell('AXLE', t.upgrades?.axleRatio === 'heavy_diff_lock' ? '3.42:1 Lock' : '2.64:1 High', m.axle)}
        ${cell('RANGE', `~${estimatedRangeKm} km`, `Calculated`)}
        ${cell('ODO', `<span data-truck-odo="${t.id}">${Math.round(t.odometer).toLocaleString()} km</span>`, 'Total Dist')}
        ${cell('HOURS', `${estimatedHours} hrs`, `Cumulative`)}
        ${cell('CONSUMP', `${st.fuelConsumption.toFixed(1)} L/100`, `Avg Rate`)}
      </div>

      <!-- Powertrain Engineering & Consumables Breakdown -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; padding:10px 12px; border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="color:var(--gold); font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">POWERTRAIN CUSTOMIZATION & CONSUMABLES</span>
          <span style="font-size:8px; font-family:monospace; color:var(--mu);">SAE J1939</span>
        </div>

        <!-- Consumables Levels Row -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(70px, 1fr)); gap:4px; margin-bottom:10px;">
          <div style="background:#111827; border:1px solid #1f293d; padding:4px 6px; border-radius:6px; min-width:0;">
            <div style="font-size:6px; color:var(--mu); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">DIESEL FUEL</div>
            <div style="font-size:10px; font-weight:800; color:var(--tx); font-family:monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.fluids.fuel}L <span style="font-size:7px; color:var(--mu);">(${fuelPctVal}%)</span></div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:4px 6px; border-radius:6px; min-width:0;">
            <div style="font-size:6px; color:var(--mu); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">ADBLUE / DEF</div>
            <div style="font-size:10px; font-weight:800; color:#38bdf8; font-family:monospace;">${t.fluids.adBlue || 100}%</div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:4px 6px; border-radius:6px; min-width:0;">
            <div style="font-size:6px; color:var(--mu); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">COOLANT</div>
            <div style="font-size:10px; font-weight:800; color:${(t.fluids.coolant || 100) < 25 ? '#ef4444' : 'var(--grn)'}; font-family:monospace;">${t.fluids.coolant || 100}%</div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:4px 6px; border-radius:6px; min-width:0;">
            <div style="font-size:6px; color:var(--mu); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">LUBE OIL</div>
            <div style="font-size:10px; font-weight:800; color:${(t.fluids.oil || 40) < 15 ? '#ef4444' : 'var(--tx)'}; font-family:monospace;">${t.fluids.oil || 40}L</div>
          </div>
        </div>

        <!-- Powertrain Upgrades Options -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>
            <div style="font-size:8px; color:var(--mu); font-weight:700; margin-bottom:4px;">HEAVY-HAUL GEARBOX</div>
            <select style="width:100%; background:#111827; border:1px solid #1f293d; color:var(--tx); font-size:10px; font-weight:800; padding:6px; border-radius:4px; outline:none;" onchange="window.__actions?.get('set-powertrain-gearbox')?.({ id: '${t.id}', gearbox: this.value })" ${busy ? 'disabled' : ''}>
              <option value="standard" ${t.upgrades?.gearbox === 'standard' ? 'selected' : ''}>Standard 12-Spd</option>
              <option value="16spd_crawler" ${t.upgrades?.gearbox === '16spd_crawler' ? 'selected' : ''}>16-Spd Crawler ($12k)</option>
            </select>
          </div>
          <div>
            <div style="font-size:8px; color:var(--mu); font-weight:700; margin-bottom:4px;">REAR AXLE DIFFERENTIAL</div>
            <select style="width:100%; background:#111827; border:1px solid #1f293d; color:var(--tx); font-size:10px; font-weight:800; padding:6px; border-radius:4px; outline:none;" onchange="window.__actions?.get('set-powertrain-axle')?.({ id: '${t.id}', ratio: this.value })" ${busy ? 'disabled' : ''}>
              <option value="standard" ${t.upgrades?.axleRatio === 'standard' ? 'selected' : ''}>Highway 2.64:1</option>
              <option value="heavy_diff_lock" ${t.upgrades?.axleRatio === 'heavy_diff_lock' ? 'selected' : ''}>Heavy 3.42:1 ($8k)</option>
            </select>
          </div>
        </div>
        <button class="btn alt" style="width:100%; margin-top:10px; padding:6px; font-size:9px; font-weight:800;" data-act="top-up-consumables" data-id="${t.id}">
          TOP UP ALL CONSUMABLES (OIL, COOLANT, ADBLUE)
        </button>
      </div>

      <!-- Component Condition & Preventive Maintenance -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; padding:10px 12px; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="color:var(--gold); font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">SYSTEMS DIAGNOSTICS & COMPONENT HEALTH</span>
          <span style="font-size:8px; font-family:monospace; color:${avgCond < 85 ? 'var(--gold)' : 'var(--mu)'};">AVG HEALTH: ${avgCond}%</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            ${bar('ENGINE / BLOCK', getCompHealth('engine'), getCompHealth('engine') < 70 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('engine')}%`)}
            ${bar('TRANSMISSION', getCompHealth('transmission'), getCompHealth('transmission') < 75 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('transmission')}%`)}
            ${bar('BRAKE SYSTEM', getCompHealth('brakes'), getCompHealth('brakes') < 60 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('brakes')}%`, getCompHealth('brakes') < 60)}
          </div>
          <div>
            ${bar('TIRE TREAD', getCompHealth('tires'), getCompHealth('tires') < 40 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('tires')}%`, getCompHealth('tires') < 40)}
            ${bar('SUSPENSION', getCompHealth('suspension'), getCompHealth('suspension') < 80 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('suspension')}%`)}
            ${bar('EXHAUST / DPF', getCompHealth('exhaust'), getCompHealth('exhaust') < 70 ? 'var(--red)' : 'var(--grn)', `${getCompHealth('exhaust')}%`)}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
          <button class="btn gold" style="padding:8px; font-size:10px; font-weight:900;" data-act="hoist-truck-to-bay" data-id="${t.id}">
            HOIST TO REPAIR BAY
          </button>
          <button class="btn alt" style="padding:8px; font-size:10px; font-weight:800;" data-act="inspect" data-id="${t.id}" ${busy ? 'disabled' : ''}>
            RUN OBD-II SCAN ($${inspectCost()})
          </button>
        </div>
      </div>
    </div>
  `;
}

function truck(S: GameState, t: Truck) {
  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const a = S.active.find((x: any) => x.truck === t.id);
  const now = Date.now();
  const open = openId === t.id;
  const busy = !!a || t.status === 'delivering';
  
  const getCompHealth = (id: string) => {
    const c = t.components[id as keyof typeof t.components];
    if (typeof c === 'number') return c;
    return (c as any)?.health ?? 100;
  };

  const needsService = ['engine', 'transmission', 'brakes', 'tires', 'suspension', 'exhaust'].some(k => getCompHealth(k) < 75) || (t.fluids.fuel / m.tankSize) < 0.25;

  return `
    <div class="card" style="margin-bottom:10px; border:1px solid ${open ? 'var(--gold)' : needsService ? 'rgba(193,154,91,0.3)' : 'var(--line)'};">
      <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="truck-toggle" data-id="${t.id}">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px; height:40px; background:#080c16; border:1px solid #1a2336; border-radius:8px; display:grid; place-items:center; flex-shrink:0;">
             ${getManufacturerLogoSvg(m.brand, 32, 20)}
          </div>
          <div>
            <div style="font-size:14px; font-weight:900; color:var(--tx);">${m.name}</div>
            <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
              Unit #${t.id} · ${t.loc} DEPOT · ${m.axle} ${m.engine.hp}HP
            </div>
          </div>
        </div>
        <div style="text-align:right; display:flex; align-items:center; gap:12px;">
           <div style="font-size:10px; font-weight:800; color:${busy ? '#38bdf8' : 'var(--grn)'}; text-transform:uppercase; font-family:monospace;">
            ${t.status === 'delivering' ? 'TRANSIT' : busy ? 'ACTIVE' : 'IDLE'}
          </div>
          <div style="color:var(--mu); transform:rotate(${open ? '90deg' : '0deg'}); transition:transform 0.2s;">${ic('chev')}</div>
        </div>
      </div>

      ${open ? `
        <div style="margin-top:14px; background:#060a14; border:1px solid #1e293b; border-radius:8px; padding:10px; position:relative; min-height:80px; display:flex; align-items:center; justify-content:center;">
          ${getTruckSilhouetteSvg(m, 'var(--gold)', m.axle, t.trailer)}
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:12px;">
          <button class="btn ${panel === 'driver' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:9px; font-weight:800;" data-act="panel" data-kind="driver">
            ${ic('user')} DRIVER
          </button>
          <button class="btn alt" style="padding:8px 4px; font-size:9px; font-weight:800;" data-act="open-hitch-modal" data-id="${t.id}" ${busy ? 'disabled' : ''}>
            🔗 HITCH
          </button>
          <button class="btn ${panel === 'move' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:9px; font-weight:800;" data-act="panel" data-kind="move" ${busy ? 'disabled' : ''}>
            📍 MOVE
          </button>
          <button class="btn gold" style="padding:8px 4px; font-size:9px; font-weight:900;" data-act="dispatch" data-id="${t.id}" ${busy || !t.driverId ? 'disabled' : ''}>
            🚀 DISPATCH
          </button>
        </div>

        ${panelHtml(S, t, busy)}
        ${body(S, t, m, a, now)}

        <!-- Sell Truck Action -->
        <div style="margin-top:14px; border-top:1px solid rgba(239,68,68,0.1); padding-top:10px; display:flex; justify-content:flex-end;">
          <button class="btn" style="padding:6px 12px; font-size:9px; font-weight:900; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2);" data-act="sell-truck" data-id="${t.id}" ${busy ? 'disabled' : ''}>
            LIQUIDATE VEHICLE ASSET (SELL)
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderHitchModal(S: GameState) {
  if (hitchModalTruckId === null) return '';
  const t = S.fleet.find((x: any) => x.id === hitchModalTruckId);
  if (!t) return '';
  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const yardTrailers: string[] = S.trailers || [];
  const compatibleYard = yardTrailers.filter((trailerType: string) => m.haul.includes(trailerType as any));

  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.85); z-index:1200; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0f172a; border:1px solid var(--gold); border-radius:12px; width:100%; max-width:440px; padding:18px; position:relative; box-shadow:0 12px 36px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">FIFTH WHEEL COUPLING</div>
            <div style="font-size:15px; font-weight:900; color:var(--tx); margin-top:2px;">Hitch Trailer to Unit #${t.id}</div>
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:1px;">Approved Endorsements: ${m.haul.join(', ')}</div>
          </div>
          <button style="background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer;" data-act="close-hitch-modal">✕</button>
        </div>

        ${t.trailer ? `
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:11px; color:var(--tx);">
              Currently Coupled: <b style="color:var(--gold);">${getTrailerIcon(t.trailer as any)} ${TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer}</b>
            </div>
            <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:800; color:var(--red); border-color:rgba(239,68,68,0.3);" data-act="unhitch-trailer" data-id="${t.id}">
              UNHITCH
            </button>
          </div>
        ` : ''}

        <div style="font-size:10px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-bottom:8px;">AVAILABLE IN HQ STORAGE YARD:</div>

        ${compatibleYard.length === 0 ? `
          <div style="background:#080c16; border:1px dashed #1e293b; border-radius:8px; padding:16px; text-align:center; margin-bottom:12px;">
            <div style="font-size:20px; margin-bottom:4px;">🚛</div>
            <div style="font-size:11px; font-weight:800; color:var(--tx);">No Compatible Trailers in Yard</div>
            <div style="font-size:9px; color:var(--mu); margin-top:3px; line-height:1.4;">
              This tractor's <b>${m.axle}</b> chassis (${m.maxGVW}t GVW) supports: ${m.haul.map((h: any) => TRAILERS[h as keyof typeof TRAILERS] || h).join(', ')}.
            </div>
            <button class="btn gold" style="margin-top:10px; padding:6px 12px; font-size:9px; font-weight:900;" data-act="store-open" data-id="dealership">
              VISIT TRAILER DEPOT
            </button>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:6px; max-height:180px; overflow-y:auto; margin-bottom:12px;">
            ${compatibleYard.map((trailerType: string) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:20px;">${getTrailerIcon(trailerType as any)}</span>
                  <div>
                    <div style="font-size:12px; font-weight:800; color:var(--tx);">${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}</div>
                    <div style="font-size:9px; color:var(--grn); font-family:monospace;">✓ Chassis Approved (${m.axle})</div>
                  </div>
                </div>
                <button class="btn gold" style="padding:6px 12px; font-size:10px; font-weight:900;" data-act="hitch-trailer" data-id="${t.id}" data-trailer="${trailerType}">
                  COUPLE
                </button>
              </div>
            `).join('')}
          </div>
        `}

        ${(() => {
          const incompatibleYard = yardTrailers.filter((trailerType: string) => !m.haul.includes(trailerType as any));
          if (incompatibleYard.length === 0) return '';
          return `
            <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
              <div style="font-size:9px; font-weight:800; color:#ef4444; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                <span>⚠️ INCOMPATIBLE WITH THIS CHASSIS (${incompatibleYard.length})</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; max-height:130px; overflow-y:auto; margin-bottom:12px;">
                ${incompatibleYard.map((trailerType: string) => {
                  let reason = `Chassis (${m.axle}) not certified for this payload`;
                  if (trailerType === 'lowboy') reason = `Requires 6x4/8x4 tandem axle heavy-haul chassis (Current: ${m.axle})`;
                  else if (trailerType === 'double_trailer') reason = `Requires 6x4 tandem-drive LCV prime mover (Current: ${m.axle})`;
                  else if (trailerType === 'tipper') reason = `Requires 8x4/6x4 vocational dump chassis with PTO`;
                  else if (m.haul?.length === 1 && m.haul[0] === 'rigid_box') reason = `Rigid box chassis has no fifth-wheel turntable`;
                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:6px; padding:6px 10px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px; opacity:0.6;">${getTrailerIcon(trailerType as any)}</span>
                        <div>
                          <div style="font-size:11px; font-weight:700; color:#cbd5e1;">${TRAILERS[trailerType as keyof typeof TRAILERS] || trailerType}</div>
                          <div style="font-size:8px; color:#f87171; font-family:monospace;">${reason}</div>
                        </div>
                      </div>
                      <span style="font-size:8px; font-weight:800; color:#f87171; background:rgba(239,68,68,0.15); padding:2px 6px; border-radius:4px;">LOCKED</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        })()}

        <button class="btn alt" style="width:100%; padding:8px; font-size:10px; font-weight:800;" data-act="close-hitch-modal">
          CANCEL
        </button>
      </div>
    </div>
  `;
}

export default {
  id: 'garage',
  icon: 'garage',
  label: 'Garage',
  render(S: GameState) {
    const upCost = upgradeGarageCost(S.garageLevel || 0);
    const canUp = S.money >= upCost;

    const truckNeedsRepair = (t: Truck) => {
      if (t.status === 'repair') return true;
      if ((S as any).repairs?.some((r: any) => r.truckId === t.id)) return true;
      const compValues = Object.values(t.components || {}).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
      const minHealth = compValues.length > 0 ? Math.min(...compValues) : 100;
      const avgHealth = compValues.length > 0 ? compValues.reduce((a: number, b: number) => a + b, 0) / compValues.length : 100;
      const lowFluids = (t.fluids?.coolant || 100) < 60 || (t.fluids?.oil || 40) < 25 || (t.fluids?.adBlue || 100) < 50;
      return avgHealth < 85 || minHealth < 65 || lowFluids;
    };

    const allRegions: RegionName[] = ['Africa', 'Europe', 'America', 'Asia'];
    const unlockedRegions: RegionName[] = allRegions.filter(r => isRegionUnlocked(S, r));
    const activeUnlockedRegions: RegionName[] = unlockedRegions.length > 0 ? unlockedRegions : ['Africa'];

    if (!garageRegionFilter || !activeUnlockedRegions.includes(garageRegionFilter)) {
      garageRegionFilter = activeUnlockedRegions[0];
    }

    const unlockedHubsInRegion = REGIONAL_HUBS.filter(h => h.region === garageRegionFilter && (S.depots || []).includes(h.id));
    const selectedHub = unlockedHubsInRegion.find(h => h.id === activeGarageHubId) || null;

    const now = Date.now();
    const activeList = (S.active || []).filter((a: any) => {
      const truckObj = (S.fleet || []).find((t: any) => t.id === a.truck);
      if (!truckObj) return false;
      const truckReg = resolveTruckRegion(truckObj);
      return truckReg === garageRegionFilter;
    });

    // FIND TRUCKS THAT ARE IDLE OR DELIVERING BUT NOT AT AN OWNED HUB
    const unstationedTrucks = S.fleet.filter((t: any) => {
      if (resolveTruckRegion(t) !== garageRegionFilter) return false;
      
      // If moving cargo, it's already in activeList
      const isEnroute = S.active.some((a: any) => a.truck === t.id);
      if (isEnroute) return false;

      // If at an owned hub, it shows up in the specific hub view
      if (isCityUnlockedHub(S, t.loc)) return false;

      return true;
    });

    let fleetInScope: any[] = [];
    let filteredFleet: any[] = [];
    let totalPages = 1;
    let currentTrucks: any[] = [];
    let readiness = 100;

    if (selectedHub) {
      fleetInScope = getTrucksAtHub(S, selectedHub.city);
      filteredFleet = fleetInScope;
      if (garageFilter === 'parked') filteredFleet = fleetInScope.filter((t: any) => t.status === 'idle');
      else if (garageFilter === 'repair') filteredFleet = fleetInScope.filter((t: any) => truckNeedsRepair(t));

      const hubBusy = fleetInScope.filter((t: any) => t.status === 'busy' || t.status === 'delivering').length;
      readiness = fleetInScope.length > 0 ? Math.round(((fleetInScope.length - hubBusy) / fleetInScope.length) * 100) : 100;

      totalPages = Math.max(1, Math.ceil(filteredFleet.length / TRUCKS_PER_PAGE));
      if (garagePage > totalPages) garagePage = totalPages;
      const startIndex = (garagePage - 1) * TRUCKS_PER_PAGE;
      currentTrucks = filteredFleet.slice(startIndex, startIndex + TRUCKS_PER_PAGE);
    }

    return `
      <div style="background:#0e1320; border:1px solid #1f293d; border-radius:12px; padding:14px; margin-bottom:12px; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
          <div>
            <div style="font-size:9px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase; font-family:monospace;">FLEET LOGISTICS COMMAND</div>
            <h2 style="margin:2px 0 0; font-size:16px; font-weight:900; color:var(--tx);">Commercial Fleet Depot</h2>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn alt" style="padding:5px 10px; font-size:9px; font-weight:800; border-radius:6px; display:flex; align-items:center; gap:4px; border-color:var(--gold); color:var(--gold);" data-act="open-workshop-scan">
              <span>🔧</span> WORKSHOP SCAN
            </button>
            <button class="btn alt" style="padding:5px 10px; font-size:9px; font-weight:800; border-radius:6px; display:flex; align-items:center; gap:4px;" data-act="upgrade-garage" ${canUp ? '' : 'disabled'}>
              <span>+ EXPAND (${fmt(upCost)})</span>
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
          <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
            <div style="font-size:7px; font-weight:800; color:var(--mu); text-transform:uppercase;">REGION UNITS</div>
            <div style="font-size:13px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${S.fleet.filter((t: any) => resolveTruckRegion(t) === garageRegionFilter).length}
            </div>
          </div>
          <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
            <div style="font-size:7px; font-weight:800; color:var(--mu); text-transform:uppercase;">PARKED</div>
            <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:2px;">
              ${S.fleet.filter((t: any) => resolveTruckRegion(t) === garageRegionFilter && t.status === 'idle').length}
            </div>
          </div>
          <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
            <div style="font-size:7px; font-weight:800; color:var(--mu); text-transform:uppercase;">EN-ROUTE</div>
            <div style="font-size:13px; font-weight:900; color:#38bdf8; font-family:monospace; margin-top:2px;">
              ${activeList.length}
            </div>
          </div>
          <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
            <div style="font-size:7px; font-weight:800; color:var(--mu); text-transform:uppercase;">READINESS</div>
            <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:2px;">
              ${selectedHub ? readiness : 100}%
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:10px;">
        ${activeUnlockedRegions.map(r => {
          const count = S.fleet.filter((t: any) => resolveTruckRegion(t) === r).length;
          return `
            <button class="btn ${garageRegionFilter === r ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="garage-region" data-region="${r}">
              ${r.toUpperCase()} (${count})
            </button>
          `;
        }).join('')}
      </div>

      ${renderHubConsole(S, garageRegionFilter)}

      ${!selectedHub ? `
        <!-- Regional Logistics Strategic Overview -->
        <div style="background:#0e1320; border:1px solid #1f293d; border-radius:10px; padding:16px; margin-bottom:14px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; font-size:10px; font-weight:800; color:var(--gold); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:4px;">
                <span style="display:inline-block; width:8px; height:8px; background:var(--gold); border-radius:50%; box-shadow:0 0 8px var(--gold);"></span>
                ${garageRegionFilter.toUpperCase()} ACTIVE LOGISTICS NETWORK
              </div>
              <div style="font-size:18px; font-weight:900; color:var(--tx); letter-spacing:-0.2px;">
                Regional Operational Intelligence
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace; font-weight:700; letter-spacing:0.5px; margin-bottom:2px;">FLEET DEPLOYMENT</div>
              <div style="font-size:16px; font-weight:900; color:var(--tx); font-family:monospace;">
                ${activeList.length}<span style="font-size:10px; color:var(--mu); font-weight:600; margin-left:4px;">UNITS ACTIVE IN CORRIDOR</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top:12px; display:flex; gap:16px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
            <div style="display:flex; flex-direction:column;">
              <span style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">TOTAL CAPACITY</span>
              <span style="font-size:11px; font-weight:800; color:var(--tx); font-family:monospace;">${S.fleet.filter((t: any) => resolveTruckRegion(t) === garageRegionFilter).length} TRACTORS</span>
            </div>
            <div style="display:flex; flex-direction:column;">
              <span style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">EXTERNAL STAGING</span>
              <span style="font-size:11px; font-weight:800; color:${unstationedTrucks.length > 0 ? '#f87171' : 'var(--grn)'}; font-family:monospace;">${unstationedTrucks.length} UNSTATIONED</span>
            </div>
            <div style="display:flex; flex-direction:column; margin-left:auto; text-align:right;">
              <span style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">NETWORK STATUS</span>
              <span style="font-size:9px; font-weight:900; color:var(--gold); font-family:monospace;">✓ OPTIMAL THROUGHPUT</span>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
          <!-- 1. Render Unstationed/Parked-Outside-Hub Trucks first so they can be dealt with -->
          ${unstationedTrucks.map((t: any) => {
            const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
            return `
              <div style="background:rgba(239,68,68,0.05); border:1px dashed #ef444480; border-radius:8px; padding:10px; cursor:pointer;" data-act="truck-toggle" data-id="${t.id}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px;">⚠️</div>
                    <div>
                      <div style="font-size:12px; font-weight:900; color:var(--tx);">${m.name} (#${t.id})</div>
                      <div style="font-size:9px; color:#f87171; font-family:monospace; font-weight:800;">
                        PARKED AT EXTERNAL TERMINAL: ${t.loc}
                      </div>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:10px; font-weight:800; color:var(--mu);">IDLE / NO HUB</div>
                    <div style="font-size:8px; color:var(--mu); font-family:monospace;">TAP TO MANAGE</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <!-- 2. Render Active Consignments -->
          ${activeList.length > 0 ? activeList.map((a: any) => {
            const truckObj = (S.fleet || []).find((t: any) => t.id === a.truck);
            const drv = (S.drivers || []).find((d: any) => d.id === truckObj?.driverId);
            const cargoName = a.cargo || CARGO_TYPES.find(c => c.id === a.cargoId)?.name || 'Commercial Freight';
            const remainingMs = Math.max(0, a.end - now);
            const totalDuration = Math.max(1, a.end - a.start);
            const elapsed = Math.max(0, now - a.start);
            const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            const telem = getTruckTelematics(truckObj, a, drv, now);

            return `
              <div style="background:#0f172a; border:1px solid ${telem.stateBadgeColor}80; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px; cursor:pointer;" data-act="truck-toggle" data-id="${a.truck}">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                    ${renderCargoBadge(a.cargoId || 'general_freight', { size: 30 })}
                    <div style="min-width:0; flex:1;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:12px; font-weight:900; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cargoName}</span>
                        ${getDrivingStateBadge(telem.state, true)}
                      </div>
                      <div style="font-size:10px; font-family:monospace; color:var(--gold); font-weight:800; margin-top:1px;">
                        ${a.from} → ${a.to} <span style="color:var(--mu); font-weight:400;">(${a.km}km)</span>
                      </div>
                    </div>
                  </div>
                  <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.3); display:flex; align-items:center; gap:4px; flex-shrink:0;" data-act="open-telematics" data-id="${a.truck}">
                    🛰️ <span data-truck-speed="${a.truck}">${telem.speedKmh > 0 ? `${telem.speedKmh} km/h` : '0 km/h'}</span>
                  </button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:var(--mu); font-family:monospace; margin-top:-2px;">
                  <span>#${a.truck} · ${drv ? drv.name : 'Driver'} · <b style="color:#38bdf8;">${telem.phase}</b></span>
                  <span style="color:var(--gold); font-weight:800;" data-eta="${a.end}">${dur(remainingMs)}</span>
                </div>
                <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #0284c7, #38bdf8); transition:width 0.5s ease;"></div>
                </div>
              </div>
            `;
          }).join('') : (unstationedTrucks.length === 0 ? `
            <div style="padding:40px 20px; text-align:center; background:#0b101d; border:1px dashed #1e2638; border-radius:10px; color:var(--mu); font-family:monospace; font-size:11px; line-height:1.6;">
              No trucks currently en-route or unstationed in the ${garageRegionFilter} region.<br>
              <span style="font-size:10px; color:rgba(255,255,255,0.4);">Select a terminal hub above to manage stationed fleet units.</span>
            </div>
          ` : '')}
        </div>
      ` : `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px; flex-wrap:wrap;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn ${garageFilter === 'all' ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:9px; font-weight:800;" data-act="garage-filter" data-filter="all">ALL (${fleetInScope.length})</button>
            <button class="btn ${garageFilter === 'parked' ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:9px; font-weight:800;" data-act="garage-filter" data-filter="parked">PARKED (${fleetInScope.filter((t: any) => t.status === 'idle').length})</button>
            <button class="btn ${garageFilter === 'repair' ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:9px; font-weight:800;" data-act="garage-filter" data-filter="repair">SERVICE / REPAIR (${fleetInScope.filter((t: any) => truckNeedsRepair(t)).length})</button>
          </div>
        </div>
        ${currentTrucks.length > 0 ? currentTrucks.map((t: any) => truck(S, t)).join('') : `
          <div style="padding:28px 20px; text-align:center; background:#0b101d; border:1px dashed #1e2638; border-radius:10px; color:var(--mu); font-family:monospace; font-size:11px; line-height:1.6;">
            No tractors currently stationed at <b>${selectedHub.name}</b>.
          </div>
        `}
        ${totalPages > 1 ? `
          <div style="display:flex; justify-content:center; align-items:center; margin:16px 0; gap:12px; font-family:monospace; font-size:10px;">
            <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800;" data-act="garage-page-prev" ${garagePage <= 1 ? 'disabled style="opacity:0.35;"' : ''}>← PREV</button>
            <span style="color:var(--mu); font-weight:700;">PAGE <b style="color:var(--tx);">${garagePage}</b> OF ${totalPages}</span>
            <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800;" data-act="garage-page-next" ${garagePage >= totalPages ? 'disabled style="opacity:0.35;"' : ''}>NEXT →</button>
          </div>
        ` : ''}
      `}

      ${(() => {
        if (openId === null) return '';
        const targetTruck = S.fleet.find((x: any) => x.id === openId);
        if (!targetTruck) return '';
        // If we are in hub view and the truck is already visible in the paged list, don't double-render it
        if (selectedHub && currentTrucks.some(ct => ct.id === targetTruck.id)) return '';
        return truck(S, targetTruck);
      })()}
      ${activeJobSelectorTruckId !== null ? renderJobSelectorOverlay(S) : ''}
      ${renderHitchModal(S)}
      ${renderTelematicsOverlay(S)}

      <div class="card" style="margin-top:14px; padding:14px; background:#0f172a; border:1px solid var(--gold); border-radius:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="open-workshop-scan">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:38px; height:38px; background:var(--gold); color:#0a0f1d; border-radius:6px; display:grid; place-items:center; font-size:18px;">${ic('wrench')}</div>
          <div>
            <div style="font-size:13px; font-weight:900; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">Mechanic Workshop & Fleet Diagnostics</div>
            <div style="font-size:10px; color:var(--mu); margin-top:1px;">Enter workshop terminal, run fleet OBD-II health scan & hoist trucks to repair bays</div>
          </div>
        </div>
        <div style="color:var(--gold); font-size:14px;">${ic('chev')}</div>
      </div>
    `;
  }
};
