/**
 * Commercial Loans & Enterprise Credit Facilities View
 *
 * Professional corporate banking interface with dynamic valuation-based borrowing capacity,
 * tiered facilities (Startup, Fleet Acquisition, Syndicated Corporate), and rotating bank offers.
 */

import { fmt, action, toast } from '../../../core/ui';
import { refresh, set } from '../../../core/store';
import {
  calculateEnterpriseCreditProfile,
  getAvailableLoanOffers,
  executeTakeLoan,
  executePayoffLoan,
  calculateLoanAmortization,
  LoanOffer
} from '../../../domain/finance/commercialLoans';

let activeCategoryFilter: 'all' | 'startup' | 'fleet' | 'enterprise' | 'special' | 'active' = 'all';
let customDrawdownAmount: number = 0;
let customDrawdownTermDays: number = 60;
let showScoreDetails: boolean = false;

action('set-loan-category-filter', d => {
  activeCategoryFilter = (d as any).filter || 'all';
  refresh();
});

action('toggle-credit-factors', () => {
  showScoreDetails = !showScoreDetails;
  refresh();
});

action('take-commercial-loan', d => {
  const offerId = (d as any).offerId;
  set(S => {
    executeTakeLoan(S, offerId);
  });
  refresh();
});

action('payoff-commercial-loan', d => {
  const loanId = (d as any).loanId;
  set(S => {
    executePayoffLoan(S, loanId);
  });
  refresh();
});

action('set-custom-drawdown-amount', d => {
  const amt = parseInt((d as any).amount, 10) || 0;
  customDrawdownAmount = amt;
  refresh();
});

action('set-custom-drawdown-term', d => {
  const term = parseInt((d as any).term, 10) || 60;
  customDrawdownTermDays = term;
  refresh();
});

action('execute-custom-drawdown', () => {
  if (customDrawdownAmount <= 0) {
    toast('Select or enter an amount to draw down', 'err');
    return;
  }
  set(S => {
    executeTakeLoan(S, 'custom_drawdown', customDrawdownAmount);
    customDrawdownAmount = 0;
  });
  refresh();
});

export function renderLoansTab(S: any): string {
  const profile = calculateEnterpriseCreditProfile(S);
  const offers = getAvailableLoanOffers(S);
  const activeLoans = S.loans || [];

  const totalDailyDebtService = activeLoans.reduce((sum: number, l: any) => sum + (l.dailyRate || 0), 0);
  const totalOutstandingBalance = activeLoans.reduce((sum: number, l: any) => sum + (l.balance || 0), 0);

  // Filter offers based on user selected category
  const filteredOffers = offers.filter(o => {
    if (activeCategoryFilter === 'all') return true;
    return o.category === activeCategoryFilter;
  });

  const RATING_TIER_NAMES: Record<string, string> = {
    AAA: 'Prime Sovereign Conglomerate',
    AA: 'High-Grade Institutional Carrier',
    A: 'Upper-Medium Commercial Fleet',
    BBB: 'Established Regional Operator',
    BB: 'Early-Growth Carrier',
    B: 'Speculative / Startup Venture'
  };

  // Custom drawdown preview
  const defaultDrawdown = customDrawdownAmount > 0
    ? customDrawdownAmount
    : Math.min(profile.availableCreditUsd, Math.max(25000, Math.round(profile.availableCreditUsd * 0.25 / 10000) * 10000));
  const effectiveCustomAmt = customDrawdownAmount > 0 ? customDrawdownAmount : defaultDrawdown;
  const customApr = profile.rating === 'AAA' ? 3.4 : profile.rating === 'AA' ? 4.2 : profile.rating === 'A' ? 5.2 : 6.5;
  const customAmort = calculateLoanAmortization(effectiveCustomAmt, customApr, customDrawdownTermDays);

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- 1. Executive Credit Profile & Borrowing Base Header -->
      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:12px; padding:18px; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
        
        <!-- Header row -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:9.5px; color:var(--gold); font-weight:800; letter-spacing:1px; text-transform:uppercase; font-family:monospace;">
              CORPORATE DEBT CAPACITY & BORROWING BASE
            </div>
            <h2 style="font-size:18px; font-weight:900; color:var(--tx); margin:2px 0;">
              Commercial Lending Facilities
            </h2>
            <div style="font-size:11px; color:var(--mu); font-family:monospace;">
              Calibrated to Tangible Asset Valuation: <b style="color:var(--tx);">${fmt(profile.totalAssetsUsd)}</b>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px; color:var(--mu); font-family:monospace; text-transform:uppercase;">CREDIT GRADE</div>
            <div style="font-size:22px; font-weight:900; color:var(--gold); font-family:monospace; line-height:1.1;">
              ${profile.rating}
              <span style="font-size:11px; color:var(--mu); font-weight:700;">(${profile.score}/900)</span>
            </div>
            <div style="font-size:9.5px; color:#10b981; font-weight:700;">
              ${RATING_TIER_NAMES[profile.rating] || 'Commercial Carrier'}
            </div>
          </div>
        </div>

        <!-- Metric Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">
          
          <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px;">
            <div style="font-size:8.5px; color:var(--mu); text-transform:uppercase; font-family:monospace;">MAX CREDIT LIMIT</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
              ${fmt(profile.maxCreditLimitUsd)}
            </div>
            <div style="font-size:8.5px; color:var(--gold); margin-top:2px;">
              ${Math.round((profile.maxCreditLimitUsd / profile.totalAssetsUsd) * 100)}% of Enterprise Assets
            </div>
          </div>

          <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px;">
            <div style="font-size:8.5px; color:var(--mu); text-transform:uppercase; font-family:monospace;">AVAILABLE CAPACITY</div>
            <div style="font-size:16px; font-weight:900; color:${profile.availableCreditUsd > 0 ? 'var(--grn)' : '#ef4444'}; font-family:monospace; margin-top:2px;">
              ${fmt(profile.availableCreditUsd)}
            </div>
            <div style="font-size:8.5px; color:var(--mu); margin-top:2px;">
              Ready for immediate drawdown
            </div>
          </div>

          <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px;">
            <div style="font-size:8.5px; color:var(--mu); text-transform:uppercase; font-family:monospace;">ACTIVE DEBT LOAD</div>
            <div style="font-size:16px; font-weight:900; color:${profile.currentDebtUsd > 0 ? '#f59e0b' : 'var(--mu)'}; font-family:monospace; margin-top:2px;">
              ${fmt(profile.currentDebtUsd)}
            </div>
            <div style="font-size:8.5px; color:var(--mu); margin-top:2px;">
              ${activeLoans.length} active ${activeLoans.length === 1 ? 'facility' : 'facilities'}
            </div>
          </div>

          <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px;">
            <div style="font-size:8.5px; color:var(--mu); text-transform:uppercase; font-family:monospace;">DAILY DEBT SERVICE</div>
            <div style="font-size:16px; font-weight:900; color:${totalDailyDebtService > 0 ? '#ef4444' : 'var(--mu)'}; font-family:monospace; margin-top:2px;">
              -${fmt(totalDailyDebtService)}/day
            </div>
            <div style="font-size:8.5px; color:var(--mu); margin-top:2px;">
              Deducted at daily sim tick
            </div>
          </div>

        </div>

        <!-- Credit Utilization Gauge -->
        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:9.5px; font-family:monospace; color:var(--mu); margin-bottom:4px;">
            <span>CREDIT FACILITY UTILIZATION: <b style="color:var(--tx);">${profile.utilizationPct}%</b></span>
            <span>DEBT-TO-EQUITY (LEVERAGE): <b style="color:var(--tx);">${profile.debtToEquityPct}%</b></span>
          </div>
          <div style="height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; display:flex;">
            <div style="width:${profile.utilizationPct}%; height:100%; background:${profile.utilizationPct > 75 ? '#ef4444' : profile.utilizationPct > 45 ? '#f59e0b' : 'var(--gold)'}; transition:width 0.3s;"></div>
          </div>
        </div>

        <!-- Collapsible Credit Factors Toggle -->
        <button class="btn alt" style="width:100%; padding:6px; font-size:9.5px; font-weight:700; display:flex; justify-content:center; align-items:center; gap:6px;" data-act="toggle-credit-factors">
          <span>${showScoreDetails ? '▲ Hide Commercial Underwriting Breakdown' : '▼ View Commercial Underwriting Factors & Asset Backing'}</span>
        </button>

        ${showScoreDetails ? `
          <div style="margin-top:12px; padding:12px; background:#060a14; border-radius:8px; border:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; gap:8px;">
            <div style="font-size:9.5px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace;">
              BALANCE SHEET & UNDERWRITING AUDIT
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:10px; font-family:monospace;">
              <div>Total Asset Valuation: <b style="color:var(--tx);">${fmt(profile.totalAssetsUsd)}</b></div>
              <div>Net Enterprise Equity: <b style="color:var(--tx);">${fmt(profile.netEnterpriseValueUsd)}</b></div>
              <div>Delivered Loads Track: <b style="color:var(--tx);">${S.loads || 0} hauls</b></div>
              <div>Safety & Compliance: <b style="color:var(--tx);">${S.reputation ?? 100}/100</b></div>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:8px; display:flex; flex-direction:column; gap:6px;">
              ${profile.scoreFactors.map(f => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace;">
                  <span style="color:var(--tx);">${f.label}</span>
                  <span style="color:${f.impact === 'positive' ? 'var(--grn)' : f.impact === 'negative' ? '#ef4444' : 'var(--mu)'};">${f.detail}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>

      <!-- 2. Active Debt Facilities (if any) -->
      ${activeLoans.length > 0 ? `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <div style="font-size:9.5px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace;">
                CURRENT ACTIVE LIABILITIES
              </div>
              <h3 style="font-size:15px; font-weight:900; color:var(--tx); margin:1px 0;">
                Serviced Loan Facilities (${activeLoans.length})
              </h3>
            </div>
            <div style="text-align:right;">
              <span style="font-size:9px; color:var(--mu); font-family:monospace;">TOTAL PRINCIPAL REMAINING</span>
              <div style="font-size:15px; font-weight:900; color:#f59e0b; font-family:monospace;">
                ${fmt(totalOutstandingBalance)}
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            ${activeLoans.map((l: any) => {
              const payoffPct = Math.max(0, Math.min(100, Math.round(((l.principal - l.balance) / l.principal) * 100)));
              const canPayoff = (S.money || 0) >= l.balance;
              return `
                <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <div>
                      <div style="font-size:13px; font-weight:800; color:var(--tx);">${l.name}</div>
                      <div style="font-size:10px; color:var(--mu); font-family:monospace; margin-top:2px;">
                        ${l.lender || 'Commercial Lender'} · ${l.apr}% APR · Issued: $${(l.principal || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:14px; font-weight:900; color:#ef4444; font-family:monospace;">
                        ${fmt(l.balance)}
                      </div>
                      <div style="font-size:9px; color:var(--mu); font-family:monospace;">
                        -$${(l.dailyRate || 0).toLocaleString()}/day (${Math.ceil(l.daysRemaining || 0)}d left)
                      </div>
                    </div>
                  </div>

                  <!-- Progress -->
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:9px; font-family:monospace; color:var(--mu); margin-bottom:3px;">
                      <span>Amortization Progress: ${payoffPct}%</span>
                      <span>${Math.ceil(l.daysRemaining || 0)} of ${l.termDays || 60} Days Remaining</span>
                    </div>
                    <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                      <div style="width:${payoffPct}%; height:100%; background:var(--grn);"></div>
                    </div>
                  </div>

                  <!-- Action -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                    <span style="font-size:9px; color:var(--mu); font-family:monospace;">
                      Early settlement eliminates future daily interest charges
                    </span>
                    <button class="btn gold" style="padding:6px 14px; font-size:9.5px; font-weight:900;" data-act="payoff-commercial-loan" data-loan-id="${l.id}" ${canPayoff ? '' : 'disabled style="opacity:0.4;"'}>
                      ${canPayoff ? `SETTLE EARLY (${fmt(l.balance)})` : `NEEDS ${fmt(l.balance - S.money)} MORE`}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 3. Category Filter Navigation -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:10px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace;">
            COMMERCIAL CREDIT MARKETPLACE
          </div>
          <div style="font-size:10px; color:var(--mu); font-family:monospace;">
            ${filteredOffers.length} offers calibrated to your tier
          </div>
        </div>

        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;">
          ${[
            { id: 'all', label: 'All Facilities' },
            { id: 'startup', label: 'Startup & Liquidity' },
            { id: 'fleet', label: 'Fleet & Equipment' },
            { id: 'enterprise', label: 'Enterprise Syndicated' },
            { id: 'special', label: '⭐ Special Bank Offers' }
          ].map(f => `
            <button class="btn ${activeCategoryFilter === f.id ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap; flex-shrink:0;" data-act="set-loan-category-filter" data-filter="${f.id}">
              ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 4. Available Loan Facility Cards -->
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${filteredOffers.map(o => {
          const isEligibleCredit = profile.score >= (o.requiredRating === 'AAA' ? 800 : o.requiredRating === 'AA' ? 730 : o.requiredRating === 'A' ? 650 : o.requiredRating === 'BBB' ? 580 : 480);
          const isEligibleAssets = profile.totalAssetsUsd >= o.minAssetsRequired;
          const hasCapacity = profile.availableCreditUsd >= o.principal;
          const alreadyOpen = activeLoans.some((l: any) => l.id === o.id);
          const canBorrow = isEligibleCredit && isEligibleAssets && hasCapacity && !alreadyOpen;

          return `
            <div style="background:#0f172a; border:${o.category === 'special' ? '2px solid var(--gold)' : o.category === 'enterprise' ? '1px solid #3b82f6' : '1px solid #1e293b'}; border-radius:10px; padding:16px; position:relative; box-shadow:0 4px 16px rgba(0,0,0,0.3);">
              
              <!-- Top Row: Badge & Lender -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                <div style="font-size:9.5px; color:${o.category === 'special' ? 'var(--gold)' : o.category === 'enterprise' ? '#60a5fa' : 'var(--mu)'}; font-family:monospace; font-weight:800; text-transform:uppercase;">
                  ${o.badge || o.category.toUpperCase()} · ${o.lender}
                </div>
                <div style="font-size:10px; font-family:monospace;">
                  <span style="color:var(--mu);">REQUIRED GRADE:</span>
                  <b style="color:${isEligibleCredit ? 'var(--grn)' : '#ef4444'};">${o.requiredRating}</b>
                  <span style="color:var(--mu);">(${profile.rating} current)</span>
                </div>
              </div>

              <!-- Title & Principal -->
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                <h3 style="font-size:16px; font-weight:900; color:var(--tx); margin:0;">
                  ${o.name}
                </h3>
                <div style="font-size:20px; font-weight:900; color:var(--gold); font-family:monospace;">
                  ${fmt(o.principal)}
                </div>
              </div>

              <!-- Description -->
              <div style="font-size:11px; color:var(--mu); line-height:1.4; margin-bottom:12px;">
                ${o.description}
              </div>

              <!-- Loan Terms Grid -->
              <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; margin-bottom:12px;">
                <div>
                  <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">ANNUAL APR</div>
                  <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace;">${o.apr}% fixed</div>
                </div>
                <div>
                  <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">FACILITY TERM</div>
                  <div style="font-size:13px; font-weight:900; color:var(--tx); font-family:monospace;">${o.termDays} Days</div>
                </div>
                <div>
                  <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">DAILY DEBT SERVICE</div>
                  <div style="font-size:13px; font-weight:900; color:#ef4444; font-family:monospace;">-${fmt(o.dailyRate)}/day</div>
                </div>
                <div>
                  <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">TOTAL TERM INTEREST</div>
                  <div style="font-size:13px; font-weight:900; color:var(--mu); font-family:monospace;">${fmt(o.totalInterest)}</div>
                </div>
              </div>

              <!-- Benefits -->
              <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px; font-size:10px; font-family:monospace; color:var(--tx);">
                ${o.benefits.map(b => `<span style="color:#a5f3fc;">✓ ${b}</span>`).join('')}
              </div>

              <!-- Action & Qualification Status -->
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; flex-wrap:wrap; gap:8px;">
                <div style="font-size:10px; font-family:monospace;">
                  ${alreadyOpen ? `
                    <span style="color:#f59e0b; font-weight:800;">● Active Tranche Open (Settle prior tranche to re-draw)</span>
                  ` : !isEligibleCredit ? `
                    <span style="color:#ef4444; font-weight:800;">✕ Requires Credit Grade ${o.requiredRating} (Deliver more freight to upgrade)</span>
                  ` : !isEligibleAssets ? `
                    <span style="color:#ef4444; font-weight:800;">✕ Requires ${fmt(o.minAssetsRequired)} in Corporate Assets</span>
                  ` : !hasCapacity ? `
                    <span style="color:#ef4444; font-weight:800;">✕ Exceeds Available Credit Headroom (${fmt(profile.availableCreditUsd)} left)</span>
                  ` : `
                    <span style="color:var(--grn); font-weight:800;">✓ Pre-Approved by ${o.lender}</span>
                  `}
                </div>

                <button class="btn gold" style="padding:8px 18px; font-size:10px; font-weight:900; letter-spacing:0.5px;" data-act="take-commercial-loan" data-offer-id="${o.id}" ${canBorrow ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;"'}>
                  DRAW DOWN ${fmt(o.principal)}
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- 5. Tailored Custom Drawdown Facility Tool -->
      <div style="background:#0b1120; border:1px solid #1e293b; border-radius:12px; padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:9.5px; color:var(--gold); font-weight:800; text-transform:uppercase; font-family:monospace;">
              ON-DEMAND LIQUIDITY
            </div>
            <h3 style="font-size:16px; font-weight:900; color:var(--tx); margin:2px 0;">
              Custom Credit Line Drawdown
            </h3>
            <div style="font-size:11px; color:var(--mu); font-family:monospace;">
              Draw any specific capital amount up to your verified borrowing base (${fmt(profile.availableCreditUsd)})
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px; color:var(--mu); font-family:monospace;">EFFECTIVE APR</div>
            <div style="font-size:16px; font-weight:900; color:var(--grn); font-family:monospace;">${customApr}% APR</div>
          </div>
        </div>

        <!-- Quick Select Buttons -->
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">
          ${[
            { label: '$25,000', val: 25000 },
            { label: '$75,000', val: 75000 },
            { label: '$200,000', val: 200000 },
            { label: '$500,000', val: 500000 },
            { label: '$1,500,000', val: 1500000 },
            { label: 'Max Limit', val: profile.availableCreditUsd }
          ].filter(b => b.val <= profile.availableCreditUsd).map(b => `
            <button class="btn ${effectiveCustomAmt === b.val ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800;" data-act="set-custom-drawdown-amount" data-amount="${b.val}">
              ${b.label}
            </button>
          `).join('')}
        </div>

        <!-- Term Selector -->
        <div style="margin-bottom:14px;">
          <div style="font-size:9.5px; color:var(--mu); font-family:monospace; margin-bottom:6px; text-transform:uppercase;">
            REPAYMENT TERM RUNWAY
          </div>
          <div style="display:flex; gap:6px;">
            ${[30, 45, 60, 90, 120, 180].map(t => `
              <button class="btn ${customDrawdownTermDays === t ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; flex:1;" data-act="set-custom-drawdown-term" data-term="${t}">
                ${t}d
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Real-time Amortization Calculation Summary -->
        <div style="background:#060a14; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:14px;">
          <div>
            <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">DRAWDOWN AMOUNT</div>
            <div style="font-size:16px; font-weight:900; color:var(--gold); font-family:monospace;">${fmt(effectiveCustomAmt)}</div>
          </div>
          <div>
            <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">DAILY REPAYMENT</div>
            <div style="font-size:16px; font-weight:900; color:#ef4444; font-family:monospace;">-${fmt(customAmort.dailyRate)}/day</div>
          </div>
          <div>
            <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">TOTAL INTEREST</div>
            <div style="font-size:16px; font-weight:900; color:var(--mu); font-family:monospace;">${fmt(customAmort.totalInterest)}</div>
          </div>
          <div>
            <div style="font-size:8.5px; color:var(--mu); font-family:monospace; text-transform:uppercase;">TOTAL COST OVER TERM</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); font-family:monospace;">${fmt(customAmort.totalRepayment)}</div>
          </div>
        </div>

        <!-- Draw Button -->
        <button class="btn gold" style="width:100%; padding:10px; font-size:11px; font-weight:900; letter-spacing:0.8px;" data-act="execute-custom-drawdown" ${profile.availableCreditUsd >= 5000 ? '' : 'disabled style="opacity:0.4;"'}>
          DISBURSE ${fmt(effectiveCustomAmt)} CASH TO TREASURY
        </button>

      </div>

    </div>
  `;
}
