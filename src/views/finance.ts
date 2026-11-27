import { ic } from '../core/icons';
import { fmt, action, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { pushNote } from '../systems/notify';
import { AVAILABLE_LOANS, calculateCreditRating, INSURANCE_POLICIES } from '../domain/finance/banking';
import { executeTakeLoan, executePayoffLoan } from '../domain/finance/commercialLoans';
import { getCompanySafetyRating } from '../domain/trucks/registration';
import { recordTransaction } from '../core/ledger';
import { slots } from '../systems/offices';
import { createTruck } from '../domain/trucks/trucks.physics';

// Modular Tab Imports
import { renderTreasuryTab } from './finance/tabs/treasury';
import { renderExchangeTab } from './finance/tabs/exchange';
import { renderLoansTab } from './finance/tabs/loans';
import { renderInsuranceTab } from './finance/tabs/insurance';
import { renderFinanceNav } from './finance/tabs/shared';

// Initialize tab state if not present on window
if (!(window as any).financeTab) (window as any).financeTab = 'treasury';
let accountsReceivableOpen = false;

action('finance-tab', d => {
  (window as any).financeTab = (d as any).tab;
  refresh();
});

action('toggle-receivable', () => {
  accountsReceivableOpen = !accountsReceivableOpen;
  refresh();
});

action('take-loan', d => {
  const loanId = (d as any).id || (d as any).offerId;
  set(S => {
    executeTakeLoan(S, loanId);
  });
  refresh();
});

action('payoff-loan', d => {
  const loanId = (d as any).id || (d as any).loanId;
  set(S => {
    executePayoffLoan(S, loanId);
  });
  refresh();
});

action('lease-tractor', d => {
  const modelId = (d as any).modelId || 'scania_s730';
  set(S => {
    const downPayment = 18000;
    if (getCompanySafetyRating(S).grade === 'UNSATISFACTORY') {
      return toast('Credit Freeze: Resolve FMCSA Unsatisfactory safety rating before leasing.', 'err');
    }
    if ((S.fleet || []).length >= slots(S)) {
      return toast(`Fleet berth capacity full (${S.fleet.length}/${slots(S)}). Expand depot/garage slots first.`, 'err');
    }
    if (S.money < downPayment) return toast('Insufficient funds', 'err');
    recordTransaction(S, 'expense_finance', -downPayment, `Tractor Lease Down Payment (${modelId})`);
    const newId = (S.fleet.reduce((m: any, t: any) => Math.max(m, t.id), 0) || 0) + 1;
    const homeLoc = (S.homeCity || 'LAGOS').toUpperCase();
    const leasedTruck: any = createTruck(newId, modelId, `Leased ${modelId}`, homeLoc);
    leasedTruck.leased = true;
    S.fleet.push(leasedTruck);
    if (!S.leases) S.leases = [];
    S.leases.push({ id: `L${Date.now()}`, modelId, downPayment, dailyRate: 480, termDays: 45, daysRemaining: 45, truckId: newId });
    toast('Lease Activated ($480/day for 45 days)', 'success');
  });
});

action('toggle-insurance', d => {
  const id = (d as any).id as 'liability' | 'collision' | 'cargo';
  set(S => {
    if (!S.insurance) S.insurance = { liability: true, collision: true, cargo: false };
    S.insurance[id] = !S.insurance[id];
    const policyName = INSURANCE_POLICIES[id]?.name || id;
    toast(`${policyName}: ${S.insurance[id] ? 'Enrolled' : 'Cancelled'}`, S.insurance[id] ? 'success' : 'info');
  });
});

action('set-insurance-tier', d => {
  const tier = (d as any).tier;
  if (!tier) return;
  set(S => {
    S.insuranceTier = tier;
    toast('Deductible schedule updated', 'success');
  });
});

export default {
  id: 'finance',
  icon: 'cash',
  label: 'Finance',
  render: (S: any) => {
    let financeTab = (window as any).financeTab || 'treasury';
    if (financeTab === 'fuel') {
      financeTab = 'treasury';
      (window as any).financeTab = 'treasury';
    }
    const { rating, score, maxCredit } = calculateCreditRating(S);
    const ins = S.insurance || { liability: true, collision: true, cargo: false };

    return `
      <div style="padding: 16px; padding-bottom: 90px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div>
            <div style="font-size: 9px; color: var(--gold); font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">TREASURY & BANKING</div>
            <div style="font-size: 20px; font-weight: 900; color: var(--tx); margin-top:2px;">Enterprise Finance</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size: 9px; color: var(--mu);">CREDIT GRADE</div>
            <div style="font-size: 15px; font-weight: 900; color: var(--gold); font-family:monospace;">${rating} <span style="font-size:9px; color:var(--tx); opacity:0.6;">(${score})</span></div>
          </div>
        </div>

        ${renderFinanceNav(financeTab)}

        ${financeTab === 'treasury' ? renderTreasuryTab(S) : ''}
        ${financeTab === 'exchange' ? renderExchangeTab(S) : ''}
        ${(financeTab === 'banking' || financeTab === 'loans') ? renderLoansTab(S) : ''}

        ${financeTab === 'insurance' ? renderInsuranceTab(S) : ''}
      </div>
    `;
  }
};
