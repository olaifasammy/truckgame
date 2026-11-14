import { ic } from '../core/icons';
import { action, fmt, dur } from '../core/ui';
import { refresh, get as getState } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { getTruckTelematics } from '../domain/trucks/trucks.telematics';

action('set-truck-cruise-speed', d => {
  const truckId = +(d as any).truckId;
  const speed = +(d as any).speed;
  const S = getState();
  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (truck) {
    truck.targetSpeed = speed;
    const activeJob = (S.active || []).find((a: any) => a.truck === truckId);
    if (activeJob) {
      activeJob.targetSpeed = speed;
    }
    refresh();
  }
});

action('adjust-truck-cruise-speed', d => {
  const truckId = +(d as any).truckId;
  const delta = +(d as any).delta;
  const S = getState();
  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (truck) {
    const model = TRUCK_MODELS.find(m => m.id === truck.modelId);
    const maxSpeed = model ? model.topSpeed : 120;
    const currentTarget = truck.targetSpeed || 85;
    const newSpeed = Math.max(30, Math.min(maxSpeed, currentTarget + delta));
    truck.targetSpeed = newSpeed;
    const activeJob = (S.active || []).find((a: any) => a.truck === truckId);
    if (activeJob) {
      activeJob.targetSpeed = newSpeed;
    }
    refresh();
  }
});

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
    }
  }, 1000);
}

export function closeTelematicsModal() {
  activeTelematicsTruckId = null;
  if (telematicsInterval) {
    clearInterval(telematicsInterval);
    telematicsInterval = null;
  }
  refresh();
}

action('close-telematics-modal', () => {
  closeTelematicsModal();
});

export function renderTelematicsOverlay(S: any): string {
  if (activeTelematicsTruckId === null || !S) return '';

  const t = (S.fleet || []).find((x: any) => x.id === activeTelematicsTruckId);
  const a = (S.active || []).find((act: any) => act.truck === activeTelematicsTruckId);
  if (!t) return '';
  const truck = t;

  const model = TRUCK_MODELS.find(m => m.id === truck.modelId);
  const driver = (S.drivers || []).find((d: any) => d.assignedTruckId === truck.id);
  const now = Date.now();
  const telem = getTruckTelematics(truck, a, driver, now);

  const topSpeed = model ? model.topSpeed : 120;
  const currentTargetSpeed = truck.targetSpeed || 85;
  const currentSpeed = telem.speedKmh || 0;
  const currentRpm = telem.rpm || 650;
  const gearText = telem.gear || 'N';

  // RPM calculation for circular/bar gauge
  const rpmPct = Math.min(100, Math.max(0, ((currentRpm - 500) / 2000) * 100));
  const speedPct = Math.min(100, Math.max(0, (currentSpeed / topSpeed) * 100));

  // Telltale indicators
  const ccActive = currentSpeed > 0 && Math.abs(currentSpeed - currentTargetSpeed) <= 5;
  const retActive = telem.state === 'braking' || currentSpeed > currentTargetSpeed;
  const loadActive = telem.state === 'loading' || telem.state === 'unloading';

  return `
    <div class="modal-overlay" style="background: rgba(4, 7, 15, 0.88); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;">
      <style>
        .telem-dashboard {
          background: linear-gradient(180deg, #0b1322 0%, #060a12 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(14, 165, 233, 0.15);
          border-radius: 16px;
          width: 100%;
          max-width: 920px;
          max-height: 92vh;
          overflow-y: auto;
          color: #f1f5f9;
          font-family: 'JetBrains Mono', 'Segoe UI', system-ui, sans-serif;
        }

        /* Cluster Cockpit Styling */
        .cluster-panel {
          background: #040811;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
        }

        .telltale-strip {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 8px 12px;
          background: #020408;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 14px;
        }

        .telltale-icon {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          letter-spacing: 0.5px;
        }

        .telltale-icon.active-green {
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .telltale-icon.active-amber {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
        }

        .telltale-icon.active-blue {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
        }

        /* Speedometer & Tachometer Visual Gauges */
        .gauge-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 16px;
          align-items: center;
        }

        @media (max-width: 640px) {
          .gauge-grid {
            grid-template-columns: 1fr;
          }
        }

        .digital-speedo {
          text-align: center;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, rgba(2, 6, 12, 0.6) 80%);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 12px;
          padding: 16px 8px;
        }

        .speed-val {
          font-size: 52px;
          font-weight: 900;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
        }

        .gauge-bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .gauge-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        /* Cruise Control Console */
        .cc-console {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 12px;
          padding: 16px;
        }

        .cc-btn {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .cc-btn:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          color: #ffffff;
        }

        .cc-btn.active {
          background: #0284c7;
          border-color: #38bdf8;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }

        .cc-btn-delta {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-weight: 800;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cc-btn-delta:hover {
          background: #38bdf8;
          color: #020617;
        }
      </style>

      <div class="telem-dashboard">
        <!-- Header -->
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #38bdf8;">
              🚚
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 800; font-size: 16px; color: #ffffff;">${truck.name || model?.name || 'Heavy Duty Unit'}</span>
                <span style="font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #94a3b8;">#${truck.id}</span>
                <span style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 12px;">${truck.plate || 'DOT-REG'}</span>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Driver: <strong style="color: #cbd5e1;">${driver ? driver.name : 'Unassigned (Auto-Pilot)'}</strong> · ${model?.brand || 'NexHaul'} ${model?.name || ''}
              </div>
            </div>
          </div>
          <button data-act="close-telematics-modal" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseenter="this.style.color='#fff'; this.style.background='rgba(239, 68, 68, 0.2)'" onmouseleave="this.style.color='#94a3b8'; this.style.background='rgba(255,255,255,0.05)'">
            ✕
          </button>
        </div>

        <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px;">

          <!-- Top Section: REAL TRUCK DIGITAL DASHBOARD INSTRUMENT CLUSTER -->
          <div class="cluster-panel">
            <!-- Telltale Indicator Strip -->
            <div class="telltale-strip">
              <span class="telltale-icon ${ccActive ? 'active-green' : ''}">
                <span style="font-size: 12px;">⏲</span> CC ${ccActive ? 'SET' : 'OFF'}
              </span>
              <span class="telltale-icon ${retActive ? 'active-amber' : ''}">
                <span style="font-size: 12px;">⚡</span> RETARDER
              </span>
              <span class="telltale-icon ${loadActive ? 'active-blue' : ''}">
                <span style="font-size: 12px;">📦</span> DOCK BAY
              </span>
              <span class="telltale-icon active-green">
                <span style="font-size: 12px;">🛡</span> AIR BRAKE OK
              </span>
              <span class="telltale-icon active-green">
                <span style="font-size: 12px;">🔧</span> ENGINE OK
              </span>
            </div>

            <!-- Digital Cluster Main Visual Gauges -->
            <div class="gauge-grid">
              <!-- Left: Tachometer (RPM) & Transmission -->
              <div style="background: rgba(2, 6, 12, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; text-align: center;">
                <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 1px;">TACHOMETER · RPM</div>
                <div style="font-size: 32px; font-weight: 800; color: ${currentRpm > 1800 ? '#ef4444' : currentRpm > 1400 ? '#f59e0b' : '#10b981'}; font-family: monospace; margin: 4px 0;">
                  ${currentRpm}
                </div>
                <div class="gauge-bar-track">
                  <div class="gauge-bar-fill" style="width: ${rpmPct}%; background: linear-gradient(90deg, #10b981 0%, #f59e0b 75%, #ef4444 100%);"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;">
                  <span>GEAR: <strong style="color: #38bdf8; font-family: monospace;">${gearText}</strong></span>
                  <span>PWR BAND: <strong style="color: #10b981;">1100-1500</strong></span>
                </div>
              </div>

              <!-- Center: Digital Speedometer & Limit -->
              <div class="digital-speedo">
                <div style="font-size: 10px; font-weight: 800; color: #38bdf8; letter-spacing: 1.5px;">LIVE GROUND SPEED</div>
                <div style="display: flex; align-items: baseline; justify-content: center; gap: 6px; margin: 4px 0;">
                  <span class="speed-val">${currentSpeed}</span>
                  <span style="font-size: 14px; color: #94a3b8; font-weight: 700;">KM/H</span>
                </div>
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); margin-top: 2px;">
                  <span style="width: 18px; height: 18px; border-radius: 50%; background: #dc2626; border: 2px solid #ffffff; color: #ffffff; font-size: 8px; font-weight: 900; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">90</span>
                  <span style="font-size: 10px; color: #cbd5e1; font-weight: 700;">HWY LIMIT</span>
                </div>
                <div class="gauge-bar-track" style="margin-top: 12px;">
                  <div class="gauge-bar-fill" style="width: ${speedPct}%; background: linear-gradient(90deg, #38bdf8, #0284c7);"></div>
                </div>
              </div>

              <!-- Right: Fuel, AdBlue & Thermal Engine Temp -->
              <div style="background: rgba(2, 6, 12, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; text-align: center;">
                <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 1px;">DIESEL & THERMALS</div>
                <div style="display: flex; justify-content: space-around; margin: 10px 0;">
                  <div>
                    <div style="font-size: 9px; color: #64748b; font-weight: 700;">FUEL TANK</div>
                    <div style="font-size: 16px; font-weight: 800; color: #10b981;">${truck.fuelPct ?? 92}%</div>
                  </div>
                  <div style="width: 1px; background: rgba(255,255,255,0.08);"></div>
                  <div>
                    <div style="font-size: 9px; color: #64748b; font-weight: 700;">DEF / ADBLUE</div>
                    <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">88%</div>
                  </div>
                  <div style="width: 1px; background: rgba(255,255,255,0.08);"></div>
                  <div>
                    <div style="font-size: 9px; color: #64748b; font-weight: 700;">COOLANT</div>
                    <div style="font-size: 16px; font-weight: 800; color: ${telem.engineTempC > 95 ? '#ef4444' : '#f59e0b'};">${telem.engineTempC}°C</div>
                  </div>
                </div>
                <div class="gauge-bar-track">
                  <div class="gauge-bar-fill" style="width: ${truck.fuelPct ?? 92}%; background: #10b981;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: REDESIGNED INTEL-CRUISE CONTROL & SPEED TARGET MODULE -->
          <div class="cc-console">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px; color: #38bdf8;">⚙️</span>
                <div>
                  <div style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">INTEL-CRUISE CONTROL SYSTEM</div>
                  <div style="font-size: 10px; color: #64748b;">Dynamic speed governor & automatic terrain throttle management</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; background: rgba(2, 6, 12, 0.8); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2);">
                <span style="font-size: 10px; font-weight: 800; color: #64748b;">CRUISE TARGET:</span>
                <span style="font-size: 20px; font-weight: 900; color: #38bdf8; font-family: monospace;">${currentTargetSpeed} <span style="font-size: 11px; color: #94a3b8;">KM/H</span></span>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(2, 6, 12, 0.4); padding: 12px; border-radius: 8px;">
              <!-- Fine Adjustment Buttons -->
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; margin-right: 4px;">FINE ADJ:</span>
                <button class="cc-btn-delta" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="-5">-5</button>
                <button class="cc-btn-delta" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="-1">-1</button>
                <button class="cc-btn-delta" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="1">+1</button>
                <button class="cc-btn-delta" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="5">+5</button>
              </div>

              <!-- Quick Presets -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; margin-right: 4px;">PRESETS:</span>
                ${[60, 75, 85, 95, 105, topSpeed].map(s => `
                  <button class="cc-btn ${currentTargetSpeed === s ? 'active' : ''}"
                          data-act="set-truck-cruise-speed" data-truck-id="${truck.id}" data-speed="${s}">
                    ${s === topSpeed ? `MAX (${s})` : `${s} KM/H`}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Section 3: MECHANICAL DIAGNOSTICS GRID -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">TURBO BOOST</div>
              <div style="font-size: 15px; font-weight: 800; color: #38bdf8; font-family: monospace; margin-top: 2px;">${telem.turboBoostBar} BAR</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">BRAKE TEMP</div>
              <div style="font-size: 15px; font-weight: 800; color: ${telem.brakeTempC > 150 ? '#ef4444' : '#cbd5e1'}; font-family: monospace; margin-top: 2px;">${telem.brakeTempC}°C</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">INST. BURN</div>
              <div style="font-size: 15px; font-weight: 800; color: #10b981; font-family: monospace; margin-top: 2px;">${telem.instantL100km} L/100</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">AVG BURN</div>
              <div style="font-size: 15px; font-weight: 800; color: #cbd5e1; font-family: monospace; margin-top: 2px;">${telem.avgL100km} L/100</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">GRADIENT</div>
              <div style="font-size: 15px; font-weight: 800; color: ${telem.gradientPct > 3 ? '#f59e0b' : '#cbd5e1'}; font-family: monospace; margin-top: 2px;">${telem.gradientPct > 0 ? '+' : ''}${telem.gradientPct}%</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">ROAD SURFACE</div>
              <div style="font-size: 11px; font-weight: 800; color: #38bdf8; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${telem.roadSurface || 'Dry Asphalt'}</div>
            </div>
          </div>

          <!-- Section 4: CONSIGNMENT TELEMATICS & LIVE ROUTE PROGRESS -->
          ${a ? `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">ACTIVE CONSIGNMENT MANIFEST</div>
                  <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 2px;">${a.title || a.cargo || 'Freight Load'}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 10px; color: #64748b; font-weight: 700;">ESTIMATED TIME EN ROUTE</div>
                  <div style="font-size: 18px; font-weight: 900; color: #10b981; font-family: monospace;">${dur(telem.remainingMs)}</div>
                </div>
              </div>

              <!-- Route Origin / Destination Bar -->
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 800; color: #cbd5e1; margin-bottom: 8px;">
                <span>🛫 ${a.from}</span>
                <span style="color: #38bdf8; font-size: 11px;">${telem.distanceRemainingKm} KM REMAINING</span>
                <span>🏁 ${a.to}</span>
              </div>

              <!-- Visual Route Progress Bar -->
              <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); position: relative;">
                <div style="width: ${telem.pctCompleted}%; height: 100%; background: linear-gradient(90deg, #38bdf8 0%, #0284c7 100%); transition: width 0.3s ease;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #64748b;">
                <span>Phase: <strong style="color: ${telem.stateBadgeColor || '#38bdf8'};">${telem.stateLabel}</strong></span>
                <span>Completed: <strong style="color: #ffffff;">${telem.pctCompleted}%</strong></span>
              </div>
            </div>
          ` : `
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; color: #64748b;">
              <span style="font-size: 24px; display: block; margin-bottom: 6px;">🅿️</span>
              <strong style="color: #cbd5e1; font-size: 13px;">Truck Staged at Depot / Idle</strong>
              <div style="font-size: 11px; margin-top: 2px;">Assign a freight contract from the Dispatch board to initiate telemetry tracking.</div>
            </div>
          `}

        </div>
      </div>
    </div>
  `;
}
