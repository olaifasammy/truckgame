import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { set, refresh } from '../core/store';
import { fillPool } from '../systems/drivers';
import { getCompanyProgression, renderProgressLogoRing } from '../domain/company/progression';
import { CARGO_TYPES } from '../domain/freight/cargo/registry';
import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { renderTelematicsOverlay } from './telematics-modal';

let transitPage = 1;
const TRANSIT_PER_PAGE = 3;

action('transit-page', d => {
  transitPage = +(d as any).page;
  refresh();
});

action('logout', () => {
  set(S => {
    S.isAuthenticated = false;
  });
  toast('Logged out successfully');
  setTimeout(() => location.reload(), 500);
});

action('buy-regional-hub', d => {
  const hubId = (d as any).id;
  const cost = +(d as any).cost;
  set(S => {
    if (S.money < cost) return toast(`Insufficient capital ($${cost.toLocaleString()}) to acquire regional hub`, 'err');
    S.money -= cost;
    if (!S.depots) S.depots = [];
    S.depots.push(hubId);
    toast(`Regional Logistics Hub acquired! Depot berths expanded.`, 'success');
  });
});

action('buy-warehouse-upg', d => {
  const upgId = (d as any).id;
  const cost = +(d as any).cost;
  set(S => {
    if (S.money < cost) return toast(`Insufficient funds ($${cost.toLocaleString()}) for warehouse installation`, 'err');
    S.money -= cost;
    if (!S.warehouseUpgrades) S.warehouseUpgrades = {};
    S.warehouseUpgrades[upgId] = true;
    toast(`Warehouse facility installed & activated!`, 'success');
  });
});

export default {
  id: 'company',
  icon: 'company',
  label: 'HQ Depot',
  render: (S: any) => {
    fillPool(S);
    const prog = getCompanyProgression(S);
    const avgSkill = S.drivers.length > 0
      ? (S.drivers.reduce((acc: number, d: any) => acc + (d.skill || 1), 0) / S.drivers.length).toFixed(1)
      : '1.0';

    // Aggregate storage yard trailers
    const yardTrailers: Record<string, number> = {};
    (S.trailers || []).forEach((t: string) => {
      yardTrailers[t] = (yardTrailers[t] || 0) + 1;
    });
    const totalYardTrailers = (S.trailers || []).length;

    return `
      <div class="profile-wrap" style="background:linear-gradient(180deg, #111827 0%, #0a0f1d 100%); border-bottom:1px solid #1f293d; padding:28px 16px 20px; text-align:center;">
        <!-- Circular Progress Ring Encircled Logo -->
        <div style="margin:0 auto 14px; display:inline-block;">
          ${renderProgressLogoRing(S, 84, 5)}
        </div>

        <div class="avatar-tx" style="font-size:18px; font-weight:900; color:var(--tx); letter-spacing:0.3px; text-transform:uppercase;">
          ${S.company}
        </div>
        <div style="display:inline-flex; align-items:center; gap:6px; background:${prog.color}18; border:1px solid ${prog.color}50; border-radius:4px; padding:3px 10px; margin-top:8px;">
          <span style="font-size:11px; font-weight:900; color:${prog.color}; font-family:monospace; letter-spacing:0.5px;">
            CARRIER RANK: ${prog.title.toUpperCase()} (TIER ${prog.tier})
          </span>
        </div>

        <!-- Progress Bar Line Towards Next Rank -->
        <div style="max-width:320px; margin:16px auto 0; background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:10px 14px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace; margin-bottom:6px;">
            <span style="color:var(--mu);">PROGRESSION TO <b style="color:var(--tx);">${prog.nextTitle.toUpperCase()}</b></span>
            <span style="color:${prog.color}; font-weight:800;">${prog.percent}%</span>
          </div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="width:${prog.percent}%; height:100%; background:linear-gradient(90deg, ${prog.strokeGrad[0]}, ${prog.strokeGrad[1]}); transition:width 0.5s ease; border-radius:3px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:var(--mu); font-family:monospace; margin-top:5px;">
            <span>${prog.xpInTier} XP</span>
            <span>Target: ${prog.targetXp} XP</span>
          </div>
        </div>
      </div>

      <!-- Executive Operations & Financial KPIs -->
      <div class="grid2" style="padding:14px; gap:10px;">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace;">${S.loads}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Completed Loads</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace;">${S.drivers.length}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Active Personnel</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--grn); font-family:monospace;">$${(S.stats?.earned || 0).toLocaleString()}</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Gross Freight Revenue</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
          <span class="stat-val" style="font-size:18px; font-weight:900; color:var(--gold); font-family:monospace;">${(S.stats?.km || 0).toLocaleString()} km</span>
          <span class="stat-lab" style="font-size:9px; color:var(--mu); text-transform:uppercase; font-weight:700;">Highway Logged</span>
        </div>
      </div>

      <!-- Active Transit Consignments & GPS Telematics (Paginated) -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
              ACTIVE TRANSIT CONSIGNMENTS (${(S.active || []).length})
            </span>
            <span style="font-size:8px; background:rgba(56,189,248,0.15); border:1px solid #38bdf8; color:#38bdf8; padding:1px 6px; border-radius:3px; font-weight:800; font-family:monospace;">
              REAL-TIME GPS TELEMETRICS
            </span>
          </div>
          ${(S.active && S.active.length > TRANSIT_PER_PAGE) ? `
            <span style="font-size:9px; font-family:monospace; color:var(--mu);">
              PAGE ${Math.min(Math.ceil(S.active.length / TRANSIT_PER_PAGE), Math.max(1, transitPage))} OF ${Math.ceil(S.active.length / TRANSIT_PER_PAGE)}
            </span>
          ` : ''}
        </div>

        ${(() => {
          const activeList = S.active || [];
          if (activeList.length === 0) {
            return `
              <div style="background:#0b1120; border:1px dashed #1e293b; border-radius:8px; padding:14px; text-align:center;">
                <div style="font-size:16px; margin-bottom:4px;">🛰️</div>
                <div style="font-size:11px; font-weight:800; color:var(--tx);">No Tractors Currently In Transit</div>
                <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                  Active freight dispatches report live speed, RPM, GPS route coordinates, and dashcam telemetry here.
                </div>
              </div>
            `;
          }

          const totalPages = Math.ceil(activeList.length / TRANSIT_PER_PAGE);
          const currentPage = Math.min(totalPages, Math.max(1, transitPage));
          const startIdx = (currentPage - 1) * TRANSIT_PER_PAGE;
          const pageItems = activeList.slice(startIdx, startIdx + TRANSIT_PER_PAGE);
          const now = Date.now();

          return `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${pageItems.map((a: any) => {
                const truckObj = (S.fleet || []).find((t: any) => t.id === a.truck);
                const drv = (S.drivers || []).find((d: any) => d.id === truckObj?.driverId);
                const cargoName = a.cargo || CARGO_TYPES.find(c => c.id === a.cargoId)?.name || 'Commercial Freight';
                const remainingMs = Math.max(0, a.end - now);
                const totalDuration = Math.max(1, a.end - a.start);
                const elapsed = Math.max(0, now - a.start);
                const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                return `
                  <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                      <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span style="font-size:13px; font-weight:900; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${cargoName}
                          </span>
                          <span style="font-size:9px; color:var(--mu); font-family:monospace;">
                            (${a.weight || 0}t)
                          </span>
                        </div>
                        <div style="font-size:11px; font-family:monospace; color:var(--gold); font-weight:800; margin-top:2px;">
                          ${a.from} → ${a.to} <span style="color:var(--mu); font-weight:400;">(${a.km} km)</span>
                        </div>
                        <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                          Unit #${a.truck} (${truckObj?.name || 'Tractor'}) · Driver: <b style="color:var(--tx);">${drv ? drv.name : 'CDL Driver'}</b>
                        </div>
                      </div>

                      <button class="btn alt" style="padding:6px 12px; font-size:9px; font-weight:800; color:#38bdf8; border-color:rgba(56,189,248,0.4); display:flex; align-items:center; gap:5px; flex-shrink:0;" data-act="open-telematics" data-id="${a.truck}">
                        <span>🛰️</span> DASHCAM
                      </button>
                    </div>

                    <!-- Progress Bar & Live Countdown -->
                    <div style="background:#080c16; border:1px solid #141d2e; border-radius:6px; padding:6px 10px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; font-family:monospace; margin-bottom:4px;">
                        <span style="color:var(--mu);">Transit Progress: <b style="color:var(--grn);">${pct.toFixed(0)}%</b></span>
                        <span style="color:var(--gold); font-weight:800;" data-eta="${a.end}">ETA: ${dur(remainingMs)}</span>
                      </div>
                      <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #0284c7, #38bdf8); border-radius:3px; transition:width 0.5s ease;"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}

              <!-- Clean Pagination Controls -->
              ${totalPages > 1 ? `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:4px;">
                  <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="transit-page" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
                    ← PREV
                  </button>
                  <span style="font-size:9px; color:var(--mu); font-family:monospace;">
                    Showing ${startIdx + 1}-${Math.min(activeList.length, startIdx + TRANSIT_PER_PAGE)} of ${activeList.length}
                  </span>
                  <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="transit-page" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
                    NEXT →
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        })()}
      </div>

      <!-- Executive Operations & Logistics Gateway Hub -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">OPERATIONS & LOGISTICS DEPARTMENTS</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">CARRIER INFRASTRUCTURE</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <!-- 1. Dedicated Link: Drivers Management & Recruitment View -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="tab" data-id="drivers">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(193,154,91,0.12); border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:20px; flex-shrink:0;">
                ${ic('user')}
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Commercial Drivers & CDL Academy
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--tx);">${S.drivers.length}</b> Employed · Avg Skill <b style="color:var(--gold);">${avgSkill}★</b> · <b style="color:var(--grn);">${S.pool.length}</b> Recruits
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>MANAGE CREW</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 2. Dedicated Link: Central Storage & Logistics Depot -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="tab" data-id="storage">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(56,189,248,0.12); border:1px solid #38bdf8; border-radius:8px; display:grid; place-items:center; color:#38bdf8; font-size:20px; flex-shrink:0;">
                📦
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Central Storage & Logistics Depot
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--gold);">${totalYardTrailers}</b> Unhitched Trailers · <b style="color:var(--tx);">${Object.values(S.partsInventory || {}).reduce((a: number, b: any) => a + Number(b), 0)}</b> Spares in Stock
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>OPEN STORAGE</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 3. Dedicated Link: OEM Commercial Trailer Equipment Depot -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid var(--gold); border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="open-trailer-depot">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:8px; display:grid; place-items:center; color:var(--gold); font-size:20px; flex-shrink:0;">
                🏗️
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--gold); letter-spacing:0.3px;">
                  Commercial Trailer Equipment Depot
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  Order Lowboys, Reefers, Tippers, LCV Doubles & Tankers
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>TRAILER DEPOT</span>
              ${ic('chev')}
            </div>
          </div>

          <!-- 4. Dedicated Link: Commercial Freight Licenses & Operating Authorities -->
          <div class="card" style="padding:14px 16px; background:linear-gradient(135deg, #111827 0%, #1e293b 100%); border:1px solid #1f293d; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" data-act="open-storage-subtab" data-subtab="licenses">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:44px; height:44px; background:rgba(34,197,94,0.12); border:1px solid var(--grn); border-radius:8px; display:grid; place-items:center; color:var(--grn); font-size:20px; flex-shrink:0;">
                📜
              </div>
              <div>
                <div style="font-size:13px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  Freight Licenses & Regulatory Compliance
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px; font-family:monospace;">
                  <b style="color:var(--grn);">${(S.licenses || ['standard']).length}</b> Active Permits · ADR Hazmat, Cold Chain & Heavy Haul
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; color:var(--gold); font-size:10px; font-weight:900; flex-shrink:0;">
              <span>VIEW PERMITS</span>
              ${ic('chev')}
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Logistics Depots & Cross-Docking Warehouses -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">MULTI-CITY REGIONAL DISTRIBUTION CENTERS</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">${(S.depots || []).length} / 4 HUBS ACTIVE</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
          ${[
            { id: 'hub_rotterdam', name: 'Rotterdam Europort Intermodal Hub', city: 'ROTTERDAM', cost: 160000, icon: '🚢', desc: 'Eliminates European deadhead penalties · +4 Berths' },
            { id: 'hub_chicago', name: 'Chicago Midwest Rail & Road Terminal', city: 'CHICAGO', cost: 195000, icon: '🚂', desc: 'North American crossroads connecting I-80 freight corridors · +5 Berths' },
            { id: 'hub_lagos', name: 'Lagos Deep Sea Logistics Terminal', city: 'LAGOS', cost: 125000, icon: '⚓', desc: 'Atlantic coastal industrial terminal for West Africa corridors · +4 Berths' },
            { id: 'hub_munich', name: 'Munich Alpine Cross-Border Depot', city: 'MUNICH', cost: 175000, icon: '⛰️', desc: 'High-altitude European transit node for heavy haul & tankers · +4 Berths' }
          ].map(hub => {
            const isOwned = (S.depots || []).includes(hub.id);
            return `
              <div style="background:#111827; border:1px solid ${isOwned ? 'rgba(34,197,94,0.3)' : '#1f293d'}; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:22px;">${hub.icon}</span>
                  <div>
                    <div style="font-size:12px; font-weight:800; color:var(--tx);">${hub.name}</div>
                    <div style="font-size:9px; color:var(--mu);">${hub.desc}</div>
                  </div>
                </div>
                <div>
                  ${isOwned ? `
                    <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.12); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace;">
                      ✓ OPERATIONAL
                    </span>
                  ` : `
                    <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="buy-regional-hub" data-id="${hub.id}" data-cost="${hub.cost}">
                      ACQUIRE ($${hub.cost.toLocaleString()})
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Custom Warehouse Infrastructure Upgrades -->
        <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">WAREHOUSE AUTOMATION & COLD STORAGE</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">PASSIVE REVENUE</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${[
            { id: 'cross_docking', name: 'Automated Cross-Docking Sorting Bays', cost: 45000, icon: '📦', perk: '+$1,200/day automated logistics throughput revenue', desc: 'High-speed automated roller sorters eliminate intermediate storage delays.' },
            { id: 'cold_vault', name: 'Temperature-Controlled Cold Storage Vaults', cost: 55000, icon: '❄️', perk: '+20% revenue bonus on all Refrigerated Reefer contracts', desc: 'Multi-zone cryogenic chambers safeguard perishable food chains.' },
            { id: 'gantry_crane', name: 'Heavy Gantry Crane & Industrial Forklift Fleet', cost: 48000, icon: '🏗️', perk: '30% faster turnaround time on Lowboys and 40ft Containers', desc: 'Heavy-duty 45-tonne overhead cranes load oversized machinery.' }
          ].map(upg => {
            const hasUpg = !!S.warehouseUpgrades?.[upg.id];
            return `
              <div style="background:#111827; border:1px solid ${hasUpg ? 'rgba(193,154,91,0.4)' : '#1f293d'}; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:22px;">${upg.icon}</span>
                  <div>
                    <div style="font-size:12px; font-weight:800; color:var(--tx);">${upg.name}</div>
                    <div style="font-size:9px; color:var(--gold); font-weight:700;">${upg.perk}</div>
                    <div style="font-size:8px; color:var(--mu);">${upg.desc}</div>
                  </div>
                </div>
                <div>
                  ${hasUpg ? `
                    <span style="font-size:9px; font-weight:900; color:var(--gold); background:rgba(193,154,91,0.15); border:1px solid var(--gold); padding:4px 8px; border-radius:4px; font-family:monospace;">
                      ✓ INSTALLED
                    </span>
                  ` : `
                    <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="buy-warehouse-upg" data-id="${upg.id}" data-cost="${upg.cost}">
                      INSTALL ($${upg.cost.toLocaleString()})
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Priority Operations & Dispatch Telemetry Console -->
      <div style="padding:0 14px 14px;">
        <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">OPERATIONS & DISPATCH LOG</span>
          <span class="mu-tx" style="font-size:9px; font-family:monospace;">${(S.notes || []).length} LOGS RECORDED</span>
        </div>

        <div style="background:#050811; border:1px solid #1a2336; border-radius:10px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.4); font-family:monospace;">
          <!-- Console Title Bar -->
          <div style="background:#090d18; border-bottom:1px solid #141c2c; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#ef4444; opacity:0.85;"></span>
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#f59e0b; opacity:0.85;"></span>
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; opacity:0.85;"></span>
              <span style="font-size:9px; font-weight:800; color:var(--tx); margin-left:6px; letter-spacing:0.5px;">SYSTEM CONSOLE · DISPATCH TELEMETRY</span>
            </div>
            <div style="display:flex; align-items:center; gap:5px; font-size:9px;">
              <span style="display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--grn); box-shadow:0 0 5px var(--grn);"></span>
              <span style="color:var(--grn); font-weight:800;">RECORDING</span>
            </div>
          </div>

          <!-- Console Feed Window -->
          <div style="padding:10px 12px; max-height:240px; overflow-y:auto; display:flex; flex-direction:column; gap:5px; font-size:10px; line-height:1.5;">
            ${(S.notes && S.notes.length > 0) ? S.notes.slice(0, 20).map((n: any, idx: number) => {
              const text = String(n.t || '');
              const isTenderWon = text.includes('Tender Won') || text.includes('Secured');
              const isAuthority = text.includes('LICENSING') || text.includes('AUTHORITY');
              const isCompetitor = text.includes('Contract Awarded') || text.includes('won the');
              const logNum = String(idx + 1).padStart(2, '0');
              const accentColor = isTenderWon ? 'var(--gold)' : isAuthority ? '#38bdf8' : isCompetitor ? 'var(--mu)' : 'var(--grn)';

              return `
                <div style="display:flex; align-items:flex-start; gap:8px; padding:3px 6px; border-radius:4px; background:rgba(255,255,255,0.02); border-left:2px solid ${accentColor};">
                  <span style="color:var(--mu); font-size:9px; font-weight:700; flex-shrink:0;">[#${logNum}]</span>
                  <span style="color:${accentColor}; font-weight:800; flex-shrink:0;">&gt;</span>
                  <span style="color:${isTenderWon ? '#fef08a' : isAuthority ? '#e0f2fe' : 'var(--tx)'}; flex:1; word-break:break-word;">
                    ${text}
                  </span>
                </div>
              `;
            }).join('') : `
              <div style="color:var(--mu); padding:12px; text-align:center; font-size:10px;">
                &gt; NO DISPATCH TRANSMISSIONS RECORDED YET. CONSOLE LISTENING...
              </div>
            `}
            <div style="display:flex; align-items:center; gap:6px; padding:2px 6px; color:var(--mu); font-size:9px; margin-top:2px;">
              <span style="color:var(--grn);">&gt;</span>
              <span style="color:var(--mu);">carrier-dispatch-bus connected</span>
              <span style="display:inline-block; width:5px; height:10px; background:var(--grn); opacity:0.8;"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Sign Out -->
      <div style="padding:14px;">
        <button class="btn alt" style="width:100%; padding:10px; font-size:11px; font-weight:800; letter-spacing:0.5px; border-radius:6px; text-transform:uppercase;" data-act="logout">
          Sign Out of Carrier System
        </button>
      </div>

      ${renderTelematicsOverlay(S)}
      <div style="height:20px;"></div>
    `;
  }
};

