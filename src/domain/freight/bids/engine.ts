import { tenderWonTemplate } from '../../notifications/templates';
import { JobAuction, BidHistoryItem, Region } from './types';
import { COMPETITORS, getRandomCompetitor } from './competitors';
import { CARGO_TYPES } from '../cargo/registry';
import { COMPANIES } from '../companies/registry';
import { pushNote } from '../../../systems/notify';
import { getCompanyProgression } from '../../company/progression';
import { LOCATIONS } from '../../../data/world';
import { REGIONAL_HUBS } from '../../logistics/network';

const REGION_CODE_MAP: Record<string, Region> = {
  Europe: 'EU',
  America: 'NA',
  Africa: 'AF',
  Asia: 'AS'
};

function resolveAuctionRegion(fromCity: string): Region | undefined {
  const loc = LOCATIONS[fromCity] || LOCATIONS[fromCity?.toUpperCase()];
  return loc?.region ? REGION_CODE_MAP[loc.region] : undefined;
}

export class BiddingEngine {
  /**
   * Converts a standard high-value job into an active auction
   */
  static createAuction(job: any, durationMs = 120000): JobAuction {
    const startingBid = Math.round(job.pay * 1.15); 
    
    return {
      id: job.id,
      companyId: job.companyId,
      cargoId: job.cargoId,
      from: job.from,
      to: job.to,
      km: job.km,
      weight: job.weight,
      startingBid,
      currentBid: startingBid,
      currentWinner: 'none',
      currentWinnerName: 'Awaiting tenders',
      expiresAt: Date.now() + durationMs,
      durationMs,
      bidHistory: [],
      requirements: job.requirements,
      vip: job.vip
    };
  }

  /**
   * Process AI competitor bids during game loop tick
   */
  static tickAuctions(S: any, now: number): { listChanged: boolean; bidChanged: boolean } {
    if (!S.auctions) S.auctions = [];
    if (!S.jobs) S.jobs = [];
    
    let listChanged = false;
    let bidChanged = false;

    // 1. Check for Expired "Won" Jobs (5 minute window) in both global and hub boards
    const FIVE_MINS = 5 * 60 * 1000;
    const initialJobCount = S.jobs.length;
    S.jobs = S.jobs.filter((j: any) => {
      if (j.isAuctionWon && j.wonAt && (now - j.wonAt > FIVE_MINS)) {
        return false;
      }
      return true;
    });
    if (S.jobs.length !== initialJobCount) listChanged = true;

    if (S.hubJobs) {
      for (const hubId of Object.keys(S.hubJobs)) {
        const prevLen = S.hubJobs[hubId].length;
        S.hubJobs[hubId] = S.hubJobs[hubId].filter((j: any) => {
          if (j.isAuctionWon && j.wonAt && (now - j.wonAt > FIVE_MINS)) {
            return false;
          }
          return true;
        });
        if (S.hubJobs[hubId].length !== prevLen) listChanged = true;
      }
    }

    const active: JobAuction[] = [];
    const expired: JobAuction[] = [];

    for (const auc of S.auctions) {
      if (now >= auc.expiresAt) {
        expired.push(auc);
        listChanged = true;
      } else {
        const timeLeft = auc.expiresAt - now;
        
        let bidChance = 0.38; // Responsive base chance for live reverse auction
        if (timeLeft < 15000) bidChance = 0.85; // High intensity final countdown
        else if (timeLeft < 45000) bidChance = 0.60;

        // If player is currently winning, rivals are actively motivated to contest
        if (auc.currentWinner === 'player') {
          bidChance += 0.30;
        }

        if (Math.random() < bidChance) {
          if (this.simulateCompetitorBid(S, auc)) {
            bidChanged = true;
          }
        }
        active.push(auc);
      }
    }

    if (expired.length > 0) {
      listChanged = true;
      S.auctions = active;
      for (const auc of expired) {
        this.finalizeAuction(S, auc);
      }
    }

    return { listChanged, bidChanged };
  }

  /**
   * Simulate a competitor placing a bid
   */
  static simulateCompetitorBid(S: any, auc: JobAuction): boolean {
    const regionCode = resolveAuctionRegion(auc.from);
    const competitor = getRandomCompetitor(regionCode);
    const timeLeft = auc.expiresAt - Date.now();

    if (!S.competitorStats) S.competitorStats = { playerWins: 0, rivals: {} };
    const playerWins = S.competitorStats.playerWins || 0;
    const rivalStats = S.competitorStats.rivals?.[competitor.id] || { wins: 0, bids: 0 };

    // Dynamic competitive profit floor: rivals undercut harder when player dominates auctions
    const competitivePressure = Math.min(0.08, playerWins * 0.02);
    const profitFloor = auc.startingBid * (0.68 - competitivePressure + (Math.random() * 0.08));
    if (auc.currentBid <= profitFloor) return false;

    const dropPct = 0.01 + (Math.random() * 0.025 * competitor.aggression);
    let newBid = Math.round(auc.currentBid * (1 - dropPct));

    if (timeLeft < 12000) {
      newBid = auc.currentBid - Math.floor(120 + Math.random() * 380);
    }

    newBid = Math.max(newBid, Math.round(profitFloor));

    if (newBid < auc.currentBid && auc.currentWinner !== competitor.id) {
      const wasPlayerWinning = auc.currentWinner === 'player';
      auc.currentBid = newBid;
      auc.currentWinner = competitor.id;
      auc.currentWinnerName = competitor.name;

      S.competitorStats.rivals[competitor.id] = {
        ...rivalStats,
        bids: (rivalStats.bids || 0) + 1
      };

      auc.bidHistory.unshift({
        bidderId: competitor.id,
        bidderName: competitor.name,
        amount: newBid,
        time: Date.now()
      });

      if (auc.bidHistory.length > 12) auc.bidHistory.pop();

      if (wasPlayerWinning && S) {
        pushNote(S, `${competitor.name} underbid your tender on ${auc.from} → ${auc.to} at $${newBid.toLocaleString()}.`, {
          title: 'OUTBID ON TENDER',
          type: 'ops'
        });
      }

      return true;
    }
    return false;
  }

  /**
   * Player places a bid
   */
  static placePlayerBid(S: any, auctionId: number, bidAmount: number): boolean {
    if (!S.auctions) return false;

    const auc = S.auctions.find((a: any) => a.id === auctionId);
    if (!auc || Date.now() >= auc.expiresAt) return false;

    if (bidAmount >= auc.currentBid) {
      // Must beat current lowest tender
      return false;
    }

    auc.currentBid = bidAmount;
    auc.currentWinner = 'player';
    auc.currentWinnerName = 'Your Fleet (NexHaul)';

    auc.bidHistory.unshift({
      bidderId: 'player',
      bidderName: 'Your Fleet (NexHaul)',
      amount: bidAmount,
      time: Date.now()
    });


    return true;
  }

  /**
   * Finalize expired auction
   */
  static finalizeAuction(S: any, auc: JobAuction) {
    const cargo = CARGO_TYPES.find(c => c.id === auc.cargoId);
    if (!S.competitorStats) S.competitorStats = { playerWins: 0, rivals: {} };

    if (auc.currentWinner === 'player') {
      S.competitorStats.playerWins = (S.competitorStats.playerWins || 0) + 1;
      const SIM_HOUR_MS = 277_000;
      const driveHours = auc.km / 65;
      const wonJob = {
        id: auc.id,
        companyId: auc.companyId,
        cargoId: auc.cargoId,
        cargo: cargo?.name || 'Commercial Contract',
        trailer: cargo?.requiredTrailer || 'curtain',
        kind: 'Contract' as const,
        weight: auc.weight,
        from: auc.from,
        to: auc.to,
        km: auc.km,
        pay: Math.round(auc.currentBid * 1.03),
        deadline: Date.now() + Math.round((driveHours + 14) * SIM_HOUR_MS),
        requirements: auc.requirements,
        vip: false,
        isAuctionWon: true,
        wonAt: Date.now()
      };

      // Route won bid job directly to the pickup hub's job list if owned; fallback to global board
      const pickupHub = REGIONAL_HUBS.find(
        h => h.city === auc.from && (S.depots || []).includes(h.id)
      );

      if (pickupHub) {
        if (!S.hubJobs) S.hubJobs = {};
        if (!S.hubJobs[pickupHub.id]) S.hubJobs[pickupHub.id] = [];
        if (!S.hubJobs[pickupHub.id].some((j: any) => j.id === wonJob.id)) {
          S.hubJobs[pickupHub.id].unshift(wonJob);
        }
        pushNote(S, `Won bid: ${auc.from} → ${auc.to} ($${wonJob.pay.toLocaleString()}). Added to ${pickupHub.name} job list.`, {
          title: 'BID WON — HUB DISPATCH READY',
          type: 'ops'
        });
      } else {
        if (!S.jobs) S.jobs = [];
        if (!S.jobs.some((j: any) => j.id === wonJob.id)) {
          S.jobs.unshift(wonJob);
        }
      }
    } else if (auc.currentWinner && auc.currentWinner !== 'none') {
      const prev = S.competitorStats.rivals?.[auc.currentWinner] || { wins: 0, bids: 0 };
      S.competitorStats.rivals[auc.currentWinner] = {
        ...prev,
        wins: (prev.wins || 0) + 1,
        lastWonAt: Date.now()
      };
    }
  }
}

