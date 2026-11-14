/**
 * NexHaul Logistics - Authoritative Simulation Engine
 * Coordinates authoritative simulation step execution across domain subsystems:
 * Economics, Deliveries, Driver Fatigue & HOS, AI Automation, and Market Orders.
 * 
 * Following NexHaul Engineering Constitution Sections 3.2, 6.1, 6.3, 6.4, & 6.6.
 */

import { completeJobs, processEconomics, replenish } from '../../systems/jobs';
import { completeRepairs } from '../../systems/maintenance';
import { processLimitOrders } from '../finance/markets/crypto';
import { processCryptoLoansTick } from '../finance/markets/loans';
import { getTruckTelematics } from '../trucks/trucks.telematics';
import { onTruckArrival } from '../../systems/fleet';
import { runAiAutoDispatch, runAiFleetMaintenance } from '../ai/ai.engine';
import { runAiCryptoTradingTick } from '../ai/ai.quant';
import { AI_SUBSCRIPTION_PLANS } from '../ai/ai.config';
import { TRAIT_REGISTRY } from '../drivers/drivers.names';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { calculateIncomeStatement, calculateWeeklyAccounting, calculateMonthlyAccounting } from '../finance/accounting';
import { getDailyAccountingMessage } from '../notifications/templates/dailyAccounting';
import { getWeeklyAccountingMessage } from '../notifications/templates/weeklyAccounting';
import { getMonthlyAccountingMessage } from '../notifications/templates/monthlyAccounting';

export interface SimulationTickResult {
  doneCount: number;
  auctionsChanged: boolean;
  bidChanged: boolean;
  repairsCount: number;
  dispatchedCount: number;
  botTraded: boolean;
  maintenanceCount: number;
  hasStructuralChange: boolean;
  activeDeliveriesRemaining: number;
}

let lastFreightReplenishTime = 0;

/**
 * Executes a single authoritative simulation tick step.
 * Modifies state in place deterministically.
 */
export function executeSimulationStep(st: any, now: number): SimulationTickResult {
  if (!st || !st.isAuthenticated) {
    return {
      doneCount: 0,
      auctionsChanged: false,
      bidChanged: false,
      repairsCount: 0,
      dispatchedCount: 0,
      botTraded: false,
      maintenanceCount: 0,
      hasStructuralChange: false,
      activeDeliveriesRemaining: 0
    };
  }

  // 1. Authoritative Economic Simulation Tick (Passive revenues, warehouse cross-docking, debt service, mining yield)
  try {
    processEconomics(st, now);
  } catch (e) {
    console.error('Simulation: Economy error', e);
  }

  // 2. Spot Exchange Limit Orders Processing
  try {
    processLimitOrders(st);
  } catch (e) {
    console.error('Simulation: Limit orders error', e);
  }

  // 2.5 Authoritative Fleet & Active Job Integrity Audit (Self-Healing)
  // Ensures S.active only contains valid jobs for existing trucks, and no duplicates.
  if (st.active && st.active.length > 0) {
    const validFleetIds = new Set((st.fleet || []).map((t: any) => t.id));
    const processedTruckIds = new Set<number>();
    
    st.active = st.active.filter((a: any) => {
      // 1. Purge jobs for non-existent trucks
      if (!validFleetIds.has(a.truck)) return false;
      
      // 2. Prevent duplicate active jobs for the same truck (Zombie job cleanup)
      if (processedTruckIds.has(a.truck)) {
        console.warn(`Simulation: Purged duplicate active job for Truck #${a.truck}`);
        return false;
      }
      
      processedTruckIds.add(a.truck);

      // 3. Status Synchronization: Ensure truck is marked 'busy' if it has an active job
      const truck = st.fleet.find((t: any) => t.id === a.truck);
      if (truck && truck.status === 'idle') {
        truck.status = 'busy';
      }

      // 4. Physical Distance Progression & Lively ETA Synchronization
      if (truck) {
        const driver = (st.drivers || []).find((d: any) => d.assignedTruckId === a.truck);
        const telem = getTruckTelematics(truck, a, driver, now);
        const lastTick = (st as any)._lastSimTick || (now - 1000);
        const deltaMs = Math.max(100, Math.min(60000, now - lastTick));

        // If speedKmh > 0, advance physical distance travelled (stops have speedKmh = 0, so distance pauses during rest/fuel stops)
        if (telem.speedKmh > 0) {
          const deltaKm = telem.speedKmh * (deltaMs / 3600000);
          a.kmTravelled = Math.min(a.km || 100, (a.kmTravelled ?? 0) + deltaKm);
        }

        // Dynamically update activeJob.end lively so UI, map popups, and telematics modal show accurate ETA
        if (telem.remainingMs > 0) {
          a.end = now + telem.remainingMs;
        }
      }

      return true;
    });
    (st as any)._lastSimTick = now;
  }

  // 3. Freight Consignment Arrivals & Job Completions
  let done: any[] = [];
  let auctionChanged = false;
  let bidChanged = false;

  // EMERGENCY CLEANUP: If the board is overwhelmed (e.g. from legacy state or bugs), 
  // truncate it immediately to maintain performance and UI sanity.
  if (st.jobs && st.jobs.length > 20) {
    st.jobs = st.jobs.slice(0, 17);
  }

  const prevAuctionCount = (st.auctions || []).length;
  const prevJobCount = (st.jobs || []).length;

  try {
    const jobResult = completeJobs(st, now) || {};
    done = jobResult.done || [];
    auctionChanged = !!jobResult.auctionChanged;
    bidChanged = !!jobResult.bidChanged;
    
    if (done.length > 0) {
      // _finalizeJob already handles status=idle and processScheduledRepair
      toast(`Delivered ${done.length} consignment${done.length > 1 ? 's' : ''}`, 'success');
    }
  } catch (e) {
    console.error('Simulation: Complete jobs error', e);
  }

  // 4. Workshop Hoist Repairs Completion
  let repCount = 0;
  try {
    repCount = completeRepairs(st, now) || 0;
  } catch (e) {
    console.error('Simulation: Repairs error', e);
  }

  // 5. Driver Fatigue & En-Route Hours of Service (HOS) Safety Stop
  if (st.active && st.active.length > 0) {
    st.active.forEach((a: any) => {
      const truck = (st.fleet || []).find((tr: any) => tr.id === a.truck);
      if (truck && truck.driverId) {
        const drv = (st.drivers || []).find((d: any) => d.id === truck.driverId);
        if (drv) {
          // Skip fatigue accumulation if currently on mandatory sleeper berth rest
          if (drv.hosRestUntil && drv.hosRestUntil > now) {
            a.lastFatigueTick = now;
            return;
          }

          if (!a.lastFatigueTick) a.lastFatigueTick = now;
          const msElapsed = Math.max(0, now - a.lastFatigueTick);
          const simHoursElapsed = msElapsed / 150000; // 2.5 real minutes = 1 simulation hour

          let fatigueMod = 1.0;
          if (drv.trait) {
            const traitDef = (TRAIT_REGISTRY as any)[drv.trait];
            if (traitDef?.effect?.fatigueMod) {
              fatigueMod += traitDef.effect.fatigueMod;
            }
          }

          const fatigueGain = simHoursElapsed * 9.1 * fatigueMod;
          drv.fatigue = Math.min(100, Math.round(((drv.fatigue || 0) + fatigueGain) * 100) / 100);
          a.lastFatigueTick = now;

          // En-route safety stop at 80% fatigue (mandated regulatory sleeper berth rest)
          if (drv.fatigue >= 80) {
            drv.fatigue = 0;
            drv.hosHours = 0;
            const restDurationMs = 15000; // 15 seconds real-time safety stop
            drv.hosRestUntil = now + restDurationMs;
            a.end = (a.end || now) + restDurationMs;
            pushNote(st, `${drv.name} reached 80% fatigue en-route and pulled over at a travel plaza for mandatory sleeper berth rest.`, {
              title: 'HOS SAFETY REST',
              type: 'ops'
            });
            toast(`${drv.name} taking mandatory HOS rest (80% fatigue reached)`, 'info');
          }
        }
      }
    });
  }

  // 6. AI Dispatch Automation (Continuous background matching when subscribed)
  let dispatchedCount = 0;
  let isAiSubscribed = !!(st.aiState?.subscriptionActive && now < (st.aiState?.expiresTimestamp || 0));

  // Seamless auto-renewal: If subscription expired but auto-renew is enabled or positive treasury balance exists
  if (!isAiSubscribed && st.aiState?.subscriptionActive && (st.aiState?.autoRenew || st.aiState?.planId === 'auto' || (st.money || 0) >= 5000)) {
    const planId = st.aiState.planId || 'auto';
    const plan = AI_SUBSCRIPTION_PLANS[planId] || AI_SUBSCRIPTION_PLANS['auto'];
    const renewCost = plan?.priceUsd || 145000;
    if ((st.money || 0) >= renewCost) {
      st.money -= renewCost;
      st.aiState.expiresTimestamp = now + (plan?.days || 30) * 86400 * 1000;
      isAiSubscribed = true;
      pushNote(st, `🔄 AI Enterprise License auto-renewed for ${plan?.days || 30} days (-$${renewCost.toLocaleString()}). Neural dispatching uninterrupted.`, {
        title: 'LICENSE AUTO-RENEWED',
        type: 'finance'
      });
    } else if ((st.money || 0) >= 5000) {
      const dailyCost = 5000;
      st.money -= dailyCost;
      st.aiState.expiresTimestamp = now + 86400 * 1000;
      isAiSubscribed = true;
      pushNote(st, `⚡ Tactical 24h AI Dispatch extension applied (-$${dailyCost.toLocaleString()}). Operations maintained.`, {
        title: 'TACTICAL DISPATCH EXTENSION',
        type: 'finance'
      });
    }
  }

  if (isAiSubscribed && st.aiState?.filters?.enabled !== false) {
    try {
      const dispatchRes = runAiAutoDispatch(st, now);
      dispatchedCount = dispatchRes.dispatchedCount || 0;
    } catch (e) {
      console.error('Simulation: AI Dispatch error', e);
    }
  }

  // 7. AI Crypto Quant Trading Bot Tick & Collateral Loans Margin Desk
  let botTraded = false;
  try {
    processCryptoLoansTick(st);
  } catch (e) {
    console.error('Simulation: Loans Margin Desk error', e);
  }

  const isQuantSubscribed = !!(st.aiState?.quantTraderActive && now < (st.aiState?.quantTraderExpiresTimestamp || 0));

  if (st.aiCryptoBot?.enabled) {
    if (!isQuantSubscribed) {
      st.aiCryptoBot.enabled = false;
      pushNote(st, 'AI Quant Trading Bot paused. Subscription expired or inactive.', {
        title: 'TRADER BOT EXPIRED',
        type: 'finance'
      });
      toast('AI Quant Bot paused (Subscription Required)', 'err');
    } else {
      try {
        const botRes = runAiCryptoTradingTick(st);
        botTraded = !!botRes.executed;
      } catch (e) {
        console.error('Simulation: AI Quant Bot error', e);
      }
    }
  }

  // 8. AI Fleet Maintenance Automation (Autonomous workshop servicing)
  let maintCount = 0;
  const isMaintActive = !!(st.aiState?.maintenanceAddonActive && now < (st.aiState?.maintenanceExpiresTimestamp || 0));
  if (isMaintActive) {
    try {
      maintCount = runAiFleetMaintenance(st) || 0;
    } catch (e) {
      console.error('Simulation: Fleet Maintenance error', e);
    }
  }

  // 9. Periodic Freight Market Replenishment (Every 30s or if board drops below 3 contracts)
  if (now - lastFreightReplenishTime > 30000 || (st.jobs && st.jobs.length < 3)) {
    try {
      replenish(st);
      lastFreightReplenishTime = now;
    } catch (e) {
      console.error('Simulation: Replenish error', e);
    }
  }

  // 10. Automated Accounting Statements (Daily, Weekly, Monthly)
  st.simulationDay = st.simulationDay || 1;
  st.lastAccountingDayTimestamp = st.lastAccountingDayTimestamp || now;
  
  if (now - st.lastAccountingDayTimestamp >= 60000) {
    st.simulationDay += 1;
    st.lastAccountingDayTimestamp = now;
    
    // Daily Accounting
    const daily = calculateIncomeStatement(st);
    const dailyMsg = getDailyAccountingMessage({
      dayNumber: st.simulationDay,
      grossRevenue: daily.totalGrossRevenueUsd,
      freightInflow: daily.expectedFreightInflowUsd + daily.freightRevenueUsd,
      warehouseInflow: daily.warehouseInflowUsd,
      driverWages: daily.driverPayrollUsd,
      fuelExpense: daily.fuelExpenseUsd,
      maintenanceExpense: daily.maintenanceExpenseUsd,
      insuranceExpense: daily.insuranceExpenseUsd,
      debtService: daily.debtServiceUsd,
      leaseExpense: daily.leaseExpenseUsd,
      netDailyCashflow: daily.netDailyCashflowUsd
    });
    pushNote(st, dailyMsg.msg, { title: dailyMsg.title, type: 'finance', priority: 1, body: dailyMsg.body });

    // Weekly Accounting (Every 7 days)
    if (st.simulationDay % 7 === 0) {
      const weeklyNum = Math.floor(st.simulationDay / 7);
      const weekly = calculateWeeklyAccounting(st);
      const weeklyMsg = getWeeklyAccountingMessage({
        weekNumber: weeklyNum,
        grossRevenue: weekly.grossRevenueUsd,
        totalOpex: weekly.totalOpexUsd,
        ebitda: weekly.ebitdaUsd,
        netWeeklyProfit: weekly.netWeeklyProfitUsd,
        netMarginPct: weekly.netMarginPct
      });
      pushNote(st, weeklyMsg.msg, { title: weeklyMsg.title, type: 'finance', priority: 2, body: weeklyMsg.body });
    }

    // Monthly Accounting (Every 30 days)
    if (st.simulationDay % 30 === 0) {
      const monthlyNum = Math.floor(st.simulationDay / 30);
      const monthly = calculateMonthlyAccounting(st);
      const monthlyMsg = getMonthlyAccountingMessage({
        monthNumber: monthlyNum,
        grossRevenue: monthly.grossRevenueUsd,
        totalOpex: monthly.totalOpexUsd,
        ebitda: monthly.ebitdaUsd,
        corporateTax: monthly.corporateTaxUsd,
        netMonthlyProfit: monthly.netMonthlyProfitUsd,
        netMarginPct: monthly.netMarginPct
      });
      pushNote(st, monthlyMsg.msg, { title: monthlyMsg.title, type: 'finance', priority: 2, body: monthlyMsg.body });
    }
  }

  const currentAuctionCount = (st.auctions || []).length;
  const currentJobCount = (st.jobs || []).length;
  const boardStructurallyChanged = prevAuctionCount !== currentAuctionCount || prevJobCount !== currentJobCount || auctionChanged;

  const hasStructuralChange = 
    done.length > 0 ||
    repCount > 0 ||
    dispatchedCount > 0 ||
    maintCount > 0 ||
    boardStructurallyChanged;

  return {
    doneCount: done.length,
    auctionsChanged: boardStructurallyChanged,
    bidChanged,
    repairsCount: repCount,
    dispatchedCount,
    botTraded,
    maintenanceCount: maintCount,
    hasStructuralChange,
    activeDeliveriesRemaining: (st.active || []).length
  };
}
