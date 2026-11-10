import { ic } from '../core/icons';
import { action, fmt, dur } from '../core/ui';
import { refresh } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { getTruckTelematics, getDrivingStateBadge } from '../domain/trucks/trucks.telematics';

export let activeTelematicsTruckId: number | null = null;
let telematicsInterval: any = null;

export function openTelematicsModal(truckId: number) {
  activeTelematicsTruckId = truckId;
  if (telematicsInterval) clearInterval(telematicsInterval);
  telematicsInterval = setInterval(() => {
    if (activeTelematicsTruckId !== null) {
      refresh();
    } else {
      clearInterval(telematicsInterval);
      telematicsInterval = null;
    }
  }, 750);
  refresh();
}

export function closeTelematicsModal() {
  activeTelematicsTruckId = null;
  if (telematicsInterval) {
    clearInterval(telematicsInterval);
    telematicsInterval = null;
  }
  refresh();
}

action('open-telematics', d => openTelematicsModal(+(d as any).id));
action('close-telematics', () => closeTelematicsModal());

export function renderTelematicsOverlay(S: any): string {
  if (activeTelematicsTruckId === null || !S) return '';

  const t = (S.fleet || []).find((x: any) => x.id === activeTelematicsTruckId);
  const a = (S.active || []).find((act: any) => act.truck === activeTelematicsTruckId);
  if (!t) return '';

  const m = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'];
  const drv = (S.drivers || []).find((d: any) => d.id === t.driverId);
  const now = Date.now();

  // Retrieve comprehensive dynamic telematics snapshot
  const telem = getTruckTelematics(t, a, drv, now);

  const weather = a?.env?.weather || 'clear';
  const ambientTemp = a?.env?.temp || 22;

  // Compute road dash animation speed based on dynamic vehicle speed
  const animDur = telem.isMoving
    ? Math.max(0.2, ((125 - telem.speedKmh) / 100)).toFixed(2)
    : '0';

  return `
    <div style="position:fixed; inset:0; background:rgba(3,7,18,0.92); z-index:2000; display:flex; align-items:center; justify-content:center; padding:12px; backdrop-filter:blur(6px);">
      <div style="background:#0b1120; border:1px solid var(--gold); border-radius:14px; width:100%; max-width:620px; max-height:92vh; overflow-y:auto; padding:18px; box-shadow:0 24px 60px rgba(0,0,0,0.85); position:relative;">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="font-size:9px; font-weight:900; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
                LIVE FLEET TELEMATICS · GPS SATELLITE FEED
              </div>
              ${getDrivingStateBadge(telem.state, true)}
            </div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:3px;">
              ${t.name} <span style="font-size:11px; color:var(--mu); font-family:monospace;">[${m.brand} ${m.name}]</span>
            </div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px;">
              Operator: <b style="color:var(--tx);">${drv ? drv.name : 'Unassigned'}</b> · CDL Skill ${drv ? '★'.repeat(drv.skill) : 'N/A'} · HOS Clock: <b style="color:var(--gold);">${drv ? (drv.hosHours || 0).toFixed(1) : '0'}/11.0 hrs</b>
            </div>
          </div>
          <button style="background:none; border:none; color:var(--mu); font-size:20px; cursor:pointer; padding:4px;" data-act="close-telematics">✕</button>
        </div>

        <!-- Simulated Road Dashcam Cockpit HUD -->
        <div style="position:relative; width:100%; height:200px; background:linear-gradient(180deg, #091224 0%, #17243c 55%, #1e293b 56%, #0f172a 100%); border-radius:10px; overflow:hidden; border:1px solid #1f293d; margin-bottom:10px; box-shadow:inset 0 0 40px rgba(0,0,0,0.8);">
          
          <!-- Top HUD Header Status Strip -->
          <div style="position:absolute; top:0; left:0; right:0; padding:6px 10px; background:linear-gradient(180deg, rgba(5,10,25,0.92) 0%, rgba(5,10,25,0.6) 80%, transparent 100%); z-index:10; display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:9px;">
            <div style="display:flex; align-items:center; gap:8px; color:rgba(255,255,255,0.85); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <span style="color:var(--gold); font-weight:800;">ENV: ${weather.toUpperCase()}</span>
              <span>·</span>
              <span>${ambientTemp}°C</span>
              <span>·</span>
              <span style="color:#38bdf8; font-weight:800;">📍 ${t.status === 'delivering' ? 'FACTORY' : t.loc} → ${a ? a.to : (t.status === 'delivering' ? t.loc : 'DEPOT')}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="color:${telem.stateBadgeColor}; font-weight:900; font-size:8px;">${telem.stateIcon} ${telem.state.toUpperCase()}</span>
              <div style="color:var(--grn); font-weight:800; font-size:8px; flex-shrink:0; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); padding:2px 6px; border-radius:4px;">
                ● 4G LTE LIVE
              </div>
            </div>
          </div>

          <!-- Dynamic Driving State Overlay Badges on Dashcam -->
          ${telem.state === 'braking' || telem.retarderActive ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#ef4444; font-weight:900; background:rgba(239,68,68,0.2); border:1px solid #ef4444; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px); box-shadow:0 0 10px rgba(239,68,68,0.3);">
              🛑 JAKE ENGINE BRAKE / RETARDER ACTIVE (-${telem.brakePct}% TORQUE)
            </div>
          ` : telem.state === 'speeding' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#facc15; font-weight:900; background:rgba(234,179,8,0.2); border:1px solid #facc15; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ⚡ PASSING LANE OVERTAKE (${telem.speedKmh} KM/H)
            </div>
          ` : telem.state === 'slow_down' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#fb923c; font-weight:900; background:rgba(249,115,22,0.2); border:1px solid #fb923c; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ⚠️ TRAFFIC SLOWDOWN / CURVATURE ADVISORY
            </div>
          ` : telem.state === 'resting' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#c084fc; font-weight:900; background:rgba(168,85,247,0.2); border:1px solid #c084fc; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ☕ MOTORWAY TRAVEL PLAZA · SLEEPER BERTH LOGGED
            </div>
          ` : telem.state === 'refueling' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#fde047; font-weight:900; background:rgba(234,179,8,0.2); border:1px solid #fde047; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ⛽ DIESEL BUNKERING CANOPY · REFUELING NOZZLE CONNECTED
            </div>
          ` : telem.state === 'loading' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#38bdf8; font-weight:900; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              📦 SHIPPERS DISTRIBUTION DOCK · LOADING BAY MANIFEST
            </div>
          ` : telem.state === 'unloading' ? `
            <div style="position:absolute; top:32px; left:10px; z-index:10; font-size:9px; color:#38bdf8; font-weight:900; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              🏁 CONSIGNEE RECEIVING DOCK · PALLET UNLOADING
            </div>
          ` : ''}

          <!-- Weather Advisory Banner Strip (Below Header) -->
          ${weather === 'rain' ? `
            <div style="position:absolute; top:32px; right:10px; z-index:10; font-size:9px; color:#38bdf8; font-weight:800; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.4); padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              🌧️ WIPERS CONTINUOUS ACTIVE
            </div>
          ` : ''}
          ${weather === 'snow' ? `
            <div style="position:absolute; top:32px; right:10px; z-index:10; font-size:9px; color:#e2e8f0; font-weight:800; background:rgba(15,23,42,0.85); border:1px solid rgba(226,232,240,0.4); padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ❄️ TRACTION ADVISORY: WINTER ROADS
            </div>
          ` : ''}
          ${weather === 'heatwave' ? `
            <div style="position:absolute; top:32px; right:10px; z-index:10; font-size:9px; color:#f97316; font-weight:800; background:rgba(15,23,42,0.85); border:1px solid rgba(249,115,22,0.4); padding:3px 8px; border-radius:4px; font-family:monospace; backdrop-filter:blur(4px);">
              ☀️ DESERT HEATWAVE: MONITOR COOLANT
            </div>
          ` : ''}

          <!-- Animated Perspective Road Canvas (CSS illusion) -->
          <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" preserveAspectRatio="none" viewBox="0 0 400 200">
            <!-- Horizon mountains -->
            <polygon points="0,110 70,90 140,110 230,85 320,110 400,95 400,111 0,111" fill="#0f192d" opacity="0.6"/>
            <!-- Road Asphalt -->
            <polygon points="175,111 225,111 380,200 20,200" fill="#1b2434"/>
            <!-- Shoulder lines -->
            <line x1="175" y1="111" x2="20" y2="200" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>
            <line x1="225" y1="111" x2="380" y2="200" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>
            <!-- Animated Center dashed lane marker (speed-adaptive) -->
            <line x1="200" y1="111" x2="200" y2="200" stroke="#ffffff" stroke-dasharray="14 10" stroke-width="2.5" opacity="0.85">
              ${telem.isMoving ? `<animate attributeName="stroke-dashoffset" values="0;24" dur="${animDur}s" repeatCount="indefinite" />` : ''}
            </line>
          </svg>

          <!-- Braking Red Aura Glow Overlay -->
          ${telem.state === 'braking' || telem.retarderActive ? `
            <div style="position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at 50% 90%, rgba(239,68,68,0.3) 0%, transparent 65%);"></div>
          ` : ''}

          <!-- Rain overlay effect if raining -->
          ${weather === 'rain' ? `
            <div style="position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px); opacity:0.8;"></div>
          ` : ''}

          <!-- Windshield HUD Overlay Gauge Cluster (Bottom) -->
          <div style="position:absolute; bottom:8px; left:8px; right:8px; z-index:10; display:flex; gap:8px;">
            <div style="flex:1.2; background:rgba(5,10,25,0.88); border:1px solid ${telem.stateBadgeColor}80; border-radius:6px; padding:5px 8px; backdrop-filter:blur(4px);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:7px; color:${telem.stateBadgeColor}; font-weight:800; text-transform:uppercase;">${telem.state.replace('_', ' ')} SPEED</span>
                <span style="font-size:7px; color:var(--mu); font-family:monospace;">TGT: ${telem.targetSpeedKmh}</span>
              </div>
              <div style="font-size:19px; font-weight:900; color:#fff; font-family:monospace; line-height:1.1; margin-top:1px;">
                ${telem.speedKmh} <span style="font-size:9px; color:var(--mu); font-weight:normal;">km/h</span>
              </div>
              <!-- Throttle / Brake mini bars -->
              <div style="display:flex; gap:4px; margin-top:3px; height:3px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                <div style="width:${telem.throttlePct}%; height:100%; background:var(--grn); border-radius:2px;"></div>
                <div style="width:${telem.brakePct}%; height:100%; background:#ef4444; border-radius:2px;"></div>
              </div>
            </div>
            
            <div style="flex:1; background:rgba(5,10,25,0.88); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:5px 8px; backdrop-filter:blur(4px);">
              <div style="font-size:7px; color:var(--mu); font-weight:800; text-transform:uppercase;">ENGINE RPM</div>
              <div style="font-size:16px; font-weight:900; color:#38bdf8; font-family:monospace; line-height:1.1; margin-top:1px;">
                ${telem.engineRpm} <span style="font-size:8px; color:var(--mu); font-weight:normal;">RPM</span>
              </div>
              <div style="font-size:7px; color:${telem.engineRpm > 1700 ? '#f59e0b' : telem.engineRpm > 1150 ? 'var(--grn)' : 'var(--mu)'}; font-family:monospace; margin-top:2px;">
                ${telem.engineRpm > 1700 ? '● PEAK POWER' : telem.engineRpm > 1150 ? '● ECO GREEN BAND' : telem.engineRpm === 0 ? '● ENGINE CUT' : '● IDLE 650'}
              </div>
            </div>

            <div style="flex:1; background:rgba(5,10,25,0.88); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:5px 8px; backdrop-filter:blur(4px);">
              <div style="font-size:7px; color:var(--mu); font-weight:800; text-transform:uppercase;">DRIVELINE GEAR</div>
              <div style="font-size:15px; font-weight:900; color:var(--tx); font-family:monospace; line-height:1.1; margin-top:1px;">
                ${telem.currentGear}
              </div>
              <div style="font-size:7px; color:${telem.retarderActive ? '#ef4444' : telem.throttlePct > 80 ? 'var(--gold)' : 'var(--mu)'}; font-family:monospace; margin-top:2px;">
                ${telem.retarderActive ? 'JAKE RETARDER ON' : telem.throttlePct > 80 ? 'HIGH TORQUE' : telem.brakePct > 0 ? 'SERVICE BRAKE' : 'OVERDRIVE ECO'}
              </div>
            </div>
          </div>
        </div>

        <!-- Real-Time Driving State Narrative Strip -->
        <div style="background:#0a0f1d; border:1px solid #1f293d; border-left:3px solid ${telem.stateBadgeColor}; border-radius:8px; padding:9px 12px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <span style="font-size:18px; flex-shrink:0;">${telem.stateIcon}</span>
            <div style="min-width:0;">
              <div style="font-size:11px; font-weight:900; color:${telem.stateBadgeColor}; text-transform:uppercase; letter-spacing:0.3px;">
                ${telem.stateLabel}
              </div>
              <div style="font-size:10px; color:var(--tx); opacity:0.85; margin-top:1px; line-height:1.3;">
                ${telem.stateDescription}
              </div>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0; font-family:monospace; font-size:9px; color:var(--mu);">
            <div>Grade: <b style="color:var(--tx);">${telem.gradientPct >= 0 ? '+' : ''}${telem.gradientPct}%</b></div>
            <div style="color:${telem.roadSurface.includes('Ice') ? '#e2e8f0' : telem.roadSurface.includes('Wet') ? '#38bdf8' : 'var(--gold)'};">${telem.roadSurface}</div>
          </div>
        </div>

        <!-- Telemetry Sensors Data Grid -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px;">
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">INSTANTANEOUS FUEL BURN</div>
            <div style="font-size:14px; font-weight:900; color:var(--gold); font-family:monospace; margin-top:2px;">
              ${telem.fuelBurnRate} <span style="font-size:9px; color:var(--mu);">L/100km</span>
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
            <div style="font-size:14px; font-weight:900; color:${telem.coolantTempC > 92 ? '#f97316' : 'var(--grn)'}; font-family:monospace; margin-top:2px;">
              ${telem.coolantTempC}°C <span style="font-size:9px; color:var(--mu);">Thermal</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">TURBO MANIFOLD BOOST</div>
            <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${telem.turboBoostBar} <span style="font-size:9px; color:var(--mu);">bar</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">FOUNDATION BRAKE TEMP</div>
            <div style="font-size:14px; font-weight:900; color:${telem.brakeTempC > 180 ? '#ef4444' : telem.brakeTempC > 120 ? '#f59e0b' : 'var(--tx)'}; font-family:monospace; margin-top:2px;">
              ${telem.brakeTempC}°C <span style="font-size:9px; color:var(--mu);">${telem.retarderActive ? 'RETARDER' : 'NORMAL'}</span>
            </div>
          </div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:8px 10px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">OIL MANIFOLD PRESSURE</div>
            <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${telem.oilPressureBar} <span style="font-size:9px; color:var(--mu);">bar</span>
            </div>
          </div>
        </div>

        <!-- Active Transit Consignment Details -->
        ${a ? `
          <div style="background:#09101d; border:1px solid #1e293b; border-radius:8px; padding:10px 12px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase;">DISPATCH CONSIGNMENT: ${a.cargo}</span>
              <span style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace;">ETA: ${dur(telem.remainingMs)}</span>
            </div>
            <div style="font-size:11px; color:var(--tx); font-weight:700;">
              Route: ${a.from} → ${a.to} (${a.km} km) · Gross Payload: ${a.weight || 18} tonnes · Phase: <b style="color:#38bdf8;">${telem.phase}</b>
            </div>
            <div style="margin-top:6px; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${telem.pctCompleted}%; height:100%; background:var(--gold); border-radius:3px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:8px; color:var(--mu); font-family:monospace; margin-top:4px;">
              <span>DEPARTED: ${a.from}</span>
              <span>PROGRESS: ${telem.pctCompleted}% (${telem.distanceRemainingKm} km to go)</span>
              <span>DESTINATION: ${a.to}</span>
            </div>
          </div>
        ` : t.status === 'delivering' ? `
          <div style="background:#09101d; border:1px solid var(--gold); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase;">LOGISTICS DELIVERY MANIFEST</span>
              <span style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace;">ETA: ${dur(telem.remainingMs)}</span>
            </div>
            <div style="font-size:11px; color:var(--tx); font-weight:700;">
              Repositioning: FACTORY → ${t.loc} · Mode: <b style="color:#38bdf8;">${telem.phase}</b>
            </div>
            <div style="margin-top:6px; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${100 - (telem.remainingMs / (15 * 60 * 1000) * 100)}%; height:100%; background:var(--gold); border-radius:3px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:8px; color:var(--mu); font-family:monospace; margin-top:4px;">
              <span>SHIPPING POINT: FACTORY</span>
              <span>IN TRANSIT</span>
              <span>DESTINATION: ${t.loc} TERMINAL</span>
            </div>
          </div>
        ` : `
          <div style="background:#09101d; border:1px dashed #1e293b; border-radius:8px; padding:14px; text-align:center; color:var(--mu); font-size:11px; margin-bottom:12px;">
            Tractor is currently idle in <b>${t.loc}</b>. Air brakes set; pneumatic systems staged. Dispatch on a freight consignment to stream live telemetry.
          </div>
        `}

        <button class="btn alt" style="width:100%; padding:10px; font-weight:800; font-size:11px;" data-act="close-telematics">
          CLOSE TELEMATICS CONSOLE
        </button>
      </div>
    </div>
  `;
}
