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
    const periodSalaries = Math.round(dailySalaries * daysElapsedActual);
    const periodInsurance = Math.round(dailyInsurance * daysElapsedActual);
    const periodParking = Math.round(dailyParking * daysElapsedActual);
    const periodLeases = Math.round(dailyLeaseCost * daysElapsedActual);
    const periodOverdraftInterest = Math.round(dailyOverdraftInterest * daysElapsedActual);
    const netPeriod = periodInflow - periodSalaries - periodInsurance - periodParking - periodLeases - periodOverdraftInterest;

    if (netPeriod !== 0 || periodInflow !== 0 || periodSalaries !== 0 || periodInsurance !== 0 || periodParking !== 0 || periodLeases !== 0 || periodOverdraftInterest !== 0) {
      S.money = S.money + netPeriod;
      if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
      if (periodInflow > 0) S.dailyStats.revenue += periodInflow;
      if (periodSalaries > 0) S.dailyStats.salaries += periodSalaries;
      if (periodInsurance > 0) S.dailyStats.insurance += periodInsurance;
      if (periodParking > 0) S.dailyStats.parking = (S.dailyStats.parking || 0) + periodParking;
      if (periodLeases > 0) S.dailyStats.leases = (S.dailyStats.leases || 0) + periodLeases;
      if (periodOverdraftInterest > 0) S.dailyStats.overdraftInterest = (S.dailyStats.overdraftInterest || 0) + periodOverdraftInterest;
    }

    // 5. Driver Lifecycle: Stress recovery, burnout drain & idle resignations
    processDriverLifecycleTick(S, daysElapsedActual);

    S.lastTick = now;
  }
};
