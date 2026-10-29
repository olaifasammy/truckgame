/**
 * Daily Dispatch Quota for Won Bidded Jobs
 * 
 * Rules:
 * - 5 bidded jobs can be dispatched per calendar day for free.
 * - Beyond 5 daily dispatches, each additional bidded job dispatch costs 4 Gold Coins.
 */

export interface DailyBidQuotaInfo {
  date: string;
  dispatchedToday: number;
  freeRemaining: number;
  isFree: boolean;
  costInCoins: number;
  canAfford: boolean;
  coinsBalance: number;
}

export function getDailyBidDispatchQuota(S: any): DailyBidQuotaInfo {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  
  if (!S.dailyBids || S.dailyBids.date !== today) {
    S.dailyBids = {
      date: today,
      dispatchedToday: 0
    };
  }

  const dispatchedToday = S.dailyBids.dispatchedToday || 0;
  const freeRemaining = Math.max(0, 5 - dispatchedToday);
  const isFree = dispatchedToday < 5;
  const costInCoins = isFree ? 0 : 4;
  const coinsBalance = S.coins || 0;
  const canAfford = isFree || (coinsBalance >= costInCoins);

  return {
    date: today,
    dispatchedToday,
    freeRemaining,
    isFree,
    costInCoins,
    canAfford,
    coinsBalance
  };
}

export function consumeBidDispatchQuota(S: any): { success: boolean; costPaid: number; message: string } {
  const quota = getDailyBidDispatchQuota(S);

  if (quota.isFree) {
    S.dailyBids.dispatchedToday = quota.dispatchedToday + 1;
    const remaining = Math.max(0, 5 - S.dailyBids.dispatchedToday);
    return {
      success: true,
      costPaid: 0,
      message: `Dispatched under Daily Free Quota (${remaining}/5 remaining today)`
    };
  }

  // Daily free quota has been exhausted; requires 4 Gold Coins
  if (quota.coinsBalance < 4) {
    return {
      success: false,
      costPaid: 0,
      message: `Daily free quota exceeded (5/5 used). Dispatching additional bidded jobs costs 4 Gold Coins. (Balance: ${quota.coinsBalance} Coins)`
    };
  }

  // Deduct 4 Gold Coins
  S.coins = Math.max(0, (S.coins || 0) - 4);
  S.dailyBids.dispatchedToday = quota.dispatchedToday + 1;

  return {
    success: true,
    costPaid: 4,
    message: `Dispatched via 4 Gold Coins (Daily limit exceeded: #${S.dailyBids.dispatchedToday} today)`
  };
}
