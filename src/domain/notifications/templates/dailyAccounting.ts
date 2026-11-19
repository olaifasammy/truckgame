import { recordTransaction } from '../../core/ledger';

export interface DailyAccountingTemplateData {
  dayNumber: number;
  grossRevenue: number;
  freightInflow: number;
  warehouseInflow: number;
  driverWages: number;
  fuelExpense: number;
  maintenanceExpense: number;
  insuranceExpense: number;
  debtService: number;
  leaseExpense: number;
  netDailyCashflow: number;
}

export function getDailyAccountingMessage(S: any, data: DailyAccountingTemplateData) {
  const ledger = S.ledger || [];
  const dayStart = Date.now() - 43200000; // 12 hours = 1 sim day
  const dailyTx = ledger.filter((tx: any) => tx.timestamp >= dayStart);

  const getSum = (cat: string) => dailyTx.filter((tx: any) => tx.category === cat).reduce((acc: number, tx: any) => acc + tx.amount, 0);

  const stats = {
    freight: getSum('revenue_freight'),
    bonus: getSum('revenue_bonus'),
    assetRev: getSum('revenue_asset'),
    cryptoRev: getSum('revenue_crypto'),
    fuel: getSum('expense_fuel'),
    toll: getSum('expense_toll'),
    payroll: getSum('expense_payroll'),
    maintenance: getSum('expense_maintenance'),
    purchase: getSum('expense_purchase'),
    permit: getSum('expense_permit'),
    unlock: getSum('expense_unlock'),
    cryptoExp: getSum('expense_crypto'),
    finance: getSum('expense_finance'),
  };

  const totalInflow = stats.freight + stats.bonus + stats.assetRev + stats.cryptoRev;
  const totalOutflow = stats.fuel + stats.toll + stats.payroll + stats.maintenance + stats.purchase + stats.permit + stats.unlock + stats.cryptoExp + stats.finance;
  const netResult = totalInflow + totalOutflow;

  const title = `ENTERPRISE ACCOUNTING AUDIT — DAY ${data.dayNumber}`;
  const msg = `📊 Ledger Balance P&L (Day ${data.dayNumber}): Gross +$${totalInflow.toLocaleString()} | Net: ${netResult >= 0 ? '+' : ''}$${netResult.toLocaleString()}`;

  const body = `CONSOLIDATED INCOME STATEMENT (REAL-TIME LEDGER)
Fiscal Period: Day ${data.dayNumber} (Last 12 Real-World Hours)

[REALIZED OPERATING REVENUE]
- Freight Operations: +$${stats.freight.toLocaleString()}
- Performance Bonuses: +$${stats.bonus.toLocaleString()}
- Asset Divestment: +$${stats.assetRev.toLocaleString()}
- Crypto Proceeds: +$${stats.cryptoRev.toLocaleString()}
TOTAL REALIZED INFLOW: +$${totalInflow.toLocaleString()}

[REALIZED OPERATING EXPENSES (OPEX)]
- Fleet Fuel & Energy: $${stats.fuel.toLocaleString()}
- Tolls & Border Tariffs: $${stats.toll.toLocaleString()}
- Driver Wages & Fees: $${stats.payroll.toLocaleString()}
- Maintenance & Overhauls: $${stats.maintenance.toLocaleString()}
- DMV Permits & Inspections: $${stats.permit.toLocaleString()}
- Finance & Interest Fees: $${stats.finance.toLocaleString()}

[CAPITAL EXPENDITURE (CAPEX)]
- Equipment Acquisitions: $${stats.purchase.toLocaleString()}
- Region & Hub Expansion: $${stats.unlock.toLocaleString()}
- Crypto Asset Loading: $${stats.cryptoExp.toLocaleString()}

[NET SETTLEMENT RESULT]
TOTAL CASH OUTFLOW: $${totalOutflow.toLocaleString()}
NET PERIOD CASHFLOW: ${netResult >= 0 ? '+' : ''}$${netResult.toLocaleString()}

Authorized by Corporate Audit Directorate — NexHaul Enterprise`;

  return { title, msg, body };
}
