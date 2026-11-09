import { GameState } from '../../types/state';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { processMiningTick } from '../finance/markets/mining';
import { getTotalSubcontractInflow } from '../fleet/subcontracting';

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

    let dailyInflow = 0;
    let dailyOutflow = 0;

    // 1. Warehouse Automation Passive Income
    if (S.warehouseUpgrades?.cross_docking) dailyInflow += 1200;
    if (S.warehouseUpgrades?.gantry_crane) dailyInflow += 600;

    // 2. Sub-contracting Passive Retainer (Dynamic Rigs & Trailers)
    dailyInflow += getTotalSubcontractInflow(S);

    // 3. Driver Payroll Daily Salaries
    const totalSalaries = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);
    dailyOutflow += totalSalaries;

    // 4. Commercial Insurance Premiums
    if (S.insurance) {
      if (S.insurance.liability) dailyOutflow += (INSURANCE_POLICIES.liability?.dailyCost || 85);
      if (S.insurance.collision) dailyOutflow += (INSURANCE_POLICIES.collision?.dailyCost || 220);
      if (S.insurance.cargo) dailyOutflow += (INSURANCE_POLICIES.cargo?.dailyCost || 310);
    }

    // 5. Debt Service & Equipment Leases
    if (S.loans && S.loans.length > 0) {
      for (const loan of S.loans) {
        dailyOutflow += (loan.dailyRate || 0);
      }
    }

    const daysElapsed = elapsedMs / MS_PER_DAY;
    const netDaily = dailyInflow - dailyOutflow;
    const netPeriod = Math.round(netDaily * daysElapsed);

    if (netPeriod !== 0) {
      S.money = Math.max(0, S.money + netPeriod);
      if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
      if (netPeriod < 0) {
        S.dailyStats.salaries += Math.abs(netPeriod);
      } else {
        S.dailyStats.revenue += netPeriod;
      }
    }

    S.lastTick = now;
  }
};
