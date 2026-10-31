import { ic } from '../core/icons';
import { fmt, action, toast } from '../core/ui';
import { refresh, set } from '../core/store';
import { AVAILABLE_LOANS, calculateCreditRating, INSURANCE_POLICIES, REGIONAL_FUEL_SPOT } from '../domain/finance/banking';
import { createTruck } from '../domain/trucks/trucks.physics';

let financeTab: 'cashflow' | 'banking' | 'fuel' | 'insurance' = 'cashflow';

action('finance-tab', d => {
  financeTab = (d as any).tab;
  refresh();
});

action('take-loan', d => {
  const loanId = (d as any).id;
  set(S => {
    const loanDef = AVAILABLE_LOANS.find(l => l.id === loanId);
    if (!loanDef) return;

    if (!S.loans) S.loans = [];
    if (S.loans.some((l: any) => l.id === loanId)) {
      return toast('You already have this active credit facility', 'err');
    }

    const { rating } = calculateCreditRating(S);
    const order = ['BBB', 'A', 'AA', 'AAA'];
    if (order.indexOf(rating) < order.indexOf(loanDef.requiredRating)) {
      return toast(`Credit rating ${loanDef.requiredRating} required (Current: ${rating})`, 'err');
    }

    S.loans.push({
      id: loanDef.id,
      name: loanDef.name,
      principal: loanDef.principal,
      balance: loanDef.principal,
      apr: loanDef.apr,
      dailyRate: loanDef.dailyRate,
      termDays: loanDef.termDays,
      daysRemaining: loanDef.termDays
    });

    S.money += loanDef.principal;
    toast(`Commercial Loan Approved: +$${loanDef.principal.toLocaleString()} disbursed to working capital!`, 'success');
  });
});

action('payoff-loan', d => {
  const loanId = (d as any).id;
  set(S => {
    const loan = S.loans?.find((l: any) => l.id === loanId);
    if (!loan) return;
    if (S.money < loan.balance) {
      return toast(`Insufficient funds to clear $${loan.balance.toLocaleString()} balance`, 'err');
    }
    S.money -= loan.balance;
    S.loans = S.loans.filter((l: any) => l.id !== loanId);
    toast(`Loan fully paid off and settled: $${loan.balance.toLocaleString()}`, 'success');
  });
});

action('lease-tractor', d => {
  const modelId = (d as any).modelId || 'scania_s730';
  set(S => {
    const downPayment = 18000;
    const dailyRate = 480;
    if (S.money < downPayment) {
      return toast(`Insufficient down payment ($${downPayment.toLocaleString()}) for commercial lease`, 'err');
    }

    S.money -= downPayment;
    const newTruckId = (S.fleet.reduce((max: number, t: any) => Math.max(max, t.id), 0) || 0) + 1;
    const leasedTruck = createTruck(newTruckId, modelId, `Leased S730 #${newTruckId}`, 'LAGOS');
    S.fleet.push(leasedTruck);

    if (!S.leases) S.leases = [];
    S.leases.push({
      id: `lease_${Date.now()}`,
      modelId,
      name: `Leased ${modelId}`,
      downPayment,
      dailyRate,
      termDays: 45,
      daysRemaining: 45,
      truckId: newTruckId
    });

    toast(`Equipment Lease Activated: Unit #${newTruckId} delivered to depot!`, 'success');
  });
});

action('buy-wholesale-fuel', d => {
  const liters = +(d as any).liters;
  const spotPrice = +(d as any).price || 0.82;
  set(S => {
    if (!S.fuelBunker) S.fuelBunker = { currentLiters: 0, maxCapacity: 12000, avgCostPerLiter: 0.95 };
    const room = S.fuelBunker.maxCapacity - S.fuelBunker.currentLiters;
    const toBuy = Math.min(room, liters);
    if (toBuy <= 0) return toast('HQ Fuel Bunker storage tank is at maximum capacity (12,000L)', 'err');

    const totalCost = Math.round(toBuy * spotPrice);
    if (S.money < totalCost) {
      return toast(`Insufficient cash to purchase ${toBuy}L ($${totalCost.toLocaleString()})`, 'err');
    }

    S.money -= totalCost;
    const prevLiters = S.fuelBunker.currentLiters;
    const prevCost = S.fuelBunker.avgCostPerLiter || spotPrice;
    S.fuelBunker.currentLiters += toBuy;
    S.fuelBunker.avgCostPerLiter = parseFloat(((prevLiters * prevCost + totalCost) / S.fuelBunker.currentLiters).toFixed(2));
    toast(`Purchased ${toBuy.toLocaleString()}L wholesale diesel at $${spotPrice}/L into HQ Bunker!`, 'success');
  });
});

action('toggle-insurance', d => {
  const policyId = (d as any).id as 'liability' | 'collision' | 'cargo';
  set(S => {
    if (!S.insurance) S.insurance = { liability: true, collision: true, cargo: false, claimsCount: 0, totalPaidOut: 0 };
    S.insurance[policyId] = !S.insurance[policyId];
    toast(`Insurance Policy ${S.insurance[policyId] ? 'Activated' : 'Suspended'}: ${INSURANCE_POLICIES[policyId]?.name}`, 'success');
  });
});

export default {
  id: 'finance',
  icon: 'cash',
  label: 'Finance',
  render: (S: any) => {
    const { rating, score, maxCredit } = calculateCreditRating(S);
    const totalLoanDebt = (S.loans || []).reduce((sum: number, l: any) => sum + (l.balance || 0), 0);
    const enterpriseValue = S.money + (S.fleet.length * 125000) + ((S.offices?.length || 0) * 50000) - totalLoanDebt;
    const bunker = S.fuelBunker || { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
    const ins = S.insurance || { liability: true, collision: true, cargo: false, claimsCount: 0, totalPaidOut: 0 };

    return `
      <div style="padding: 16px; padding-bottom: 90px;">
        <!-- Header Banner -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div>
            <div style="font-size: 10px; color: var(--gold); font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
              CORPORATE TREASURY & BANKING
            </div>
            <div style="font-size: 22px; font-weight: 900; color: var(--tx); margin-top:2px;">
              Enterprise Financials
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size: 9px; color: var(--mu); text-transform:uppercase;">CREDIT RATING</div>
            <div style="font-size: 16px; font-weight: 900; color: var(--gold); font-family:monospace;">
              ${rating} <span style="font-size:10px; color:var(--tx); font-weight:700;">(${score} Pts)</span>
            </div>
          </div>
        </div>

        <!-- Segmented Navigation Controls -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:16px;">
          <button class="btn ${financeTab === 'cashflow' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:10px; font-weight:800;" data-act="finance-tab" data-tab="cashflow">
            Treasury
          </button>
          <button class="btn ${financeTab === 'banking' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:10px; font-weight:800;" data-act="finance-tab" data-tab="banking">
            Credit & Loans
          </button>
          <button class="btn ${financeTab === 'fuel' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:10px; font-weight:800;" data-act="finance-tab" data-tab="fuel">
            Fuel Bunker
          </button>
          <button class="btn ${financeTab === 'insurance' ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:10px; font-weight:800;" data-act="finance-tab" data-tab="insurance">
            Insurance
          </button>
        </div>

        <!-- 1. Treasury & Cash Flow Sub-View -->
        ${financeTab === 'cashflow' ? `
          <div class="grid2" style="margin-bottom:14px;">
            <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
              <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">TOTAL REVENUE</span>
              <span class="stat-val" style="color:var(--grn); font-size:20px; font-weight:900; font-family:monospace;">${fmt(S.stats.earned)}</span>
            </div>
            <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
              <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">LIQUID WORKING CAPITAL</span>
              <span class="stat-val" style="font-size:20px; font-weight:900; color:var(--tx); font-family:monospace;">${fmt(S.money)}</span>
            </div>
          </div>

          <div class="sec" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Enterprise Balance Sheet</span>
            <span style="font-size:9px; color:var(--mu); font-family:monospace;">GAAP AUDITED</span>
          </div>

          <div class="card" style="padding: 16px; background:#0f172a; border:1px solid #1e293b; border-radius:10px; display: flex; flex-direction: column; gap: 10px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:var(--mu);">Fleet Tangible Assets (${S.fleet.length} Tractors)</span>
              <span style="font-weight:700; color:var(--tx);">${fmt(S.fleet.length * 125000)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:var(--mu);">Regional Depots & Terminals</span>
              <span style="font-weight:700; color:var(--tx);">${fmt((S.depots?.length || 1) * 85000)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:var(--mu);">HQ Wholesale Fuel Inventory</span>
              <span style="font-weight:700; color:var(--tx);">${fmt(Math.round(bunker.currentLiters * (bunker.avgCostPerLiter || 0.95)))}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#ef4444;">Commercial Bank Liabilities (Outstanding Debt)</span>
              <span style="font-weight:700; color:#ef4444;">-${fmt(totalLoanDebt)}</span>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; display: flex; justify-content: space-between; font-size:14px;">
              <span style="font-weight: 900; color: var(--gold);">NET CORPORATE EQUITY</span>
              <span style="font-weight: 900; color: var(--gold); font-family:monospace;">${fmt(enterpriseValue)}</span>
            </div>
          </div>

          <div class="sec" style="margin-bottom:8px;">
            <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Pending Consignment Accounts Receivable</span>
          </div>
          <div>
            ${S.active.length > 0 ? S.active.map((a: any) => `
              <div class="card" style="margin-bottom:8px; padding:12px; background:#111827; border:1px solid #1f293d; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:12px; font-weight:800; color:var(--tx);">${a.cargo}</div>
                  <div style="font-size:10px; color:var(--mu); margin-top:2px;">INVOICE: ${a.from} → ${a.to}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13px; font-weight:900; color:var(--gold); font-family:monospace;">+$${a.pay.toLocaleString()}</div>
                  <div style="font-size:9px; color:var(--mu);">Payout upon delivery</div>
                </div>
              </div>
            `).join('') : '<div style="text-align:center; padding:20px; color:var(--mu); font-size:11px; background:#0f172a; border-radius:8px;">No pending transit invoices.</div>'}
          </div>
        ` : ''}

        <!-- 2. Bank Loans & Equipment Leasing Sub-View -->
        ${financeTab === 'banking' ? `
          <div style="background:#0f172a; border:1px solid var(--gold); border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div>
                <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">BANK SYNDICATE CREDIT LIMIT</div>
                <div style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
                  ${fmt(maxCredit)} <span style="font-size:11px; color:var(--mu);">Maximum Line</span>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:9px; color:var(--mu); text-transform:uppercase;">CREDIT GRADE</div>
                <div style="font-size:18px; font-weight:900; color:var(--grn); font-family:monospace;">${rating}</div>
              </div>
            </div>
            <div style="font-size:10px; color:var(--mu); line-height:1.4;">
              Maintain high delivery volume and positive net equity to qualify for lower APR interest rates on commercial term facilities.
            </div>
          </div>

          <!-- Active Loans -->
          ${(S.loans || []).length > 0 ? `
            <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase; margin-bottom:8px;">Active Debt Facilities</div>
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
              ${S.loans.map((l: any) => `
                <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:12px; font-weight:800; color:var(--tx);">${l.name}</div>
                    <div style="font-size:10px; color:var(--mu); margin-top:2px;">APR: ${l.apr}% · Balance: <b style="color:#ef4444;">$${l.balance.toLocaleString()}</b></div>
                  </div>
                  <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800; color:var(--grn); border-color:rgba(34,197,94,0.3);" data-act="payoff-loan" data-id="${l.id}">
                    PAY OFF EARLY
                  </button>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Available Commercial Loans -->
          <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase; margin-bottom:8px;">Commercial Term Facilities</div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
            ${AVAILABLE_LOANS.map(loan => {
              const hasLoan = (S.loans || []).some((l: any) => l.id === loan.id);
              return `
                <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:12px; font-weight:800; color:var(--tx);">${loan.name}</div>
                    <div style="font-size:10px; color:var(--mu); margin-top:2px;">Principal: <b style="color:var(--gold);">$${loan.principal.toLocaleString()}</b> · APR: ${loan.apr}% · Req: ${loan.requiredRating}</div>
                  </div>
                  <div>
                    ${hasLoan ? `
                      <span style="font-size:9px; font-weight:800; color:var(--mu); background:rgba(255,255,255,0.06); padding:4px 8px; border-radius:4px;">ACTIVE</span>
                    ` : `
                      <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900;" data-act="take-loan" data-id="${loan.id}">
                        BORROW
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Equipment Leasing -->
          <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase; margin-bottom:8px;">Equipment Leasing</div>
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:12px; font-weight:800; color:var(--tx);">Commercial Lease: Scania S730 V8 6x4</div>
              <div style="font-size:10px; color:var(--mu); margin-top:2px;">Down Payment: $18,000 · Retainer: $480/day · 45-day contract</div>
            </div>
            <button class="btn alt" style="padding:6px 12px; font-size:10px; font-weight:800; color:var(--gold); border-color:rgba(193,154,91,0.4);" data-act="lease-tractor" data-model-id="scania_s730">
              LEASE TRACTOR
            </button>
          </div>
        ` : ''}

        <!-- 3. Wholesale Fuel Spot Market & HQ Bunker -->
        ${financeTab === 'fuel' ? `
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">HQ WHOLESALE FUEL BUNKER STORAGE</div>
                <div style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
                  ${bunker.currentLiters.toLocaleString()}L <span style="font-size:11px; color:var(--mu);">/ ${bunker.maxCapacity.toLocaleString()}L (${Math.round((bunker.currentLiters / bunker.maxCapacity) * 100)}%)</span>
                </div>
                <div style="font-size:10px; color:var(--mu); margin-top:2px;">Average Cost: $${(bunker.avgCostPerLiter || 0.95).toFixed(2)}/L</div>
              </div>
              <span style="font-size:32px;">⛽</span>
            </div>
            
            <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin-bottom:10px;">
              <div style="width:${Math.min(100, (bunker.currentLiters / bunker.maxCapacity) * 100)}%; height:100%; background:var(--gold); border-radius:4px;"></div>
            </div>

            <div style="display:flex; gap:8px;">
              <button class="btn gold" style="flex:1; padding:8px; font-size:10px; font-weight:900;" data-act="buy-wholesale-fuel" data-liters="2000" data-price="0.82">
                BUY +2,000L ($1,640)
              </button>
              <button class="btn gold" style="flex:1; padding:8px; font-size:10px; font-weight:900;" data-act="buy-wholesale-fuel" data-liters="5000" data-price="0.82">
                BUY +5,000L ($4,100)
              </button>
            </div>
          </div>

          <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase; margin-bottom:8px;">Regional Fuel Spot Market Rates</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${Object.entries(REGIONAL_FUEL_SPOT).map(([city, prices]) => `
              <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; font-weight:800; color:var(--tx);">${city}</span>
                  <span style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace;">$${prices.diesel.toFixed(2)}/L</span>
                </div>
                <div style="font-size:9px; color:var(--mu); margin-top:2px;">AdBlue: $${prices.adBlue.toFixed(2)}/L</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- 4. Corporate Insurance Sub-View -->
        ${financeTab === 'insurance' ? `
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">COMMERCIAL CARRIER RISK PROTECTION</div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">Active Insurance Coverage</div>
            <div style="font-size:10px; color:var(--mu); margin-top:2px;">
              Policies automatically reimburse collision repair claims, roadside towing, stolen cargo, and statutory DOT citations.
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            ${Object.values(INSURANCE_POLICIES).map(policy => {
              const isActive = !!ins[policy.id];
              return `
                <div style="background:#111827; border:1px solid ${isActive ? 'rgba(34,197,94,0.4)' : '#1f293d'}; border-radius:8px; padding:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <div>
                      <div style="font-size:13px; font-weight:800; color:var(--tx);">${policy.name}</div>
                      <div style="font-size:9px; color:var(--mu);">${policy.type} · Deductible: $${policy.deductible}</div>
                    </div>
                    <button class="btn ${isActive ? 'alt' : 'gold'}" style="padding:6px 12px; font-size:9px; font-weight:900; ${isActive ? 'color:var(--grn); border-color:var(--grn);' : ''}" data-act="toggle-insurance" data-id="${policy.id}">
                      ${isActive ? '✓ COVERED ($' + policy.dailyCost + '/day)' : 'ENROLL ($' + policy.dailyCost + '/day)'}
                    </button>
                  </div>
                  <div style="font-size:10px; color:var(--mu); line-height:1.4;">${policy.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

      </div>
    `;
  }
};
