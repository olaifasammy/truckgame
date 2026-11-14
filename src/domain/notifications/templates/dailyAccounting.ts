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

export function getDailyAccountingMessage(data: DailyAccountingTemplateData) {
  const title = `DAILY FINANCIAL AUDIT — DAY ${data.dayNumber}`;
  const msg = `📊 Daily Accounting P&L (Day ${data.dayNumber}): Gross Revenue +$${data.grossRevenue.toLocaleString()} | Net Cashflow: ${data.netDailyCashflow >= 0 ? '+' : ''}$${data.netDailyCashflow.toLocaleString()}`;
  const body = `CONSOLIDATED DAILY INCOME STATEMENT (EXCEL TABLE FORMAT)\nDay: ${data.dayNumber}\n\n[OPERATING REVENUE]\n- Freight Operations: +$${data.freightInflow.toLocaleString()}\n- Warehouse & Cross-Dock: +$${data.warehouseInflow.toLocaleString()}\nTotal Gross Inflows: +$${data.grossRevenue.toLocaleString()}\n\n[OPERATING EXPENSES (OPEX)]\n- CDL Driver Wages & Payroll: -$${data.driverWages.toLocaleString()}\n- Fleet Diesel & Energy: -$${data.fuelExpense.toLocaleString()}\n- Component Maintenance & Repairs: -$${data.maintenanceExpense.toLocaleString()}\n- Insurance Premiums: -$${data.insuranceExpense.toLocaleString()}\n- Debt Service & Loan Interest: -$${data.debtService.toLocaleString()}\n- Equipment Leases: -$${data.leaseExpense.toLocaleString()}\n\n[NET OPERATING RESULT]\nNet Daily Cashflow: ${data.netDailyCashflow >= 0 ? '+' : ''}$${data.netDailyCashflow.toLocaleString()}\n\nCorporate Accounting Directorate`;
  return { title, msg, body };
}
