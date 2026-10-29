import { Region } from '../types';
export type { Region };

export interface CompetitorBidder {
  id: string;
  name: string;
  region: Region;
  aggression: number; // 0.6 to 1.4 (how aggressive their bids are)
  budgetCapMultiplier: number;
}

export interface BidHistoryItem {
  bidderId: string;
  bidderName: string;
  amount: number;
  time: number;
}

export interface JobAuction {
  id: number; // maps to job id
  companyId: string;
  cargoId: string;
  from: string;
  to: string;
  km: number;
  weight: number;
  startingBid: number;
  currentBid: number;
  currentWinner: 'player' | string; // 'player' or competitor id
  currentWinnerName: string;
  expiresAt: number; // timestamp (2 mins duration)
  durationMs: number;
  bidHistory: BidHistoryItem[];
  requirements: {
    requiredSkills?: string[];
    minLevel?: number;
    adrClass?: number;
    reefer?: boolean;
  };
  vip?: boolean;
}
