import { ic } from '../core/icons';
import { action, fmt, dur } from '../core/ui';
import { refresh } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { stats } from '../systems/calc';

export let activeTelematicsTruckId: number | null = null;

export function openTelematicsModal(truckId: number) {
  activeTelematicsTruckId = truckId;
  refresh();
}

export function closeTelematicsModal() {
  activeTelematicsTruckId = null;
  refresh();
}

action('open-telematics', d => openTelematicsModal(+(d as any).id));
action('close-telematics', () => closeTelematicsModal());

export function renderTelematicsOverlay(S: any): string {
  if (activeTelematicsTruckId === null) return '';

  const t = S.fleet.find((x: any) => x.id === activeTelematicsTruckId);
  const a = S.active.find((act: any) => act.truck === activeTelematicsTruckId);
  if (!t) return '';

  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const drv = S.drivers.find((d: any) => d.id === t.driverId);
  const now = Date.now();
  const st = stats(S, t, a ? a.weight || 0 : 0, a ? a.env : undefined);

  const isBusy = !!a;
  const pct = a ? Math.min(100, Math.max(0, ((now - a.start) / (a.end - a.start)) * 100)) : 0;
  const remainingMs = a ? Math.max(0, a.end - now) : 0;
  const weather = a?.env?.weather || 'clear';
  const ambientTemp = a?.env?.temp || 22;

  // Realistic telemetry values
  const speed = isBusy ? Math.round(st.topSpeed * 0.92) : 0;
  const rpm = isBusy ? Math.round(1350 + (speed % 10) * 18) : 650;
  const gear = isBusy ? (t.upgrades?.gearbox === '16spd_crawler' ? '14 / 16' : '11 / 12') : 'N (Neutral)';
  const fuelRate = isBusy ? (st.fuelConsumption * (0.95 + (speed % 5) * 0.02)).toFixed(1) : '1.8';
  const turboBoost = isBusy ? '1.85 bar' : '0.10 bar';
  const coolantTemp = ambientTemp > 30 ? '94°C' : '88°C';

  return `
    <div style="position:fixed; inset:0; background:rgba(3,7,18,0.92); z-index:2000; display:flex; align-items:center; justify-content:center; padding:12px; backdrop-filter:blur(6px);">
      <div style="background:#0b1120; border:1px solid var(--gold); border-radius:14px; width:100%; max-width:620px; max-height:92vh; overflow-y:auto; padding:18px; box-shadow:0 24px 60px rgba(0,0,0,0.85); position:relative;">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <div>
            <div style="font-size:9px; font-weight:900; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
              LIVE FLEET TELEMATICS · GPS SATELLITE FEED
            </div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">
              ${t.name} <span style="font-size:11px; color:var(--mu); font-family:monospace;">[${m.brand} ${m.name}]</span>
            </div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px;">
              Operator: <b style="color:var(--tx);">${drv ? drv.name : 'Unassigned'}</b> · CDL Skill ${drv ? '★'.repeat(drv.skill) : 'N/A'} · HOS Clock: <b style="color:var(--gold);">${drv ? (drv.hosHours || 0).toFixed(1) : '0'}/11.0 hrs</b>
            </div>
          </div>
          <button style="background:none; border:none; color:var(--mu); font-size:20px; cursor:pointer; padding:4px;" data-act="close-telematics">✕</button>
        </div>

        <!-- Simulated Road Dashcam Cockpit HUD -->
        <div style="position:relative; width:100%; height:190px; background:linear-gradient(180deg, #091224 0%, #17243c 55%, #1e293b 56%, #0f172a 100%); border-radius:10px; overflow:hidden; border:1px solid #1f293d; margin-bottom:14px; box-shadow:inset 0 0 40px rgba(0,0,0,0.8);">
          
          <!-- Sky / Horizon & Weather -->
          <div style="position:absolute; top:8px; left:12px; font-size:9px; font-family:monospace; color:rgba(255,255,255,0.7); z-index:2; display:flex; gap:10px;">
            <span>ENV: ${weather.toUpperCase()}</span>
            <span>TEMP: ${ambientTemp}°C</span>
            <span>GPS: ${t.loc} → ${a ? a.to : 'DEPOT'}</span>
          </div>

          <div style="position:absolute; top:8px; right:12px; font-size:9px; font-family:monospace; color:var(--grn); z-index:2;">
            ● 4G LTE TELEMATICS CONNECTED
          </div>

          <!-- Animated Perspective Road Canvas (CSS illusion) -->
          <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" preserveAspectRatio="none" viewBox="0 0 400 190">
            <!-- Horizon mountains -->
            <polygon points="0,105 70,85 140,105 230,80 320,105 400,90 400,106 0,106" fill="#0f192d" opacity="0.6"/>
            <!-- Road Asphalt -->
            <polygon points="175,106 225,106 380,190 20,190" fill="#1b2434"/>
            <!-- Shoulder lines -->
            <line x1="175" y1="106" x2="20" y2="190" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>
            <line x1="225" y1="106" x2="380" y2="190" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>
            <!-- Animated Center dashed lane marker -->
            <line x1="200" y1="106" x2="200" y2="190" stroke="#ffffff" stroke-dasharray="14 10" stroke-width="2.5" opacity="0.85">
              ${isBusy ? `<animate attributeName="stroke-dashoffset" values="0;24" dur="0.4s" repeatCount="indefinite" />` : ''}
            </line>
          </svg>

          <!-- Windshield HUD Overlay Gauge -->
          <div style="position:absolute; bottom:12px; left:14px; z-index:3; display:flex; gap:14px; align-items:flex-end;">
            <div style="background:rgba(5,10,25,0.75); border:1px solid rgba(193,154,91,0.4); border-radius:6px; padding:6px 10px; backdrop-filter:blur(4px);">
              <div style="font-size:8px; color:var(--gold); font-weight:800;">CRUISE SPEED</div>
              <div style="font-size:22px; font-weight:900; color:#fff; font-family:monospace; line-height:1;">
                ${speed} <span style="font-size:10px; color:var(--mu);">km/h</span>
              </div>
            </div>
            <div style="background:rgba(5,10,25,0.75); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; backdrop-filter:blur(4px);">
              <div style="font-size:8px; color:var(--mu); font-weight:800;">ENGINE RPM</div>
              <div style="font-size:16px; font-weight:900; color:#38bdf8; font-family:monospace; line-height:1;">
                ${rpm} <span style="font-size:9px; color:var(--mu);">RPM</span>
              </div>
            </div>
            <div style="background:rgba(5,10,25,0.75); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; backdrop-filter:blur(4px);">
              <div style="font-size:8px; color:var(--mu); font-weight:800;">GEAR RATIO</div>
              <div style="font-size:15px; font-weight:900; color:var(--tx); font-family:monospace; line-height:1;">
                ${gear}
              </div>
            </div>
          </div>

          <!-- Weather Visual Elements -->
          ${weather === 'rain' ? `
            <div style="position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px); opacity:0.8;"></div>
            <div style="position:absolute; top:20px; right:20px; font-size:10px; color:#38bdf8; font-weight:800; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px;">
              🌧️ WIPERS CONTINUOUS ACTIVE
            </div>
          ` : ''}
          ${weather === 'snow' ? `
            <div style="position:absolute; top:20px; right:20px; font-size:10px; color:#e2e8f0; font-weight:800; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px;">
              ❄️ TRACTION ADVISORY: WINTER ROADS
            </div>
          ` : ''}
          ${weather === 'heatwave' ? `
            <div style="position:absolute; top:20px; right:20px; font-size:10px; color:#f97316; font-weight:800; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px;">
              ☀️ DESERT HEATWAVE: MONITOR COOLANT
            </div>
          ` : ''}
        </div>

        <!-- Telemetry Data Grid -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px;">
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">FUEL BURN RATE</div>
            <div style="font-size:14px; font-weight:900; color:var(--gold); font-family:monospace; margin-top:2px;">
              ${fuelRate} <span style="font-size:9px; color:var(--mu);">L/100km</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">ADBLUE / DEF LEVEL</div>
            <div style="font-size:14px; font-weight:900; color:#38bdf8; font-family:monospace; margin-top:2px;">
              ${t.fluids.adBlue || 100}% <span style="font-size:9px; color:var(--mu);">DEF</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">COOLANT TEMPERATURE</div>
            <div style="font-size:14px; font-weight:900; color:${ambientTemp > 30 ? '#f97316' : 'var(--grn)'}; font-family:monospace; margin-top:2px;">
              ${coolantTemp} <span style="font-size:9px; color:var(--mu);">Thermal</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">TURBO MANIFOLD BOOST</div>
            <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${turboBoost}
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">AXLE CONFIGURATION</div>
            <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${m.axle} <span style="font-size:9px; color:var(--mu);">${t.upgrades?.axleRatio === 'heavy_diff_lock' ? 'Locked' : 'Eco'}</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">TIRE COMPOUND</div>
            <div style="font-size:13px; font-weight:900; color:var(--tx); margin-top:2px;">
              ${t.upgrades?.tireCompound === 'all_terrain_winter' ? '❄️ M+S Winter' : '🍃 Eco Highway'}
            </div>
          </div>
        </div>

        <!-- Active Transit Consignment Details -->
        ${a ? `
          <div style="background:#09101d; border:1px solid #1e293b; border-radius:8px; padding:10px 12px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase;">DISPATCH CONSIGNMENT: ${a.cargo}</span>
              <span style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace;">ETA: ${dur(remainingMs)}</span>
            </div>
            <div style="font-size:11px; color:var(--tx); font-weight:700;">
              Route: ${a.from} → ${a.to} (${a.km} km) · Gross Payload: ${a.weight || 18} tonnes
            </div>
            <div style="margin-top:6px; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:var(--gold); border-radius:3px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:8px; color:var(--mu); font-family:monospace; margin-top:4px;">
              <span>DEPARTED: ${a.from}</span>
              <span>WEIGH STATION: ✓ APPROVED</span>
              <span>DESTINATION: ${a.to}</span>
            </div>
          </div>
        ` : `
          <div style="background:#09101d; border:1px dashed #1e293b; border-radius:8px; padding:14px; text-align:center; color:var(--mu); font-size:11px; margin-bottom:12px;">
            Tractor is currently idle in <b>${t.loc}</b>. Dispatch on a freight consignment to stream live telemetry.
          </div>
        `}

        <button class="btn alt" style="width:100%; padding:10px; font-weight:800; font-size:11px;" data-act="close-telematics">
          CLOSE TELEMATICS CONSOLE
        </button>
      </div>
    </div>
  `;
}
