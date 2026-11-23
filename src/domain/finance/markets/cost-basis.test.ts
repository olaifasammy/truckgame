import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordCryptoPurchase, recordCryptoSale, getCryptoHoldingMetrics } from './cost-basis';

describe('Crypto Cost Basis & PnL Engine', () => {
  it('calculates weighted average cost basis correctly on multiple buys', () => {
    const S: any = {};
    
    // Buy 1 BTC at $50,000
    recordCryptoPurchase(S, 'btc', 1.0, 50000);
    assert.equal(S.cryptoHoldings['btc'], 1.0);
    assert.equal(S.cryptoCostBasis['btc'], 50000);

    // Buy another 1 BTC at $60,000 (Average = $55,000)
    recordCryptoPurchase(S, 'btc', 1.0, 60000);
    assert.equal(S.cryptoHoldings['btc'], 2.0);
    assert.equal(S.cryptoCostBasis['btc'], 55000);
  });

  it('calculates realized profit on partial sale and maintains cost basis for remaining tokens', () => {
    const S: any = {};
    recordCryptoPurchase(S, 'eth', 10.0, 2000); // Spent $20,000

    // Sell 5 ETH at $3,000 (Revenue = $15,000, Cost basis = $10,000, Profit = $5,000)
    const result = recordCryptoSale(S, 'eth', 5.0, 3000);
    assert.equal(result.actualQty, 5.0);
    assert.equal(result.revenue, 15000);
    assert.equal(result.realizedPnl, 5000);
    assert.equal(result.realizedPnlPct, 50);

    // 5 ETH remaining at $2,000 avg cost basis
    assert.equal(S.cryptoHoldings['eth'], 5.0);
    assert.equal(S.cryptoCostBasis['eth'], 2000);
    assert.equal(S.cryptoRealizedPnl, 5000);
  });

  it('calculates unrealized profit and loss metrics accurately', () => {
    const S: any = {};
    recordCryptoPurchase(S, 'sol', 100, 100); // 100 SOL at $100 ($10,000 total cost)

    // Current market price is $150
    const gainMetrics = getCryptoHoldingMetrics(S, 'sol', 150);
    assert.equal(gainMetrics.currentMarketVal, 15000);
    assert.equal(gainMetrics.unrealizedPnl, 5000);
    assert.equal(gainMetrics.unrealizedPnlPct, 50);

    // Current market price is $80
    const lossMetrics = getCryptoHoldingMetrics(S, 'sol', 80);
    assert.equal(lossMetrics.currentMarketVal, 8000);
    assert.equal(lossMetrics.unrealizedPnl, -2000);
    assert.equal(lossMetrics.unrealizedPnlPct, -20);
  });

  it('clears cost basis when all holdings are sold', () => {
    const S: any = {};
    recordCryptoPurchase(S, 'ada', 1000, 1.0);
    recordCryptoSale(S, 'ada', 1000, 1.5);

    assert.equal(S.cryptoHoldings['ada'], undefined);
    assert.equal(S.cryptoCostBasis['ada'], undefined);
    assert.equal(S.cryptoRealizedPnl, 500);
  });
});
