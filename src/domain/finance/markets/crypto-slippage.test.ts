import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTradeSlippage, getCurrentMarketRegime } from './crypto';
import { processCryptoLoansTick } from './loans';

describe('Crypto Slippage & Market Regimes', () => {
  it('calculates order book slippage and price impact for large trades', () => {
    const smallBuy = calculateTradeSlippage('btc', 1000, 'buy');
    const largeBuy = calculateTradeSlippage('btc', 5000000, 'buy');

    assert.ok(largeBuy.slippagePct > smallBuy.slippagePct);
    assert.ok(largeBuy.effectivePrice > smallBuy.effectivePrice);
    assert.equal(smallBuy.exchangeFeeUsd, 1); // 0.12% of 1000 = ~1.2
  });

  it('retrieves active macro market regimes and headlines', () => {
    const regimeInfo = getCurrentMarketRegime();
    assert.ok(regimeInfo.headline.length > 0);
    assert.ok(regimeInfo.biasMultiplier > 0);
    assert.ok(regimeInfo.volatilityScale > 0);
  });

  it('triggers margin warning and auto-liquidation when LTV exceeds 95%', () => {
    const mockState: any = {
      money: 10000,
      notes: [],
      cryptoLoans: [
        {
          id: 'LN-TEST-1',
          assetId: 'btc',
          collateralQty: 0.1, // 0.1 BTC = ~$9,850 USD
          collateralValueAtIssue: 9850,
          borrowedCash: 10500, // Repay amount set high to trigger > 95% LTV regardless of micro noise
          repayAmount: 10500,
          ltvPct: 106.5,
          dailyInterestRate: 1,
          createdAt: Date.now()
        }
      ]
    };

    processCryptoLoansTick(mockState);

    // Loan should be liquidated and removed from array
    assert.equal(mockState.cryptoLoans.length, 0);
    assert.ok(mockState.notes.some((n: any) => n.title === 'COLLATERAL LIQUIDATED'));
  });
});
