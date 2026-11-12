import { Candle } from './crypto';

export interface TechnicalIndicators {
  rsi: number; // 0 - 100
  ema9: number;
  ema21: number;
  ema50: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  volatilityPct: number;
}

/**
 * Calculates Simple Moving Average array
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average array
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    const nextVal = prices[i] * k + ema[i - 1] * (1 - k);
    ema.push(nextVal);
  }
  return ema;
}

/**
 * Calculates 14-period Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < 2) return 50;

  let gains = 0;
  let losses = 0;
  const count = Math.min(prices.length - 1, period);

  for (let i = prices.length - count; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / count;
  const avgLoss = losses / count;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - (100 / (1 + rs))) * 100) / 100;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (prices.length === 0) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  const fastEma = calculateEMA(prices, fastPeriod);
  const slowEma = calculateEMA(prices, slowPeriod);
  
  const macdSeries = fastEma.map((fast, i) => fast - slowEma[i]);
  const signalSeries = calculateEMA(macdSeries, signalPeriod);

  const macdLine = macdSeries[macdSeries.length - 1] || 0;
  const signalLine = signalSeries[signalSeries.length - 1] || 0;
  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20-period, 2 stdDev)
 */
export function calculateBollingerBands(prices: number[], period = 20, stdDevMultiplier = 2) {
  if (prices.length === 0) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0 };
  }

  const slice = prices.slice(Math.max(0, prices.length - period));
  const middle = slice.reduce((a, b) => a + b, 0) / slice.length;

  const variance = slice.reduce((acc, val) => acc + Math.pow(val - middle, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDev * stdDevMultiplier;
  const lower = Math.max(0.0001, middle - stdDev * stdDevMultiplier);
  const bandwidth = middle > 0 ? (upper - lower) / middle : 0;

  return { upper, middle, lower, bandwidth };
}

/**
 * Computes complete technical indicator analysis for a given candle series
 */
export function getTechnicalIndicators(candles: Candle[]): TechnicalIndicators {
  const prices = candles.map(c => c.close);
  if (prices.length === 0) {
    return {
      rsi: 50,
      ema9: 0,
      ema21: 0,
      ema50: 0,
      macd: { macdLine: 0, signalLine: 0, histogram: 0 },
      bollinger: { upper: 0, middle: 0, lower: 0, bandwidth: 0 },
      trend: 'neutral',
      volatilityPct: 0
    };
  }

  const rsi = calculateRSI(prices, 14);
  const ema9Series = calculateEMA(prices, 9);
  const ema21Series = calculateEMA(prices, 21);
  const ema50Series = calculateEMA(prices, 50);

  const ema9 = ema9Series[ema9Series.length - 1];
  const ema21 = ema21Series[ema21Series.length - 1];
  const ema50 = ema50Series[ema50Series.length - 1];

  const macd = calculateMACD(prices);
  const bollinger = calculateBollingerBands(prices);

  const latestPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const volatilityPct = Math.round((Math.abs(latestPrice - firstPrice) / firstPrice) * 10000) / 100;

  let trend: TechnicalIndicators['trend'] = 'neutral';
  if (ema9 > ema21 && ema21 > ema50 && macd.histogram > 0) {
    trend = 'strong_bullish';
  } else if (ema9 > ema21) {
    trend = 'bullish';
  } else if (ema9 < ema21 && ema21 < ema50 && macd.histogram < 0) {
    trend = 'strong_bearish';
  } else if (ema9 < ema21) {
    trend = 'bearish';
  }

  return {
    rsi,
    ema9,
    ema21,
    ema50,
    macd,
    bollinger,
    trend,
    volatilityPct
  };
}
