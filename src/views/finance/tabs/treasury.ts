import { fmt } from '../../../core/ui';
import { calculateCreditRating } from '../../../domain/finance/banking';
import { calculateBalanceSheet, calculateIncomeStatement } from '../../../domain/finance/accounting';

export function renderTreasuryTab(S: any) {
  const { rating, score } = calculateCreditRating(S);
  const bs = calculateBalanceSheet(S);
  const pnl = calculateIncomeStatement(S);

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- TOP STAT SUMMARY -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <span class="stat-lab" style="font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Total Freight Revenue</span>
          <span class="stat-val" style="color:var(--grn); font-size:24px; font-weight:900; font-family:monospace;">${fmt(pnl.freightRevenueUsd)}</span>
        </div>

        <div class="stat-box" style="background:#111827; border:1px solid #1f293d; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <span class="stat-lab" style="font-size:11px; color:var(--mu); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Net Enterprise Equity</span>
          <span class="stat-val" style="color:var(--gold); font-size:24px; font-weight:900; font-family:monospace;">${fmt(bs.netEnterpriseValueUsd)}</span>
        </div>
      </div>

      <!-- RECURRING DAILY P&L (INCOME STATEMENT) -->
      <div style="padding: 24px; background:#0f172a; border:1px solid #1e293b; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:16px; margin-bottom:20px;">
          <div>
            <span style="font-size:14px; font-weight:900; color:var(--tx); text-transform:uppercase; letter-spacing:1.5px;">Enterprise Income Statement</span>
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
            <tr>
              <td style="padding:14px 0; color:var(--mu);">Subcontract Fleet Charter Inflows</td>
              <td style="padding:14px 0; text-align:right; color:var(--tx); font-weight:900; font-family:monospace;">+${fmt(pnl.subcontractInflowUsd)}</td>
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
