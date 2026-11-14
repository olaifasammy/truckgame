import { ic } from '../core/icons';
import { action, fmt, dur } from '../core/ui';
import { refresh, get as getState } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { getTruckTelematics } from '../domain/trucks/trucks.telematics';

/**
 * Redesigned Telematics Console with High-End Dashboard Aesthetics
 * and High-Resolution "Real Throttle" Refresh Logic.
 */

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
    const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
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

action('open-telematics', d => {
  const truckId = +(d as any).id || +(d as any).truckId || +(d as any).truck;
  if (truckId) {
    openTelematicsModal(truckId);
  }
});

export let activeTelematicsTruckId: number | null = null;
let telematicsInterval: any = null;

export function openTelematicsModal(truckId: number) {
  activeTelematicsTruckId = truckId;
  if (telematicsInterval) clearInterval(telematicsInterval);
  
  // High-Resolution Refresh (100ms) for "Real Throttle" feel
  telematicsInterval = setInterval(() => {
    if (activeTelematicsTruckId !== null) {
      refresh();
    } else {
      clearInterval(telematicsInterval);
    }
  }, 100);
  
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

action('close-telematics-modal', () => {
  closeTelematicsModal();
});

export function renderTelematicsOverlay(S: any): string {
  if (activeTelematicsTruckId === null || !S) return '';

  const truck = (S.fleet || []).find((x: any) => x.id === activeTelematicsTruckId);
  const activeJob = (S.active || []).find((act: any) => act.truck === activeTelematicsTruckId);
  if (!truck) return '';

  const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
  const driver = (S.drivers || []).find((d: any) => d.assignedTruckId === truck.id);
  const now = Date.now();
  const telem = getTruckTelematics(truck, activeJob, driver, now);

  const topSpeed = model ? model.topSpeed : 120;
  const currentTargetSpeed = truck.targetSpeed || 85;
  const currentSpeed = telem.speedKmh || 0;
  const currentRpm = telem.engineRpm || telem.rpm || 650;
  const gearText = telem.currentGear || telem.gear || 'N';

  // Precision formatting for smoother display
  const displaySpeed = currentSpeed.toFixed(0);
  const rpmPct = Math.min(100, Math.max(0, ((currentRpm - 500) / 2000) * 100));
  const speedPct = Math.min(100, Math.max(0, (currentSpeed / topSpeed) * 100));

  // State indicators
  const ccActive = currentSpeed > 0 && Math.abs(currentSpeed - currentTargetSpeed) <= 3;
  const brakingActive = telem.state === 'braking' || telem.retarderActive;
  const loadingActive = telem.state === 'loading' || telem.state === 'unloading' || telem.state === 'refueling';

  return `
    <div class="modal-overlay" style="background: rgba(2, 6, 12, 0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 12px;">
      <style>
        .dash-container {
          width: 100%;
          max-width: 680px;
          background: #0a111a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.1);
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #f1f5f9;
        }

        /* Top Dash Cluster */
        .dash-cluster {
          background: #020617;
          padding: 24px;
          border-bottom: 1px solid #1e293b;
          position: relative;
        }

        .dash-telltales {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .telltale {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.15);
          text-transform: uppercase;
          padding: 4px 10px;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 4px;
          transition: all 0.2s;
        }

        .telltale.active-green { color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
        .telltale.active-blue { color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.1); }
        .telltale.active-amber { color: #f59e0b; border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.1); }

        .cluster-main {
          display: grid;
          grid-template-columns: 1fr 1.4fr 1fr;
          align-items: center;
          gap: 20px;
        }

        .gauge-mini {
          text-align: center;
        }

        .gauge-label {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .gauge-val-mini {
          font-size: 20px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }

        .speedo-center {
          text-align: center;
          padding: 10px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
        }

        .speed-digit {
          font-size: 84px;
          font-weight: 900;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -4px;
          color: #ffffff;
        }

        .speed-unit {
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          margin-top: -5px;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          margin-top: 16px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.1s linear;
        }

        /* Cruise Control Console */
        .cc-panel {
          padding: 24px;
          background: #0a111a;
        }

        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .cc-title {
          font-size: 13px;
          font-weight: 800;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cc-target-box {
          background: #020617;
          border: 1px solid #1e293b;
          padding: 8px 16px;
          border-radius: 10px;
          text-align: center;
        }

        .cc-controls {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: center;
        }

        .cc-btn-group {
          display: flex;
          gap: 8px;
        }

        .cc-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 700;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cc-btn:hover { background: #334155; border-color: #475569; }
        .cc-btn.active { background: #0284c7; border-color: #38bdf8; color: #fff; }

        .cc-adj-btn {
          width: 44px;
          height: 44px;
          background: #1e293b;
          border: 1px solid #334155;
          color: #38bdf8;
          border-radius: 50%;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cc-adj-btn:hover { background: #38bdf8; color: #020617; border-color: #38bdf8; }

        /* Consignment Info */
        .manifest-card {
          margin: 0 24px 24px;
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px;
        }

        .manifest-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .manifest-item span { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
        .manifest-item strong { font-size: 13px; color: #cbd5e1; }
      </style>

      <div class="dash-container">
        <!-- Dashboard Cluster -->
        <div class="dash-cluster">
          <div class="dash-telltales">
            <div class="telltale ${ccActive ? 'active-green' : ''}">CRUISE</div>
            <div class="telltale ${brakingActive ? 'active-amber' : ''}">RETARDER</div>
            <div class="telltale ${loadingActive ? 'active-blue' : ''}">AUX POWER</div>
            <div class="telltale active-green">SYSTEM OK</div>
          </div>

          <div class="cluster-main">
            <!-- RPM Gauge -->
            <div class="gauge-mini">
              <div class="gauge-label">Engine RPM</div>
              <div class="gauge-val-mini" style="color: ${currentRpm > 1800 ? '#ef4444' : '#10b981'}">
                ${Math.round(currentRpm)}
              </div>
              <div class="progress-track" style="width: 80%; margin: 12px auto 0;">
                <div class="progress-fill" style="width: ${rpmPct}%; background: ${currentRpm > 1800 ? '#ef4444' : '#10b981'}"></div>
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 8px; font-weight: 800;">GEAR: ${gearText}</div>
            </div>

            <!-- Speedometer -->
            <div class="speedo-center">
              <div class="speed-digit">${displaySpeed}</div>
              <div class="speed-unit">KM/H</div>
              <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(0,0,0,0.3); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 10px; color: #64748b; font-weight: 700;">LIMIT</span>
                <span style="font-size: 11px; color: #ef4444; font-weight: 900;">90</span>
              </div>
            </div>

            <!-- Fluids Gauge -->
            <div class="gauge-mini">
              <div class="gauge-label">Fuel Level</div>
              <div class="gauge-val-mini" style="color: #38bdf8">
                ${(truck.fuelPct || 100).toFixed(0)}<span style="font-size: 12px;">%</span>
              </div>
              <div class="progress-track" style="width: 80%; margin: 12px auto 0;">
                <div class="progress-fill" style="width: ${truck.fuelPct || 100}%; background: #38bdf8"></div>
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 8px; font-weight: 800;">TEMP: ${telem.coolantTempC || 82}°C</div>
            </div>
          </div>
        </div>

        <!-- Cruise Control Console -->
        <div class="cc-panel">
          <div class="cc-header">
            <div class="cc-title">
              <span style="color: #38bdf8; font-size: 16px;">⏲</span> CRUISE CONTROL SYSTEM
            </div>
            <div class="cc-target-box">
              <div style="font-size: 9px; color: #64748b; font-weight: 800; margin-bottom: 2px;">TARGET SPEED</div>
              <div style="font-size: 18px; font-weight: 900; color: #38bdf8; font-family: 'JetBrains Mono';">${currentTargetSpeed} <small style="font-size: 10px;">KM/H</small></div>
            </div>
          </div>

          <div class="cc-controls">
            <div style="display: flex; gap: 10px;">
              <button class="cc-adj-btn" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="-5">−</button>
              <button class="cc-adj-btn" data-act="adjust-truck-cruise-speed" data-truck-id="${truck.id}" data-delta="5">+</button>
            </div>
            <div class="cc-btn-group">
              ${[60, 80, 90, 100, 110].map(s => `
                <button class="cc-btn ${currentTargetSpeed === s ? 'active' : ''}" 
                        data-act="set-truck-cruise-speed" data-truck-id="${truck.id}" data-speed="${s}">
                  ${s}
                </button>
              `).join('')}
              <button class="cc-btn" style="background: transparent; border-color: rgba(239, 68, 68, 0.3); color: #ef4444;" data-act="close-telematics-modal">EXIT</button>
            </div>
          </div>
        </div>

        <!-- Manifest Section -->
        ${activeJob ? `
          <div class="manifest-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 9px; font-weight: 800; color: #38bdf8; margin-bottom: 4px;">ACTIVE MANIFEST</div>
                <div style="font-size: 15px; font-weight: 800;">${activeJob.title || activeJob.cargo}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 9px; font-weight: 800; color: #64748b; margin-bottom: 4px;">REMAINING</div>
                <div style="font-size: 15px; font-weight: 800; color: #10b981;">${dur(telem.remainingMs)}</div>
              </div>
            </div>
            
            <div style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
                <span>${activeJob.from}</span>
                <span style="color: #64748b;">${telem.distanceRemainingKm.toFixed(0)} KM LEFT</span>
                <span>${activeJob.to}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${telem.pctCompleted}%; background: linear-gradient(90deg, #38bdf8, #0284c7);"></div>
              </div>
            </div>

            <div class="manifest-grid">
              <div class="manifest-item"><span>Payload</span><strong>${activeJob.weight} t</strong></div>
              <div class="manifest-item"><span>Status</span><strong style="color: #38bdf8;">${telem.stateLabel}</strong></div>
              <div class="manifest-item"><span>Weather</span><strong>${activeJob.env?.weather || 'Clear'}</strong></div>
            </div>
          </div>
        ` : `
          <div class="manifest-card" style="text-align: center; padding: 32px; color: #64748b;">
             <div style="font-size: 24px; margin-bottom: 8px;">🅿️</div>
             <div style="font-size: 13px; font-weight: 700; color: #cbd5e1;">Vehicle Staged & Idle</div>
             <div style="font-size: 11px; margin-top: 4px;">Waiting for contract dispatch from terminal.</div>
          </div>
        `}
      </div>
    </div>
  `;
}
