import { action, fmt } from '../../../core/ui';
import { refresh } from '../../../core/store';
import { INSURANCE_POLICIES } from '../../../domain/finance/banking';

const INS_UNIT_PAGE_SIZE = 6;
let insuranceUnitPage = 1;

action('ins-unit-prev', () => {
  if (insuranceUnitPage > 1) {
    insuranceUnitPage--;
    refresh();
  }
});

action('ins-unit-next', () => {
  insuranceUnitPage++;
  refresh();
});
import {
  calculateUnderwritingProfile,
  DEDUCTIBLE_TIERS,
  DeductibleTier,
  getEffectivePolicyNumbers
} from '../../../domain/finance/insurance';
import { TRUCK_MODELS } from '../../../domain/trucks/trucks.data';

export function renderInsuranceTab(S: any): string {
  const ins = S.insurance || { liability: true, collision: true, cargo: false };
  const profile = calculateUnderwritingProfile(S);
  const fleet = Array.isArray(S.fleet) ? S.fleet : [];
  const claims = Array.isArray(S.insuranceClaims) ? S.insuranceClaims : [];

  const riskColor =
    profile.riskGrade === 'LOW RISK'
      ? 'var(--grn)'
      : profile.riskGrade === 'MODERATE'
        ? '#eab308'
        : profile.riskGrade === 'ELEVATED'
          ? '#f97316'
          : '#ef4444';

  const safetyColor =
    profile.safetyGrade === 'SATISFACTORY'
      ? 'var(--grn)'
      : profile.safetyGrade === 'CONDITIONAL'
        ? '#eab308'
        : '#ef4444';

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">

      <!-- Underwriting & Risk Summary -->
      <div style="background:linear-gradient(135deg, #111827 0%, #0b101d 100%); border:1px solid #1f293d; border-radius:12px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
          <div>
            <div style="font-size:9px; font-weight:900; color:var(--gold); letter-spacing:1.2px; text-transform:uppercase;">COMMERCIAL CARRIER UNDERWRITING</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">Risk &amp; Insurance Desk</div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px;">
              DOT Safety: <span style="color:${safetyColor}; font-weight:800;">${profile.safetyGrade}</span> ·
              Rate Factor: <span style="color:var(--tx); font-weight:800; font-family:monospace;">${profile.premiumMultiplier.toFixed(2)}x</span>
            </div>
          </div>
          <div style="text-align:right; background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:8px 12px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace; text-transform:uppercase;">RISK RATING</div>
            <div style="font-size:13px; font-weight:900; color:${riskColor}; font-family:monospace;">${profile.riskGrade} (${profile.riskScore}/100)</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">DAILY PREMIUM</div>
            <div style="font-size:13px; font-weight:900; color:#ef4444; font-family:monospace; margin-top:2px;">-${fmt(profile.dailyPremiumUsd)}/d</div>
            <div style="font-size:8px; color:var(--mu); margin-top:1px;">${profile.activePolicies}/3 policies active</div>
          </div>
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">FLEET CONDITION</div>
            <div style="font-size:13px; font-weight:900; color:${profile.avgFleetHealth >= 80 ? 'var(--grn)' : '#eab308'}; font-family:monospace; margin-top:2px;">${profile.avgFleetHealth}%</div>
            <div style="font-size:8px; color:var(--mu); margin-top:1px;">${profile.uncompliantTrucks} uncompliant unit(s)</div>
          </div>
          <div style="background:#080c16; border:1px solid #1f293d; border-radius:8px; padding:9px;">
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">CLAIMS PAID</div>
            <div style="font-size:13px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">${fmt(profile.totalClaimsPaidUsd)}</div>
            <div style="font-size:8px; color:var(--mu); margin-top:1px;">${profile.claimCount} incident(s) on record</div>
          </div>
        </div>

        ${(profile.uncompliantTrucks > 0 || profile.fatiguedDrivers > 0) ? `
          <div style="margin-top:10px; background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:8px 10px; font-size:10px; color:#fbbf24;">
            ⚠️ Underwriting Notice: ${profile.uncompliantTrucks > 0 ? `${profile.uncompliantTrucks} unit(s) lack active DMV registration/inspection (increases premium &amp; voids collision claims)` : ''}${profile.uncompliantTrucks > 0 && profile.fatiguedDrivers > 0 ? ' · ' : ''}${profile.fatiguedDrivers > 0 ? `${profile.fatiguedDrivers} driver(s) flagged for high fatigue/stress` : ''}.
          </div>
        ` : ''}
      </div>

      <!-- Deductible Tier Selector -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
        <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; text-transform:uppercase; margin-bottom:8px;">DEDUCTIBLE &amp; RETENTION SCHEDULE</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
          ${(Object.keys(DEDUCTIBLE_TIERS) as DeductibleTier[]).map(tierKey => {
            const t = DEDUCTIBLE_TIERS[tierKey];
            const isActive = profile.tier.id === t.id;
            return `
              <button
                type="button"
                data-act="set-insurance-tier"
                data-tier="${t.id}"
                style="text-align:left; background:${isActive ? 'rgba(193,154,91,0.12)' : '#080c16'}; border:1px solid ${isActive ? 'var(--gold)' : '#1f293d'}; border-radius:8px; padding:8px; cursor:pointer; color:var(--tx);"
              >
                <div style="font-size:10px; font-weight:800; color:${isActive ? 'var(--gold)' : 'var(--tx)'};">${t.label}</div>
                <div style="font-size:8.5px; color:var(--mu); margin-top:3px; line-height:1.3;">${t.desc}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Policy Cards -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; text-transform:uppercase; letter-spacing:0.5px;">COMMERCIAL COVERAGE POLICIES</div>
        ${Object.values(INSURANCE_POLICIES).map(p => {
          const active = !!ins[p.id];
          const eff = getEffectivePolicyNumbers(p, profile);
          return `
            <div style="background:#111827; border:1px solid ${active ? 'rgba(34,197,94,0.45)' : '#1f293d'}; border-radius:10px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="flex:1;">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="font-size:12px; font-weight:900; color:var(--tx);">${p.name}</span>
                    <span style="font-size:8px; font-weight:800; font-family:monospace; padding:2px 6px; border-radius:4px; background:${active ? 'rgba(34,197,94,0.14)' : 'rgba(148,163,184,0.1)'}; color:${active ? 'var(--grn)' : 'var(--mu)'};">
                      ${active ? 'ACTIVE' : 'UNINSURED'}
                    </span>
                  </div>
                  <div style="font-size:9px; color:var(--gold); font-weight:700; margin-top:2px;">${p.type}</div>
                  <div style="font-size:10px; color:var(--mu); margin-top:6px; line-height:1.4;">${p.desc}</div>
                </div>
                <button
                  type="button"
                  class="btn ${active ? 'alt' : 'gold'}"
                  style="padding:7px 12px; font-size:9.5px; font-weight:900; white-space:nowrap;"
                  data-act="toggle-insurance"
                  data-id="${p.id}"
                >
                  ${active ? 'CANCEL' : 'ENROLL'}
                </button>
              </div>

              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:10px; padding-top:8px; border-top:1px solid #1f293d;">
                <div>
                  <div style="font-size:8px; color:var(--mu); font-family:monospace;">DAILY PREMIUM</div>
                  <div style="font-size:11px; font-weight:900; color:var(--tx); font-family:monospace;">${fmt(eff.dailyCost)}/day</div>
                </div>
                <div>
                  <div style="font-size:8px; color:var(--mu); font-family:monospace;">COVERAGE</div>
                  <div style="font-size:11px; font-weight:900; color:var(--grn); font-family:monospace;">${p.coveragePct}%</div>
                </div>
                <div>
                  <div style="font-size:8px; color:var(--mu); font-family:monospace;">DEDUCTIBLE</div>
                  <div style="font-size:11px; font-weight:900; color:#fbbf24; font-family:monospace;">${fmt(eff.deductible)}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Fleet Unit Coverage Matrix -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
        <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; text-transform:uppercase; margin-bottom:8px;">UNIT UNDERWRITING STATUS (${fleet.length})</div>
        ${fleet.length === 0 ? `
          <div style="font-size:11px; color:var(--mu); padding:8px 0;">No tractors in fleet.</div>
        ` : (() => {
          const totalUnitPages = Math.max(1, Math.ceil(fleet.length / INS_UNIT_PAGE_SIZE));
          if (insuranceUnitPage > totalUnitPages) insuranceUnitPage = totalUnitPages;
          const unitStart = (insuranceUnitPage - 1) * INS_UNIT_PAGE_SIZE;
          const pagedFleet = fleet.slice(unitStart, unitStart + INS_UNIT_PAGE_SIZE);
          return `
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${pagedFleet.map((t: any) => {
              const m = TRUCK_MODELS[t.modelId];
              const compliant = !!t.regNo && t.registrationStatus !== 'unregistered' && t.registrationStatus !== 'suspended' && t.registrationStatus !== 'inspection_expired';
              const covered = compliant && (ins.liability || ins.collision);
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px 10px; font-size:10px;">
                  <div>
                    <span style="font-weight:800; color:var(--tx);">#${t.id} ${t.name || m?.name || t.modelId}</span>
                    <span style="color:var(--mu); font-family:monospace; margin-left:6px;">${t.regNo || 'NO PLATE'}</span>
                  </div>
                  <span style="font-size:9px; font-weight:800; font-family:monospace; color:${covered ? 'var(--grn)' : !compliant ? '#fbbf24' : '#ef4444'};">
                    ${covered ? '✓ INSURED' : !compliant ? '⚠ UNCOMPLIANT' : '✕ NO POLICY'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
          ${totalUnitPages > 1 ? `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:6px 10px;">
              <button type="button" class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="ins-unit-prev" ${insuranceUnitPage <= 1 ? 'disabled' : ''}>← Prev</button>
              <span style="font-size:9.5px; color:var(--mu); font-family:monospace;">Page <b style="color:var(--tx);">${insuranceUnitPage}</b> of <b style="color:var(--tx);">${totalUnitPages}</b> (${fleet.length} units)</span>
              <button type="button" class="btn alt" style="padding:4px 10px; font-size:9px; font-weight:800;" data-act="ins-unit-next" ${insuranceUnitPage >= totalUnitPages ? 'disabled' : ''}>Next →</button>
            </div>
          ` : ''}
          `;
        })()}
      </div>

      <!-- Claims History -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
        <div style="font-size:10px; font-weight:800; color:var(--gold); font-family:monospace; text-transform:uppercase; margin-bottom:6px;">CLAIMS &amp; LOSS LEDGER</div>
        ${claims.length === 0 ? `
          <div style="font-size:10px; color:var(--grn); background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:6px; padding:8px 10px;">
            ✓ Zero claims on record — Carrier qualifies for clean loss-history underwriting.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${claims.slice(-8).reverse().map((c: any) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#080c16; border:1px solid #1f293d; border-radius:6px; padding:7px 10px; font-size:10px;">
                <div>
                  <div style="font-weight:800; color:var(--tx);">${c.title || 'Claim Payout'}</div>
                  <div style="font-size:9px; color:var(--mu);">${c.date || ''} · ${c.policyId || 'collision'}</div>
                </div>
                <div style="font-family:monospace; font-weight:900; color:var(--grn);">+${fmt(c.payoutUsd || 0)}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>
  `;
}
