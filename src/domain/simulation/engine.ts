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
import { onTruckArrival } from '../../systems/fleet';
import { runAiAutoDispatch, runAiFleetMaintenance } from '../ai/ai.engine';
import { runAiCryptoTradingTick } from '../ai/ai.quant';
import { TRAIT_REGISTRY } from '../drivers/drivers.names';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export interface SimulationTickResult {
  doneCount: number;
  auctionsChanged: boolean;
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

  // 3. Freight Consignment Arrivals & Job Completions
  let done: any[] = [];
  let auctionChanged = false;
  const prevAuctionCount = (st.auctions || []).length;

  try {
    const jobResult = completeJobs(st, now) || {};
    done = jobResult.done || [];
    auctionChanged = !!jobResult.auctionChanged;
    
    if (done.length > 0) {
      done.forEach((job: any) => {
        onTruckArrival(st, job.truck || job.id);
      });
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
          const simHoursElapsed = msElapsed / 300000; // 5 real minutes = 1 simulation hour

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
            const restDurationMs = 30000; // 30 seconds real-time safety stop
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
  const isAiSubscribed = !!(st.aiState?.subscriptionActive && now < (st.aiState?.expiresTimestamp || 0));
  if (isAiSubscribed && st.aiState?.filters?.enabled !== false) {
    try {
      const dispatchRes = runAiAutoDispatch(st);
      dispatchedCount = dispatchRes.dispatchedCount || 0;
    } catch (e) {
      console.error('Simulation: AI Dispatch error', e);
    }
  }

  // 7. AI Crypto Quant Trading Bot Tick
  let botTraded = false;
  if (st.aiCryptoBot?.enabled) {
    try {
      const botRes = runAiCryptoTradingTick(st);
      botTraded = !!botRes.executed;
    } catch (e) {
      console.error('Simulation: AI Quant Bot error', e);
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

  const currentAuctionCount = (st.auctions || []).length;
  const auctionsStructurallyChanged = prevAuctionCount !== currentAuctionCount || auctionChanged;

  const hasStructuralChange = 
    done.length > 0 ||
    repCount > 0 ||
    dispatchedCount > 0 ||
    maintCount > 0 ||
    auctionsStructurallyChanged;

  return {
    doneCount: done.length,
    auctionsChanged: auctionsStructurallyChanged,
    repairsCount: repCount,
    dispatchedCount,
    botTraded,
    maintenanceCount: maintCount,
    hasStructuralChange,
    activeDeliveriesRemaining: (st.active || []).length
  };
}
