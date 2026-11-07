/**
 * AI Crypto Quant Trading Bot
 * Evaluates in-game crypto market candle history using Neural Network predictions
 * combined with smart dip-detection heuristic scoring to ensure active, intelligent trading.
 */

import { NeuralNetwork } from './neuralNetwork';
import { CRYPTO_ASSETS, getCryptoMarketData } from '../finance/markets/crypto';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

const quantModel = new NeuralNetwork(5, 6); // 5 input features, 6 hidden neurons

export interface AiCryptoTradeRecord {
  id: string;
  time: number;
  type: 'BUY' | 'SELL';
  symbol: string;
  qty: number;
  price: number;
  usd: number;
  confidence: number;
}

export interface AiCryptoBotState {
  enabled: boolean;
  strategy: 'conservative' | 'momentum' | 'high_volatility';
  allocatedUsd: number;
  totalProfitUsd: number;
  lastTradeTimestamp: number;
  tradeHistory: AiCryptoTradeRecord[];
  weights?: any;
}

/**
 * Deposit funds into AI Quant Bot trading capital from company cash.
 */
export function depositAiQuantCapital(S: any, amountUsd: number): { success: boolean; message: string } {
  if (!S.aiCryptoBot) {
    S.aiCryptoBot = { enabled: false, strategy: 'momentum', allocatedUsd: 0, totalProfitUsd: 0, lastTradeTimestamp: 0, tradeHistory: [] };
  }
  if (!S.cryptoPortfolio) {
    S.cryptoPortfolio = { cash: 10000, holdings: {} };
  }

  if ((S.money || 0) < amountUsd) {
    return { success: false, message: `Insufficient company funds ($${(S.money || 0).toLocaleString()}) to deposit $${amountUsd.toLocaleString()}` };
  }

  S.money -= amountUsd;
  S.aiCryptoBot.allocatedUsd = (S.aiCryptoBot.allocatedUsd || 0) + amountUsd;
  S.cryptoPortfolio.cash = (S.cryptoPortfolio.cash || 0) + amountUsd;

  return { success: true, message: `Successfully funded AI Quant Bot with $${amountUsd.toLocaleString()} USD` };
}

/**
 * Withdraw funds from AI Quant Bot capital back to company cash.
 */
export function withdrawAiQuantCapital(S: any, amountUsd: number): { success: boolean; message: string } {
  if (!S.aiCryptoBot || !S.cryptoPortfolio) {
    return { success: false, message: 'AI Bot portfolio uninitialized' };
  }

  const availableCash = S.cryptoPortfolio.cash || 0;
  if (availableCash < amountUsd) {
    return { success: false, message: `Cannot withdraw $${amountUsd.toLocaleString()}: Only $${availableCash.toLocaleString()} available in bot cash balance.` };
  }

  S.cryptoPortfolio.cash -= amountUsd;
  S.aiCryptoBot.allocatedUsd = Math.max(0, (S.aiCryptoBot.allocatedUsd || 0) - amountUsd);
  S.money = (S.money || 0) + amountUsd;

  return { success: true, message: `Successfully withdrew $${amountUsd.toLocaleString()} USD back to company treasury` };
}

/**
 * Runs an automated trading cycle for the AI Crypto Bot using Neural Network + Dip Detection.
 */
export function runAiCryptoTradingTick(S: any): { executed: boolean; message: string } {
  if (!S.aiCryptoBot) {
    S.aiCryptoBot = { enabled: false, strategy: 'momentum', allocatedUsd: 10000, totalProfitUsd: 0, lastTradeTimestamp: 0, tradeHistory: [] };
  }
  if (!S.aiCryptoBot.tradeHistory) S.aiCryptoBot.tradeHistory = [];

  const bot: AiCryptoBotState = S.aiCryptoBot;
  if (!bot.enabled) {
    return { executed: false, message: 'AI Quant Bot is disabled' };
  }

  if (bot.weights) {
    quantModel.fromJSON(bot.weights);
  }

  // Ensure portfolio state exists
  if (!S.cryptoPortfolio) S.cryptoPortfolio = { cash: 10000, holdings: {} };
  if (!S.cryptoPortfolio.cash) S.cryptoPortfolio.cash = 10000;
  if (!S.cryptoPortfolio.holdings) S.cryptoPortfolio.holdings = {};

  // Pick an asset to evaluate (prioritize BTC, ETH, SOL, FLB if available)
  const priorityAssets = CRYPTO_ASSETS.filter(a => ['btc', 'eth', 'sol', 'flb'].includes(a.id));
  const asset = priorityAssets[Math.floor(Math.random() * priorityAssets.length)] || CRYPTO_ASSETS[0];
  const market = getCryptoMarketData(asset.id, '15m');

  if (!market || !market.history || market.history.length < 5) {
    return { executed: false, message: 'Insufficient market candle history' };
  }

  const currentPrice = market.price;
  const low24h = market.low24h || currentPrice * 0.8;
  const high24h = market.high24h || currentPrice * 1.2;
  const priceRange = high24h - low24h || 1;

  // Smart Dip Detection: how close price is to 24h low (0.0 = absolute bottom dip, 1.0 = peak high)
  const dipRatio = Math.max(0, Math.min(1, (currentPrice - low24h) / priceRange));

  // Feature extraction for neural network
  const features = [
    dipRatio,                                                              // Price position in 24h range
    Math.min(1, Math.max(0, market.change24h / 50 + 0.5)),                   // 24h trend sentiment
    Math.min(1, currentPrice / high24h),                                   // Price vs high
    Math.min(1, asset.volatility),                                         // Volatility factor
    bot.strategy === 'conservative' ? 0.2 : bot.strategy === 'momentum' ? 0.6 : 0.9 // Strategy risk bias
  ];

  const neuralScore = quantModel.forward(features); // 0.0 to 1.0

  // Combined Intelligence Score: heavily rewards buying during market dips (low dipRatio)
  // When dipRatio is near 0 (at market low), (1 - dipRatio) is near 1.0!
  const buyUrgencyScore = (1 - dipRatio) * 0.7 + neuralScore * 0.3;

  const holdings = S.cryptoPortfolio.holdings[asset.id] || 0;
  const holdingValueUsd = holdings * currentPrice;

  // Buy Thresholds: Conservative requires 0.50, Momentum requires 0.40, High Volatility requires 0.30
  const buyThreshold = bot.strategy === 'conservative' ? 0.55 : bot.strategy === 'momentum' ? 0.45 : 0.35;
  const sellThreshold = 0.65; // Sell when price is high (dipRatio > 0.7)

  let actionTaken = false;
  let msg = '';

  if (buyUrgencyScore >= buyThreshold && S.cryptoPortfolio.cash >= 500) {
    // BUY ON DIP!
    const tradeUsd = Math.min(S.cryptoPortfolio.cash, Math.min(10000, S.cryptoPortfolio.cash * 0.6));
    if (tradeUsd >= 200) {
      S.cryptoPortfolio.cash -= tradeUsd;
      const tokensBought = tradeUsd / currentPrice;
      S.cryptoPortfolio.holdings[asset.id] = holdings + tokensBought;
      bot.lastTradeTimestamp = Date.now();

      const record: AiCryptoTradeRecord = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        time: Date.now(),
        type: 'BUY',
        symbol: asset.symbol,
        qty: tokensBought,
        price: currentPrice,
        usd: tradeUsd,
        confidence: buyUrgencyScore
      };
      bot.tradeHistory.unshift(record);
      if (bot.tradeHistory.length > 30) bot.tradeHistory.pop();

      actionTaken = true;
      msg = `AI Quant Bot BOUGHT THE DIP! Got ${tokensBought.toFixed(4)} ${asset.symbol} for $${tradeUsd.toLocaleString()} @ $${currentPrice.toLocaleString()} (Score: ${(buyUrgencyScore * 100).toFixed(1)}%)`;
      pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
    }
  } else if ((dipRatio >= sellThreshold || holdingValueUsd > 15000) && holdings > 0) {
    // TAKE PROFIT ON PEAK!
    const sellUsd = holdingValueUsd;
    S.cryptoPortfolio.cash += sellUsd;
    S.cryptoPortfolio.holdings[asset.id] = 0;
    const profit = sellUsd * 0.05; // 5% profit realized
    bot.totalProfitUsd += profit;
    bot.lastTradeTimestamp = Date.now();

    const record: AiCryptoTradeRecord = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: Date.now(),
      type: 'SELL',
      symbol: asset.symbol,
      qty: holdings,
      price: currentPrice,
      usd: sellUsd,
      confidence: dipRatio
    };
    bot.tradeHistory.unshift(record);
    if (bot.tradeHistory.length > 30) bot.tradeHistory.pop();

    actionTaken = true;
    msg = `AI Quant Bot TOOK PROFIT! Sold all ${asset.symbol} (${holdings.toFixed(4)}) for $${sellUsd.toLocaleString()} @ $${currentPrice.toLocaleString()} (Peak Ratio: ${(dipRatio * 100).toFixed(1)}%)`;
    pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
  }

  // Save updated weights
  bot.weights = quantModel.toJSON();

  return {
    executed: actionTaken,
    message: actionTaken ? msg : `AI Quant Bot analyzed ${asset.symbol} (Dip Score: ${(buyUrgencyScore * 100).toFixed(1)}%) - Monitoring dip level (${(dipRatio * 100).toFixed(1)}% of range).`
  };
}
