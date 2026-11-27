import { GameState } from '../../types/state';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { processMiningTick } from '../finance/markets/mining';
import { processLoanTick } from '../finance/commercialLoans';
import { calculateFleetDailyParkingFees } from '../hubs/hub-facility';
import { processDriverLifecycleTick } from '../drivers/drivers.engine';
import { pushNote } from '../../systems/notify';

const INSURANCE_POLICIES: any = {
  liability: { dailyCost: 85 },
  collision: { dailyCost: 220 },
  cargo: { dailyCost: 310 }
};

function getUtcDateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Authoritative economic simulation engine.
 * Following Engineering Constitution Section 6.3 (Economic Simulation).
 */
export const EconomySimulation = {
  /**
   * Processes passive income, payroll, debt service, and operating expenses.
   */
  processTick(state: GameState, now: number): void {
    const S = state as any; // Temporary cast until GameState is fully fleshed out
    if (!S.lastTick) S.lastTick = now;
    const elapsedMs = now - S.lastTick;
    if (elapsedMs <= 0) return;

    const todayKey = getUtcDateKey(now);
    if (!S.dailyAccountingDate) {
      S.dailyAccountingDate = todayKey;
    } else if (S.dailyAccountingDate !== todayKey) {
      const ds = S.dailyStats || { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
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

      if (!Array.isArray(S.dailyHistory)) S.dailyHistory = [];
      S.dailyHistory.unshift({
        date: S.dailyAccountingDate,
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
        net: revenue - totalExpenses
      });
      if (S.dailyHistory.length > 30) S.dailyHistory.length = 30;

      S.dailyStats = {
        revenue: 0,
        salaries: 0,
        fuel: 0,
        maintenance: 0,
        insurance: 0,
        loans: 0,
        parking: 0,
        leases: 0,
        overdraftInterest: 0,
        tolls: 0
      };
      S.dailyAccountingDate = todayKey;
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // Check and settle any completed corporate tenders
    if (S.corporateTenders && S.corporateTenders.length > 0) {
      S.corporateTenders = S.corporateTenders.filter((tender: any) => {
        if ((tender.completedLoads >= tender.totalLoads || tender.loadsRemaining <= 0) && !tender.bonusAwarded) {
          tender.bonusAwarded = true;
          S.money += tender.bonusPayout;
          S.stats.earned += tender.bonusPayout;
          pushNote(S, `${tender.client} contract completed! Awarded $${tender.bonusPayout.toLocaleString()} SLA performance bonus!`, {
            title: 'CORPORATE TENDER COMPLETED',
            type: 'tender',
            priority: 1,
            body: `Corporate Tender ID: ${tender.id}\nClient: ${tender.client}\nPerformance Bonus: $${tender.bonusPayout.toLocaleString()}\nSLA Met: 100%`
          });
          toast(`Tender Completed: ${tender.client}! +$${tender.bonusPayout.toLocaleString()} Bonus 🪙`, 'success');
          return false;
        }
        return tender.loadsRemaining > 0;
      });
    }
    
    processMiningTick(S, elapsedMs);

    const daysElapsed = elapsedMs / MS_PER_DAY;

    // 5. Debt Service & Equipment Leases (Process via Loan Domain)
    processLoanTick(S, daysElapsed, now);

    let dailyInflow = 0;
    let dailySalaries = 0;
    let dailyInsurance = 0;

    // 1. Warehouse Automation Passive Income
    if (S.warehouseUpgrades?.cross_docking) dailyInflow += 1200;
    if (S.warehouseUpgrades?.gantry_crane) dailyInflow += 600;

    // 3. Driver Payroll Daily Salaries
    dailySalaries = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);

    // 4. Commercial Insurance Premiums
    if (S.insurance) {
      if (S.insurance.liability) dailyInsurance += (INSURANCE_POLICIES.liability?.dailyCost || 85);
      if (S.insurance.collision) dailyInsurance += (INSURANCE_POLICIES.collision?.dailyCost || 220);
      if (S.insurance.cargo) dailyInsurance += (INSURANCE_POLICIES.cargo?.dailyCost || 310);
    }

    // 4b. Hub Berth Overflow & Off-Hub Staging Parking Fees
    const parkingInfo = calculateFleetDailyParkingFees(S);
    const dailyParking = parkingInfo.totalDailyFee;

    // 4c. Tractor Lease Daily Billing & Expiration
    let dailyLeaseCost = 0;
    const daysElapsedActual = elapsedMs / MS_PER_DAY;
    if (Array.isArray(S.leases) && S.leases.length > 0) {
      const activeLeases: any[] = [];
      for (const lease of S.leases) {
        dailyLeaseCost += (lease.dailyRate || 480);
        lease.daysRemaining = (lease.daysRemaining ?? 45) - daysElapsedActual;
        if (lease.daysRemaining <= 0) {
          const leasedTruck = (S.fleet || []).find((t: any) => t.id === lease.truckId);
          if (leasedTruck && leasedTruck.status === 'busy') {
            lease.pendingReturn = true;
            activeLeases.push(lease);
          } else {
            if (leasedTruck) {
              if (leasedTruck.driverId) {
                const drv = (S.drivers || []).find((d: any) => d.id === leasedTruck.driverId);
                if (drv) drv.assignedTruckId = null;
              }
              S.fleet = (S.fleet || []).filter((t: any) => t.id !== leasedTruck.id);
            }
            pushNote(S, `📄 Tractor lease (${lease.modelId}, Unit #${lease.truckId}) expired and was returned to lessor.`, {
              title: 'LEASE EXPIRED',
              type: 'finance'
            });
          }
        } else {
          activeLeases.push(lease);
        }
      }
      S.leases = activeLeases;
    }

    // 4d. Commercial Working-Capital Overdraft Interest (18% APR / 365 when S.money < 0)
    const dailyOverdraftInterest = (S.money || 0) < 0
      ? Math.round(Math.abs(S.money) * (0.18 / 365))
      : 0;

    const periodInflow = Math.round(dailyInflow * daysElapsedActual);
    const periodInsurance = Math.round(dailyInsurance * daysElapsedActual);
    const periodParking = Math.round(dailyParking * daysElapsedActual);
    const periodLeases = Math.round(dailyLeaseCost * daysElapsedActual);
    const periodOverdraftInterest = Math.round(dailyOverdraftInterest * daysElapsedActual);
    const netPeriod = periodInflow - periodInsurance - periodParking - periodLeases - periodOverdraftInterest;

    if (netPeriod !== 0 || periodInflow !== 0 || periodInsurance !== 0 || periodParking !== 0 || periodLeases !== 0 || periodOverdraftInterest !== 0) {
      S.money = S.money + netPeriod;
      if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
      if (periodInflow > 0) S.dailyStats.revenue += periodInflow;
      if (periodInsurance > 0) S.dailyStats.insurance += periodInsurance;
      if (periodParking > 0) S.dailyStats.parking = (S.dailyStats.parking || 0) + periodParking;
      if (periodLeases > 0) S.dailyStats.leases = (S.dailyStats.leases || 0) + periodLeases;
      if (periodOverdraftInterest > 0) S.dailyStats.overdraftInterest = (S.dailyStats.overdraftInterest || 0) + periodOverdraftInterest;
    }

    // 4e. Weekly Staff Payroll Accrual & End-of-Week Settlement (Every 7 simulation days)
    if (dailySalaries > 0) {
      S.accruedPayroll = (S.accruedPayroll || 0) + (dailySalaries * daysElapsedActual);
    }
    S.payrollWeekDays = (S.payrollWeekDays || 0) + daysElapsedActual;
    if (S.payrollWeekDays >= 7) {
      S.payrollWeekDays = S.payrollWeekDays % 7;
      const weeklyPayroll = Math.round(S.accruedPayroll || 0);
      S.accruedPayroll = 0;
      if (weeklyPayroll > 0) {
        if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
        S.money -= weeklyPayroll;
        S.dailyStats.salaries = (S.dailyStats.salaries || 0) + weeklyPayroll;
        if (!Array.isArray(S.ledger)) S.ledger = [];
        S.ledger.push({
          id: `tx-payroll-${now}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          category: 'expense_payroll',
          amount: -weeklyPayroll,
          description: `Weekly Staff Payroll (${(S.drivers || []).length} drivers)`
        });
        if (S.ledger.length > 200) S.ledger.shift();
        pushNote(S, `💼 Weekly Staff Payroll settled: -$${weeklyPayroll.toLocaleString()} for ${(S.drivers || []).length} driver(s).`, {
          title: 'WEEKLY PAYROLL',
          type: 'finance'
        });
      }
    }

    // 5. Driver Lifecycle: Stress recovery, burnout drain & idle resignations
    processDriverLifecycleTick(S, daysElapsedActual);

    S.lastTick = now;
  }
};
