import { fmt } from '../../../core/ui';
import { calculateCreditRating } from '../../../domain/finance/banking';
import { calculateBalanceSheet, calculateIncomeStatement } from '../../../domain/finance/accounting';

export function renderTreasuryTab(S: any) {
  const { rating, score } = calculateCreditRating(S);
  const bs = calculateBalanceSheet(S);
  const pnl = calculateIncomeStatement(S);

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">
      
      <!-- TOP STAT SUMMARY -->
      <div class="grid2">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">TOTAL FREIGHT REVENUE</span>
          <span class="stat-val" style="color:var(--grn); font-size:18px; font-weight:900; font-family:monospace;">${fmt(pnl.freightRevenueUsd)}</span>
        </div>

        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:10px; padding:12px;">
          <span class="stat-lab" style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">NET ENTERPRISE EQUITY</span>
          <span class="stat-val" style="color:var(--gold); font-size:18px; font-weight:900; font-family:monospace;">${fmt(bs.netEnterpriseValueUsd)}</span>
        </div>
      </div>

      <!-- RECURRING DAILY P&L (INCOME STATEMENT) -->
      <div class="card" style="padding: 14px; background:#0f172a; border:1px solid #1e293b; border-radius:10px; display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Corporate P&L & Income Statement</span>
          <span style="font-size:10px; color:${pnl.netDailyCashflowUsd >= 0 ? 'var(--grn)' : '#ef4444'}; font-weight:800; font-family:monospace;">
            NET: ${pnl.netDailyCashflowUsd >= 0 ? `+${fmt(pnl.netDailyCashflowUsd)}` : `-${fmt(Math.abs(pnl.netDailyCashflowUsd))}`}/DAY
          </span>
        </div>

        <!-- REVENUE INFLOWS -->
        <div style="display:flex; flex-direction:column; gap:4px; font-size:11px;">
          <div style="font-size:9px; font-weight:800; color:var(--grn); text-transform:uppercase; margin-bottom:2px;">OPERATING REVENUE INFLOWS</div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Terminal & Warehouse Cross-Docking</span>
            <span style="color:var(--tx); font-weight:700;">+${fmt(pnl.warehouseInflowUsd)}/day</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Subcontract Fleet Charter Inflows</span>
            <span style="color:var(--tx); font-weight:700;">+${fmt(pnl.subcontractInflowUsd)}/day</span>
          </div>
        </div>

        <!-- OPERATING EXPENSES (OPEX) -->
        <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; border-top:1px dashed var(--line); padding-top:8px;">
          <div style="font-size:9px; font-weight:800; color:#ef4444; text-transform:uppercase; margin-bottom:2px;">OPERATING EXPENSES (OPEX)</div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>CDL Driver Payroll & Wages</span>
            <span style="color:#ef4444; font-weight:700;">-${fmt(pnl.driverPayrollUsd)}/day</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Insurance Policies (Liability/Collision/Cargo)</span>
            <span style="color:#ef4444; font-weight:700;">-${fmt(pnl.insuranceExpenseUsd)}/day</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Debt Interest & Bank Servicing</span>
            <span style="color:#ef4444; font-weight:700;">-${fmt(pnl.debtServiceUsd)}/day</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Tractor Equipment Leases</span>
            <span style="color:#ef4444; font-weight:700;">-${fmt(pnl.leaseExpenseUsd)}/day</span>
          </div>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; display:flex; justify-content:space-between; font-size:10px; color:var(--mu);">
          <span>RUNWAY SURPLUS STATUS</span>
          <span style="font-weight:700; color:var(--tx);">
            ${pnl.runwayDays === null ? 'Self-Sustaining Operating Surplus' : `${pnl.runwayDays} Days Cash Runway Remaining`}
          </span>
        </div>
      </div>

      <!-- ENTERPRISE BALANCE SHEET & ASSET VALUATION -->
      <div class="card" style="padding: 16px; background:#0f172a; border:1px solid #1e293b; border-radius:10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size:10px; color:var(--gold); font-weight:800; text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid var(--line); padding-bottom:6px;">
          Enterprise Balance Sheet & Asset Valuation
        </div>

        <!-- LIQUID & TRADING ASSETS -->
        <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-top:2px;">LIQUID & TRADING ASSETS</div>
        
        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Liquid Cash Reserve</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.liquidCash)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--gold);">Fleet Bonds (${bs.bondsCount % 1 === 0 ? bs.bondsCount : bs.bondsCount.toFixed(2)} FLB)</span>
          <span style="font-weight:700; color:var(--gold);">${fmt(bs.bondsValueUsd)}</span>
        </div>

        ${bs.cryptoValueUsd > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span style="color:var(--grn);">Digital Crypto Holdings</span>
            <span style="font-weight:700; color:var(--grn);">${fmt(bs.cryptoValueUsd)}</span>
          </div>
        ` : ''}

        <!-- PHYSICAL ASSETS & INFRASTRUCTURE -->
        <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-top:6px; border-top:1px dashed var(--line); padding-top:6px;">
          PHYSICAL ASSETS & INFRASTRUCTURE
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Tractor Vehicle Fleet (${bs.fleetTractorsCount} Units)</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.fleetTractorsValueUsd)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Storage Yard Trailers (${bs.yardTrailersCount} Trailers)</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.yardTrailersValueUsd)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Regional Hub Terminals (${bs.hubTerminalsCount} Depots)</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.hubTerminalsValueUsd)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Garage HQ Facility (Level ${bs.garageLevel})</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.garageFacilityValueUsd)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Warehouse Installations & Upgrades</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.warehouseUpgradesValueUsd)}</span>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Fuel Bunker Facility & Stored Diesel Inventory</span>
          <span style="font-weight:700; color:var(--tx);">${fmt(bs.fuelBunkerFacilityValueUsd + bs.fuelInventoryValueUsd)}</span>
        </div>

        ${bs.sparePartsInventoryValueUsd > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span style="color:var(--mu);">Spare Parts & Components Inventory</span>
            <span style="font-weight:700; color:var(--tx);">${fmt(bs.sparePartsInventoryValueUsd)}</span>
          </div>
        ` : ''}

        ${bs.officesValueUsd > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span style="color:var(--mu);">Regional Commercial Offices</span>
            <span style="font-weight:700; color:var(--tx);">${fmt(bs.officesValueUsd)}</span>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800; color:var(--tx); border-top:1px solid rgba(255,255,255,0.08); padding-top:4px;">
          <span>TOTAL GROSS ASSETS</span>
          <span style="color:var(--grn);">${fmt(bs.totalAssetsUsd)}</span>
        </div>

        <!-- LIABILITIES -->
        <div style="font-size:9px; font-weight:800; color:#ef4444; text-transform:uppercase; margin-top:6px; border-top:1px dashed var(--line); padding-top:6px;">
          LIABILITIES & DEBT OBLIGATIONS
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px;">
          <span style="color:var(--mu);">Commercial Bank Loan Principal</span>
          <span style="font-weight:700; color:#ef4444;">-${fmt(bs.loanDebtUsd)}</span>
        </div>

        ${bs.leaseObligationsUsd > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span style="color:var(--mu);">Equipment Lease Obligations</span>
            <span style="font-weight:700; color:#ef4444;">-${fmt(bs.leaseObligationsUsd)}</span>
          </div>
        ` : ''}

        <!-- NET EQUITY -->
        <div style="border-top: 1px solid var(--gold); padding-top: 8px; margin-top:4px; display: flex; justify-content: space-between; font-size:13px;">
          <span style="font-weight: 900; color: var(--gold);">NET ENTERPRISE EQUITY VALUE</span>
          <span style="font-weight: 900; color: var(--gold); font-family:monospace;">${fmt(bs.netEnterpriseValueUsd)}</span>
        </div>
      </div>
    </div>
  `;
}
