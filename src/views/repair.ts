import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { refresh } from '../core/store';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { PART_LABELS } from '../systems/calc';
import { getPartRepairCost, calculateRepairDurationMs, startRepair, PART_BASE_PRICES } from '../systems/maintenance';

let selectedPartsSet = new Set<string>();

action('back-to-garage', () => {
  const S = (window as any).__getStore?.();
  if (S) {
    S.tab = 'garage';
    refresh();
  }
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
    refresh();
  }
});

export default {
  id: 'repair',
  icon: 'wrench',
  hidden: true,
  render(S: any) {
    const fleet = S.fleet || [];
    if (!S.repairTruckId && fleet.length > 0) {
      S.repairTruckId = fleet[0].id;
    }

    const truck = fleet.find((t: any) => t.id === S.repairTruckId) || fleet[0];
    const model = truck ? TRUCK_MODELS[truck.modelId] : null;
    const repairsQueue = S.repairs || [];
    const now = Date.now();

    // Calculate total cost and duration for selected parts
    let totalCost = 0;
    const selectedPartsList = Array.from(selectedPartsSet) as string[];
    if (truck) {
      selectedPartsList.forEach(part => {
        if (['oil', 'coolant', 'adBlue'].includes(part)) {
          totalCost += PART_BASE_PRICES[part] || 150;
        } else if (truck.components[part]) {
          totalCost += getPartRepairCost(part, truck.components[part].health);
        }
      });
    }
    const durationMs = truck ? calculateRepairDurationMs(truck, selectedPartsList) : 0;

    return `
      <div class="view" style="padding-bottom:100px;">
        <div style="margin-bottom:12px;">
          <button class="btn alt" style="padding:6px 12px; font-size:11px; font-weight:800;" data-act="back-to-garage">← Back to Garage</button>
        </div>

        <div class="header-banner" style="background:linear-gradient(135deg, var(--s1), var(--bg)); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <div style="font-size:24px; color:var(--gold);">${ic('wrench')}</div>
            <div>
              <h2 style="margin:0; font-size:18px; color:var(--tx);">Repair Bay & Maintenance Center</h2>
              <div style="font-size:11px; color:var(--mu);">Inspect individual components, service fluids, and manage heavy repairs for ${truck ? truck.name : 'Selected Truck'}.</div>
            </div>
          </div>
        </div>

        ${!truck ? '<div class="card" style="padding:30px; text-align:center; color:var(--mu);">No truck selected for inspection.</div>' : `
          <!-- Truck Overview Card -->
          <div class="card" style="margin-bottom:16px; border-color:var(--gold); background:var(--s1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div>
                <h3 style="margin:0; font-size:16px; color:var(--tx);">${truck.name}</h3>
                <div style="font-size:11px; color:var(--gold); font-weight:700; margin-top:2px;">${model?.brand} ${model?.name} · Odometer: ${Math.round(truck.odometer).toLocaleString()} km</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px; font-weight:900; color:${truck.status === 'repair' ? '#ef4444' : 'var(--grn)'}; text-transform:uppercase;">Status: ${truck.status}</div>
              </div>
            </div>

            ${truck.status === 'repair' ? `
              <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:8px; padding:12px; text-align:center; color:#ef4444; font-weight:700; font-size:12px; margin-bottom:12px;">
                🛠️ This truck is currently undergoing maintenance in the Repair Bay and is unavailable for dispatch.
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-size:11px; font-weight:700; color:var(--mu);">Select components to service / repair:</div>
                <div style="display:flex; gap:6px;">
                  <button class="btn alt" style="font-size:9px; padding:4px 8px;" data-act="select-all-parts">Select All</button>
                  <button class="btn alt" style="font-size:9px; padding:4px 8px;" data-act="clear-repair-parts">Clear</button>
                </div>
              </div>

              <!-- Component Checklist -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;">
                ${Object.entries(truck.components).map(([key, comp]: [string, any]) => {
                  const health = Math.round(comp.health);
                  const cost = getPartRepairCost(key, health);
                  const isSelected = selectedPartsSet.has(key);
                  const isMint = health >= 100;
                  
                  return `
                    <div class="card" style="padding:10px; border:1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}; background:${isSelected ? 'rgba(193,154,91,0.08)' : 'var(--bg)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="toggle-repair-part" data-part="${key}">
                      <div>
                        <div style="font-size:11px; font-weight:800; color:var(--tx);">${PART_LABELS[key] || key}</div>
                        <div style="font-size:10px; color:${health < 50 ? '#ef4444' : 'var(--grn)'}; font-weight:700;">Health: ${health}%</div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:11px; font-weight:900; color:${isMint ? 'var(--grn)' : 'var(--gold)'};">${isMint ? 'MINT' : '$' + cost.toLocaleString()}</div>
                        <div style="font-size:9px; color:var(--accent); font-weight:700; margin-top:2px;">${isSelected ? '☑ SELECTED' : '☐ Select'}</div>
                      </div>
                    </div>
                  `;
                }).join('')}

                <!-- Fluids -->
                ${[
                  { key: 'oil', label: 'Engine Oil Refill', val: Math.round((truck.fluids.oil / (model?.oilCapacity || 40)) * 100), cost: PART_BASE_PRICES.oil },
                  { key: 'coolant', label: 'Coolant Flush', val: Math.round(truck.fluids.coolant), cost: PART_BASE_PRICES.coolant },
                  { key: 'adBlue', label: 'AdBlue Refill', val: Math.round(truck.fluids.adBlue), cost: PART_BASE_PRICES.adBlue }
                ].map(fluid => {
                  const isSelected = selectedPartsSet.has(fluid.key);
                  const isFull = fluid.val >= 99;
                  return `
                    <div class="card" style="padding:10px; border:1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}; background:${isSelected ? 'rgba(193,154,91,0.08)' : 'var(--bg)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="toggle-repair-part" data-part="${fluid.key}">
                      <div>
                        <div style="font-size:11px; font-weight:800; color:var(--tx);">${fluid.label}</div>
                        <div style="font-size:10px; color:var(--grn); font-weight:700;">Level: ${fluid.val}%</div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:11px; font-weight:900; color:${isFull ? 'var(--grn)' : 'var(--gold)'};">${isFull ? 'FULL' : '$' + fluid.cost}</div>
                        <div style="font-size:9px; color:var(--accent); font-weight:700; margin-top:2px;">${isSelected ? '☑ SELECTED' : '☐ Select'}</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Summary & Action Bar -->
              <div style="background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:10px; color:var(--mu); text-transform:uppercase;">Estimated Repair Cost</div>
                  <div style="font-size:20px; font-weight:900; color:var(--gold);">$${totalCost.toLocaleString()}</div>
                  <div style="font-size:10px; color:var(--accent); font-weight:700; margin-top:2px;">⏱️ Duration: ${Math.round(durationMs / 1000)}s in Repair Bay</div>
                </div>
                <button class="btn gold" style="padding:10px 20px; font-size:12px; font-weight:900;" data-act="submit-repair" ${totalCost === 0 || truck.status !== 'idle' ? 'disabled' : ''}>
                  PAY & SEND TO BAY
                </button>
              </div>
            `}
          </div>
        `}

        <!-- Active Repair Bay Queue -->
        <div class="card" style="padding:14px; background:var(--s1);">
          <div style="font-size:12px; font-weight:800; color:var(--gold); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
            <span>🛠️ Active Repair Bay Queue</span>
            <span style="background:var(--bg); padding:2px 6px; border-radius:4px; font-size:10px; color:var(--mu);">${repairsQueue.length} Trucks</span>
          </div>
          ${repairsQueue.length === 0 ? '<div style="font-size:11px; color:var(--mu); text-align:center; padding:16px;">Repair bay is currently empty. All trucks operational.</div>' : 
            repairsQueue.map((rep: any) => {
              const timeLeft = Math.max(0, rep.end - now);
              const totalDuration = rep.end - rep.start;
              const pct = Math.min(100, Math.max(0, ((now - rep.start) / totalDuration) * 100));
              
              return `
                <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px; margin-bottom:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="font-size:12px; font-weight:700; color:var(--tx);">${rep.truckName}</div>
                    <div style="font-size:11px; font-weight:800; color:var(--gold);" data-eta="${rep.end}">⏱️ ${dur(timeLeft)} remaining</div>
                  </div>
                  <div style="font-size:10px; color:var(--mu); margin-bottom:6px;">Services: ${rep.parts.join(', ').toUpperCase()}</div>
                  <div class="bar"><i style="width:${pct}%; background:var(--gold);"></i></div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  }
};
