import { action, fmt } from '../../core/ui';
import { FleetService } from '../../application/services/fleet';
import {
  GEARBOX_UPGRADES,
  AXLE_RATIO_UPGRADES,
  TIRE_UPGRADES,
  ECO_TUNING_COST_PER_LEVEL,
  PERFORMANCE_CHIP_COST_PER_LEVEL,
  HEAVY_DUTY_SUSPENSION_COST
} from '../../domain/trucks/upgrades';
import { CONSUMABLES_SERVICE_COST } from '../../domain/trucks/maintenance';

action('repair-set-gearbox', d => FleetService.setGearbox(+(d as any).id, (d as any).gearbox));
action('repair-set-axle', d => FleetService.setAxleRatio(+(d as any).id, (d as any).axle));
action('repair-set-tires', d => FleetService.setTires(+(d as any).id, (d as any).tires));
action('repair-service-consumables', d => FleetService.serviceConsumables(+(d as any).id));
action('repair-upgrade-eco', d => FleetService.upgradeEcoTuning(+(d as any).id));
action('repair-upgrade-chip', d => FleetService.upgradePerformanceChip(+(d as any).id));
action('repair-upgrade-susp', d => FleetService.upgradeHeavyDutySuspension(+(d as any).id));

export function renderUpgradesAndConsumablesPanel(S: any, truck: any, model: any): string {
  const upgrades = truck.upgrades || {};
  const fluids = truck.fluids || {};
  const tankCap = model?.tankSize || 800;
  const fuelPct = Math.round(((fluids.fuel ?? tankCap) / tankCap) * 100);
  const adBluePct = Math.round(fluids.adBlue ?? 100);
  const coolantPct = Math.round(fluids.coolant ?? 100);
  const oilLiters = Math.round(fluids.oil ?? (model?.oilCapacity || 40));

  const ecoLvl = Number(upgrades.ecoTuning) || 0;
  const chipLvl = Number(upgrades.performanceChip) || 0;
  const hasSusp = !!upgrades.heavyDutySuspension;

  const nextEcoCost = ECO_TUNING_COST_PER_LEVEL * (ecoLvl + 1);
  const nextChipCost = PERFORMANCE_CHIP_COST_PER_LEVEL * (chipLvl + 1);

  const curGearbox = upgrades.gearbox === '16spd_crawler' ? '16spd_crawler' : '12spd_highway';
  const curAxle = upgrades.axleRatio === 'heavy_diff_lock' ? 'heavy_diff_lock' : 'highway_eco';
  const curTire = upgrades.tireCompound || 'highway_eco';

  const isBusy = truck.status !== 'idle';

  return `
    <div class="card" style="padding:14px; background:var(--s1); margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:12px; font-weight:900; color:var(--gold); letter-spacing:0.4px;">⚙️ POWERTRAIN CUSTOMIZATION &amp; CONSUMABLES</div>
          <div style="font-size:9.5px; color:var(--mu);">Upgrades directly modify live trip physics: fuel burn, top speed, grade climbing, traction &amp; wear.</div>
        </div>
        <span style="font-size:9px; color:var(--mu); font-family:monospace;">SAE J1939</span>
      </div>

      <!-- Fluids & Consumables -->
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:10px;">
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px; text-align:center;">
          <div style="font-size:8px; color:var(--mu); font-family:monospace;">DIESEL FUEL</div>
          <div style="font-size:11px; font-weight:900; color:${fuelPct < 25 ? '#ef4444' : 'var(--tx)'}; font-family:monospace;">${Math.round(fluids.fuel ?? tankCap)}L (${fuelPct}%)</div>
        </div>
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px; text-align:center;">
          <div style="font-size:8px; color:var(--mu); font-family:monospace;">ADBLUE / DEF</div>
          <div style="font-size:11px; font-weight:900; color:${adBluePct < 25 ? '#eab308' : 'var(--tx)'}; font-family:monospace;">${adBluePct}%</div>
        </div>
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px; text-align:center;">
          <div style="font-size:8px; color:var(--mu); font-family:monospace;">COOLANT</div>
          <div style="font-size:11px; font-weight:900; color:${coolantPct < 40 ? '#ef4444' : 'var(--tx)'}; font-family:monospace;">${coolantPct}%</div>
        </div>
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px; text-align:center;">
          <div style="font-size:8px; color:var(--mu); font-family:monospace;">LUBE OIL</div>
          <div style="font-size:11px; font-weight:900; color:var(--tx); font-family:monospace;">${oilLiters}L</div>
        </div>
      </div>

      <button type="button" class="btn alt" style="width:100%; padding:8px; font-size:10px; font-weight:800; margin-bottom:14px;" data-act="repair-service-consumables" data-id="${truck.id}" ${isBusy || S.money < CONSUMABLES_SERVICE_COST ? 'disabled' : ''}>
        🛢️ TOP UP ALL CONSUMABLES (OIL, COOLANT, ADBLUE) · ${fmt(CONSUMABLES_SERVICE_COST)}
      </button>

      <!-- Powertrain Hardware Selectors -->
      <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; margin-bottom:8px; text-transform:uppercase;">DRIVETRAIN &amp; TIRE HARDWARE</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:8px; margin-bottom:14px;">
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
          <div style="font-size:9px; color:var(--mu); font-weight:800; margin-bottom:4px;">HEAVY-HAUL GEARBOX</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            ${Object.entries(GEARBOX_UPGRADES).map(([k, g]) => `
              <button type="button" class="btn ${curGearbox === k ? 'gold' : 'alt'}" style="font-size:9px; padding:6px 8px; text-align:left;" data-act="repair-set-gearbox" data-id="${truck.id}" data-gearbox="${k}" ${isBusy || curGearbox === k ? 'disabled' : ''}>
                ${curGearbox === k ? '✓ ' : ''}${g.name} (${g.cost ? fmt(g.cost) : 'Stock'})
              </button>
            `).join('')}
          </div>
          <div style="font-size:8.5px; color:var(--mu); margin-top:5px;">Crawler: -40% uphill speed loss, +15% accel</div>
        </div>

        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
          <div style="font-size:9px; color:var(--mu); font-weight:800; margin-bottom:4px;">REAR AXLE DIFFERENTIAL</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            ${Object.entries(AXLE_RATIO_UPGRADES).map(([k, a]) => `
              <button type="button" class="btn ${curAxle === k ? 'gold' : 'alt'}" style="font-size:9px; padding:6px 8px; text-align:left;" data-act="repair-set-axle" data-id="${truck.id}" data-axle="${k}" ${isBusy || curAxle === k ? 'disabled' : ''}>
                ${curAxle === k ? '✓ ' : ''}${a.name} (${a.cost ? fmt(a.cost) : 'Stock'})
              </button>
            `).join('')}
          </div>
          <div style="font-size:8.5px; color:var(--mu); margin-top:5px;">Eco: -7% fuel, +4% speed · Diff Lock: +15% traction</div>
        </div>

        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
          <div style="font-size:9px; color:var(--mu); font-weight:800; margin-bottom:4px;">TIRE COMPOUND</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            ${Object.entries(TIRE_UPGRADES).map(([k, t]) => `
              <button type="button" class="btn ${curTire === k ? 'gold' : 'alt'}" style="font-size:9px; padding:6px 8px; text-align:left;" data-act="repair-set-tires" data-id="${truck.id}" data-tires="${k}" ${isBusy || curTire === k ? 'disabled' : ''}>
                ${curTire === k ? '✓ ' : ''}${t.name} (${t.cost ? fmt(t.cost) : 'Stock'})
              </button>
            `).join('')}
          </div>
          <div style="font-size:8.5px; color:var(--mu); margin-top:5px;">Winter: +20% wet/ice traction · Eco: -5% fuel</div>
        </div>
      </div>

      <!-- Dynamic Performance & Chassis Tuning -->
      <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; margin-bottom:8px; text-transform:uppercase;">PERFORMANCE &amp; CHASSIS TUNING</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:8px;">
        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11px; font-weight:900; color:var(--tx);">Eco-Tuning ECU</span>
              <span style="font-size:9px; font-family:monospace; color:var(--grn); font-weight:800;">L${ecoLvl}/3 (-${ecoLvl * 5}% fuel)</span>
            </div>
            <div style="font-size:9px; color:var(--mu); margin-top:3px;">Calibrates injection mapping to reduce L/100km fuel burn by 5% per level.</div>
          </div>
          <button type="button" class="btn ${ecoLvl >= 3 ? 'alt' : 'gold'}" style="font-size:9px; padding:6px; font-weight:900;" data-act="repair-upgrade-eco" data-id="${truck.id}" ${isBusy || ecoLvl >= 3 || S.money < nextEcoCost ? 'disabled' : ''}>
            ${ecoLvl >= 3 ? 'MAXED (L3)' : `UPGRADE TO L${ecoLvl + 1} (${fmt(nextEcoCost)})`}
          </button>
        </div>

        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11px; font-weight:900; color:var(--tx);">Performance Chip</span>
              <span style="font-size:9px; font-family:monospace; color:var(--gold); font-weight:800;">L${chipLvl}/3 (+${chipLvl * 6}% power)</span>
            </div>
            <div style="font-size:9px; color:var(--mu); margin-top:3px;">Increases effective top speed &amp; acceleration by +6%/lvl (+2.5% fuel burn).</div>
          </div>
          <button type="button" class="btn ${chipLvl >= 3 ? 'alt' : 'gold'}" style="font-size:9px; padding:6px; font-weight:900;" data-act="repair-upgrade-chip" data-id="${truck.id}" ${isBusy || chipLvl >= 3 || S.money < nextChipCost ? 'disabled' : ''}>
            ${chipLvl >= 3 ? 'MAXED (L3)' : `UPGRADE TO L${chipLvl + 1} (${fmt(nextChipCost)})`}
          </button>
        </div>

        <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11px; font-weight:900; color:var(--tx);">Heavy-Duty Suspension</span>
              <span style="font-size:9px; font-family:monospace; color:${hasSusp ? 'var(--grn)' : 'var(--mu)'}; font-weight:800;">${hasSusp ? 'INSTALLED' : 'STOCK'}</span>
            </div>
            <div style="font-size:9px; color:var(--mu); margin-top:3px;">Reduces cargo-weight &amp; rough-road component wear by 25%.</div>
          </div>
          <button type="button" class="btn ${hasSusp ? 'alt' : 'gold'}" style="font-size:9px; padding:6px; font-weight:900;" data-act="repair-upgrade-susp" data-id="${truck.id}" ${isBusy || hasSusp || S.money < HEAVY_DUTY_SUSPENSION_COST ? 'disabled' : ''}>
            ${hasSusp ? '✓ INSTALLED' : `INSTALL (${fmt(HEAVY_DUTY_SUSPENSION_COST)})`}
          </button>
        </div>
      </div>
    </div>
  `;
}
