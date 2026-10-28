import { ic } from '../core/icons';
import { action, fmt, dur } from '../core/ui';
import { refresh } from '../core/store';
import { TRUCK_MODELS, TRAILERS } from '../domain/trucks/trucks.data';
import { CITIES, LOCATIONS } from '../data/world';
import { stats, PART_LABELS, distKm } from '../systems/calc';
import { refuel, repair, inspect, assign, transport, refuelCost, repairCost, transportInfo, inspectCost } from '../systems/fleet';
import { why } from '../systems/jobs';
import { slots, upgradeGarage, upgradeGarageCost } from '../systems/offices';
import { openJobSelector, renderJobSelectorOverlay, activeJobSelectorTruckId } from './garage/job-selector';
import { getTruckSilhouetteSvg } from '../domain/trucks/trucks.visuals';
import { getManufacturerLogoSvg } from '../domain/trucks/trucks.logos';

let openId: number | null = null, panel: string | null = null;
action('truck-toggle', d => { openId = openId === +(d as any).id ? null : +(d as any).id; panel = null; refresh(); });
action('panel', d => { panel = panel === (d as any).kind ? null : (d as any).kind; refresh(); });
action('refuel', d => refuel(+(d as any).id));
action('repair', d => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.repairTruckId = +(d as any).id;
    S.tab = 'repair';
    refresh();
  }
});
action('inspect', d => inspect(+(d as any).id));
action('dispatch', d => openJobSelector(+(d as any).id));
action('assign', d => assign(+(d as any).id, (d as any).driver ? +(d as any).driver : null));
action('move', d => transport(+(d as any).id, (d as any).city));
action('upgrade-garage', () => upgradeGarage());

const meter = (label: string, value: number, formattedText: string, alertThreshold = 30) => {
  const isAlert = value < alertThreshold;
  const barColor = isAlert ? 'var(--red)' : value < 60 ? 'var(--gold)' : 'var(--grn)';
  
  return `
    <div style="background:#0a0f1d; padding:8px 10px; border-radius:6px; border:1px solid #1f293d;">
      <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:4px; font-weight:700;">
        <span style="color:var(--mu); text-transform:uppercase; letter-spacing:0.3px;">${label}</span>
        <span style="color:${isAlert ? 'var(--red)' : 'var(--tx)'}; font-family:monospace; font-weight:800;">${formattedText}</span>
      </div>
      <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
        <div style="width:${Math.min(100, Math.max(0, value))}%; height:100%; background:${barColor}; border-radius:2px; transition:width 0.3s ease;"></div>
      </div>
    </div>
  `;
};

const cell = (label: string, value: string, subvalue?: string) => `
  <div style="background:#0a0f1d; padding:8px 10px; border-radius:6px; border:1px solid #1f293d;">
    <div style="font-size:8px; text-transform:uppercase; color:var(--mu); letter-spacing:0.5px; font-weight:700;">${label}</div>
    <div style="font-size:11px; font-weight:800; color:var(--tx); font-family:monospace; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</div>
    ${subvalue ? `<div style="font-size:8px; color:var(--mu); margin-top:1px;">${subvalue}</div>` : ''}
  </div>
`;

function panelHtml(S: any, t: any, busy: boolean) {
  if (panel === 'driver') {
    return `
      <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); background:#0a0f1d; padding:12px; border-radius:8px; border:1px solid #1f293d;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">COMMERCIAL DRIVER ROSTER & DISPATCH</span>
          <span style="font-size:9px; color:var(--mu); font-family:monospace;">CDL CLASS-A LICENSED</span>
        </div>
        ${S.drivers.length > 0 ? S.drivers.map((d: any) => {
          const cur = t.driverId === d.id;
          const o = S.fleet.find((x: any) => x.driverId === d.id && x.id !== t.id);
          const lock = o && o.status === 'busy';
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; margin-bottom:6px; background:#111827; border:1px solid #1f293d; border-radius:6px;">
              <div>
                <div style="font-size:12px; font-weight:800; color:var(--tx);">${d.name}</div>
                <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                  Skill Level ${d.skill}/5 · ${o ? `Assigned to Unit #${o.id}` : cur ? 'Currently in Command' : 'Off-Duty Standby'}
                </div>
              </div>
              <button class="btn ${cur ? 'gold' : 'alt'}" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="assign" data-id="${t.id}" data-driver="${d.id}" ${cur || busy || lock ? 'disabled' : ''}>
                ${cur ? 'ASSIGNED' : lock ? 'ON MISSION' : 'ASSIGN'}
              </button>
            </div>
          `;
        }).join('') : `
          <div style="padding:14px; text-align:center; color:var(--mu); font-size:10px; font-family:monospace;">
            NO LICENSED CDL DRIVERS HIRED. VISIT HR CREW MANAGEMENT.
          </div>
        `}
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
    return `
      <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); background:#0a0f1d; padding:12px; border-radius:8px; border:1px solid #1f293d;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">TERMINAL DEADHEAD / RELOCATION</span>
          <span style="font-size:9px; color:var(--mu); font-family:monospace;">BILL OF LADING TRANSIT</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; max-height:220px; overflow-y:auto; padding-right:2px;">
          ${Object.keys(CITIES).filter(c => c !== t.loc).map(c => {
            const i = transportInfo(S, t, c);
            const loc = LOCATIONS[c];
            return `
              <button class="btn alt" style="display:flex; flex-direction:column; align-items:flex-start; padding:8px 10px; text-align:left; border-radius:6px;" data-act="move" data-id="${t.id}" data-city="${c}" ${i.why ? 'disabled' : ''}>
                <div style="font-size:11px; font-weight:800; color:var(--tx);">${loc?.name || c} <span style="font-size:8px; color:var(--gold); font-family:monospace;">[${loc?.region || 'Global'}]</span></div>
                <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                  ${i.km} km · ETA ${dur(i.ms)}
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return '';
}

function body(S: any, t: any, m: any, a: any, now: number) {
  const st = stats(S, t);
  const busy = !!a;
  const drv = S.drivers.find((x: any) => x.id === t.driverId);
  const pct = a ? Math.min(100, (now - a.start) / (a.end - a.start) * 100) : 0;
  
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgCond = Math.round(healthValues.reduce((sum: number, b: any) => sum + b, 0) / healthValues.length);
  const fuelPctVal = Math.round((t.fluids.fuel / m.tankSize) * 100);
  const estimatedHours = Math.round(t.odometer / 58);
  const estimatedRangeKm = Math.round((t.fluids.fuel / (st.fuelConsumption || 32)) * 100);

  const hasCompatibleJobs = S.jobs.some((j: any) => !why(S, t, j));

  // 9 Monitored Subsystems
  const componentMeters = Object.entries(t.components).map(([k, c]: [string, any]) => 
    meter(PART_LABELS[k] || k, c.health, `${Math.round(c.health)}%`, 35)
  ).join('');

  return `
    <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
      <!-- Real-time Active Consignment Bar -->
      ${a ? `
        <div style="background:#0f172a; border:1px solid var(--blu); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div>
              <div style="font-size:9px; color:var(--blu); font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">
                ACTIVE LOGISTICS TRANSIT · CONSIGNMENT
              </div>
              <div style="font-size:12px; font-weight:800; color:var(--tx); margin-top:2px;">
                ${a.cargo} · ${a.from} → ${a.to}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:9px; color:var(--mu);">ESTIMATED ARRIVAL</div>
              <div style="font-size:12px; font-weight:800; color:var(--gold); font-family:monospace;" data-eta="${a.end}">
                ${dur(Math.max(0, a.end - now))}
              </div>
            </div>
          </div>
          <div class="bar" style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;" data-start="${a.start}" data-end="${a.end}">
            <div style="width:${pct}%; height:100%; background:var(--blu); border-radius:3px; transition:width 0.5s linear;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Real Telematics Dual Primary Gauges -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
        ${meter('Diesel Reservoir', fuelPctVal, `${Math.round(t.fluids.fuel)} / ${m.tankSize} L (${fuelPctVal}%)`, 20)}
        ${meter('Mechanical Integrity', avgCond, `${avgCond}% Nominal`, 35)}
      </div>

      <!-- SAE Diagnostic Telematics Grid (9 Subsystems) -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:9px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">SAE J1939 DIAGNOSTIC SUBSYSTEMS</span>
          <span style="font-size:8px; font-family:monospace; color:var(--mu);">${avgCond > 70 ? 'ALL SENSORS NOMINAL' : 'MAINTENANCE ADVISORY'}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          ${componentMeters}
        </div>
      </div>

      <!-- Heavy Vehicle Technical Specification Grid -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:12px;">
        ${cell('ENGINE', m.engine.name, `${m.engine.displacement}L · ${m.engine.cylinders === 8 ? 'V8' : 'I6'}`)}
        ${cell('POWER', `${m.engine.hp} HP`, `@ 1,900 RPM`)}
        ${cell('TORQUE', `${m.engine.torque} Nm`, `Peak Output`)}
        ${cell('TRANSMISSION', m.trans, `Automated Manual`)}
        ${cell('AXLE RATIO', m.axle, `Inter-Axle Lock`)}
        ${cell('CRUISE RANGE', `~${estimatedRangeKm} km`, `Calculated`)}
        ${cell('LIFETIME ODO', `${Math.round(t.odometer).toLocaleString()} km`, `Total Distance`)}
        ${cell('ENGINE HOURS', `${estimatedHours} hrs`, `Cumulative Run`)}
        ${cell('FUEL RATE', `${st.fuelConsumption.toFixed(1)} L/100`, `Telematics Avg`)}
      </div>

      <!-- Fifth Wheel Coupling Trailer Endorsement -->
      <div style="font-size:9px; color:var(--mu); background:#0a0f1d; border:1px solid #1e293b; padding:8px 10px; border-radius:6px; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
        <span style="color:var(--gold); font-weight:800; text-transform:uppercase;">TRAILER ENDORSEMENTS:</span>
        <span style="color:var(--tx);">${m.haul.map((h: any) => TRAILERS[h as keyof typeof TRAILERS] || h).join(' · ')}</span>
      </div>

      <!-- Primary Dispatch Action -->
      <button class="btn gold" style="width:100%; margin-bottom:12px; padding:10px; font-weight:900; font-size:11px; letter-spacing:0.5px; text-transform:uppercase;" data-act="dispatch" data-id="${t.id}" ${hasCompatibleJobs && !busy ? '' : 'disabled'}>
        ${ic('send')} ${busy ? 'TRACTOR CURRENTLY IN TRANSIT' : hasCompatibleJobs ? 'DISPATCH ON COMPATIBLE FREIGHT LOAD' : 'NO COMPATIBLE FREIGHT LOADS ON BOARD'}
      </button>

      <!-- Terminal Maintenance & Fleet Actions -->
      <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;">
        <button class="btn alt" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px;" data-act="refuel" data-id="${t.id}" ${busy || fuelPctVal >= 99 ? 'disabled' : ''}>
          ${ic('fuel')}
          <span style="font-size:8px; font-weight:800;">${fuelPctVal < 99 ? fmt(refuelCost(t)) : 'FULL'}</span>
          <span style="font-size:7px; color:var(--mu);">REFUEL</span>
        </button>

        <button class="btn alt" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px;" data-act="repair" data-id="${t.id}" ${busy ? 'disabled' : ''}>
          ${ic('wrench')}
          <span style="font-size:8px; font-weight:800; color:${avgCond >= 100 ? 'var(--grn)' : 'var(--gold)'};">${avgCond >= 100 ? 'CHECK' : 'REPAIR'}</span>
          <span style="font-size:7px; color:var(--mu);">SERVICE</span>
        </button>

        <button class="btn alt" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px;" data-act="inspect" data-id="${t.id}" ${busy ? 'disabled' : ''}>
          ${ic('search')}
          <span style="font-size:8px; font-weight:800;">${fmt(inspectCost())}</span>
          <span style="font-size:7px; color:var(--mu);">INSPECT</span>
        </button>

        <button class="btn alt ${panel === 'driver' ? 'gold' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px;" data-act="panel" data-kind="driver">
          ${ic('user')}
          <span style="font-size:8px; font-weight:800; max-width:45px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${drv ? drv.name.split(' ')[0].toUpperCase() : 'CDL'}</span>
          <span style="font-size:7px; color:var(--mu);">DRIVER</span>
        </button>

        <button class="btn alt ${panel === 'move' ? 'gold' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px;" data-act="panel" data-kind="move">
          ${ic('route')}
          <span style="font-size:8px; font-weight:800;">${t.loc.slice(0, 5)}</span>
          <span style="font-size:7px; color:var(--mu);">RELOCATE</span>
        </button>
      </div>

      ${panelHtml(S, t, busy)}
    </div>
  `;
}

function truck(S: any, t: any) {
  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const a = S.active.find((x: any) => x.truck === t.id);
  const now = Date.now();
  const o = openId === t.id;
  const drv = S.drivers.find((x: any) => x.id === t.driverId);

  const status = a ? { txt: a.kind === 'move' ? 'REPOSITIONING' : 'ON HIGHWAY', color: 'var(--blu)' }
    : drv ? { txt: 'STAGED · READY', color: 'var(--grn)' }
    : { txt: 'STANDBY (NO CDL)', color: 'var(--mu)' };

  const fuelPctVal = Math.round((t.fluids.fuel / m.tankSize) * 100);
  const healthValues = Object.values(t.components).map((c: any) => c.health);
  const avgCond = Math.round(healthValues.reduce((sum: number, b: any) => sum + b, 0) / healthValues.length);

  return `
    <div class="card ${o ? 'open' : ''}" style="margin-bottom:12px; background:#111827; border:1px solid ${o ? 'var(--gold)' : '#1f293d'}; border-radius:10px; padding:14px; cursor:pointer; transition:border-color 0.2s;" data-act="truck-toggle" data-id="${t.id}">
      <!-- Unit Banner Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <!-- OEM Manufacturer Logo -->
          <div style="width:54px; height:36px; background:#080c16; border:1px solid #1a2336; border-radius:6px; display:grid; place-items:center; flex-shrink:0; padding:2px;">
            ${getManufacturerLogoSvg(m.brand, 48, 30)}
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:6px; font-size:9px; color:var(--mu); font-family:monospace;">
              <span style="color:var(--gold); font-weight:800;">UNIT #${t.id}</span>
              <span>·</span>
              <span>${t.loc} TERMINAL</span>
              <span>·</span>
              <span>${drv ? drv.name : 'NO DRIVER'}</span>
            </div>
            <div style="font-size:15px; font-weight:900; color:var(--tx); margin-top:2px;">
              ${t.name}
            </div>
            <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:1px;">
              ${m.brand} ${m.name} (${m.axle} · ${m.engine.hp} HP)
            </div>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:9px; font-weight:900; color:${status.color}; letter-spacing:0.5px; font-family:monospace; margin-bottom:4px;">
            ${status.txt}
          </div>
          <div style="display:flex; gap:6px; align-items:center; justify-content:flex-end; font-size:9px; font-family:monospace; color:var(--mu);">
            <span>FUEL <b>${fuelPctVal}%</b></span>
            <span>·</span>
            <span>HLTH <b style="color:${avgCond < 40 ? 'var(--red)' : 'var(--tx)'};">${avgCond}%</b></span>
          </div>
        </div>
      </div>

      <!-- Vehicle Blueprint Silhouette Preview -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; border-radius:6px; padding:4px 10px; margin-bottom:8px; display:flex; justify-content:center; align-items:center;">
        ${getTruckSilhouetteSvg(m, o ? 'var(--gold)' : 'rgba(193,154,91,0.6)', m.axle)}
      </div>

      <!-- Quick Telematics Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--mu); font-family:monospace; padding-top:4px;">
        <span>ODO: <b style="color:var(--tx);">${Math.round(t.odometer).toLocaleString()} km</b></span>
        <span style="color:var(--gold); font-weight:700;">${o ? 'COLLAPSE TELEMATICS ▲' : 'EXPAND TELEMATICS ▼'}</span>
      </div>

      ${o ? body(S, t, m, a, now) : ''}
    </div>
  `;
}

export default {
  id: 'garage',
  icon: 'garage',
  label: 'Garage',
  render(S: any) {
    const busy = S.fleet.filter((t: any) => t.status === 'busy').length;
    const upCost = upgradeGarageCost(S.garageLevel);
    const canUp = S.money >= upCost;
    const readiness = S.fleet.length > 0 ? Math.round(((S.fleet.length - busy) / S.fleet.length) * 100) : 100;

    return `
      <!-- Terminal Fleet Operations Bar -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:14px; margin-bottom:14px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; letter-spacing:0.5px;">TERMINAL BERTH CAPACITY</div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
            <span style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace;">${S.fleet.length} <span style="font-size:12px; color:var(--mu);">/ ${slots(S)}</span></span>
            <button class="btn alt" style="padding:3px 8px; font-size:8px; font-weight:800; border-radius:4px;" data-act="upgrade-garage" ${canUp ? '' : 'disabled'}>
              + BERTH LVL ${S.garageLevel + 1} (${fmt(upCost)})
            </button>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; letter-spacing:0.5px;">DEPOT READINESS</div>
          <div style="font-size:18px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:2px;">
            ${readiness}% <span style="font-size:10px; color:var(--mu); font-family:sans-serif; font-weight:700;">(${S.fleet.length - busy} Ready / ${busy} On Road)</span>
          </div>
        </div>
      </div>

      <!-- Fleet Unit Roster Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 2px;">
        <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">REGISTERED FLEET ASSETS (${S.fleet.length})</span>
        <span style="font-size:9px; color:var(--mu); font-family:monospace;">SAE J1939 TELEMATICS LIVE</span>
      </div>

      ${S.fleet.map((t: any) => truck(S, t)).join('')}
      ${activeJobSelectorTruckId !== null ? renderJobSelectorOverlay(S) : ''}

      <!-- OEM Dealership Gateway Card -->
      <div class="card" style="margin-top:14px; padding:14px; background:#0f172a; border:1px solid var(--gold); border-radius:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="store-open" data-id="dealership">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:38px; height:38px; background:var(--gold); color:#0a0f1d; border-radius:6px; display:grid; place-items:center; font-size:18px;">
            ${ic('truck')}
          </div>
          <div>
            <div style="font-size:13px; font-weight:900; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">Acquire New Fleet Assets</div>
            <div style="font-size:10px; color:var(--mu); margin-top:1px;">Factory Order Class 8 Heavy Commercial Tractors & Trailers</div>
          </div>
        </div>
        <div style="color:var(--gold); font-size:14px;">${ic('chev')}</div>
      </div>
    `;
  }
};
