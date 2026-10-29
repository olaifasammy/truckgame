import { ic } from '../core/icons';
import { action, fmt, dur, toast } from '../core/ui';
import { refresh } from '../core/store';
import { hire, fire, transferDriver, hireFee, transferFee, trainDriverSkill, certifyDriver, DRIVER_CERTIFICATIONS, skillUpgradeCost } from '../systems/drivers';
import { TRAIT_REGISTRY } from '../domain/drivers/drivers.names';
import { Region } from '../domain/drivers/drivers.types';

let activeTab: 'employed' | 'pool' = 'employed';
let selectedRegion: Region | 'All' = 'All';
let expandedDriverId: number | null = null;
let transferModalDriverId: number | null = null;

action('driver-tab', d => { activeTab = (d as any).tab; refresh(); });
action('driver-region', d => { selectedRegion = (d as any).region; refresh(); });
action('toggle-driver-expand', d => {
  const id = +(d as any).id;
  expandedDriverId = expandedDriverId === id ? null : id;
  refresh();
});

action('hire-driver', d => hire(+(d as any).id));
action('fire-driver', d => fire(+(d as any).id));

action('train-driver-skill', d => {
  trainDriverSkill(+(d as any).id);
  refresh();
});

action('certify-driver', d => {
  certifyDriver(+(d as any).id, (d as any).cert);
  refresh();
});

action('open-transfer-modal', d => {
  transferModalDriverId = +(d as any).id;
  refresh();
});

action('close-transfer-modal', () => {
  transferModalDriverId = null;
  refresh();
});

action('execute-transfer', d => {
  const driverId = +(d as any).driverId;
  const newRegion = (d as any).region as Region;
  transferDriver(driverId, newRegion);
  transferModalDriverId = null;
  refresh();
});

export default {
  id: 'drivers',
  icon: 'user',
  label: 'Drivers',
  hidden: true,
  render(S: any) {
    const employed: any[] = S.drivers || [];
    const pool: any[] = S.pool || [];

    const filteredEmployed = selectedRegion === 'All' ? employed : employed.filter((d: any) => (d.region || 'Africa') === selectedRegion);
    const filteredPool = selectedRegion === 'All' ? pool : pool.filter((d: any) => (d.region || 'Africa') === selectedRegion);

    const regions: (Region | 'All')[] = ['All', 'America', 'Europe', 'Africa', 'Asia'];

    const transferDriverObj = employed.find((d: any) => d.id === transferModalDriverId);

    return `
      <div class="view" style="padding-bottom:100px;">
        <div class="header-banner" style="background:linear-gradient(135deg, var(--s1), var(--bg)); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <div style="font-size:24px; color:var(--gold);">${ic('user')}</div>
            <div>
              <h2 style="margin:0; font-size:18px; color:var(--tx);">Global Driver Workforce</h2>
              <div style="font-size:11px; color:var(--mu);">Manage regional talent, special traits, morale, fatigue, and logistics assignments.</div>
            </div>
          </div>
        </div>

        <!-- Top Navigation Tabs (Employed vs Pool) -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
          <button class="btn ${activeTab === 'employed' ? 'gold' : 'alt'}" style="padding:10px; font-weight:800;" data-act="driver-tab" data-tab="employed">
            Employed (${employed.length})
          </button>
          <button class="btn ${activeTab === 'pool' ? 'gold' : 'alt'}" style="padding:10px; font-weight:800;" data-act="driver-tab" data-tab="pool">
            Recruitment Pool (${pool.length})
          </button>
        </div>

        <!-- Region Filter Pills -->
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px;">
          ${regions.map(r => `
            <button class="btn ${selectedRegion === r ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="driver-region" data-region="${r}">
              ${r.toUpperCase()}
            </button>
          `).join('')}
        </div>

        <!-- Employed Drivers List -->
        ${activeTab === 'employed' ? `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${filteredEmployed.length === 0 ? '<div class="card" style="padding:30px; text-align:center; color:var(--mu);">No drivers found in this region.</div>' : 
              filteredEmployed.map((d: any) => {
                const isExpanded = expandedDriverId === d.id;
                const trait = TRAIT_REGISTRY[d.trait as keyof typeof TRAIT_REGISTRY];
                const assignedTruck = S.fleet?.find((t: any) => t.id === d.assignedTruckId);
                const regionStr = (d.region || 'Africa').toUpperCase();
                const stats = d.stats || { tripsCompleted: 0, kmDriven: 0, earned: 0 };
                const morale = d.morale !== undefined ? d.morale : 90;
                const fatigue = d.fatigue !== undefined ? d.fatigue : 10;
                const salary = d.salary || 200;
                const certs: string[] = d.certifications || [];
                const upgradeFee = skillUpgradeCost(d.skill);

                return `
                  <div class="card ${isExpanded ? 'open' : ''}" style="background:var(--s1); border:1px solid var(--line);">
                    <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-act="toggle-driver-expand" data-id="${d.id}">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; background:var(--bg); border:1px solid var(--gold); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--gold); font-size:16px;">${ic('user')}</div>
                        <div>
                          <div style="font-weight:800; font-size:13px; color:var(--tx);">${d.name}</div>
                          <div style="font-size:10px; color:var(--gold); font-weight:700; margin-top:2px;">${regionStr} · Daily Wage: $${salary}</div>
                          <!-- Skill & Certifications Badges -->
                          <div style="display:flex; align-items:center; gap:4px; margin-top:4px; flex-wrap:wrap;">
                            <span style="font-size:9px; background:rgba(193,154,91,0.15); border:1px solid var(--gold); border-radius:3px; padding:1px 5px; color:var(--gold); font-weight:800; font-family:monospace;">
                              SKILL ${'★'.repeat(d.skill)}${'☆'.repeat(5 - d.skill)}
                            </span>
                            ${certs.length > 0 ? certs.map(c => `
                              <span style="font-size:8px; background:rgba(34,197,94,0.15); border:1px solid var(--grn); border-radius:3px; padding:1px 5px; color:var(--grn); font-weight:700;">
                                ${c}
                              </span>
                            `).join('') : `
                              <span style="font-size:8px; color:var(--mu); font-family:monospace;">Standard CDL Only</span>
                            `}
                          </div>
                        </div>
                      </div>
                      <div style="text-align:right; display:flex; align-items:center; gap:10px;">
                        <div>
                          <div style="font-size:10px; color:var(--grn); font-weight:700;">Morale: ${morale}%</div>
                          <div style="font-size:10px; color:${fatigue > 75 ? '#ef4444' : 'var(--mu)'}; font-weight:700;">Fatigue: ${fatigue}%</div>
                        </div>
                        <div style="font-size:14px; color:var(--mu);">${isExpanded ? '▲' : '▼'}</div>
                      </div>
                    </div>

                    ${isExpanded ? `
                      <div style="margin-top:14px; padding-top:14px; border-top:1px solid var(--line);">
                        <!-- Driver Skill Academy Promotion -->
                        <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                              <div style="font-size:11px; font-weight:800; color:var(--tx);">Commercial Skill Advancement</div>
                              <div style="font-size:9px; color:var(--mu); margin-top:1px;">Higher skill reduces transit time, fuel consumption, and vehicle stress.</div>
                            </div>
                            <div>
                              ${d.skill >= 5 ? `
                                <span style="font-size:9px; font-weight:900; color:var(--gold); font-family:monospace; background:rgba(193,154,91,0.15); border:1px solid var(--gold); padding:4px 8px; border-radius:4px;">
                                  ★ MASTER CDL (5/5)
                                </span>
                              ` : `
                                <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="train-driver-skill" data-id="${d.id}" ${S.money >= upgradeFee ? '' : 'disabled'}>
                                  TRAIN TO LVL ${d.skill + 1}★ ($${upgradeFee.toLocaleString()})
                                </button>
                              `}
                            </div>
                          </div>
                        </div>

                        <!-- Specialized Freight Endorsements & Certifications -->
                        <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">COMMERCIAL ENDORSEMENTS & CERTIFICATIONS</span>
                            <span style="font-size:9px; font-family:monospace; color:var(--mu);">${certs.length} / ${DRIVER_CERTIFICATIONS.length} ENDORSED</span>
                          </div>
                          <div style="display:flex; flex-direction:column; gap:6px;">
                            ${DRIVER_CERTIFICATIONS.map(cert => {
                              const hasCert = certs.includes(cert.id);
                              const canAfford = S.money >= cert.cost;
                              return `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#111827; border:1px solid ${hasCert ? 'rgba(34,197,94,0.3)' : '#1e293b'}; border-radius:6px; padding:8px 10px;">
                                  <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:16px;">${cert.icon}</span>
                                    <div>
                                      <div style="font-size:11px; font-weight:800; color:var(--tx);">${cert.name}</div>
                                      <div style="font-size:9px; color:var(--mu);">${cert.desc}</div>
                                    </div>
                                  </div>
                                  <div>
                                    ${hasCert ? `
                                      <span style="font-size:9px; font-weight:900; color:var(--grn); font-family:monospace; background:rgba(34,197,94,0.12); border:1px solid var(--grn); padding:3px 8px; border-radius:4px;">
                                        ✓ ENDORSED
                                      </span>
                                    ` : `
                                      <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="certify-driver" data-id="${d.id}" data-cert="${cert.id}" ${canAfford ? '' : 'disabled'}>
                                        ENROLL $${cert.cost.toLocaleString()}
                                      </button>
                                    `}
                                  </div>
                                </div>
                              `;
                            }).join('')}
                          </div>
                        </div>

                        <!-- Special Trait -->
                        <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px; margin-bottom:12px;">
                          <div style="font-size:10px; font-weight:800; color:var(--gold); margin-bottom:4px;">SPECIAL TRAIT: ${trait?.name || 'Standard'}</div>
                          <div style="font-size:11px; color:var(--tx);">${trait?.desc || 'Reliable operational characteristics.'}</div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px; text-align:center;">
                          <div class="card" style="padding:8px; background:var(--bg);"><small style="font-size:9px; color:var(--mu);">TRIPS</small><div style="font-size:12px; font-weight:800; color:var(--tx);">${stats.tripsCompleted}</div></div>
                          <div class="card" style="padding:8px; background:var(--bg);"><small style="font-size:9px; color:var(--mu);">KM DRIVEN</small><div style="font-size:12px; font-weight:800; color:var(--tx);">${stats.kmDriven.toLocaleString()} km</div></div>
                          <div class="card" style="padding:8px; background:var(--bg);"><small style="font-size:9px; color:var(--mu);">EARNED</small><div style="font-size:12px; font-weight:800; color:var(--grn);">$${stats.earned.toLocaleString()}</div></div>
                        </div>

                        <div style="font-size:11px; color:var(--mu); margin-bottom:12px;">
                          Assigned Truck: <b style="color:var(--tx);">${assignedTruck ? assignedTruck.name : 'None (Unassigned)'}</b>
                        </div>

                        <div style="display:flex; gap:8px;">
                          <button class="btn alt" style="flex:1; padding:8px; font-size:10px; font-weight:800;" data-act="open-transfer-modal" data-id="${d.id}">
                            🌍 Transfer Region ($${transferFee.toLocaleString()})
                          </button>
                          <button class="btn alt" style="padding:8px 16px; font-size:10px; font-weight:800; color:#ef4444; border-color:rgba(239,68,68,0.3);" data-act="fire-driver" data-id="${d.id}">
                            Fire
                          </button>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
          </div>
        ` : `
          <!-- Recruitment Pool List -->
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${filteredPool.length === 0 ? '<div class="card" style="padding:30px; text-align:center; color:var(--mu);">No candidates available in this region. Check back later.</div>' : 
              filteredPool.map((d: any) => {
                const trait = TRAIT_REGISTRY[d.trait as keyof typeof TRAIT_REGISTRY];
                const cost = hireFee(d);
                const regionStr = (d.region || 'Africa').toUpperCase();
                const salary = d.salary || 200;

                return `
                  <div class="card" style="background:var(--s1); border:1px solid var(--line);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; background:var(--bg); border:1px solid var(--gold); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--gold); font-size:16px;">${ic('user')}</div>
                        <div>
                          <div style="font-weight:800; font-size:13px; color:var(--tx);">${d.name}</div>
                          <div style="font-size:10px; color:var(--gold); font-weight:700; margin-top:2px;">${regionStr} · Skill ${d.skill}/5 · Wage: $${salary}/day</div>
                          <div style="font-size:10px; color:var(--accent); font-weight:700; margin-top:2px;">Trait: ${trait?.name || 'Standard'}</div>
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:12px; font-weight:900; color:var(--gold); margin-bottom:4px;">$${cost.toLocaleString()}</div>
                        <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900;" data-act="hire-driver" data-id="${d.id}">
                          HIRE
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        `}

        <!-- Transfer Region Modal -->
        ${transferDriverObj ? `
          <div style="position:fixed; inset:0; background:rgba(5,8,18,0.95); z-index:1500; display:flex; align-items:center; justify-content:center; padding:16px;">
            <div style="background:var(--s1); border:1px solid var(--gold); border-radius:16px; width:100%; max-width:400px; padding:20px; position:relative;">
              <button style="position:absolute; top:14px; right:16px; background:none; border:none; color:var(--mu); font-size:18px; cursor:pointer;" data-act="close-transfer-modal">✕</button>
              <h3 style="margin:0 0 4px 0; font-size:16px; color:var(--tx);">Transfer ${transferDriverObj.name}</h3>
              <div style="font-size:11px; color:var(--mu); margin-bottom:16px;">Current Region: <b style="color:var(--gold);">${transferDriverObj.region || 'Africa'}</b> · Fee: <b style="color:var(--gold);">$${transferFee.toLocaleString()}</b></div>

              <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                ${(['America', 'Europe', 'Africa', 'Asia'] as Region[]).map(reg => `
                  <button class="btn ${transferDriverObj.region === reg ? 'gold' : 'alt'}" style="padding:10px; font-weight:800; justify-content:center;" data-act="execute-transfer" data-driver-id="${transferDriverObj.id}" data-region="${reg}" ${transferDriverObj.region === reg ? 'disabled' : ''}>
                    Transfer to ${reg}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
};
