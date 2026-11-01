import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { TRUCK_MODELS, TRAILERS, getTrailerIcon } from '../domain/trucks/trucks.data';
import { CITIES, LOCATIONS } from '../data/world';
import { stats, distKm } from '../systems/calc';
import { refuel, repair, inspect, assign, transport, refuelCost, repairCost, transportInfo, inspectCost, unhitchTrailer, hitchTrailer } from '../systems/fleet';
import { why } from '../systems/jobs';
import { slots, upgradeGarage, upgradeGarageCost } from '../systems/offices';
import { openJobSelector, renderJobSelectorOverlay, activeJobSelectorTruckId } from './garage/job-selector';
import { getTruckSilhouetteSvg } from '../domain/trucks/trucks.visuals';
import { getManufacturerLogoSvg } from '../domain/trucks/trucks.logos';
import { renderTelematicsOverlay } from './telematics-modal';

let openId: number | null = null, panel: string | null = null;
let hitchModalTruckId: number | null = null;

action('truck-toggle', d => { openId = openId === +(d as any).id ? null : +(d as any).id; panel = null; refresh(); });
action('panel', d => { panel = panel === (d as any).kind ? null : (d as any).kind; refresh(); });
action('refuel', d => refuel(+(d as any).id));

action('set-powertrain-gearbox', d => {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === +(d as any).id);
    if (t) {
      const type = (d as any).gearbox;
      const cost = type === '16spd_crawler' ? 12500 : 0;
      if (cost > 0 && S.money < cost) return toast('Insufficient funds for 16-speed crawler transmission ($12,500)', 'err');
      S.money -= cost;
      if (!t.upgrades) t.upgrades = {} as any;
      t.upgrades.gearbox = type;
      toast(`Installed ${type === '16spd_crawler' ? '16-Speed Heavy Crawler Transmission' : '12-Speed Automated Highway Transmission'}`, 'success');
    }
  });
});

action('set-powertrain-axle', d => {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === +(d as any).id);
    if (t) {
      const ratio = (d as any).ratio;
      const cost = ratio === 'heavy_diff_lock' ? 8500 : 0;
      if (cost > 0 && S.money < cost) return toast('Insufficient funds for 3.42:1 diff lock ratio ($8,500)', 'err');
      S.money -= cost;
      if (!t.upgrades) t.upgrades = {} as any;
      t.upgrades.axleRatio = ratio;
      toast(`Configured ${ratio === 'heavy_diff_lock' ? '3.42:1 Heavy Ratio with Inter-Axle Diff Lock' : '2.64:1 Long-Haul Highway Eco Ratio'}`, 'success');
    }
  });
});

action('set-powertrain-tires', d => {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === +(d as any).id);
    if (t) {
      const compound = (d as any).compound;
      const cost = compound === 'all_terrain_winter' ? 6000 : 4500;
      if (S.money < cost) return toast(`Insufficient funds for tire compound upgrade ($${cost.toLocaleString()})`, 'err');
      S.money -= cost;
      if (!t.upgrades) t.upgrades = {} as any;
      t.upgrades.tireCompound = compound;
      t.components.tires.health = 100;
      toast(`Mounted fresh ${compound === 'all_terrain_winter' ? 'All-Terrain Winter M+S Treads' : 'Low Rolling Resistance Eco Highway Tires'}`, 'success');
    }
  });
});

action('top-up-consumables', d => {
  set(S => {
    const t = S.fleet.find((x: any) => x.id === +(d as any).id);
    if (t) {
      const cost = 450;
      if (S.money < cost) return toast(`Insufficient funds for consumables service ($${cost})`, 'err');
      S.money -= cost;
      t.fluids.adBlue = 100;
      t.fluids.coolant = 100;
      t.fluids.transmissionOil = 100;
      toast(`Topped up AdBlue / DEF, flushed Coolant & refreshed Transmission Fluid ($${cost})`, 'success');
    }
  });
});
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

action('unhitch-trailer', d => {
  unhitchTrailer(+(d as any).id);
  refresh();
});

action('open-hitch-modal', d => {
  hitchModalTruckId = +(d as any).id;
  refresh();
});

action('close-hitch-modal', () => {
  hitchModalTruckId = null;
  refresh();
});

action('hitch-trailer', d => {
  hitchTrailer(+(d as any).id, (d as any).trailer as any);
  hitchModalTruckId = null;
  refresh();
});

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
  if (t.status === 'delivering') {
    const totalTime = 15 * 60 * 1000;
    const remaining = Math.max(0, (t.availableAt || now) - now);
    const progress = 100 - (remaining / totalTime * 100);

    return `
      <div style="margin-top:14px; background:#0f172a; border:1px solid var(--gold); border-radius:10px; padding:20px; text-align:center;">
        <div style="font-size:32px; margin-bottom:12px;">🚢</div>
        <div style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">Vehicle in Logistics Transit</div>
        <div style="font-size:13px; font-weight:900; color:var(--tx); margin:4px 0 12px;">FACTORY-TO-DEPOT DELIVERY</div>
        
        <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-bottom:6px; display:flex; justify-content:space-between;">
          <span>EST. ARRIVAL: ${new Date(t.availableAt).toLocaleTimeString()}</span>
          <span>${Math.round(progress)}%</span>
        </div>
        <div class="bar" style="height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
          <div style="width:${progress}%; height:100%; background:var(--gold); border-radius:4px; transition:width 1s linear;"></div>
        </div>
        
        <div style="font-size:9px; color:var(--mu); margin-top:12px; line-height:1.4;">
          Professional merchandise transport is currently repositioning this unit from the manufacturer regional distribution hub to your local terminal.
        </div>
      </div>
    `;
  }

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
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="btn alt" style="flex:1; padding:6px 10px; font-size:10px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.4); display:flex; align-items:center; justify-content:center; gap:6px;" data-act="open-telematics" data-id="${t.id}">
              <span>🛰️</span> LIVE TELEMATICS
            </button>
            <button class="btn" style="padding:6px 10px; font-size:9px; font-weight:900; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); letter-spacing:0.5px;" data-act="recall-truck" data-id="${t.id}">
              RECALL
            </button>
          </div>
        </div>
      ` : `
        <button class="btn alt" style="width:100%; margin-bottom:12px; padding:6px 10px; font-size:10px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.3); display:flex; align-items:center; justify-content:center; gap:6px;" data-act="open-telematics" data-id="${t.id}">
          <span>🛰️</span> OPEN VEHICLE TELEMETRICS & DASHCAM DIAGNOSTICS
        </button>
      `}

      <!-- Heavy Vehicle Technical Specification Grid -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:12px;">
        ${cell('ENGINE', m.engine.name, `${m.engine.displacement}L · ${m.engine.cylinders === 8 ? 'V8' : 'I6'}`)}
        ${cell('POWER', `${m.engine.hp} HP`, `@ 1,900 RPM`)}
        ${cell('TORQUE', `${m.engine.torque} Nm`, `Peak Output`)}
        ${cell('TRANSMISSION', t.upgrades?.gearbox === '16spd_crawler' ? '16-Spd Crawler' : '12-Spd Automated', t.upgrades?.gearbox === '16spd_crawler' ? 'Vocational Heavy' : 'Direct Drive')}
        ${cell('AXLE RATIO', t.upgrades?.axleRatio === 'heavy_diff_lock' ? '3.42:1 Diff Lock' : '2.64:1 Highway', m.axle)}
        ${cell('CRUISE RANGE', `~${estimatedRangeKm} km`, `Calculated`)}
        ${cell('LIFETIME ODO', `${Math.round(t.odometer).toLocaleString()} km`, `Total Distance`)}
        ${cell('ENGINE HOURS', `${estimatedHours} hrs`, `Cumulative Run`)}
        ${cell('FUEL RATE', `${st.fuelConsumption.toFixed(1)} L/100`, `Telematics Avg`)}
      </div>

      <!-- Powertrain Engineering & Consumables Breakdown -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; padding:10px 12px; border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="color:var(--gold); font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">POWERTRAIN CUSTOMIZATION & CONSUMABLES</span>
          <span style="font-size:8px; font-family:monospace; color:var(--mu);">SAE J1939</span>
        </div>

        <!-- Consumables Levels Row -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:10px;">
          <div style="background:#111827; border:1px solid #1f293d; padding:6px 8px; border-radius:6px;">
            <div style="font-size:7px; color:var(--mu); font-weight:700;">DIESEL FUEL</div>
            <div style="font-size:11px; font-weight:800; color:var(--tx); font-family:monospace;">${t.fluids.fuel}L <span style="font-size:8px; color:var(--mu);">(${fuelPctVal}%)</span></div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:6px 8px; border-radius:6px;">
            <div style="font-size:7px; color:var(--mu); font-weight:700;">ADBLUE / DEF</div>
            <div style="font-size:11px; font-weight:800; color:#38bdf8; font-family:monospace;">${t.fluids.adBlue || 100}%</div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:6px 8px; border-radius:6px;">
            <div style="font-size:7px; color:var(--mu); font-weight:700;">ENGINE COOLANT</div>
            <div style="font-size:11px; font-weight:800; color:${(t.fluids.coolant || 100) < 25 ? '#ef4444' : 'var(--grn)'}; font-family:monospace;">${t.fluids.coolant || 100}%</div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; padding:6px 8px; border-radius:6px;">
            <div style="font-size:7px; color:var(--mu); font-weight:700;">TRANSMISSION FLUID</div>
            <div style="font-size:11px; font-weight:800; color:var(--gold); font-family:monospace;">${t.fluids.transmissionOil || 100}%</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="font-size:9px; color:var(--mu);">Low coolant risks engine thermal shutdown during desert heatwaves.</span>
          <button class="btn alt" style="padding:4px 8px; font-size:8px; font-weight:800; color:var(--grn); border-color:rgba(34,197,94,0.3);" data-act="top-up-consumables" data-id="${t.id}" ${busy ? 'disabled' : ''}>
            💧 FLUSH & REFILL FLUIDS ($450)
          </button>
        </div>

        <!-- Gearbox, Differential & Tire Selector Controls -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:10px; font-weight:800; color:var(--tx);">Gearbox: ${t.upgrades?.gearbox === '16spd_crawler' ? '16-Speed Heavy Crawler' : '12-Speed Automated Highway'}</div>
              <div style="font-size:8px; color:var(--mu);">16-speed adds low crawler ratios for heavy 50t+ lowboys & grades.</div>
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn ${t.upgrades?.gearbox !== '16spd_crawler' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-gearbox" data-id="${t.id}" data-gearbox="12spd_highway" ${busy ? 'disabled' : ''}>
                12-SPD
              </button>
              <button class="btn ${t.upgrades?.gearbox === '16spd_crawler' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-gearbox" data-id="${t.id}" data-gearbox="16spd_crawler" ${busy ? 'disabled' : ''}>
                16-SPD CRAWLER ($12.5k)
              </button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:10px; font-weight:800; color:var(--tx);">Axle Differential: ${t.upgrades?.axleRatio === 'heavy_diff_lock' ? '3.42:1 Inter-Axle Diff Lock' : '2.64:1 Highway Eco'}</div>
              <div style="font-size:8px; color:var(--mu);">Diff lock provides +15% wet/snow traction; 2.64 saves 6% highway fuel.</div>
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn ${t.upgrades?.axleRatio !== 'heavy_diff_lock' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-axle" data-id="${t.id}" data-ratio="highway_eco" ${busy ? 'disabled' : ''}>
                2.64 ECO
              </button>
              <button class="btn ${t.upgrades?.axleRatio === 'heavy_diff_lock' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-axle" data-id="${t.id}" data-ratio="heavy_diff_lock" ${busy ? 'disabled' : ''}>
                3.42 DIFF LOCK ($8.5k)
              </button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:10px; font-weight:800; color:var(--tx);">Tires: ${t.upgrades?.tireCompound === 'all_terrain_winter' ? '❄️ All-Terrain Winter M+S' : '🍃 Low Rolling Resistance Eco'}</div>
              <div style="font-size:8px; color:var(--mu);">Winter treads prevent jackknife/black ice; Eco saves 8% fuel.</div>
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn ${t.upgrades?.tireCompound !== 'all_terrain_winter' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-tires" data-id="${t.id}" data-compound="highway_eco" ${busy ? 'disabled' : ''}>
                ECO TIRES ($4.5k)
              </button>
              <button class="btn ${t.upgrades?.tireCompound === 'all_terrain_winter' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-powertrain-tires" data-id="${t.id}" data-compound="all_terrain_winter" ${busy ? 'disabled' : ''}>
                WINTER M+S ($6.0k)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fifth Wheel Coupling & Trailer Management -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; padding:10px 12px; border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="color:var(--gold); font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">FIFTH WHEEL COUPLING STATUS</span>
          <span style="font-size:8px; font-family:monospace; color:var(--mu);">SAE J700 PIN</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">${t.trailer ? getTrailerIcon(t.trailer) : '🚛'}</span>
            <div>
              <div style="font-size:11px; font-weight:800; color:var(--tx);">
                ${t.trailer ? (TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer) : 'Bobtail (No Trailer Attached)'}
              </div>
              <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-top:1px;">
                Endorsements: ${m.haul.map((h: any) => TRAILERS[h as keyof typeof TRAILERS] || h).join(' · ')}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            ${t.trailer ? `
              <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:800; color:var(--red); border-color:rgba(239,68,68,0.3);" data-act="unhitch-trailer" data-id="${t.id}" ${busy ? 'disabled' : ''}>
                UNHITCH
              </button>
            ` : ''}
            <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:900;" data-act="open-hitch-modal" data-id="${t.id}" ${busy ? 'disabled' : ''}>
              ${t.trailer ? 'SWAP' : 'HITCH TRAILER'}
            </button>
          </div>
        </div>
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
            <div style="display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap;">
              <span style="font-size:10px; color:var(--mu); font-family:monospace;">
                ${m.brand} ${m.name} (${m.axle} · ${m.engine.hp} HP)
              </span>
              <!-- Trailer Badge -->
              <span style="display:inline-flex; align-items:center; gap:4px; background:${t.trailer ? 'rgba(193,154,91,0.12)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${t.trailer ? 'var(--gold)' : '#1e293b'}; border-radius:4px; padding:2px 6px; font-size:9px; font-weight:800; color:${t.trailer ? 'var(--gold)' : 'var(--mu)'};">
                <span>${t.trailer ? getTrailerIcon(t.trailer) : '🚛'}</span>
                <span>${t.trailer ? (TRAILERS[t.trailer as keyof typeof TRAILERS] || t.trailer).toUpperCase() : 'BOBTAIL (NO TRAILER)'}</span>
              </span>
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

      <!-- Vehicle Blueprint Silhouette Preview (Bobtail or Connected Rig) -->
      <div style="background:#0a0f1d; border:1px solid #1e293b; border-radius:6px; padding:6px 12px; margin-bottom:8px; display:flex; justify-content:center; align-items:center; min-height:64px;">
        ${getTruckSilhouetteSvg(m, o ? 'var(--gold)' : 'rgba(193,154,91,0.6)', m.axle, t.trailer)}
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

function renderHitchModal(S: any) {
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
      ${renderHitchModal(S)}
      ${renderTelematicsOverlay(S)}

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

