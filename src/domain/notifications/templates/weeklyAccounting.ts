export interface WeeklyAccountingTemplateData {
  weekNumber: number;
  grossRevenue: number;
  totalOpex: number;
  ebitda: number;
  netWeeklyProfit: number;
  netMarginPct: number;
}

export function getWeeklyAccountingMessage(data: WeeklyAccountingTemplateData) {
  const title = `WEEKLY FINANCIAL STATEMENT — WEEK ${data.weekNumber}`;
  const msg = `📈 Weekly Enterprise P&L (Week ${data.weekNumber}): Gross Revenue $${data.grossRevenue.toLocaleString()} | Net Profit: ${data.netWeeklyProfit >= 0 ? '+' : ''}$${data.netWeeklyProfit.toLocaleString()} (${data.netMarginPct.toFixed(1)}% Margin)`;
  const body = `WEEKLY ENTERPRISE PERFORMANCE STATEMENT\nWeek ${data.weekNumber} Summary\n\n- Gross Revenue: $${data.grossRevenue.toLocaleString()}\n- Total Operating Expenses: $${data.totalOpex.toLocaleString()}\n- EBITDA: $${data.ebitda.toLocaleString()}\n- Net Weekly Profit / Loss: ${data.netWeeklyProfit >= 0 ? '+' : ''}$${data.netWeeklyProfit.toLocaleString()}\n- Net Profit Margin: ${data.netMarginPct.toFixed(1)}%\n\nAudited by NexHaul Global Financial Controller`;
  return { title, msg, body };
}
