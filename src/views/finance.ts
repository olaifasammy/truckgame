import { ic } from '../core/icons';
import { fmt, action, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { pushNote } from '../systems/notify';
import { AVAILABLE_LOANS, calculateCreditRating, INSURANCE_POLICIES, REGIONAL_FUEL_SPOT, getGoldMarketData } from '../domain/finance/banking';
import { executeTakeLoan, executePayoffLoan } from '../domain/finance/commercialLoans';
import { createTruck } from '../domain/trucks/trucks.physics';

// Modular Tab Imports
import { renderTreasuryTab } from './finance/tabs/treasury';
import { renderExchangeTab } from './finance/tabs/exchange';
import { renderLoansTab } from './finance/tabs/loans';
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
    pushNote(S, `Wholesale Fuel Receipt: ${toBuy.toLocaleString()}L of diesel delivered to HQ Bunker at $${spotPrice}/L.`, {
      title: 'WHOLESALE FUEL',
      type: 'ops'
    });
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
        ${(financeTab === 'banking' || financeTab === 'loans') ? renderLoansTab(S) : ''}

        ${financeTab === 'fuel' ? `
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px; margin-bottom:16px;">
            <div style="font-size:10px; color:var(--gold); font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">HQ Enterprise Fuel Bunker</div>
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:6px;">
              <div style="font-size:24px; font-weight:900; color:var(--tx); font-family:monospace;">${bunker.currentLiters.toLocaleString()}<span style="font-size:12px; color:var(--mu); font-weight:700;"> / ${bunker.maxCapacity.toLocaleString()} L</span></div>
              <div style="font-size:10px; color:var(--mu); font-weight:700;">AVG COST: <span style="color:var(--tx);">$${bunker.avgCostPerLiter || '0.00'}/L</span></div>
            </div>
            <div style="height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; margin-top:14px; border:1px solid rgba(255,255,255,0.05);">
              <div style="width:${Math.min(100, (bunker.currentLiters/bunker.maxCapacity)*100)}%; height:100%; background:linear-gradient(90deg, var(--gold-dim), var(--gold));"></div>
            </div>
            <div style="display:flex; gap:10px; margin-top:18px;">
              <button class="btn gold" style="flex:1; padding:10px; font-size:10px;" data-act="buy-wholesale-fuel" data-liters="5000">REFILL 5,000L</button>
              <button class="btn alt" style="flex:1; padding:10px; font-size:10px;" data-act="upgrade-fuel-bunker">EXPAND BUNKER</button>
            </div>
          </div>

          <div class="card" style="padding:16px; margin:0; width:100%;">
            <div style="font-size:10px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:12px; letter-spacing:0.5px;">Regional Diesel Spot Markets</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid var(--line);">
                  <th style="text-align:left; padding:8px 0; font-size:9px; color:var(--mu); text-transform:uppercase;">Hub Location</th>
                  <th style="text-align:right; padding:8px 0; font-size:9px; color:var(--mu); text-transform:uppercase;">Diesel Spot</th>
                  <th style="text-align:right; padding:8px 0; font-size:9px; color:var(--mu); text-transform:uppercase;">Change</th>
                </tr>
              </thead>
              <tbody style="font-size:12px;">
                ${Object.entries(REGIONAL_FUEL_SPOT).map(([city, p]) => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                    <td style="padding:10px 0; font-weight:700; color:var(--tx);">${city}</td>
                    <td style="padding:10px 0; text-align:right; font-weight:900; color:var(--gold); font-family:monospace;">$${p.diesel.toFixed(2)}/L</td>
                    <td style="padding:10px 0; text-align:right; color:var(--grn); font-size:10px; font-weight:700;">+0.02</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
