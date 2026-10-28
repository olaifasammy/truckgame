import { JobAuction, BidHistoryItem } from './types';
import { COMPETITORS, getRandomCompetitor } from './competitors';
import { CARGO_TYPES } from '../cargo/registry';
import { COMPANIES } from '../companies/registry';
import { pushNote } from '../../../systems/notify';

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
  static tickAuctions(S: any, now: number) {
    if (!S.auctions) S.auctions = [];
    if (!S.jobs) S.jobs = [];
    
    let stateChanged = false;

    // 1. Check for Expired "Won" Jobs (5 minute window)
    const FIVE_MINS = 5 * 60 * 1000;
    const initialJobCount = S.jobs.length;
    S.jobs = S.jobs.filter((j: any) => {
      if (j.isAuctionWon && j.wonAt && (now - j.wonAt > FIVE_MINS)) {
        pushNote(S, `⚠️ Contract Expired: Dispatch for ${j.from} haul missed (5m timeout).`);
        return false;
      }
      return true;
    });
    if (S.jobs.length !== initialJobCount) stateChanged = true;

    const active: JobAuction[] = [];
    const expired: JobAuction[] = [];

    for (const auc of S.auctions) {
      if (now >= auc.expiresAt) {
        expired.push(auc);
        stateChanged = true;
      } else {
        const timeLeft = auc.expiresAt - now;
        
        let bidChance = 0.14; // Base chance
        if (timeLeft < 15000) bidChance = 0.65; // High intensity countdown
        else if (timeLeft < 45000) bidChance = 0.35;

        // If player is currently winning, rivals are slightly more motivated to contest
        if (auc.currentWinner === 'player' && Math.random() < 0.4) {
          bidChance += 0.2;
        }

        if (Math.random() < bidChance) {
          if (this.simulateCompetitorBid(S, auc)) {
            stateChanged = true;
          }
        }
        active.push(auc);
      }
    }

    if (stateChanged) {
      S.auctions = active;
      // Handle expired auctions
      for (const auc of expired) {
        this.finalizeAuction(S, auc);
      }
    }
  }

  /**
   * Simulate a competitor placing a bid
   */
  static simulateCompetitorBid(S: any, auc: JobAuction): boolean {
    const competitor = getRandomCompetitor();
    const timeLeft = auc.expiresAt - Date.now();
    
    // Profit floor calculation: rivals will not bid at a loss
    const profitFloor = auc.startingBid * (0.68 + (Math.random() * 0.10));
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
      
      auc.bidHistory.unshift({
        bidderId: competitor.id,
        bidderName: competitor.name,
        amount: newBid,
        time: Date.now()
      });

      if (auc.bidHistory.length > 12) auc.bidHistory.pop();

      if (wasPlayerWinning && S) {
        pushNote(S, `⚡ Outbid: ${competitor.name} undercut your tender on ${auc.from} → ${auc.to} to $${newBid.toLocaleString()}!`);
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

    pushNote(S, `Tender Submitted: $${bidAmount.toLocaleString()} on ${auc.from} → ${auc.to} freight`);
    return true;
  }

  /**
   * Finalize expired auction
   */
  static finalizeAuction(S: any, auc: JobAuction) {
    const cargo = CARGO_TYPES.find(c => c.id === auc.cargoId);
    const company = COMPANIES.find(c => c.id === auc.companyId);

    if (auc.currentWinner === 'player') {
      const wonJob = {
        id: auc.id,
        companyId: auc.companyId,
        cargoId: auc.cargoId,
        kind: 'Contract' as const,
        weight: auc.weight,
        from: auc.from,
        to: auc.to,
        km: auc.km,
        pay: auc.currentBid, 
        deadline: Date.now() + (auc.km * 3600000 / 60) + (24 * 3600000),
        requirements: auc.requirements,
        vip: auc.vip,
        isAuctionWon: true,
        wonAt: Date.now()
      };

      if (!S.jobs) S.jobs = [];
      S.jobs.unshift(wonJob);
      pushNote(S, `🏆 Tender Won: Secured ${cargo?.name || 'Cargo'} haul for $${auc.currentBid.toLocaleString()}! Dispatch within 5 mins.`);
    } else {
      pushNote(S, `Contract Awarded: ${auc.currentWinnerName} won the ${auc.from} → ${auc.to} freight contract at $${auc.currentBid.toLocaleString()}`);
    }
  }
}

