import { ic } from '../../core/icons';
import { TRAIT_REGISTRY } from '../../domain/drivers/drivers.names';
import { DRIVER_CERTIFICATIONS } from '../../domain/drivers/certifications';
import { skillUpgradeCost, transferFee } from './helpers';

export function renderEmployedCard(d: any, S: any, isExpanded: boolean): string {
  const trait = TRAIT_REGISTRY[d.trait as keyof typeof TRAIT_REGISTRY];
  const assignedTruck = S.fleet?.find((t: any) => t.driverId === d.id || t.id === d.assignedTruckId);
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
            <div style="font-size:10px; color:var(--grn); font-weight:700;">Morale: ${Math.round(morale)}%</div>
            <div style="font-size:10px; color:${fatigue > 75 ? '#ef4444' : 'var(--mu)'}; font-weight:700;">Fatigue: ${Math.round(fatigue)}%</div>
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

          <!-- Hours of Service (HOS) & Wellness Management -->
          <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">HOURS OF SERVICE (HOS) & WELLNESS</span>
              <span style="font-size:9px; font-family:monospace; color:${(d.hosHours || 0) > 10 ? '#ef4444' : 'var(--grn)'}; font-weight:700;">LOGGED: ${(d.hosHours || 0).toFixed(1)}h / 11h</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:800; white-space:nowrap;" data-act="send-driver-rest" data-id="${d.id}" ${d.hosRestUntil && d.hosRestUntil > Date.now() ? 'disabled' : ''}>
                🛌 Mandatory 10h Rest
              </button>
              <button class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800; color:var(--gold); border-color:rgba(193,154,91,0.4);" data-act="award-driver-bonus" data-id="${d.id}" ${S.money >= 500 ? '' : 'disabled'}>
                ⭐ Performance Bonus ($500)
              </button>
            </div>
          </div>

          <!-- Mentorship Program -->
          <div style="background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:12px;">
            <div style="font-size:10px; font-weight:800; color:var(--gold); margin-bottom:4px; text-transform:uppercase;">ACADEMY MENTORSHIP PROGRAM</div>
            ${d.skill <= 2 ? `
              ${d.mentorId ? `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#111827; border:1px solid var(--grn); border-radius:6px; padding:6px 10px;">
                  <div style="font-size:10px; color:var(--grn); font-weight:800;">
                    ✓ Actively Mentored by Master Driver ${S.drivers.find((m: any) => m.id === d.mentorId)?.name || 'Instructor'}
                  </div>
                  <span style="font-size:8px; color:var(--mu); font-family:monospace;">+100% PROMOTION XP</span>
                </div>
              ` : `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:9px; color:var(--mu);">Rookie driver can be paired with an elite Level 5★ Master driver.</span>
                  ${(() => {
                    const master = S.drivers.find((m: any) => m.id !== d.id && m.skill >= 5);
                    if (master) {
                      return `
                        <button class="btn gold" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="pair-mentor" data-rookie-id="${d.id}" data-mentor-id="${master.id}">
                          PAIR WITH ${master.name.split(' ')[0].toUpperCase()} (5★)
                        </button>
                      `;
                    } else {
                      return `<span style="font-size:8px; color:var(--mu); font-family:monospace;">Train a driver to 5★ to unlock mentoring</span>`;
                    }
                  })()}
                </div>
              `}
            ` : `
              <div style="font-size:9px; color:var(--mu);">
                Mid-level commercial operator. Train to Level 5 Master CDL to become a designated academy instructor.
              </div>
            `}
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
}
