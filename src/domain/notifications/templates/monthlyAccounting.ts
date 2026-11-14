export interface MonthlyAccountingTemplateData {
  monthNumber: number;
  grossRevenue: number;
  totalOpex: number;
  ebitda: number;
  corporateTax: number;
  netMonthlyProfit: number;
  netMarginPct: number;
}

export function getMonthlyAccountingMessage(data: MonthlyAccountingTemplateData) {
  const title = `MONTHLY FINANCIAL AUDIT — MONTH ${data.monthNumber}`;
  const msg = `🏛️ Monthly Corporate Balance Sheet & P&L (Month ${data.monthNumber}): Gross $${data.grossRevenue.toLocaleString()} | Net Profit: ${data.netMonthlyProfit >= 0 ? '+' : ''}$${data.netMonthlyProfit.toLocaleString()}`;
  const body = `MONTHLY ENTERPRISE AUDITED BALANCE SHEET & P&L\nMonth ${data.monthNumber}\n\n- Gross Corporate Revenue: $${data.grossRevenue.toLocaleString()}\n- Total Monthly OPEX & Depreciation: $${data.totalOpex.toLocaleString()}\n- EBITDA (Before Tax): $${data.ebitda.toLocaleString()}\n- Corporate Income Tax (21%): $${data.corporateTax.toLocaleString()}\n- Net Monthly Profit / (Loss): ${data.netMonthlyProfit >= 0 ? '+' : ''}$${data.netMonthlyProfit.toLocaleString()}\n- Net Profit Margin: ${data.netMarginPct.toFixed(1)}%\n\nApproved by Executive Board of Directors & Chief Financial Officer`;
  return { title, msg, body };
}
