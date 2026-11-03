import { ic } from '../core/icons';
import { fmt, action, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { AVAILABLE_LOANS, calculateCreditRating, INSURANCE_POLICIES, REGIONAL_FUEL_SPOT, getGoldMarketData } from '../domain/finance/banking';
import { createTruck } from '../domain/trucks/trucks.physics';

// Modular Tab Imports
import { renderTreasuryTab } from './finance/tabs/treasury';
import { renderExchangeTab } from './finance/tabs/exchange';
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
  const loanId = (d as any).id;
  set(S => {
    const loanDef = AVAILABLE_LOANS.find(l => l.id === loanId);
    if (!loanDef) return;
    if (!S.loans) S.loans = [];
    if (S.loans.some((l: any) => l.id === loanId)) return toast('Active loan exists', 'err');
    const { rating } = calculateCreditRating(S);
    const order = ['BBB', 'A', 'AA', 'AAA'];
    if (order.indexOf(rating) < order.indexOf(loanDef.requiredRating)) return toast('Low credit rating', 'err');
    S.loans.push({ ...loanDef, balance: loanDef.principal, daysRemaining: loanDef.termDays });
    S.money += loanDef.principal;
    toast(`Loan Disbursed: +$${loanDef.principal.toLocaleString()}`, 'success');
  });
});

action('payoff-loan', d => {
  const loanId = (d as any).id;
  set(S => {
    const loan = S.loans?.find((l: any) => l.id === loanId);
    if (!loan || S.money < loan.balance) return toast('Insufficient funds', 'err');
    S.money -= loan.balance;
    S.loans = S.loans.filter((l: any) => l.id !== loanId);
    toast('Loan Settled', 'success');
  });
});

action('lease-tractor', d => {
  const modelId = (d as any).modelId || 'scania_s730';
  set(S => {
    const downPayment = 18000;
    if (S.money < downPayment) return toast('Insufficient funds', 'err');
    S.money -= downPayment;
    const newId = (S.fleet.reduce((m: any, t: any) => Math.max(m, t.id), 0) || 0) + 1;
    S.fleet.push(createTruck(newId, modelId, `Leased ${modelId}`, 'LAGOS'));
    if (!S.leases) S.leases = [];
    S.leases.push({ id: `L${Date.now()}`, modelId, downPayment, dailyRate: 480, termDays: 45, daysRemaining: 45, truckId: newId });
    toast('Lease Activated', 'success');
  });
});

action('upgrade-fuel-bunker', () => {
  set(S => {
    const nextLevel = (S.fuelBunkerLevel || 0) + 1;
    const cost = 25000 * Math.pow(2, nextLevel - 1);
    if (S.money < cost) return toast('Insufficient funds', 'err');
    S.money -= cost;
    S.fuelBunkerLevel = nextLevel;
    S.fuelBunker.maxCapacity += 12000;
    toast('Bunker Expanded', 'success');
  });
});

action('buy-wholesale-fuel', d => {
  const liters = +(d as any).liters;
  const spotPrice = +(d as any).price || 0.82;
  set(S => {
    const bunker = S.fuelBunker;
    const toBuy = Math.min(bunker.maxCapacity - bunker.currentLiters, liters);
    const cost = Math.round(toBuy * spotPrice);
    if (toBuy <= 0 || S.money < cost) return toast('Cannot purchase', 'err');
    S.money -= cost;
    const prevL = bunker.currentLiters;
    const prevC = bunker.avgCostPerLiter || spotPrice;
    bunker.currentLiters += toBuy;
    bunker.avgCostPerLiter = parseFloat(((prevL * prevC + cost) / bunker.currentLiters).toFixed(2));
    toast(`Refilled ${toBuy}L`, 'success');
  });
});

action('toggle-insurance', d => {
  const id = (d as any).id as any;
  set(S => {
    S.insurance[id] = !S.insurance[id];
    toast('Policy Updated', 'success');
  });
});

export default {
  id: 'finance',
  icon: 'cash',
  label: 'Finance',
  render: (S: any) => {
    const financeTab = (window as any).financeTab || 'treasury';
    const { rating, score, maxCredit } = calculateCreditRating(S);
    const bunker = S.fuelBunker || { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
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

        ${financeTab === 'banking' ? `
          <div style="background:#0f172a; border:1px solid var(--gold); border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:9px; color:var(--gold); text-transform:uppercase;">CREDIT LIMIT</div>
                <div style="font-size:16px; font-weight:900; color:var(--tx); font-family:monospace;">${fmt(maxCredit)}</div>
              </div>
              <div style="text-align:right;"><div style="font-size:18px; font-weight:900; color:var(--grn);">${rating}</div></div>
            </div>
          </div>
          ${AVAILABLE_LOANS.map(l => `
            <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <div style="font-size:12px; font-weight:800; color:var(--tx);">${l.name}</div>
                <div style="font-size:9px; color:var(--mu);">$${l.principal.toLocaleString()} · ${l.apr}% APR</div>
              </div>
              <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900;" data-act="take-loan" data-id="${l.id}">BORROW</button>
            </div>
          `).join('')}
        ` : ''}

        ${financeTab === 'fuel' ? `
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="font-size:9px; color:var(--gold); font-weight:800;">HQ FUEL BUNKER</div>
            <div style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:4px;">${bunker.currentLiters.toLocaleString()}L / ${bunker.maxCapacity.toLocaleString()}L</div>
            <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-top:10px;">
              <div style="width:${(bunker.currentLiters/bunker.maxCapacity)*100}%; height:100%; background:var(--gold);"></div>
            </div>
            <div style="display:flex; gap:8px; margin-top:14px;">
              <button class="btn gold" style="flex:1; padding:8px; font-size:9px;" data-act="buy-wholesale-fuel" data-liters="5000">REFILL 5,000L</button>
              <button class="btn alt" style="flex:1; padding:8px; font-size:9px;" data-act="upgrade-fuel-bunker">UPGRADE TANK</button>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${Object.entries(REGIONAL_FUEL_SPOT).map(([city, p]) => `
              <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px;">
                <div style="font-size:11px; font-weight:800; color:var(--tx);">${city}</div>
                <div style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace; margin-top:2px;">$${p.diesel}/L</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${financeTab === 'insurance' ? `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${Object.values(INSURANCE_POLICIES).map(p => `
              <div style="background:#111827; border:1px solid ${ins[p.id] ? 'var(--grn)' : '#1f293d'}; border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div><div style="font-size:12px; font-weight:800; color:var(--tx);">${p.name}</div><div style="font-size:9px; color:var(--mu);">$${p.dailyCost}/day</div></div>
                  <button class="btn ${ins[p.id] ? 'alt' : 'gold'}" style="padding:6px 12px; font-size:9px;" data-act="toggle-insurance" data-id="${p.id}">${ins[p.id] ? 'ACTIVE' : 'ENROLL'}</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
};
