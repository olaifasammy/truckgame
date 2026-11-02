import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { set, refresh } from '../core/store';
import { REGIONAL_HUBS, REGION_AUTHORITIES, RegionName, isRegionUnlocked, SAMPLE_TENDERS, SUBCONTRACT_DAILY_RATE } from '../domain/logistics/network';
import { LOCATIONS } from '../data/world';

let hubTab: 'regions' | 'hubs' | 'routes' | 'tenders' = 'regions';

action('set-hub-tab', d => {
  hubTab = (d as any).tab;
  refresh();
});

action('unlock-region', d => {
  const region = (d as any).region as RegionName;
  const auth = REGION_AUTHORITIES[region];
  if (!auth) return;
  set(S => {
    if (!S.unlockedRegions) S.unlockedRegions = ['Africa'];
    if (S.unlockedRegions.includes(region)) return toast(`${auth.name} already active!`, 'info');
    if (S.money < auth.cost) return toast(`Insufficient capital ($${auth.cost.toLocaleString()}) for ${auth.name}`, 'err');
    
    S.money -= auth.cost;
    S.unlockedRegions.push(region);
    toast(`Operating Authority Granted! ${auth.name} (${auth.code}) active. Regional freight unlocked!`, 'success');
  });
});

action('buy-regional-hub', d => {
  const hubId = (d as any).id;
  const hub = REGIONAL_HUBS.find(h => h.id === hubId);
  if (!hub) return;
  set(S => {
    if (!S.unlockedRegions) S.unlockedRegions = ['Africa'];
    if (!S.unlockedRegions.includes(hub.region)) {
      return toast(`Region Locked: Must obtain ${REGION_AUTHORITIES[hub.region].name} before purchasing hubs in ${hub.region}`, 'err');
    }
    if (S.money < hub.cost) return toast(`Insufficient capital ($${hub.cost.toLocaleString()}) to acquire ${hub.name}`, 'err');
    S.money -= hub.cost;
    if (!S.depots) S.depots = [];
    if (!S.depots.includes(hubId)) S.depots.push(hubId);
    toast(`${hub.name} acquired! Regional berths (+${hub.berths}) and logistics base active in ${hub.city}.`, 'success');
  });
});

action('sign-tender', d => {
  const tenderId = (d as any).id;
  const tenderDef = SAMPLE_TENDERS.find(t => t.id === tenderId);
  if (!tenderDef) return;
  set(S => {
    if (!S.corporateTenders) S.corporateTenders = [];
    if (S.corporateTenders.some((t: any) => t.id === tenderId)) {
      return toast('You already have an active agreement with this enterprise client', 'err');
    }
    if (tenderDef.requiredCerts && tenderDef.requiredCerts.length > 0) {
      const hasCerts = tenderDef.requiredCerts.every(c => {
        if (c === 'ADR Hazmat') return S.licenses?.includes('adr_hazmat');
        if (c === 'Cold Chain') return S.licenses?.includes('cold_chain');
        return true;
      });
      if (!hasCerts) {
        return toast(`Regulatory permit missing: requires ${tenderDef.requiredCerts.join(', ')} (Purchase in HQ Compliance)`, 'err');
      }
    }
    S.corporateTenders.push({
      ...JSON.parse(JSON.stringify(tenderDef)),
      completedLoads: 0,
      loadsRemaining: tenderDef.totalLoads
    });
    toast(`Enterprise Contract Executed: ${tenderDef.client}! Dedicated loads dispatched to job board.`, 'success');
  });
});

action('cancel-tender', d => {
  const tenderId = (d as any).id;
  set(S => {
    if (!S.corporateTenders) return;
    S.corporateTenders = S.corporateTenders.filter((t: any) => t.id !== tenderId);
    toast('Tender agreement terminated.', 'info');
  });
});

action('subcontract-rig', d => {
  const truckId = +(d as any).id;
  set(S => {
    const trk = (S.fleet || []).find((t: any) => t.id === truckId);
    if (!trk) return;
    if (trk.status !== 'idle') return toast('Truck must be parked/idle to lease out on charter', 'err');
    if (!S.subcontractedTrucks) S.subcontractedTrucks = [];
    if (S.subcontractedTrucks.includes(truckId)) return;
    S.subcontractedTrucks.push(truckId);
    toast(`Unit #${trk.id} (${trk.name}) chartered out on sub-contract (+$1,800/day passive retainer)!`, 'success');
  });
});

action('recall-subcontract', d => {
  const truckId = +(d as any).id;
  set(S => {
    if (!S.subcontractedTrucks) return;
    S.subcontractedTrucks = S.subcontractedTrucks.filter((id: number) => id !== truckId);
    toast(`Unit #${truckId} recalled to primary fleet operations!`, 'info');
  });
});

export default {
  id: 'network',
  icon: 'route',
  label: 'Network & Hubs',
  hidden: true,
  render: (S: any) => {
    const unlockedCount = (S.unlockedRegions || ['Africa']).length;
    const ownedHubsCount = (S.depots || []).length;

    return `
      <!-- Header Banner -->
      <div style="padding:24px 16px; background:linear-gradient(180deg, #111827 0%, #0a0f1d 100%); border-bottom:1px solid #1f293d; text-align:center;">
        <div style="font-size:10px; font-weight:900; color:var(--gold); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">
          GLOBAL INFRASTRUCTURE & AUTHORITY
        </div>
        <div style="font-size:20px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:0.5px;">
          Global Network & Regional Hubs
        </div>
        <div style="font-size:11px; color:var(--mu); margin-top:4px; font-family:monospace;">
          ${unlockedCount} Operating Regions · ${ownedHubsCount} Terminal Depots Acquired
        </div>

        <!-- Quick Return to HQ Button -->
        <div style="margin-top:14px;">
          <button class="btn alt" style="padding:6px 14px; font-size:10px; font-weight:800;" data-act="tab" data-id="company">
            ← Return to Carrier HQ
          </button>
        </div>
      </div>

        <!-- Management Navigation Tabs -->
        <div style="padding:16px;">
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:14px;">
            <button class="btn ${hubTab === 'regions' ? 'gold' : 'alt'}" style="padding:8px 2px; font-size:9px; font-weight:800; text-transform:uppercase;" data-act="set-hub-tab" data-tab="regions">
              Regions (${unlockedCount}/4)
            </button>
            <button class="btn ${hubTab === 'hubs' ? 'gold' : 'alt'}" style="padding:8px 2px; font-size:9px; font-weight:800; text-transform:uppercase;" data-act="set-hub-tab" data-tab="hubs">
              Hubs (${ownedHubsCount})
            </button>
            <button class="btn ${hubTab === 'routes' ? 'gold' : 'alt'}" style="padding:8px 2px; font-size:9px; font-weight:800; text-transform:uppercase;" data-act="set-hub-tab" data-tab="routes">
              Corridors
            </button>
            <button class="btn ${hubTab === 'tenders' ? 'gold' : 'alt'}" style="padding:8px 2px; font-size:9px; font-weight:800; text-transform:uppercase;" data-act="set-hub-tab" data-tab="tenders">
              Tenders & Charters
            </button>
          </div>

        <!-- TAB 1: OPERATING REGIONS -->
        ${hubTab === 'regions' ? `
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            ${(Object.keys(REGION_AUTHORITIES) as RegionName[]).map(rName => {
              const auth = REGION_AUTHORITIES[rName];
              const isUnlocked = isRegionUnlocked(S, rName);
              const citiesInRegion = Object.entries(LOCATIONS).filter(([_, loc]) => loc.region === rName).map(([_, loc]) => loc.name).join(', ');
              const hubsInRegion = REGIONAL_HUBS.filter(h => h.region === rName);
              const ownedCount = hubsInRegion.filter(h => (S.depots || []).includes(h.id)).length;

              return `
                <div style="background:#111827; border:1px solid ${isUnlocked ? 'rgba(16,185,129,0.3)' : '#1f293d'}; border-radius:10px; padding:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <span style="font-size:24px;">${auth.flag}</span>
                      <div>
                        <div style="font-size:13px; font-weight:900; color:var(--tx);">${auth.name}</div>
                        <div style="font-size:9px; color:var(--gold); font-family:monospace; margin-top:1px;">PERMIT: ${auth.code} · ${rName.toUpperCase()}</div>
                      </div>
                    </div>
                    <div>
                      ${isUnlocked ? `
                        <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.12); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace;">
                          ✓ ACTIVE
                        </span>
                      ` : `
                        <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="unlock-region" data-region="${rName}" ${S.money < auth.cost ? 'disabled style="opacity:0.5;"' : ''}>
                          OBTAIN ($${(auth.cost/1000).toFixed(0)}k)
                        </button>
                      `}
                    </div>
                  </div>
                  <div style="font-size:10px; color:var(--mu); line-height:1.4; margin-bottom:8px;">
                    ${auth.description}
                  </div>
                  <div style="font-size:9px; font-family:monospace; color:rgba(255,255,255,0.5); display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                    <span>Cities: ${citiesInRegion}</span>
                    <span style="color:${ownedCount > 0 ? 'var(--grn)' : 'var(--mu)'};">${ownedCount}/${hubsInRegion.length} Hubs Owned</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- TAB 2: REGIONAL HUBS & TERMINALS -->
        ${hubTab === 'hubs' ? `
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            ${REGIONAL_HUBS.map(hub => {
              const isOwned = (S.depots || []).includes(hub.id);
              const regionUnlocked = isRegionUnlocked(S, hub.region);

              return `
                <div style="background:#111827; border:1px solid ${isOwned ? 'rgba(16,185,129,0.3)' : regionUnlocked ? '#1f293d' : 'rgba(239,68,68,0.2)'}; border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                  <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                    <span style="font-size:26px; flex-shrink:0;">${hub.icon}</span>
                    <div style="min-width:0;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:13px; font-weight:900; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${hub.name}</span>
                        <span style="font-size:9px; color:var(--gold); font-family:monospace; background:#0e1320; border:1px solid rgba(193,154,91,0.3); padding:1px 6px; border-radius:3px;">${hub.region}</span>
                      </div>
                      <div style="font-size:10px; color:var(--mu); margin-top:2px; line-height:1.3;">${hub.desc}</div>
                      <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:4px;">
                        Capacity: <b style="color:var(--tx);">+${hub.berths} Berths</b> · Terminal Hub: <b style="color:var(--gold);">${hub.city}</b>
                      </div>
                    </div>
                  </div>
                  <div style="flex-shrink:0;">
                    ${isOwned ? `
                      <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.12); border:1px solid var(--grn); padding:6px 10px; border-radius:4px; font-family:monospace; white-space:nowrap;">
                        ✓ OPERATIONAL
                      </span>
                    ` : !regionUnlocked ? `
                      <span style="font-size:9px; font-weight:800; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:6px 10px; border-radius:4px; font-family:monospace; white-space:nowrap;">
                        🔒 ${hub.region} LOCKED
                      </span>
                    ` : `
                      <button class="btn gold" style="padding:8px 14px; font-size:10px; font-weight:900; white-space:nowrap;" data-act="buy-regional-hub" data-id="${hub.id}" ${S.money < hub.cost ? 'disabled style="opacity:0.5;"' : ''}>
                        ACQUIRE ($${(hub.cost/1000).toFixed(0)}k)
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- TAB 3: FREIGHT CORRIDORS -->
        ${hubTab === 'routes' ? `
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            ${[
              { region: 'Africa', from: 'LAGOS', to: 'IBADAN', km: 135, type: '4-Lane Industrial Expressway', grade: '2.5% Grade', note: 'Primary coastal manufacturing transit' },
              { region: 'Africa', from: 'LAGOS', to: 'ABUJA', km: 760, type: 'Central Federal Trunk Highway', grade: '2.0% Grade', note: 'Express linehaul connecting Atlantic port to Capital' },
              { region: 'Africa', from: 'ABUJA', to: 'KANO', km: 365, type: 'Sahel Savanna Highway', grade: '1.0% Grade', note: 'Northern commercial logistics corridor' },
              { region: 'Africa', from: 'KANO', to: 'MAIDUGURI', km: 585, type: 'Trans-Sahel Desert Corridor', grade: '0.8% Grade', note: 'Lake Chad Basin trading linehaul' },
              { region: 'Europe', from: 'ROTTERDAM', to: 'MUNICH', km: 790, type: 'Autobahn A3 Linehaul Corridor', grade: '3.0% Grade', note: 'Continuous high-speed multimodal freight' },
              { region: 'Europe', from: 'MUNICH', to: 'INNSBRUCK', km: 165, type: 'Brenner Alpine Mountain Pass', grade: '7.8% Extreme Grade', note: 'Severe switchbacks, retarder & winter tires mandatory' },
              { region: 'Europe', from: 'ROTTERDAM', to: 'LYON', km: 780, type: 'Benelux-Rhône Transit Highway', grade: '2.8% Grade', note: 'North-South Atlantic/Mediterranean link' },
              { region: 'America', from: 'CHICAGO', to: 'DENVER', km: 1620, type: 'Interstate 80 Cross-Country', grade: '1.5% Grade', note: 'Great Plains intermodal rail-road corridor' },
              { region: 'America', from: 'CHICAGO', to: 'DALLAS', km: 1490, type: 'Interstate 55 / 35 Freightway', grade: '0.9% Grade', note: 'Midwest manufacturing to Gulf trade' },
              { region: 'America', from: 'DALLAS', to: 'LOS_ANGELES', km: 2310, type: 'Interstate 10 Southwestern Line', grade: '5.5% Grade', note: 'Desert corridor through Cajon Pass' },
              { region: 'Asia', from: 'TOKYO', to: 'NAGOYA', km: 350, type: 'Tomei Expressway Corridor', grade: '1.5% Grade', note: 'High-density Pacific automotive manufacturing' },
              { region: 'Asia', from: 'TOKYO', to: 'NAGANO', km: 245, type: 'Japanese Alps Alpine Pass', grade: '7.2% Grade', note: 'High-altitude mountain curves' },
              { region: 'Asia', from: 'SHANGHAI', to: 'ALMATY', km: 4150, type: 'Trans-Eurasian Silk Road Line', grade: '6.0% Grade', note: 'UN-TIR transcontinental container linehaul' }
            ].map(corridor => {
              const isUnlocked = isRegionUnlocked(S, corridor.region as RegionName);
              const activeCount = (S.active || []).filter((a: any) => 
                (a.from === corridor.from && a.to === corridor.to) || (a.from === corridor.to && a.to === corridor.from)
              ).length;

              return `
                <div style="background:#111827; border:1px solid ${isUnlocked ? '#1f293d' : 'rgba(255,255,255,0.05)'}; opacity:${isUnlocked ? 1 : 0.6}; border-radius:8px; padding:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <div style="font-size:11px; font-weight:800; color:var(--tx); font-family:monospace;">
                      <span style="color:var(--gold);">${LOCATIONS[corridor.from]?.name || corridor.from}</span>
                      <span> ↔ </span>
                      <span style="color:var(--gold);">${LOCATIONS[corridor.to]?.name || corridor.to}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-size:9px; color:var(--mu); font-family:monospace;">${corridor.km} km</span>
                      <span style="font-size:9px; font-weight:800; color:${isUnlocked ? 'var(--grn)' : '#ef4444'}; font-family:monospace;">
                        ${isUnlocked ? '● ACTIVE' : '🔒 LOCKED'}
                      </span>
                    </div>
                  </div>
                  <div style="font-size:10px; color:var(--mu); display:flex; justify-content:space-between; align-items:center;">
                    <span>${corridor.type} (${corridor.grade})</span>
                    ${activeCount > 0 ? `<span style="color:#38bdf8; font-weight:800; font-size:9px; font-family:monospace;">${activeCount} FLEET EN-ROUTE</span>` : ''}
                  </div>
                  <div style="font-size:9px; color:rgba(255,255,255,0.4); margin-top:3px;">
                    ${corridor.note}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- TAB 4: ENTERPRISE TENDERS & CHARTER SUBCONTRACTING -->
        ${hubTab === 'tenders' ? `
          <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;">
            <!-- Section A: Corporate SLA Tenders -->
            <div>
              <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Enterprise Corporate Logistics Tenders</span>
                <span style="font-size:9px; color:var(--gold); font-family:monospace;">ANNUAL COMMITTED FREIGHT</span>
              </div>

              <div style="display:flex; flex-direction:column; gap:10px;">
                ${SAMPLE_TENDERS.map(tender => {
                  const activeTender = (S.corporateTenders || []).find((ct: any) => ct.id === tender.id);
                  const isSigned = !!activeTender;
                  const reqCerts = tender.requiredCerts || [];
                  const missingCerts = reqCerts.filter(c => {
                    if (c === 'ADR Hazmat') return !S.licenses?.includes('adr_hazmat');
                    if (c === 'Cold Chain') return !S.licenses?.includes('cold_chain');
                    return false;
                  });
                  const isCompliant = missingCerts.length === 0;

                  return `
                    <div style="background:#111827; border:1px solid ${isSigned ? 'var(--gold)' : isCompliant ? '#1f293d' : 'rgba(239,68,68,0.25)'}; border-radius:10px; padding:14px;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                          <span style="font-size:24px;">${tender.icon}</span>
                          <div>
                            <div style="font-size:13px; font-weight:900; color:var(--tx);">${tender.client}</div>
                            <div style="font-size:9px; color:var(--gold); font-family:monospace; margin-top:1px;">
                              ${tender.industry} · SLA Target: ${tender.slaTarget}% On-Time
                            </div>
                          </div>
                        </div>
                        <div>
                          ${isSigned ? `
                            <div style="display:flex; align-items:center; gap:6px;">
                              <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(16,185,129,0.12); border:1px solid var(--grn); padding:4px 8px; border-radius:4px; font-family:monospace;">
                                ✓ COMMITTED
                              </span>
                              <button class="btn alt" style="padding:4px 8px; font-size:9px; font-weight:700; color:#ef4444;" data-act="cancel-tender" data-id="${tender.id}">
                                Cancel
                              </button>
                            </div>
                          ` : `
                            <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900;" data-act="sign-tender" data-id="${tender.id}" ${!isCompliant ? 'disabled style="opacity:0.5;"' : ''}>
                              SIGN AGREEMENT
                            </button>
                          `}
                        </div>
                      </div>

                      <div style="font-size:10px; color:var(--mu); line-height:1.4; margin-bottom:8px;">
                        ${tender.desc}
                      </div>

                      ${isSigned ? `
                        <div style="background:#0a0f1d; padding:8px 10px; border-radius:6px; border:1px solid #1f293d; margin-bottom:8px;">
                          <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:4px; font-weight:700;">
                            <span style="color:var(--mu); text-transform:uppercase;">DELIVERY PROGRESS</span>
                            <span style="color:var(--gold); font-family:monospace;">${activeTender.completedLoads || 0} / ${activeTender.totalLoads} LOADS (${activeTender.loadsRemaining || 0} REMAINING)</span>
                          </div>
                          <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                            <div style="width:${Math.round(((activeTender.completedLoads || 0) / activeTender.totalLoads) * 100)}%; height:100%; background:var(--gold); border-radius:3px;"></div>
                          </div>
                        </div>
                      ` : ''}

                      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px; font-size:9px; font-family:monospace;">
                        <div>
                          <span style="color:var(--mu);">Per-Delivery Rate:</span>
                          <span style="color:var(--grn); font-weight:800; margin-left:4px;">+$${tender.ratePerDelivery.toLocaleString()}</span>
                        </div>
                        <div style="text-align:right;">
                          <span style="color:var(--mu);">SLA Bonus:</span>
                          <span style="color:var(--gold); font-weight:800; margin-left:4px;">+$${tender.bonusPayout.toLocaleString()}</span>
                        </div>
                      </div>
                      ${reqCerts.length > 0 ? `
                        <div style="font-size:9px; color:${isCompliant ? 'var(--mu)' : '#ef4444'}; margin-top:4px;">
                          Required Endorsements: ${reqCerts.join(', ')} ${!isCompliant ? '(Missing - Acquire in Carrier Compliance)' : '✓ Verified'}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Section B: Fleet Subcontracting Charters -->
            <div>
              <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">3rd-Party Charter Subcontracting</span>
                <span style="font-size:9px; color:var(--grn); font-family:monospace;">GUARANTEED +$${SUBCONTRACT_DAILY_RATE.toLocaleString()}/DAY PER RIG</span>
              </div>

              <div style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px; margin-bottom:10px; font-size:10px; color:var(--mu); line-height:1.4;">
                Charter idle highway tractors out to allied regional logistics carriers. Chartered rigs generate steady daily passive cashflow directly to your corporate treasury, requiring no manual dispatching.
              </div>

              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(S.fleet || []).map((t: any) => {
                  const isSubcontracted = (S.subcontractedTrucks || []).includes(t.id);
                  const isIdle = t.status === 'idle';

                  return `
                    <div style="background:#0f172a; border:1px solid ${isSubcontracted ? 'rgba(16,185,129,0.3)' : '#1e293b'}; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-size:12px; font-weight:800; color:var(--tx);">${t.name}</div>
                        <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
                          Base: ${t.loc} · ${isSubcontracted ? '<b style="color:var(--grn);">CHARTERED OUT (+$' + SUBCONTRACT_DAILY_RATE.toLocaleString() + '/day)</b>' : 'Status: ' + t.status.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        ${isSubcontracted ? `
                          <button class="btn alt" style="padding:5px 10px; font-size:9px; font-weight:800; color:#ef4444;" data-act="recall-subcontract" data-id="${t.id}">
                            RECALL FLEET RIG
                          </button>
                        ` : isIdle ? `
                          <button class="btn gold" style="padding:5px 10px; font-size:9px; font-weight:900;" data-act="subcontract-rig" data-id="${t.id}">
                            CHARTER OUT (+$${SUBCONTRACT_DAILY_RATE}/d)
                          </button>
                        ` : `
                          <span style="font-size:9px; color:var(--mu); font-family:monospace;">RIG IN TRANSIT</span>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      <div style="height:30px;"></div>
    `;
  }
};
