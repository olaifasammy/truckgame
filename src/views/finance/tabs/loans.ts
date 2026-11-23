/**
 * Commercial Loans & Enterprise Credit Facilities View
 */

import { fmt, action, toast } from '../../../core/ui';
import { refresh, set } from '../../../core/store';
import {
  calculateEnterpriseCreditProfile,
  checkLoanEligibility,
  executeTakeLoan,
  executePayoffLoan,
  getCustomLoanApr,
  calculateLoanAmortization
} from '../../../domain/finance/commercialLoans';

let customLoanPrincipal = 50000;
let customLoanTerm = 21;
let eligibilityResult: any = null;

action('update-loan-request', d => {
  const principal = parseInt((d as any).principal, 10);
  const term = parseInt((d as any).term, 10);
  if (!isNaN(principal)) customLoanPrincipal = principal;
  if (!isNaN(term)) customLoanTerm = term;
  eligibilityResult = null;
  refresh();
});

action('check-loan-eligibility', () => {
  set(S => {
    eligibilityResult = checkLoanEligibility(S, customLoanPrincipal, customLoanTerm);
  });
  refresh();
});

action('finalize-loan-application', () => {
  set(S => {
    const success = executeTakeLoan(S, customLoanPrincipal, customLoanTerm);
    if (success) {
      eligibilityResult = null;
      customLoanPrincipal = 50000;
    }
  });
  refresh();
});

action('payoff-commercial-loan', d => {
  const loanId = (d as any).loanId;
  const amount = (d as any).amount ? parseFloat((d as any).amount) : undefined;
  set(S => {
    executePayoffLoan(S, loanId, amount);
  });
  refresh();
});

export function renderLoansTab(S: any): string {
  const profile = calculateEnterpriseCreditProfile(S);
  const activeLoans = S.loans || [];

  const totalOutstandingBalance = activeLoans.reduce((sum: number, l: any) => {
    const bal = l.balance !== undefined ? l.balance : (l.remainingBalance !== undefined ? l.remainingBalance : (l.principal || 0));
    return sum + bal;
  }, 0);

  const RATING_TIER_NAMES: Record<string, string> = {
    AAA: 'Prime Sovereign Conglomerate',
    AA: 'High-Grade Institutional Carrier',
    A: 'Upper-Medium Commercial Fleet',
    BBB: 'Established Regional Operator',
    BB: 'Early-Growth Carrier',
    B: 'Speculative / Startup Venture'
  };

  const eligibleBox = eligibilityResult ? `
    <div style="background:${eligibilityResult.eligible ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border:1px solid ${eligibilityResult.eligible ? 'var(--grn)' : 'var(--err)'}; border-radius:8px; padding:12px; margin-bottom:16px;">
      ${eligibilityResult.eligible ? `
        <div style="font-size:10px; font-weight:800; color:var(--grn); text-transform:uppercase; margin-bottom:6px;">LOGISTICS CREDIT COMMITTEE: APPROVED</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-family:monospace; font-size:12px; margin-bottom:12px;">
          <div><span style="color:var(--mu);">INTEREST RATE:</span> <b style="color:var(--tx);">${eligibilityResult.apr}% APR</b></div>
          <div><span style="color:var(--mu);">DAILY PAYMENT:</span> <b style="color:var(--tx);">$${fmt(eligibilityResult.dailyRate)}</b></div>
          <div><span style="color:var(--mu);">TERM LENGTH:</span> <b style="color:var(--tx);">${customLoanTerm} DAYS</b></div>
          <div><span style="color:var(--mu);">TOTAL INTEREST:</span> <b style="color:var(--gold);">$${fmt(eligibilityResult.totalInterest)}</b></div>
        </div>
        <button class="btn gold" style="width:100%; padding:10px; font-weight:900;" data-act="finalize-loan-application">FINAL DISBURSEMENT ($${fmt(customLoanPrincipal)})</button>
      ` : `
        <div style="font-size:10px; font-weight:800; color:var(--err); text-transform:uppercase; margin-bottom:4px;">LOGISTICS CREDIT COMMITTEE: DENIED</div>
        <div style="font-size:12px; color:var(--tx); line-height:1.4;">${eligibilityResult.error}</div>
      `}
    </div>
  ` : '';

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- TOP: CREDIT STATUS (FULL WIDTH ON MOBILE) -->
      <div style="background:#0e1320; border:1px solid #1f293d; border-radius:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font-size:16px; font-weight:900; color:var(--tx);">Corporate Debt Profile</h3>
            <span style="font-size:12px; font-weight:900; color:var(--err); font-family:monospace;">$${fmt(totalOutstandingBalance)} Total</span>
          </div>

          <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
            <div style="width:50px; height:50px; border-radius:50%; border:3px solid var(--gold); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:var(--gold); background:rgba(193,154,91,0.05);">
              ${profile.creditRating}
            </div>
            <div>
              <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">${RATING_TIER_NAMES[profile.creditRating] || 'Established Operator'}</div>
              <div style="font-size:10px; color:var(--mu);">Rating reflects your asset-to-debt ratio ($${fmt(profile.totalAssetsUsd)} assets).</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
             <div style="background:#080c16; padding:8px; border-radius:6px; border:1px solid #1a2336;">
               <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">DEBT RATIO</div>
               <div style="font-size:14px; font-weight:900; color:${profile.activeDebtUsd > 0 ? 'var(--err)' : 'var(--grn)'};">${(profile.activeDebtUsd / (profile.totalAssetsUsd || 1) * 100).toFixed(1)}%</div>
             </div>
             <div style="background:#080c16; padding:8px; border-radius:6px; border:1px solid #1a2336;">
               <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">CREDIT LINE</div>
               <div style="font-size:14px; font-weight:900; color:var(--tx);">$${fmt(profile.availableCreditUsd)}</div>
             </div>
          </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:start;">
        
        <!-- LEFT: CUSTOM LOAN REQUEST -->
        <div style="flex:1; min-width:300px;">
          <div style="background:#0e1320; border:1px solid #1f293d; border-radius:12px; padding:16px; box-shadow:0 8px 32px rgba(0,0,0,0.5);">
            <div style="font-size:10px; font-weight:800; color:var(--gold); text-transform:uppercase; margin-bottom:4px;">COMMERCIAL CREDIT TERMINAL</div>
            <h3 style="margin:0 0 12px; font-size:18px; font-weight:900; color:var(--tx);">Request Operational Capital</h3>

            <div style="margin-bottom:12px;">
              <label style="font-size:10px; font-weight:800; color:var(--mu); display:block; margin-bottom:6px;">PRINCIPAL AMOUNT ($)</label>
              <input type="number" id="loan-principal-input" value="${customLoanPrincipal}" step="5000" min="5000" max="500000"
                style="width:100%; padding:10px; background:#080c16; border:1px solid var(--gold); border-radius:8px; color:var(--tx); font-family:monospace; font-size:16px; font-weight:900;"
                onchange="document.getElementById('loan-proxy-btn').click();"
              />
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:10px; font-weight:800; color:var(--mu); display:block; margin-bottom:6px;">REPAYMENT TERM (MAX 30 DAYS)</label>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="range" id="loan-term-input" min="7" max="30" value="${customLoanTerm}" 
                  style="flex:1; accent-color:var(--gold);"
                  oninput="this.nextElementSibling.innerText = this.value + ' DAYS'; document.getElementById('loan-proxy-btn').click();"
                />
                <span style="font-size:12px; font-weight:900; color:var(--gold); min-width:60px;">${customLoanTerm} DAYS</span>
              </div>
            </div>

            <button id="loan-proxy-btn" style="display:none;" data-act="update-loan-request" 
              onclick="this.dataset.principal = document.getElementById('loan-principal-input').value; this.dataset.term = document.getElementById('loan-term-input').value;"
            ></button>

            ${eligibleBox}

            <button class="btn alt" style="width:100%; padding:10px; font-weight:800;" data-act="check-loan-eligibility">ANALYZE ELIGIBILITY</button>
            
            <div style="margin-top:16px; font-size:10px; color:var(--mu); line-height:1.5;">
              <b style="color:var(--err);">NOTICE:</b> Failure to meet daily debt service will result in an immediate APR hike. Loans exceeding 30 days are subject to mandatory asset seizure.
            </div>
          </div>
        </div>

        <!-- RIGHT: ACTIVE LOANS -->
        <div style="flex:1; min-width:300px;">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="font-size:10px; font-weight:800; color:var(--mu); text-transform:uppercase;">Current Facilities</div>
            ${activeLoans.length === 0 ? `
              <div style="text-align:center; padding:32px; color:var(--mu); font-size:12px; background:rgba(255,255,255,0.02); border:1px dashed #1f293d; border-radius:12px;">
                No active commercial credit facilities detected.
              </div>
            ` : activeLoans.map((loan: any) => `
              <div style="background:#0e1320; border:1px solid ${loan.missedPayments > 0 ? 'var(--err)' : '#1f293d'}; border-radius:10px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                  <div>
                    <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase;">${loan.lender}</div>
                    <div style="font-size:14px; font-weight:900; color:var(--tx);">${loan.name}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:14px; font-weight:900; color:var(--err); font-family:monospace;">$${fmt(loan.balance || loan.remainingBalance)}</div>
                    <div style="font-size:9px; color:var(--mu);">Balance</div>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-family:monospace; font-size:10px;">
                  <div><span style="color:var(--mu);">LEFT:</span> <b style="color:var(--tx);">${Math.round(loan.daysRemaining)}D</b></div>
                  <div><span style="color:var(--mu);">DAILY:</span> <b style="color:var(--tx);">$${fmt(loan.dailyRate)}</b></div>
                  <div><span style="color:var(--mu);">APR:</span> <b style="color:${loan.missedPayments > 0 ? 'var(--err)' : 'var(--tx)'};">${loan.apr.toFixed(1)}%</b></div>
                  <div><span style="color:var(--mu);">PENALTY:</span> <b style="color:var(--err);">${loan.missedPayments}D</b></div>
                </div>

                <div style="display:flex; gap:8px;">
                  <button class="btn alt" style="flex:1; padding:6px; font-size:10px;" data-act="payoff-commercial-loan" data-loan-id="${loan.id}" data-amount="5000">PAY $5K</button>
                  <button class="btn gold" style="flex:1; padding:6px; font-size:10px;" data-act="payoff-commercial-loan" data-loan-id="${loan.id}" data-amount="${loan.balance || loan.remainingBalance}">SETTLE</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}
