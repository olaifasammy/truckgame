import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRSI, calculateEMA, calculateMACD, calculateBollingerBands, getTechnicalIndicators } from './crypto-indicators';
import { Candle } from './crypto';

describe('Crypto Technical Indicators', () => {
  it('calculates RSI accurately for uptrend and downtrend series', () => {
    const uptrend = [100, 102, 104, 105, 107, 110, 112, 115, 118, 120, 122, 125, 128, 130, 133];
    const rsiUp = calculateRSI(uptrend, 14);
    assert.equal(rsiUp, 100); // Pure gains = max 100 RSI

    const downtrend = [133, 130, 128, 125, 122, 120, 118, 115, 112, 110, 107, 105, 104, 102, 100];
    const rsiDown = calculateRSI(downtrend, 14);
    assert.equal(rsiDown, 0); // Pure losses = min 0 RSI
  });

  it('calculates Exponential Moving Averages (EMA)', () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const ema5 = calculateEMA(prices, 5);
    assert.equal(ema5.length, prices.length);
    assert.ok(ema5[ema5.length - 1] > 18);
  });

  it('calculates MACD line, signal line, and histogram', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    const macd = calculateMACD(prices);
    assert.ok(macd.macdLine > 0);
    assert.ok(typeof macd.histogram === 'number');
  });

  it('calculates Bollinger Bands and bandwidth', () => {
    const prices = Array.from({ length: 25 }, () => 100);
    prices[20] = 105;
    prices[21] = 95;
    prices[22] = 110;
    
    const bb = calculateBollingerBands(prices, 20, 2);
    assert.ok(bb.upper > bb.middle);
    assert.ok(bb.lower < bb.middle);
    assert.ok(bb.bandwidth > 0);
  });

  it('computes aggregated technical indicators from candle series', () => {
    const candles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
      time: Date.now() - (30 - i) * 15 * 60 * 1000,
      open: 100 + i,
      high: 102 + i,
      low: 99 + i,
      close: 101 + i,
      volume: 100000
    }));

    const indicators = getTechnicalIndicators(candles);
    assert.ok(indicators.rsi > 50);
    assert.equal(indicators.trend, 'strong_bullish');
    assert.ok(indicators.ema9 > 0);
  });
});
