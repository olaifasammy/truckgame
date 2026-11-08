import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { PART_LABELS } from '../systems/calc';
import { LOCATIONS } from '../data/world';
import { renderDiagnosticTable } from './repair/diagnostic-table';
import { VehicleMaintenance } from '../domain/trucks/maintenance';
import { calculateRepairDurationMs, getPartEffectiveCost, startRepair } from '../systems/maintenance';
import { FleetService } from '../application/services/fleet';
import { GameState } from '../types/state';
import { Truck } from '../domain/trucks/trucks.types';

let selectedPartsSet = new Set<string>();
let workshopTab: 'scan' | 'bay' | 'queue' = 'scan';
let lastScanTimestamp: number = Date.now();
let isScanningAnimation: boolean = false;

action('back-to-garage', () => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.tab = 'garage';
    refresh();
  }
});

action('set-workshop-mode', d => {
  workshopTab = (d as any).tab as ('scan' | 'bay' | 'queue');
  const S = (window as any).__getStore?.();
  if (S) S.workshopTab = workshopTab;
  refresh();
});

action('hoist-truck-to-bay', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const id = +(d as any).id;
  S.repairTruckId = id;
  workshopTab = 'bay';
  S.workshopTab = 'bay';
  selectedPartsSet.clear();
  
  // Auto-select components that need repair for convenience
  const truck = S.fleet?.find((t: any) => t.id === id);
  if (truck) {
    Object.entries(truck.components || {}).forEach(([p, comp]: [string, any]) => {
      const h = typeof comp === 'number' ? comp : comp?.health ?? 100;
      if (h < 90) selectedPartsSet.add(p);
    });
    if ((truck.fluids?.oil || 40) < 25) selectedPartsSet.add('oil');
    if ((truck.fluids?.coolant || 100) < 60) selectedPartsSet.add('coolant');
    if ((truck.fluids?.adBlue || 100) < 50) selectedPartsSet.add('adBlue');
  }
  refresh();
});

action('run-fleet-scan', () => {
  isScanningAnimation = true;
  refresh();
  setTimeout(() => {
    isScanningAnimation = false;
    lastScanTimestamp = Date.now();
    toast('Fleet OBD-II Diagnostic Scan Completed: All ECU telemetry synchronized!', 'success');
    refresh();
  }, 600);
});

action('toggle-repair-part', d => {
  const part = (d as any).part;
  if (selectedPartsSet.has(part)) {
    selectedPartsSet.delete(part);
  } else {
    selectedPartsSet.add(part);
  }
  refresh();
});

action('select-all-parts', () => {
  const S = (window as any).__getStore?.();
  const truck = S?.fleet?.find((t: any) => t.id === S.repairTruckId);
  if (!truck) return;
  selectedPartsSet.clear();
  Object.keys(truck.components).forEach(p => selectedPartsSet.add(p));
  ['oil', 'coolant', 'adBlue'].forEach(p => selectedPartsSet.add(p));
  refresh();
});

action('select-worn-parts', () => {
  const S = (window as any).__getStore?.();
  const truck = S?.fleet?.find((t: any) => t.id === S.repairTruckId);
  if (!truck) return;
  selectedPartsSet.clear();
  Object.entries(truck.components).forEach(([k, comp]: [string, any]) => {
    const health = typeof comp === 'number' ? comp : comp?.health ?? 100;
    if (health < 95) selectedPartsSet.add(k);
  });
  if ((truck.fluids?.oil || 40) < 30) selectedPartsSet.add('oil');
  if ((truck.fluids?.coolant || 100) < 80) selectedPartsSet.add('coolant');
  if ((truck.fluids?.adBlue || 100) < 70) selectedPartsSet.add('adBlue');
  refresh();
});

action('clear-repair-parts', () => {
  selectedPartsSet.clear();
  refresh();
});

action('submit-repair', () => {
  const S = (window as any).__getStore?.();
  if (!S || !S.repairTruckId) return;
  const parts = Array.from(selectedPartsSet) as string[];
  const success = startRepair(S, S.repairTruckId, parts);
  if (success) {
    selectedPartsSet.clear();
    workshopTab = 'queue';
    S.workshopTab = 'queue';
    refresh();
  }
});

function calculateTruckHealth(truck: any) {
  const healthValues = Object.values(truck.components || {}).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
  const avgHealth = healthValues.length > 0 ? Math.round(healthValues.reduce((a: number, b: number) => a + b, 0) / healthValues.length) : 100;
  const minHealth = healthValues.length > 0 ? Math.min(...healthValues) : 100;
  const lowFluids = (truck.fluids?.coolant || 100) < 40 || (truck.fluids?.oil || 40) < 15 || (truck.fluids?.adBlue || 100) < 25;
  
  let statusTier: 'critical' | 'warning' | 'optimal' = 'optimal';
  if (avgHealth < 50 || minHealth < 35 || (truck.fluids?.coolant || 100) < 20) {
    statusTier = 'critical';
  } else if (avgHealth < 80 || minHealth < 60 || lowFluids) {
    statusTier = 'warning';
  }
  return { avgHealth, minHealth, lowFluids, statusTier };
}

export default {
  id: 'repair',
  icon: 'wrench',
  hidden: true,
  render(S: any) {
    const fleet = S.fleet || [];
    if (S.workshopTab) {
      workshopTab = S.workshopTab;
    }

    // Default to scan mode if no truck selected
    if (!S.repairTruckId && fleet.length > 0) {
      if (workshopTab === 'bay') {
        S.repairTruckId = fleet[0].id;
      }
    }

    const truck = fleet.find((t: any) => t.id === S.repairTruckId) || fleet[0];
    const model = truck ? TRUCK_MODELS[truck.modelId] : null;
    const repairsQueue = S.repairs || [];
    const now = Date.now();

    // Fleet Diagnostic Statistics across all units
    let criticalCount = 0;
    let warningCount = 0;
    let optimalCount = 0;

    fleet.forEach((t: any) => {
      const { statusTier } = calculateTruckHealth(t);
      if (statusTier === 'critical') criticalCount++;
      else if (statusTier === 'warning') warningCount++;
      else optimalCount++;
    });

    // Calculate total cost and duration for selected parts on the active bay truck
    let totalCost = 0;
    let totalSavings = 0;
    const selectedPartsList = Array.from(selectedPartsSet) as string[];
    if (truck && workshopTab === 'bay') {
      selectedPartsList.forEach(part => {
        const eff = getPartEffectiveCost(S, truck, part);
        totalCost += eff.cost;
        totalSavings += Math.max(0, eff.retailCost - eff.cost);
      });
    }
    const durationMs = truck ? calculateRepairDurationMs(truck, selectedPartsList) : 0;

    return `
      <div class="view" style="padding-bottom:100px;">
        <!-- Top Back Navigation & Facility Banner -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <button class="btn alt" style="padding:6px 12px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:6px;" data-act="back-to-garage">
            ← BACK TO FLEET DEPOT
          </button>
          <span style="font-size:10px; color:var(--mu); font-family:monospace;">
            CERTIFIED SAE J1939 WORKSHOP
          </span>
        </div>

        <!-- Heavy Fleet Mechanic Workshop Command Header -->
        <div class="header-banner" style="background:#0e1320; border:1px solid #1f293d; border-radius:12px; padding:14px; margin-bottom:14px; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:36px; height:36px; background:var(--gold); color:#0a0f1d; border-radius:8px; display:grid; place-items:center; font-size:20px; font-weight:900;">
                ${ic('wrench')}
              </div>
              <div>
                <div style="font-size:9px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase; font-family:monospace;">COMMERCIAL FLEET SERVICE</div>
                <h2 style="margin:0; font-size:17px; font-weight:900; color:var(--tx);">Heavy Vehicle Mechanic Workshop</h2>
              </div>
            </div>
            <button class="btn gold" style="padding:6px 12px; font-size:10px; font-weight:900; display:flex; align-items:center; gap:6px;" data-act="run-fleet-scan" ${isScanningAnimation ? 'disabled' : ''}>
              <span>⚡</span> ${isScanningAnimation ? 'SCANNING FLEET...' : 'RUN OBD-II SCAN'}
            </button>
          </div>

          <!-- Diagnostic Health Tiles -->
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
            <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
              <div style="font-size:7px; font-weight:800; color:var(--mu); text-transform:uppercase;">UNITS INSPECTED</div>
              <div style="font-size:13px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
                ${fleet.length} <span style="font-size:8px; color:var(--mu);">Rigs</span>
              </div>
            </div>
            <div style="background:#080c16; border:1px solid ${criticalCount > 0 ? 'rgba(239,68,68,0.5)' : '#1a2336'}; border-radius:8px; padding:8px 6px; text-align:center;">
              <div style="font-size:7px; font-weight:800; color:${criticalCount > 0 ? '#ef4444' : 'var(--mu)'}; text-transform:uppercase;">CRITICAL FAULTS</div>
              <div style="font-size:13px; font-weight:900; color:${criticalCount > 0 ? '#ef4444' : 'var(--tx)'}; font-family:monospace; margin-top:2px;">
                ${criticalCount} <span style="font-size:8px; color:var(--mu);">&lt; 50%</span>
              </div>
            </div>
            <div style="background:#080c16; border:1px solid ${warningCount > 0 ? 'rgba(193,154,91,0.5)' : '#1a2336'}; border-radius:8px; padding:8px 6px; text-align:center;">
              <div style="font-size:7px; font-weight:800; color:${warningCount > 0 ? 'var(--gold)' : 'var(--mu)'}; text-transform:uppercase;">SERVICE DUE</div>
              <div style="font-size:13px; font-weight:900; color:${warningCount > 0 ? 'var(--gold)' : 'var(--tx)'}; font-family:monospace; margin-top:2px;">
                ${warningCount} <span style="font-size:8px; color:var(--mu);">Wear</span>
              </div>
            </div>
            <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:8px 6px; text-align:center;">
              <div style="font-size:7px; font-weight:800; color:var(--grn); text-transform:uppercase;">ROAD READY</div>
              <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:2px;">
                ${optimalCount} <span style="font-size:8px; color:var(--mu);">Mint</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Workshop Navigation Tabs -->
        <div style="display:flex; gap:6px; margin-bottom:14px;">
          <button class="btn ${workshopTab === 'scan' ? 'gold' : 'alt'}" style="flex:1; padding:8px; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:6px;" data-act="set-workshop-mode" data-tab="scan">
            <span>🔍</span> FLEET DIAGNOSTIC SCAN
          </button>
          <button class="btn ${workshopTab === 'bay' ? 'gold' : 'alt'}" style="flex:1; padding:8px; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:6px;" data-act="set-workshop-mode" data-tab="bay">
            <span>🔧</span> HYDRAULIC LIFT BAY ${truck ? `(#${truck.id})` : ''}
          </button>
          <button class="btn ${workshopTab === 'queue' ? 'gold' : 'alt'}" style="padding:8px 12px; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:6px;" data-act="set-workshop-mode" data-tab="queue">
            <span>⏱️</span> ACTIVE QUEUE (${repairsQueue.length})
          </button>
        </div>

        <!-- TAB 1: FLEET DIAGNOSTIC SCAN VIEW -->
        ${workshopTab === 'scan' ? `
          ${renderDiagnosticTable(S, repairsQueue, lastScanTimestamp)}
        ` : workshopTab === 'bay' ? `
          <!-- TAB 2: ACTIVE HYDRAULIC LIFT & REPAIR BAY -->
          ${!truck ? `
            <div class="card" style="padding:28px; text-align:center; color:var(--mu); background:#0b1120; border-radius:10px;">
              No vehicle currently placed on hydraulic hoist lift. Select a truck from the Fleet Diagnostic Scan.
            </div>
          ` : `
            <!-- Hoist Bay Switcher Bar -->
            <div style="background:#0e1320; border:1px solid #1f293d; border-radius:8px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase;">BAY #1 HYDRAULIC HOIST:</span>
                <span style="font-size:12px; font-weight:900; color:var(--tx);">${truck.name}</span>
              </div>
              <div style="display:flex; gap:4px; align-items:center;">
                <span style="font-size:9px; color:var(--mu); font-family:monospace; margin-right:4px;">SWITCH UNIT:</span>
                ${fleet.map((flt: any) => `
                  <button class="btn ${flt.id === truck.id ? 'gold' : 'alt'}" style="padding:2px 8px; font-size:8px; font-weight:800;" data-act="hoist-truck-to-bay" data-id="${flt.id}">
                    #${flt.id}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Truck In Bay Overview Card -->
            <div class="card" style="margin-bottom:16px; border-color:var(--gold); background:var(--s1);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:var(--tx);">${truck.name}</h3>
                  <div style="font-size:11px; color:var(--gold); font-weight:700; margin-top:2px;">
                    ${model?.brand} ${model?.name} · Odometer: <span data-truck-odo="${truck.id}">${Math.round(truck.odometer).toLocaleString()} km</span> · Base: ${truck.loc}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px; font-weight:900; color:${truck.status === 'repair' ? '#ef4444' : 'var(--grn)'}; text-transform:uppercase;">
                    Status: ${truck.status}
                  </div>
                </div>
              </div>

              ${truck.status === 'repair' ? `
                <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:8px; padding:12px; text-align:center; color:#ef4444; font-weight:700; font-size:12px; margin-bottom:12px;">
                  🛠️ This truck is currently undergoing maintenance on the Hydraulic Lift and is unavailable for dispatch until service completes.
                </div>
              ` : repairsQueue.some((r: any) => r.truckId === truck.id && r.scheduled) ? `
                <div style="background:rgba(56,189,248,0.1); border:1px solid #38bdf8; border-radius:8px; padding:12px; text-align:center; color:#38bdf8; font-weight:700; font-size:12px; margin-bottom:12px;">
                  🕒 SERVICE PRE-PAID & SCHEDULED: This truck is queued. It will automatically be hoisted into the bay the moment it completes its current transit.
                </div>
              ` : truck.status === 'busy' ? `
                <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; border-radius:8px; padding:10px 14px; text-align:left; color:#f59e0b; font-weight:600; font-size:11px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                  <span style="font-size:18px;">🛣️</span>
                  <div>
                    <b style="color:var(--tx);">VEHICLE CURRENTLY EN-ROUTE ON HIGHWAY:</b> Select wear parts below to <b>Pre-Pay & Reserve</b> maintenance. The service bay crew will hoist the rig immediately upon return.
                  </div>
                </div>
              ` : ''}
              ${truck.status === 'repair' || repairsQueue.some((r: any) => r.truckId === truck.id && r.scheduled) ? '' : `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <div style="font-size:11px; font-weight:700; color:var(--mu);">Select components to service / repair:</div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn gold" style="font-size:9px; padding:4px 8px;" data-act="select-worn-parts">Select Worn Only</button>
                    <button class="btn alt" style="font-size:9px; padding:4px 8px;" data-act="select-all-parts">Select All</button>
                    <button class="btn alt" style="font-size:9px; padding:4px 8px;" data-act="clear-repair-parts">Clear</button>
                  </div>
                </div>

                <!-- Component Checklist Grid -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;">
                  ${Object.entries(truck.components).map(([key, comp]: [string, any]) => {
                    const health = Math.round(typeof comp === 'number' ? comp : comp?.health ?? 100);
                    const isSelected = selectedPartsSet.has(key);
                    const isMint = health >= 100;
                    const eff = getPartEffectiveCost(S, truck, key);
                    const stock = (S.partsInventory && S.partsInventory[key]) || 0;
                    
                    return `
                      <div class="card" style="padding:10px; border:1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}; background:${isSelected ? 'rgba(193,154,91,0.08)' : 'var(--bg)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="toggle-repair-part" data-part="${key}">
                        <div>
                          <div style="font-size:11px; font-weight:800; color:var(--tx);">${PART_LABELS[key] || key}</div>
                          <div style="font-size:10px; color:${health < 50 ? '#ef4444' : health < 75 ? 'var(--gold)' : 'var(--grn)'}; font-weight:700;">Health: ${health}%</div>
                          ${stock > 0 ? `<div style="font-size:8px; color:var(--grn); font-family:monospace; margin-top:2px;">📦 In Stock: ${stock}</div>` : ''}
                        </div>
                        <div style="text-align:right;">
                          <div style="font-size:11px; font-weight:900; color:${isMint ? 'var(--grn)' : eff.fromInventory ? 'var(--grn)' : 'var(--gold)'};">
                            ${isMint ? 'MINT' : eff.fromInventory ? '$' + eff.cost + ' (Stock)' : '$' + eff.cost.toLocaleString()}
                          </div>
                          <div style="font-size:9px; color:var(--accent); font-weight:700; margin-top:2px;">${isSelected ? '☑ SELECTED' : '☐ Select'}</div>
                        </div>
                      </div>
                    `;
                  }).join('')}

                  <!-- Fluid Consumables Checklist -->
                  ${[
                    { key: 'oil', label: 'Engine Oil Flush & Refill', val: Math.round((truck.fluids.oil / (model?.oilCapacity || 40)) * 100) },
                    { key: 'coolant', label: 'Heavy Duty Coolant Flush', val: Math.round(truck.fluids.coolant) },
                    { key: 'adBlue', label: 'DEF / AdBlue Top-Up', val: Math.round(truck.fluids.adBlue) }
                  ].map(fluid => {
                    const isSelected = selectedPartsSet.has(fluid.key);
                    const isFull = fluid.val >= 99;
                    const eff = getPartEffectiveCost(S, truck, fluid.key);
                    const stock = (S.partsInventory && S.partsInventory[fluid.key]) || 0;

                    return `
                      <div class="card" style="padding:10px; border:1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}; background:${isSelected ? 'rgba(193,154,91,0.08)' : 'var(--bg)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="toggle-repair-part" data-part="${fluid.key}">
                        <div>
                          <div style="font-size:11px; font-weight:800; color:var(--tx);">${fluid.label}</div>
                          <div style="font-size:10px; color:${fluid.val < 30 ? '#ef4444' : 'var(--grn)'}; font-weight:700;">Level: ${fluid.val}%</div>
                          ${stock > 0 ? `<div style="font-size:8px; color:var(--grn); font-family:monospace; margin-top:2px;">📦 In Stock: ${stock}</div>` : ''}
                        </div>
                        <div style="text-align:right;">
                          <div style="font-size:11px; font-weight:900; color:${isFull ? 'var(--grn)' : eff.fromInventory ? 'var(--grn)' : 'var(--gold)'};">
                            ${isFull ? 'FULL' : eff.fromInventory ? '$' + eff.cost + ' (Stock)' : '$' + eff.cost}
                          </div>
                          <div style="font-size:9px; color:var(--accent); font-weight:700; margin-top:2px;">${isSelected ? '☑ SELECTED' : '☐ Select'}</div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                ${(() => {
                  const isEnRoute = truck.status === 'busy';
                  const isRepairing = truck.status === 'repair';
                  
                  return `
                    <div style="background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-size:10px; color:var(--mu); text-transform:uppercase;">${isEnRoute ? 'Scheduled' : 'Estimated'} Service Payout</div>
                        <div style="font-size:20px; font-weight:900; color:var(--gold);">$${totalCost.toLocaleString()}</div>
                        ${totalSavings > 0 ? `<div style="font-size:9px; color:var(--grn); font-weight:800;">✓ Saved $${totalSavings.toLocaleString()} using HQ Warehouse inventory stock!</div>` : ''}
                        <div style="font-size:10px; color:var(--accent); font-weight:700; margin-top:2px;">⏱️ Duration: ${Math.round(durationMs / 1000)}s on Hydraulic Lift</div>
                        ${isEnRoute ? `<div style="font-size:10px; color:var(--blu); font-weight:700; margin-top:2px;">🕒 Unit is En-Route. Service will start upon arrival.</div>` : ''}
                      </div>
                      <button class="btn gold" style="padding:10px 20px; font-size:12px; font-weight:900;" data-act="submit-repair" ${totalCost === 0 && selectedPartsSet.size === 0 || isRepairing ? 'disabled' : ''}>
                        ${isEnRoute ? 'PRE-PAY & SCHEDULE' : 'PAY & LOWER HOIST'}
                      </button>
                    </div>
                  `;
                })()}
              `}
            </div>
          `}
        ` : `
          <!-- TAB 3: ACTIVE REPAIR BAY QUEUE -->
          <div class="card" style="padding:14px; background:var(--s1);">
            <div style="font-size:12px; font-weight:800; color:var(--gold); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
              <span>🛠️ Active Hydraulic Lift Maintenance Queue</span>
              <span style="background:var(--bg); padding:2px 6px; border-radius:4px; font-size:10px; color:var(--mu);">${repairsQueue.length} Trucks</span>
            </div>
            ${repairsQueue.length === 0 ? '<div style="font-size:11px; color:var(--mu); text-align:center; padding:24px;">Repair bay is currently clear. No vehicles on hydraulic hoists.</div>' : 
              repairsQueue.map((rep: any) => {
                const isWaiting = rep.scheduled;
                const timeLeft = Math.max(0, rep.end - now);
                const totalDuration = Math.max(1, rep.end - rep.start);
                const pct = isWaiting ? 0 : Math.min(100, Math.max(0, ((now - rep.start) / totalDuration) * 100));
                
                return `
                  <div style="background:var(--bg); border:1px solid ${isWaiting ? 'var(--blu)' : 'var(--line)'}; border-radius:8px; padding:12px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <div style="font-size:13px; font-weight:800; color:var(--tx);">${rep.truckName}</div>
                      <div style="font-size:11px; font-weight:800; color:${isWaiting ? 'var(--blu)' : 'var(--gold)'};" ${isWaiting ? '' : `data-eta="${rep.end}"`}>
                        ${isWaiting ? '🕒 WAITING FOR ARRIVAL' : `⏱️ ${dur(timeLeft)} remaining`}
                      </div>
                    </div>
                    <div style="font-size:10px; color:var(--mu); margin-bottom:6px;">Services: ${rep.parts.join(', ').toUpperCase()}</div>
                    ${isWaiting ? '' : `<div class="bar" style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:var(--gold); border-radius:3px; transition:width 1s linear;"></div></div>`}
                  </div>
                `;
              }).join('')}
          </div>
        `}
      </div>
    `;
  }
};
