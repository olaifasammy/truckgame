export interface CryptoHoldingMetrics {
  qty: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalCostBasis: number;
  currentMarketVal: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

/**
 * Records a crypto token purchase, updating the weighted average cost basis.
 */
export function recordCryptoPurchase(S: any, assetId: string, qty: number, buyPricePerToken: number): void {
  if (!S || qty <= 0 || buyPricePerToken <= 0) return;

  if (!S.cryptoHoldings) S.cryptoHoldings = {};
  if (!S.cryptoCostBasis) S.cryptoCostBasis = {};

  const oldQty = S.cryptoHoldings[assetId] || 0;
  const oldAvg = S.cryptoCostBasis[assetId] || buyPricePerToken;

  const newQty = oldQty + qty;
  const newAvg = oldQty > 0 ? ((oldQty * oldAvg) + (qty * buyPricePerToken)) / newQty : buyPricePerToken;

  S.cryptoHoldings[assetId] = newQty;
  S.cryptoCostBasis[assetId] = newAvg;
}

/**
 * Records a crypto token sale, calculating realized P&L based on cost basis.
 */
export function recordCryptoSale(S: any, assetId: string, qtyToSell: number, sellPricePerToken: number) {
  if (!S || !S.cryptoHoldings || !S.cryptoHoldings[assetId] || qtyToSell <= 0) {
    return { actualQty: 0, revenue: 0, realizedPnl: 0, realizedPnlPct: 0, avgBuyPrice: 0 };
  }

  if (!S.cryptoCostBasis) S.cryptoCostBasis = {};

  const currentQty = S.cryptoHoldings[assetId];
  const actualQty = Math.min(qtyToSell, currentQty);
  const avgBuyPrice = S.cryptoCostBasis[assetId] || sellPricePerToken;

  const revenue = actualQty * sellPricePerToken;
  const costBasisOfSold = actualQty * avgBuyPrice;
  const realizedPnl = revenue - costBasisOfSold;
  const realizedPnlPct = avgBuyPrice > 0 ? ((sellPricePerToken - avgBuyPrice) / avgBuyPrice) * 100 : 0;

  S.cryptoHoldings[assetId] -= actualQty;
  S.cryptoRealizedPnl = (S.cryptoRealizedPnl || 0) + realizedPnl;

  if (S.cryptoHoldings[assetId] <= 0.000001) {
    delete S.cryptoHoldings[assetId];
    delete S.cryptoCostBasis[assetId];
  }

  return {
    actualQty,
    revenue,
    realizedPnl,
    realizedPnlPct,
    avgBuyPrice
  };
}

/**
 * Computes cost basis, market valuation, and unrealized profit/loss for a crypto holding.
 */
export function getCryptoHoldingMetrics(S: any, assetId: string, currentSellPrice: number): CryptoHoldingMetrics {
  const qty = (S && S.cryptoHoldings && S.cryptoHoldings[assetId]) || 0;
  const avgBuyPrice = (S && S.cryptoCostBasis && S.cryptoCostBasis[assetId]) || currentSellPrice;

  const totalCostBasis = qty * avgBuyPrice;
  const currentMarketVal = qty * currentSellPrice;
  const unrealizedPnl = currentMarketVal - totalCostBasis;
  const unrealizedPnlPct = totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0;

  return {
    qty,
    avgBuyPrice,
    currentPrice: currentSellPrice,
    totalCostBasis,
    currentMarketVal,
    unrealizedPnl,
    unrealizedPnlPct
  };
}
