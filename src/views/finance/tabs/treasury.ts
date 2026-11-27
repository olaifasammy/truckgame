import { fmt, action } from '../../../core/ui';
import { refresh } from '../../../core/store';
import { calculateCreditRating } from '../../../domain/finance/banking';
import { calculateBalanceSheet, calculateIncomeStatement } from '../../../domain/finance/accounting';

let selectedDayKey: string = 'today';
let ledgerFilter: 'all' | 'expense' | 'revenue' = 'all';

action('finance-select-day', d => {
  selectedDayKey = (d as any).day || 'today';
  refresh();
});

action('finance-ledger-filter', d => {
  ledgerFilter = ((d as any).filter || 'all') as 'all' | 'expense' | 'revenue';
  refresh();
});

function buildDayRecord(S: any, dayKey: string) {
  if (dayKey === 'today') {
    const ds = S.dailyStats || {};
    const revenue = Math.round(ds.revenue || 0);
    const fuel = Math.round(ds.fuel || 0);
    const salaries = Math.round(ds.salaries || 0);
    const maintenance = Math.round(ds.maintenance || 0);
    const insurance = Math.round(ds.insurance || 0);
    const loans = Math.round(ds.loans || 0);
    const parking = Math.round(ds.parking || 0);
    const leases = Math.round(ds.leases || 0);
    const overdraftInterest = Math.round(ds.overdraftInterest || 0);
    const tolls = Math.round(ds.tolls || 0);
    const totalExpenses = fuel + salaries + maintenance + insurance + loans + parking + leases + overdraftInterest + tolls;
    return {
      date: S.dailyAccountingDate || new Date().toISOString().slice(0, 10),
      revenue,
      fuel,
      salaries,
      maintenance,
      insurance,
      loans,
      parking,
      leases,
      overdraftInterest,
      tolls,
      totalExpenses,
      net: revenue - totalExpenses
    };
  }

  const hist = (S.dailyHistory || []).find((h: any) => h.date === dayKey);
  if (hist) {
    const totalExpenses = (hist.fuel || 0) + (hist.salaries || 0) + (hist.maintenance || 0) +
      (hist.insurance || 0) + (hist.loans || 0) + (hist.parking || 0) +
      (hist.leases || 0) + (hist.overdraftInterest || 0) + (hist.tolls || 0);
    return { ...hist, totalExpenses };
  }

  return null;
}

function renderDailyAuditCard(S: any): string {
  const history: any[] = Array.isArray(S.dailyHistory) ? S.dailyHistory : [];
  if (selectedDayKey !== 'today' && !history.some(h => h.date === selectedDayKey)) {
    selectedDayKey = 'today';
  }
  const rec = buildDayRecord(S, selectedDayKey) || buildDayRecord(S, 'today')!;

  const expenseRows = [
    { label: 'Fuel & DEF', value: rec.fuel || 0, hint: 'Diesel, AdBlue & hub refueling' },
    { label: 'Driver Salaries & Wages', value: rec.salaries || 0, hint: 'Daily payroll + trip wages' },
    { label: 'Maintenance & Repairs', value: rec.maintenance || 0, hint: 'Workshops, parts & breakdowns' },
    { label: 'Hub Overflow & Parking Fees', value: rec.parking || 0, hint: 'Trucks parked outside owned hubs or over berth capacity' },
    { label: 'Insurance Policies', value: rec.insurance || 0, hint: 'Fleet & cargo coverage' },
    { label: 'Tractor Leases', value: rec.leases || 0, hint: 'Daily lease installments' },
    { label: 'Commercial Loan Service', value: rec.loans || 0, hint: 'Principal & interest payments' },
    { label: 'Overdraft Interest (18% APR)', value: rec.overdraftInterest || 0, hint: 'Charged whenever cash drops below $0' },
    { label: 'Tolls & Tariffs', value: rec.tolls || 0, hint: 'Highway tolls & border charges' }
  ];

  const sortedExpenses = [...expenseRows].sort((a, b) => b.value - a.value);
  const topDrain = sortedExpenses[0];
  const hiddenWarnings: string[] = [];
  if ((rec.parking || 0) > 0) hiddenWarnings.push(`Overflow Parking is costing ${fmt(rec.parking)} — station idle trucks at hubs with open berths.`);
  if ((rec.overdraftInterest || 0) > 0) hiddenWarnings.push(`Overdraft Interest is costing ${fmt(rec.overdraftInterest)} — keep cash above $0.`);
  if ((rec.salaries || 0) > (rec.revenue || 0) && (rec.salaries || 0) > 0) hiddenWarnings.push(`Driver Salaries (${fmt(rec.salaries)}) exceed Revenue (${fmt(rec.revenue)}) — idle drivers still draw daily pay.`);

  const ledger: any[] = Array.isArray(S.ledger) ? [...S.ledger].reverse() : [];
  const filteredLedger = ledger.filter((entry: any) => {
    if (ledgerFilter === 'revenue') return entry.amount > 0;
    if (ledgerFilter === 'expense') return entry.amount < 0;
    return true;
  }).slice(0, 20);

  return `
    <!-- DAILY ACCOUNTING & PAST-DAYS AUDIT -->
    <div style="padding: 20px; background:#0f172a; border:1px solid #1e293b; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--line); padding-bottom:12px; margin-bottom:14px;">
        <div>
          <span style="font-size:14px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:1.2px;">Daily Accounting & Audit</span>
          <div style="font-size:11px; color:var(--mu); margin-top:2px;">Actual recorded cashflows for Today & Past Days</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px; color:var(--mu); font-weight:800; text-transform:uppercase;">${selectedDayKey === 'today' ? 'TODAY NET' : `${rec.date} NET`}</div>
          <div style="font-size:18px; font-weight:900; font-family:monospace; color:${rec.net >= 0 ? 'var(--grn)' : '#ef4444'};">
            ${rec.net >= 0 ? '+' : ''}${fmt(rec.net)}
          </div>
        </div>
      </div>

      <!-- Day Selector Pills -->
      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px;">
        <button class="btn ${selectedDayKey === 'today' ? 'gold' : 'alt'}" style="padding:5px 10px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="finance-select-day" data-day="today">
          TODAY (${S.dailyAccountingDate || 'LIVE'})
        </button>
        ${history.map((h: any) => `
          <button class="btn ${selectedDayKey === h.date ? 'gold' : 'alt'}" style="padding:5px 10px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="finance-select-day" data-day="${h.date}">
            ${h.date} (${h.net >= 0 ? '+' : ''}${fmt(h.net)})
          </button>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:8px 12px; margin-bottom:12px; background:#0b101d; border:1px solid #1a2336; border-radius:8px; font-size:11px;">
        <span style="color:var(--mu); font-weight:700;">Pending Weekly Payroll (Paid End of Week):</span>
        <span style="font-family:monospace; font-weight:900; color:var(--gold);">
          ${fmt(Math.round(S.accruedPayroll || 0))} · Payday in ${Math.max(0, 7 - (S.payrollWeekDays || 0)).toFixed(1)}d
        </span>
      </div>

      ${hiddenWarnings.length > 0 || (topDrain && topDrain.value > 0) ? `
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:10px 12px; margin-bottom:14px; font-size:11px; line-height:1.5;">
          <div style="font-weight:900; color:var(--gold); text-transform:uppercase; font-size:10px; margin-bottom:4px;">Cost-Drain Diagnostic</div>
          ${topDrain && topDrain.value > 0 ? `<div style="color:var(--tx);">• Biggest Expense: <b>${topDrain.label}</b> (${fmt(topDrain.value)})</div>` : ''}
          ${hiddenWarnings.map(w => `<div style="color:#fca5a5;">• ${w}</div>`).join('')}
        </div>
      ` : ''}

      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tbody>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
            <td style="padding:8px 0; color:var(--grn); font-weight:800;">Total Revenue Recorded</td>
            <td style="padding:8px 0; text-align:right; color:var(--grn); font-weight:900; font-family:monospace;">+${fmt(rec.revenue || 0)}</td>
          </tr>
          ${expenseRows.map(row => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
              <td style="padding:7px 0;">
                <div style="color:${row.value > 0 ? 'var(--tx)' : 'var(--mu)'}; font-weight:600;">${row.label}</div>
                <div style="font-size:9px; color:var(--mu);">${row.hint}</div>
              </td>
              <td style="padding:7px 0; text-align:right; color:${row.value > 0 ? '#ef4444' : 'var(--mu)'}; font-weight:800; font-family:monospace;">
                ${row.value > 0 ? `-${fmt(row.value)}` : '$0'}
              </td>
            </tr>
          `).join('')}
          <tr style="border-top:1.5px solid var(--line);">
            <td style="padding:10px 0; font-weight:900; color:var(--tx);">Total Expenses</td>
            <td style="padding:10px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(rec.totalExpenses || 0)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Recent Ledger Entries -->
      <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--line);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <span style="font-size:11px; font-weight:900; color:var(--tx); text-transform:uppercase;">Recent Ledger Transactions (${ledger.length})</span>
          <div style="display:flex; gap:4px;">
            <button class="btn ${ledgerFilter === 'all' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; font-weight:800;" data-act="finance-ledger-filter" data-filter="all">ALL</button>
            <button class="btn ${ledgerFilter === 'expense' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; font-weight:800;" data-act="finance-ledger-filter" data-filter="expense">EXPENSES</button>
            <button class="btn ${ledgerFilter === 'revenue' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; font-weight:800;" data-act="finance-ledger-filter" data-filter="revenue">REVENUE</button>
          </div>
        </div>
        <div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
          ${filteredLedger.length === 0 ? `
            <div style="padding:14px; text-align:center; color:var(--mu); font-size:10px; font-family:monospace;">No recorded ledger transactions yet.</div>
          ` : filteredLedger.map((tx: any) => {
            const isPos = tx.amount >= 0;
            const dateStr = new Date(tx.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 8px; background:#0b101d; border:1px solid #1a2336; border-radius:6px; font-size:10px;">
                <div style="min-width:0; flex:1;">
                  <div style="color:var(--tx); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${tx.description}</div>
                  <div style="font-size:9px; color:var(--mu); font-family:monospace;">${dateStr} · ${tx.category}</div>
                </div>
                <div style="font-family:monospace; font-weight:900; color:${isPos ? 'var(--grn)' : '#ef4444'}; white-space:nowrap;">
                  ${isPos ? '+' : ''}${fmt(tx.amount)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderTreasuryTab(S: any) {
  const { rating, score } = calculateCreditRating(S);
  const bs = calculateBalanceSheet(S);
  const pnl = calculateIncomeStatement(S);

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      ${renderDailyAuditCard(S)}
      
      <!-- TOP STAT SUMMARY -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <span class="stat-lab" style="font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Total Freight Income</span>
          <span class="stat-val" style="color:var(--grn); font-size:14px; font-weight:900; font-family:monospace;">${fmt(pnl.freightRevenueUsd)}</span>
        </div>

        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <span class="stat-lab" style="font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Net Equity</span>
          <span class="stat-val" style="color:var(--gold); font-size:14px; font-weight:900; font-family:monospace;">${fmt(bs.netEnterpriseValueUsd)}</span>
        </div>
      </div>

      <!-- RECURRING DAILY P&L (INCOME STATEMENT) -->
      <div style="padding: 24px; background:#0f172a; border:1px solid #1e293b; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:16px; margin-bottom:20px;">
          <div>
            <span style="font-size:14px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:1.5px;">Income Statement</span>
            <div style="font-size:11px; color:var(--mu); margin-top:2px;">Consolidated Daily Profit & Loss Analysis</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px; color:var(--mu); font-weight:800; text-transform:uppercase; letter-spacing:1px;">DAILY NET CASHFLOW</div>
            <div style="font-size:20px; color:${pnl.netDailyCashflowUsd >= 0 ? 'var(--grn)' : '#ef4444'}; font-weight:900; font-family:monospace;">
              ${pnl.netDailyCashflowUsd >= 0 ? `+${fmt(pnl.netDailyCashflowUsd)}` : `-${fmt(Math.abs(pnl.netDailyCashflowUsd))}`}
            </div>
          </div>
        </div>

        <!-- REVENUE TABLE -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(16, 185, 129, 0.3);">
              <th style="text-align:left; padding:10px 0; font-size:11px; color:var(--grn); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Operating Revenue Inflows</th>
              <th style="text-align:right; padding:10px 0; font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase;">Daily Rate</th>
            </tr>
          </thead>
          <tbody style="font-size:13px;">
            <tr>
              <td style="padding:14px 0; color:var(--tx); font-weight:600;">Expected Fleet Freight Operations</td>
              <td style="padding:14px 0; text-align:right; color:var(--grn); font-weight:900; font-family:monospace;">+${fmt(pnl.expectedFreightInflowUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Terminal & Warehouse Cross-Docking</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">+${fmt(pnl.warehouseInflowUsd)}</td>
            </tr>
          </tbody>
        </table>

        <!-- OPEX TABLE -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(239, 68, 68, 0.3);">
              <th style="text-align:left; padding:10px 0; font-size:11px; color:#ef4444; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Operating Expenses (OPEX)</th>
              <th style="text-align:right; padding:10px 0; font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase;">Daily Rate</th>
            </tr>
          </thead>
          <tbody style="font-size:13px;">
            <tr>
              <td style="padding:14px 0; color:var(--tx); font-weight:600;">CDL Driver Payroll & Wages</td>
              <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(pnl.driverPayrollUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Insurance Policies (Liability/Collision/Cargo)</td>
              <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(pnl.insuranceExpenseUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Debt Interest & Bank Servicing</td>
              <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(pnl.debtServiceUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Tractor Equipment Leases</td>
              <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(pnl.leaseExpenseUsd)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--line);">
              <td style="padding:18px 0; font-size:12px; font-weight:900; color:var(--mu); text-transform:uppercase; letter-spacing:1px;">Net Daily Operating Surplus</td>
              <td style="padding:18px 0; text-align:right; font-size:16px; font-weight:900; color:${pnl.netDailyCashflowUsd >= 0 ? 'var(--grn)' : '#ef4444'}; font-family:monospace;">
                ${pnl.netDailyCashflowUsd >= 0 ? `+${fmt(pnl.netDailyCashflowUsd)}` : `-${fmt(Math.abs(pnl.netDailyCashflowUsd))}`}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div>
            <div style="color:var(--mu); font-weight:800; text-transform:uppercase; letter-spacing:1px; font-size:10px;">Corporate Liquidity Status</div>
            <div style="color:var(--tx); font-weight:700; margin-top:2px;">CASH RUNWAY ANALYTICS</div>
          </div>
          <div style="font-weight:900; color:${pnl.runwayDays === null ? 'var(--grn)' : 'var(--gold)'}; text-align:right; font-size:14px; font-family:monospace;">
            ${pnl.runwayDays === null ? 'SELF-SUSTAINING' : `${pnl.runwayDays} DAYS REMAINING`}
          </div>
        </div>
      </div>

      <!-- ENTERPRISE BALANCE SHEET & ASSET VALUATION -->
      <div style="padding: 24px; background:#0f172a; border:1px solid #1e293b; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <div style="font-size:14px; color:var(--gold); font-weight:900; text-transform:uppercase; margin-bottom:20px; border-bottom:1px solid var(--line); padding-bottom:16px; letter-spacing:1.5px;">
          Enterprise Balance Sheet
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(193, 154, 91, 0.3);">
              <th style="text-align:left; padding:10px 0; font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Asset Classification</th>
              <th style="text-align:right; padding:10px 0; font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase;">Fair Market Value</th>
            </tr>
          </thead>
          <tbody style="font-size:13px;">
            <tr>
              <td style="padding:14px 0; color:var(--tx); font-weight:600;">Liquid Cash Reserve</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.liquidCash)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--gold);">Fleet Bonds (${bs.bondsCount % 1 === 0 ? bs.bondsCount : bs.bondsCount.toFixed(2)} FLB)</td>
              <td style="padding:14px 0; text-align:right; color:var(--gold); font-weight:900; font-family:monospace;">${fmt(bs.bondsValueUsd)}</td>
            </tr>
            ${bs.cryptoValueUsd > 0 ? `
              <tr>
                <td style="padding:14px 0; color:var(--grn);">Digital Crypto Holdings</td>
                <td style="padding:14px 0; text-align:right; color:var(--grn); font-weight:900; font-family:monospace;">${fmt(bs.cryptoValueUsd)}</td>
              </tr>
            ` : ''}
            
            <tr style="border-top:1px dashed var(--line);">
              <td style="padding:14px 0; color:var(--mu);">Tractor Vehicle Fleet (${bs.fleetTractorsCount} Units)</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.fleetTractorsValueUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Storage Yard Trailers (${bs.yardTrailersCount} Trailers)</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.yardTrailersValueUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Regional Hub Terminals (${bs.hubTerminalsCount} Depots)</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.hubTerminalsValueUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Garage HQ Facility (Level ${bs.garageLevel})</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.garageFacilityValueUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Warehouse Installations & Upgrades</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.warehouseUpgradesValueUsd)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Fuel Bunker & Stored Diesel Inventory</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.fuelBunkerFacilityValueUsd + bs.fuelInventoryValueUsd)}</td>
            </tr>
            ${bs.sparePartsInventoryValueUsd > 0 ? `
              <tr>
                <td style="padding:14px 0; color:var(--mu);">Spare Parts & Components</td>
                <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.sparePartsInventoryValueUsd)}</td>
              </tr>
            ` : ''}
            ${bs.officesValueUsd > 0 ? `
              <tr>
                <td style="padding:14px 0; color:var(--mu);">Regional Commercial Offices</td>
                <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">${fmt(bs.officesValueUsd)}</td>
              </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--line);">
              <td style="padding:18px 0; font-size:12px; font-weight:900; color:var(--mu); text-transform:uppercase; letter-spacing:1px;">Total Gross Assets</td>
              <td style="padding:18px 0; text-align:right; font-size:18px; font-weight:900; color:var(--grn); font-family:monospace;">${fmt(bs.totalAssetsUsd)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- LIABILITIES TABLE -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(239, 68, 68, 0.3);">
              <th style="text-align:left; padding:10px 0; font-size:11px; color:#ef4444; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Liabilities & Obligations</th>
              <th style="text-align:right; padding:10px 0; font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase;">Balance Owed</th>
            </tr>
          </thead>
          <tbody style="font-size:13px;">
            <tr>
              <td style="padding:14px 0; color:var(--tx); font-weight:600;">Commercial Bank Loan Principal</td>
              <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(bs.loanDebtUsd)}</td>
            </tr>
            ${bs.leaseObligationsUsd > 0 ? `
              <tr>
                <td style="padding:14px 0; color:var(--mu);">Equipment Lease Obligations</td>
                <td style="padding:14px 0; text-align:right; color:#ef4444; font-weight:900; font-family:monospace;">-${fmt(bs.leaseObligationsUsd)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- NET EQUITY SUMMARY -->
        <div style="border-top: 2px solid var(--gold); background:linear-gradient(90deg, rgba(193,154,91,0.1), transparent); border-radius:12px; padding: 20px; margin-top:12px; display: flex; justify-content: space-between; align-items:center; box-shadow:inset 0 0 20px rgba(0,0,0,0.2);">
          <div>
            <div style="font-size:10px; color:var(--gold); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Consolidated Shareholder Equity</div>
            <div style="font-weight: 900; color: var(--tx); font-size:15px; margin-top:2px;">NET ENTERPRISE VALUE</div>
          </div>
          <div style="font-weight: 900; color: var(--gold); font-size:22px; font-family:monospace;">${fmt(bs.netEnterpriseValueUsd)}</div>
        </div>
      </div>
    </div>
    </div>
  `;
}
