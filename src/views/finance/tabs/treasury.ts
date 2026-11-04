import { fmt } from '../../../core/ui';
import { calculateCreditRating, INSURANCE_POLICIES, getGoldMarketData } from '../../../domain/finance/banking';
import { getTotalCryptoValue } from '../../../domain/finance/markets/crypto';

export function renderTreasuryTab(S: any) {
  const { rating, score } = calculateCreditRating(S);
  const bunker = S.fuelBunker || { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
  const cryptoVal = getTotalCryptoValue(S);
  
  // Fleet Bonds (FLB) valuation at current market bid price
  const goldMarket = getGoldMarketData(S);
  const bondsCount = S.coins || 0;
  const bondsValUsd = bondsCount * goldMarket.sellPrice;

  // Total Loan Liabilities
  const totalLoanDebt = (S.loans || []).reduce((sum: number, l: any) => sum + (l.balance || 0), 0);

  // Comprehensive Real Corporate Enterprise Value (Net Worth / Equity)
  const totalLiquidCash = S.money || 0;
  const fleetAssetsVal = (S.fleet || []).reduce((sum: number, t: any) => sum + (t.value || 125000), 0);
  const terminalsVal = ((S.depots?.length || 1) * 85000) + Math.round(bunker.currentLiters * (bunker.avgCostPerLiter || 0.95));
  
  const enterpriseValue = totalLiquidCash + bondsValUsd + cryptoVal + fleetAssetsVal + terminalsVal - totalLoanDebt;

  // Cashflow Calculations
  const dailyWarehouseInflow = (S.warehouseUpgrades?.cross_docking ? 1200 : 0) + (S.warehouseUpgrades?.gantry_crane ? 600 : 0);
  const subcontractCount = (S.subcontractedTrucks || []).length;
  const dailySubcontractInflow = subcontractCount * 1800;
  const totalDailyInflow = dailyWarehouseInflow + dailySubcontractInflow;

  const dailyPayroll = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);
  let dailyInsurance = 0;
  if (S.insurance) {
    if (S.insurance.liability) dailyInsurance += INSURANCE_POLICIES.liability?.dailyCost || 85;
    if (S.insurance.collision) dailyInsurance += INSURANCE_POLICIES.collision?.dailyCost || 220;
    if (S.insurance.cargo) dailyInsurance += INSURANCE_POLICIES.cargo?.dailyCost || 310;
  }
  const dailyDebtService = (S.loans || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0);
  const dailyLeases = (S.leases || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0);
  const totalDailyOutflow = dailyPayroll + dailyInsurance + dailyDebtService + dailyLeases;
  const netDailyCashflow = totalDailyInflow - totalDailyOutflow;
  const runwayDays = netDailyCashflow < 0 ? Math.floor(totalLiquidCash / Math.abs(netDailyCashflow)) : null;

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div class="grid2">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">TOTAL REVENUE</span>
          <span class="stat-val" style="color:var(--grn); font-size:20px; font-weight:900; font-family:monospace;">${fmt(S.stats.earned)}</span>
        </div>
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">LIQUID CAPITAL</span>
          <span class="stat-val" style="font-size:20px; font-weight:900; color:var(--tx); font-family:monospace;">${fmt(totalLiquidCash)}</span>
        </div>
      </div>

      <div class="card" style="padding: 14px; background:#0f172a; border:1px solid #1e293b; border-radius:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Recurring Daily P&L</span>
          <span style="font-size:10px; color:${netDailyCashflow >= 0 ? 'var(--grn)' : '#ef4444'}; font-weight:800; font-family:monospace;">
            ${netDailyCashflow >= 0 ? `+${fmt(netDailyCashflow)}` : `-${fmt(Math.abs(netDailyCashflow))}`}/DAY
          </span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <div>
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">TOTAL INFLOW</div>
            <div style="font-size:14px; font-weight:900; color:var(--grn); font-family:monospace;">+${fmt(totalDailyInflow)}</div>
          </div>
          <div>
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">TOTAL OUTFLOW</div>
            <div style="font-size:14px; font-weight:900; color:#ef4444; font-family:monospace;">-${fmt(totalDailyOutflow)}</div>
          </div>
        </div>
        <div style="font-size:9px; color:var(--mu);">
          ${runwayDays === null ? 'Self-Sustaining Surplus' : `${runwayDays} Operating Days Runway Remaining`}
        </div>
      </div>

      <div class="card" style="padding: 16px; background:#0f172a; border:1px solid #1e293b; border-radius:10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size:10px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:4px;">Enterprise Balance Sheet (Net Worth)</div>
        
        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Liquid Cash Reserve</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(totalLiquidCash)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--gold);">Fleet Bonds (${bondsCount % 1 === 0 ? bondsCount : bondsCount.toFixed(2)} FLB)</span>
          <span style="font-weight:700; color:var(--gold);">${fmt(Math.round(bondsValUsd))}</span>
        </div>

        ${cryptoVal > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span style="color:var(--grn);">Digital Crypto Holdings</span>
            <span style="font-weight:700; color:var(--grn);">${fmt(Math.round(cryptoVal))}</span>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Fleet Assets (${(S.fleet || []).length} Tractors)</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(fleetAssetsVal)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Terminals & Fuel Inventory</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(terminalsVal)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:#ef4444;">Commercial Bank Liabilities</span>
          <span style="font-weight:700; color:#ef4444;">-${fmt(totalLoanDebt)}</span>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; display: flex; justify-content: space-between; font-size:13px;">
          <span style="font-weight: 900; color: var(--gold);">TOTAL NET ENTERPRISE VALUE</span>
          <span style="font-weight: 900; color: var(--gold); font-family:monospace;">${fmt(Math.round(enterpriseValue))}</span>
        </div>
      </div>
    </div>
  `;
}
