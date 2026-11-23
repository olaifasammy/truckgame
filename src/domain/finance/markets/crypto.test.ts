import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCryptoMarketData, CRYPTO_ASSETS } from './crypto';

describe('Crypto Market Stochastic Engine Realism', () => {
  it('produces 100% deterministic outputs for a given timestamp across multiple calls', () => {
    const data1 = getCryptoMarketData('btc', '15m');
    const data2 = getCryptoMarketData('btc', '15m');

    assert.equal(data1.price, data2.price, 'Price must be identical for identical timestamp');
    assert.equal(data1.candles.length, data2.candles.length);
    assert.equal(data1.candles[20].close, data2.candles[20].close, 'Historical candle prices must be deterministic');
  });

  it('maintains stablecoin USDC peg near $1.00', () => {
    const usdc = getCryptoMarketData('usdc', '15m');
    assert.ok(usdc.price >= 0.99 && usdc.price <= 1.01, `USDC price ${usdc.price} must remain near $1.00`);
  });

  it('generates non-linear stochastic price paths rather than simple identical repeating sine waves', () => {
    const btc = getCryptoMarketData('btc', '15m');
    const eth = getCryptoMarketData('eth', '15m');

    // Calculate return differences between consecutive candles for BTC and ETH
    const btcReturns = btc.candles.slice(1).map((c, idx) => c.close - btc.candles[idx].close);
    const ethReturns = eth.candles.slice(1).map((c, idx) => c.close - eth.candles[idx].close);

    assert.equal(btcReturns.length, 24);
    
    // Check that asset price paths are not trivially identical or linear
    assert.notEqual(btcReturns[5], btcReturns[6]);
    assert.notEqual(btcReturns[10], ethReturns[10]);
  });

  it('validates all crypto assets produce non-zero valid market data', () => {
    for (const asset of CRYPTO_ASSETS) {
      const mkt = getCryptoMarketData(asset.id, '1h');
      assert.ok(mkt.price > 0, `Price for ${asset.id} must be positive`);
      assert.ok(mkt.buyPrice > mkt.sellPrice, `Buy price must exceed sell price for ${asset.id}`);
      assert.ok(mkt.candles.length === 25, `Must generate 25 candles for ${asset.id}`);
    }
  });
});
