import { fmt, action, toast, $ } from '../core/ui';
import { set, refresh } from '../core/store';
import { getTruckCode, getTruckRegistrationStatus, registerTruckAtCity, renewVehicleRoadTax, bulkRenewFleetRoadTax, performVehicleInspection } from '../domain/trucks/registration';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { getOwnedHubsInRegion, REGIONAL_HUBS } from '../domain/logistics/network';

let selectedGovFilter: 'all' | 'unregistered' | 'tax_expired' | 'inspection_expired' = 'all';
let activeRegistrationTruckId: number | null = null;

action('set-gov-filter', d => {
  selectedGovFilter = (d as any).filter || 'all';
  refresh();
});

action('open-reg-modal', d => {
  activeRegistrationTruckId = parseInt((d as any).id, 10);
  refresh();
});

action('close-reg-modal', () => {
  activeRegistrationTruckId = null;
  refresh();
});

action('submit-vehicle-registration', d => {
  const S = (window as any).__getStore?.();
  if (!S || !activeRegistrationTruckId) return;

  const citySelect = document.getElementById('reg-city-select') as HTMLSelectElement | null;
  const vanityInput = document.getElementById('reg-vanity-input') as HTMLInputElement | null;

  const city = citySelect ? citySelect.value : 'LAGOS';
  const customPlate = vanityInput ? vanityInput.value.trim() : '';

  if (registerTruckAtCity(S, activeRegistrationTruckId, city, customPlate)) {
    activeRegistrationTruckId = null;
    refresh();
  }
});

action('renew-truck-tax', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const truckId = parseInt((d as any).id, 10);
  if (renewVehicleRoadTax(S, truckId)) {
    refresh();
  }
});

action('bulk-renew-fleet-tax', () => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  bulkRenewFleetRoadTax(S);
  refresh();
});

action('inspect-truck-safety', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const truckId = parseInt((d as any).id, 10);
  performVehicleInspection(S, truckId);
  refresh();
});

export default {
  id: 'government',
  label: 'DMV Bureau',
  icon: 'award',
  render(S: any) {
    const fleet = S.fleet || [];
    const depots = S.depots || {};
    const ownedCities = Object.keys(depots).map(k => k.toUpperCase());

    // Analytics & Metrics
    let registeredCount = 0;
    let taxExpiredCount = 0;
    let inspectionExpiredCount = 0;
    let unregisteredCount = 0;

    const now = Date.now();

    for (const truck of fleet) {
      const regStatus = getTruckRegistrationStatus(truck);
      if (regStatus.status === 'unregistered') unregisteredCount++;
      else {
        registeredCount++;
        if (truck.taxExpiresAt && now > truck.taxExpiresAt) taxExpiredCount++;
        if (truck.inspectionExpiresAt && now > truck.inspectionExpiresAt) inspectionExpiredCount++;
      }
    }

    const totalFleet = fleet.length;
    const compliantCount = registeredCount - taxExpiredCount - inspectionExpiredCount;
    const complianceRate = totalFleet > 0 ? Math.round((compliantCount / totalFleet) * 100) : 100;
    const rateColor = complianceRate >= 80 ? 'var(--grn)' : complianceRate >= 50 ? 'var(--gold)' : '#ef4444';

    // Filter Fleet
    const filteredFleet = fleet.filter((truck: any) => {
      const statusInfo = getTruckRegistrationStatus(truck);
      if (selectedGovFilter === 'unregistered') return statusInfo.status === 'unregistered';
      if (selectedGovFilter === 'tax_expired') return statusInfo.status === 'tax_expired';
      if (selectedGovFilter === 'inspection_expired') return statusInfo.status === 'inspection_expired';
      return true;
    });

    const activeRegTruck = activeRegistrationTruckId ? fleet.find((t: any) => t.id === activeRegistrationTruckId) : null;

    return `
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- DMV BUREAU HEADER & COMPLIANCE METRICS -->
        <div style="background:linear-gradient(135deg, #090d16, #0e1726); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:10px 14px; font-size:24px;">
                🏛️
              </div>
              <div>
                <h2 style="font-size:18px; font-weight:900; color:var(--tx); margin:0;">COMMERCIAL TRANSPORT & DMV REGISTRATION BUREAU</h2>
                <p style="font-size:10px; color:var(--mu); margin:2px 0 0 0;">Heavy Vehicle Licensing, DOT Inspections, Highway Road Tax Permits & Registration Papers</p>
              </div>
            </div>

            <button class="btn gold" style="padding:8px 16px; font-size:10px; font-weight:900;" data-act="bulk-renew-fleet-tax">
              ⚡ BULK RENEW ALL ROAD TAXES ($2.4k/veh)
            </button>
          </div>

          <!-- Stats Grid -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-top:16px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
            <div style="background:#05080f; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">COMPLIANCE RATE</div>
              <div style="font-size:18px; font-weight:900; color:${rateColor}; font-family:monospace; margin-top:2px;">${complianceRate}%</div>
              <div style="font-size:7px; color:var(--mu); margin-top:2px;">${compliantCount} of ${totalFleet} Fully Compliant</div>
            </div>

            <div style="background:#05080f; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">REGISTERED FLEET</div>
              <div style="font-size:18px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:2px;">${registeredCount}</div>
              <div style="font-size:7px; color:var(--mu); margin-top:2px;">Official Plates Issued</div>
            </div>

            <div style="background:#05080f; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">UNREGISTERED</div>
              <div style="font-size:18px; font-weight:900; color:#ef4444; font-family:monospace; margin-top:2px;">${unregisteredCount}</div>
              <div style="font-size:7px; color:var(--mu); margin-top:2px;">Needs City DOT Registration</div>
            </div>

            <div style="background:#05080f; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">ROAD TAX DUE</div>
              <div style="font-size:18px; font-weight:900; color:var(--gold); font-family:monospace; margin-top:2px;">${taxExpiredCount}</div>
              <div style="font-size:7px; color:var(--mu); margin-top:2px;">Permit Expired / Pending</div>
            </div>

            <div style="background:#05080f; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">INSPECTION DUE</div>
              <div style="font-size:18px; font-weight:900; color:#f97316; font-family:monospace; margin-top:2px;">${inspectionExpiredCount}</div>
              <div style="font-size:7px; color:var(--mu); margin-top:2px;">TÜV / DOT Test Pending</div>
            </div>
          </div>
        </div>

        <!-- FILTER TABS BAR -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn ${selectedGovFilter === 'all' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:9px; font-weight:800;" data-act="set-gov-filter" data-filter="all">
              ALL FLEET (${totalFleet})
            </button>
            <button class="btn ${selectedGovFilter === 'unregistered' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:9px; font-weight:800;" data-act="set-gov-filter" data-filter="unregistered">
              ⚠️ UNREGISTERED (${unregisteredCount})
            </button>
            <button class="btn ${selectedGovFilter === 'tax_expired' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:9px; font-weight:800;" data-act="set-gov-filter" data-filter="tax_expired">
              💳 TAX EXPIRED (${taxExpiredCount})
            </button>
            <button class="btn ${selectedGovFilter === 'inspection_expired' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:9px; font-weight:800;" data-act="set-gov-filter" data-filter="inspection_expired">
              🔍 INSPECTION DUE (${inspectionExpiredCount})
            </button>
          </div>

          <span style="font-size:9px; color:var(--mu); font-weight:800; font-family:monospace;">JURISDICTIONS: ${ownedCities.length} ACTIVE REGIONAL HUBS</span>
        </div>

        <!-- FLEET VEHICLE REGISTRATION CARDS GRID -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:12px;">
          ${filteredFleet.length === 0 ? `
            <div style="grid-column:1/-1; background:#0b0f19; border:1px solid #1e293b; border-radius:10px; padding:32px; text-align:center; color:var(--mu);">
              <div style="font-size:24px; margin-bottom:8px;">✅</div>
              <div style="font-size:12px; font-weight:800; color:var(--tx);">No Vehicles Match Active Filter</div>
              <div style="font-size:10px; margin-top:4px;">All company transport vehicles are compliant for this category.</div>
            </div>
          ` : filteredFleet.map((truck: any) => {
            const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
            const code = getTruckCode(truck);
            const regInfo = getTruckRegistrationStatus(truck);
            const driver = S.drivers?.find((d: any) => d.id === truck.driverId);

            // Compute overall component health
            const comps = Object.values(truck.components || {}) as any[];
            const totalH = comps.reduce((acc, c) => acc + (c?.health ?? 100), 0);
            const avgHealth = comps.length > 0 ? totalH / comps.length : 100;
            const healthColor = avgHealth >= 75 ? 'var(--grn)' : avgHealth >= 50 ? 'var(--gold)' : '#ef4444';

            return `
              <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:10px;">
                
                <!-- Card Header: Code & Plate -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-size:13px; font-weight:900; color:var(--gold); font-family:monospace;">${code}</span>
                      <span style="font-size:9px; background:rgba(255,255,255,0.06); padding:1px 6px; border-radius:3px; color:var(--tx); font-weight:800;">${model.brand} ${model.name}</span>
                    </div>
                    <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-top:2px;">
                      Odometer: ${Math.round(truck.odometer || 0).toLocaleString()} km · Depoted: <b style="color:var(--tx);">${truck.loc || 'LAGOS'}</b>
                    </div>
                  </div>

                  <!-- Status Badge -->
                  <div style="background:${regInfo.badgeBg}; color:${regInfo.color}; border:1px solid ${regInfo.color}44; font-size:7px; font-weight:900; padding:2px 6px; border-radius:4px; font-family:monospace; text-align:right;">
                    ${regInfo.label}
                  </div>
                </div>

                <!-- License Plate Banner -->
                <div style="background:#030509; border:1px dashed ${truck.regNo ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:7px; color:var(--mu); font-weight:800; text-transform:uppercase;">OFFICIAL PLATE & JURISDICTION</div>
                    <div style="font-size:14px; font-weight:900; color:${truck.regNo ? 'var(--tx)' : '#ef4444'}; font-family:monospace; letter-spacing:1px; margin-top:1px;">
                      ${truck.regNo ? `🚘 ${truck.regNo}` : '⚠️ UNREGISTERED VEHICLE'}
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:7px; color:var(--mu); font-weight:800;">HUB CITY</div>
                    <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace;">
                      ${truck.registeredCity || 'UNASSIGNED'}
                    </div>
                  </div>
                </div>

                <!-- Registration Details Summary -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:8px; color:var(--mu); font-family:monospace; background:#05080f; padding:6px 8px; border-radius:4px;">
                  <div>
                    Driver: <b style="color:var(--tx);">${driver ? driver.name : 'Unassigned'}</b>
                  </div>
                  <div>
                    Road Tax: <b style="color:${truck.taxExpiresAt && now < truck.taxExpiresAt ? 'var(--grn)' : '#ef4444'};">${truck.taxExpiresAt ? new Date(truck.taxExpiresAt).toLocaleDateString() : 'EXPIRED'}</b>
                  </div>
                  <div>
                    Safety Health: <b style="color:${healthColor};">${avgHealth.toFixed(0)}%</b>
                  </div>
                  <div>
                    DOT Test: <b style="color:${truck.inspectionExpiresAt && now < truck.inspectionExpiresAt ? 'var(--grn)' : '#ef4444'};">${truck.inspectionExpiresAt ? new Date(truck.inspectionExpiresAt).toLocaleDateString() : 'EXPIRED'}</b>
                  </div>
                </div>

                <!-- Action Controls -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:2px;">
                  ${!truck.regNo ? `
                    <button class="btn gold" style="grid-column:1/-1; padding:6px; font-size:8px; font-weight:900;" data-act="open-reg-modal" data-id="${truck.id}">
                      📝 REGISTER VEHICLE & ISSUE PLATE
                    </button>
                  ` : `
                    <button class="btn ${truck.taxExpiresAt && now > truck.taxExpiresAt ? 'gold' : 'alt'}" style="padding:6px; font-size:8px; font-weight:800;" data-act="renew-truck-tax" data-id="${truck.id}">
                      💳 RENEW TAX ($2.4k)
                    </button>
                    <button class="btn ${truck.inspectionExpiresAt && now > truck.inspectionExpiresAt ? 'gold' : 'alt'}" style="padding:6px; font-size:8px; font-weight:800;" data-act="inspect-truck-safety" data-id="${truck.id}">
                      🔍 SAFETY TEST ($600)
                    </button>
                  `}
                </div>

              </div>
            `;
          }).join('')}
        </div>

        <!-- REGISTRATION MODAL OVERLAY -->
        ${activeRegTruck ? `
          <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px;">
            <div style="background:#090d16; border:1px solid var(--gold); border-radius:12px; width:100%; max-width:440px; padding:20px; display:flex; flex-direction:column; gap:14px;">
              
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:20px;">🏛️</span>
                  <div>
                    <div style="font-size:14px; font-weight:900; color:var(--tx);">DOT VEHICLE REGISTRATION</div>
                    <div style="font-size:9px; color:var(--mu); font-family:monospace;">UNIT CODE: ${getTruckCode(activeRegTruck)}</div>
                  </div>
                </div>
                <button class="btn alt" style="padding:4px 8px; font-size:10px;" data-act="close-reg-modal">✕</button>
              </div>

              <!-- Registration Form Inputs -->
              <div style="display:flex; flex-direction:column; gap:10px; font-size:10px;">
                
                <div>
                  <label style="display:block; font-size:9px; color:var(--mu); font-weight:800; margin-bottom:4px; text-transform:uppercase;">1. SELECT REGISTRATION JURISDICTION / HUB</label>
                  <select id="reg-city-select" style="width:100%; background:#030509; border:1px solid rgba(255,255,255,0.15); color:var(--tx); padding:8px; border-radius:6px; font-size:11px; font-weight:800;">
                    ${ownedCities.length > 0 ? ownedCities.map(city => `
                      <option value="${city}">${city} DEPOT BUREAU</option>
                    `).join('') : `
                      <option value="LAGOS">LAGOS HQ DEPOT BUREAU</option>
                    `}
                  </select>
                </div>

                <div>
                  <label style="display:block; font-size:9px; color:var(--mu); font-weight:800; margin-bottom:4px; text-transform:uppercase;">2. OPTIONAL VANITY LICENSE PLATE ($3,500)</label>
                  <input id="reg-vanity-input" type="text" placeholder="e.g. NEX-001, HAUL-77 (Leave blank for standard)" style="width:100%; background:#030509; border:1px solid rgba(255,255,255,0.15); color:var(--tx); padding:8px; border-radius:6px; font-size:11px; font-family:monospace; text-transform:uppercase;" />
                </div>

                <!-- Fee Breakdown -->
                <div style="background:#030509; border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:10px; font-size:9px; color:var(--mu); font-family:monospace; display:flex; flex-direction:column; gap:4px;">
                  <div style="display:flex; justify-content:space-between;">
                    <span>Standard Plate Fee:</span>
                    <b style="color:var(--tx);">$1,800</b>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span>Includes Road Permit:</span>
                    <b style="color:var(--grn);">1 Year Included</b>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span>Includes DOT Inspection Pass:</span>
                    <b style="color:var(--grn);">1 Year Included</b>
                  </div>
                </div>

              </div>

              <!-- Modal Buttons -->
              <div style="display:flex; gap:8px; margin-top:4px;">
                <button class="btn alt" style="flex:1; padding:8px; font-size:10px; font-weight:800;" data-act="close-reg-modal">
                  CANCEL
                </button>
                <button class="btn gold" style="flex:2; padding:8px; font-size:10px; font-weight:900;" data-act="submit-vehicle-registration">
                  🏛️ ISSUE REGISTRATION PAPERS
                </button>
              </div>

            </div>
          </div>
        ` : ''}

      </div>
    `;
  }
};
