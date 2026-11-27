import { CopilotTool } from '../copilot.types';
import { DispatchExecution } from '../../dispatch/execution';
import { getDispatchEligibilityError } from '../../dispatch/validation';
import { runAiAutoDispatch } from '../ai.engine';
import { BiddingEngine } from '../../freight/bids/engine';
import { getDynamicCorporateTenders, signCorporateTender } from '../../contracts/tenders';
import { FreightEngine } from '../../freight/engine/generator';
import { findHub } from './hub.tools';

function findJobInState(S: any, jobId: number) {
  let job = (S.jobs || []).find((j: any) => j.id === jobId);
  if (job) return job;
  if (S.hubJobs) {
    for (const hJobs of Object.values(S.hubJobs) as any[][]) {
      job = hJobs?.find((j: any) => j.id === jobId);
      if (job) return job;
    }
  }
  return null;
}

export const DISPATCH_TOOLS: CopilotTool[] = [
  {
    name: 'dispatch_truck',
    description: 'Dispatch a specific truck onto a specific job by job ID and truck ID/name.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'number', description: 'Job ID' },
        truckId: { type: 'number', description: 'Truck ID' }
      },
      required: ['jobId', 'truckId']
    },
    execute: (S: any, { jobId, truckId }: { jobId: number; truckId: number }) => {
      const job = findJobInState(S, jobId);
      if (!job) return { success: false, message: `Job #${jobId} not found on any hub or VIP board.` };
      const truck = (S.fleet || []).find((t: any) => t.id === truckId);
      if (!truck) return { success: false, message: `Truck #${truckId} not found.` };

      const drv = (S.drivers || []).find((d: any) => d.id === truck.driverId);
      const err = getDispatchEligibilityError(S, truck, job, drv);
      if (err) {
        return { success: false, message: `Cannot dispatch ${truck.name} on Job #${jobId}: ${err}` };
      }
      const res = DispatchExecution.takeJob(S, jobId, truckId);
      if (!res.success) return { success: false, message: res.reason || 'Dispatch failed.' };
      return {
        success: true,
        message: `Dispatched ${truck.name} on ${job.from} -> ${job.to} (${job.cargoName}, $${(job.pay || 0).toLocaleString()}).`
      };
    }
  },
  {
    name: 'auto_dispatch_hub',
    description: 'Automatically dispatch all ready idle trucks (at a specific hub or across all hubs) to matching hub loads.',
    parameters: {
      type: 'object',
      properties: {
        hub: { type: 'string', description: 'Optional hub city/name to restrict dispatch to' }
      }
    },
    execute: (S: any, { hub }: { hub?: string }) => {
      if (hub) {
        const target = findHub(hub);
        if (!target || !(S.depots || []).includes(target.id)) {
          return { success: false, message: `Owned hub "${hub}" not found.` };
        }
        if (!S.hubJobs) S.hubJobs = {};
        if (!S.hubJobs[target.id] || S.hubJobs[target.id].length === 0) {
          FreightEngine.replenishHub(S, target.id, 6);
        }
        const idleTrucks = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.loc === target.city);
        if (idleTrucks.length === 0) {
          return { success: false, message: `No idle trucks stationed at ${target.city}.` };
        }
        let dispatched = 0;
        const blockers: string[] = [];
        for (const t of idleTrucks) {
          const drv = (S.drivers || []).find((d: any) => d.id === t.driverId);
          const pool = S.hubJobs[target.id] || [];
          const match = pool.find((j: any) => !getDispatchEligibilityError(S, t, j, drv));
          if (match) {
            const res = DispatchExecution.takeJob(S, match.id, t.id);
            if (res.success) dispatched++;
          } else if (pool.length > 0) {
            const reason = getDispatchEligibilityError(S, t, pool[0], drv);
            blockers.push(`${t.name}: ${reason}`);
          }
        }
        return {
          success: dispatched > 0,
          message: `Dispatched ${dispatched}/${idleTrucks.length} idle truck(s) at ${target.city}.${blockers.length ? ' Blockers: ' + blockers.slice(0, 3).join(' | ') : ''}`,
          actions: blockers.length ? [
            { label: `Staff ${target.city}`, prompt: `staff idle trucks in ${target.city}` },
            { label: `Service ${target.city}`, prompt: `service fleet in ${target.city}` }
          ] : undefined
        };
      }

      // Global auto-dispatch pass across all hubs
      const res = runAiAutoDispatch(S, true);
      return {
        success: res.dispatchedCount > 0,
        message: res.dispatchedCount > 0
          ? `Dispatched ${res.dispatchedCount} idle truck(s) across your hub network.`
          : (res.message || 'No idle trucks met dispatch requirements.'),
        actions: res.dispatchedCount === 0 ? [
          { label: 'Service Fleet', prompt: 'service idle fleet' },
          { label: 'Staff Idle Trucks', prompt: 'staff idle trucks' }
        ] : undefined
      };
    }
  },
  {
    name: 'toggle_ai_dispatch',
    description: 'Enable or disable the AI Neural Auto-Dispatch engine and optionally set its optimization profile.',
    parameters: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'True to enable, false to pause' },
        profile: {
          type: 'string',
          description: 'Optimization profile',
          enum: ['max_profit', 'fuel_saver', 'balanced_efficiency', 'safety_first']
        }
      }
    },
    execute: (S: any, { enabled, profile }: { enabled?: boolean; profile?: string }) => {
      if (!S.aiState) S.aiState = { subscriptionActive: false, filters: {} };
      if (!S.aiState.subscriptionActive) {
        return { success: false, message: 'AI Neural Dispatch subscription is not active. Activate it in the AI Dispatch tab.' };
      }
      if (!S.aiState.filters) S.aiState.filters = {};
      if (typeof enabled === 'boolean') S.aiState.filters.enabled = enabled;
      if (profile) S.aiState.filters.profile = profile;
      const stateLabel = S.aiState.filters.enabled ? 'ENABLED' : 'PAUSED';
      return {
        success: true,
        message: `AI Neural Auto-Dispatch is now ${stateLabel} (Profile: ${S.aiState.filters.profile || 'balanced_efficiency'}).`
      };
    }
  },
  {
    name: 'list_auctions',
    description: 'List all live reverse-bid freight auctions.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const auctions = (S.auctions || []).map((a: any) => ({
        id: a.id,
        route: `${a.from} -> ${a.to}`,
        cargo: a.cargoName,
        trailer: a.trailer,
        currentBid: `$${(a.currentBid || a.startBid || 0).toLocaleString()}`,
        leader: a.currentWinner === 'player' ? 'YOU' : (a.currentWinner || 'Open')
      }));
      return {
        success: true,
        message: `Found ${auctions.length} live auction(s).`,
        data: auctions
      };
    }
  },
  {
    name: 'place_bid',
    description: 'Place a bid on a live freight auction.',
    parameters: {
      type: 'object',
      properties: {
        auctionId: { type: 'number', description: 'Auction ID' },
        amount: { type: 'number', description: 'Bid amount in USD' }
      },
      required: ['auctionId', 'amount']
    },
    execute: (S: any, { auctionId, amount }: { auctionId: number; amount: number }) => {
      const res = BiddingEngine.placeBid(S, auctionId, amount, 'player');
      return {
        success: !!res.success,
        message: res.message || (res.success ? `Bid of $${amount.toLocaleString()} placed on Auction #${auctionId}.` : 'Bid failed.')
      };
    }
  },
  {
    name: 'list_tenders',
    description: 'List available and active 30-day Corporate Tenders.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const tenders = getDynamicCorporateTenders(S).map((t: any) => {
        const active = (S.corporateTenders || []).find((a: any) => a.id === t.id);
        return {
          id: t.id,
          client: t.client,
          lane: t.lane,
          payPerLoad: `$${(t.ratePerDelivery || 0).toLocaleString()}`,
          status: active ? `ACTIVE (${active.completedLoads || 0}/${active.totalLoads})` : 'AVAILABLE'
        };
      });
      return {
        success: true,
        message: `Found ${tenders.length} corporate tender(s).`,
        data: tenders
      };
    }
  },
  {
    name: 'sign_tender',
    description: 'Sign a 30-day Corporate Tender contract by ID.',
    parameters: {
      type: 'object',
      properties: {
        tenderId: { type: 'string', description: 'Tender ID' }
      },
      required: ['tenderId']
    },
    execute: (S: any, { tenderId }: { tenderId: string }) => {
      const ok = signCorporateTender(S, tenderId);
      if (!ok) {
        return { success: false, message: `Cannot sign tender "${tenderId}". Check fleet size, safety rating, or required permits.` };
      }
      return { success: true, message: `Signed 30-day Corporate Tender "${tenderId}". Loads will be scheduled to your hub.` };
    }
  }
];
