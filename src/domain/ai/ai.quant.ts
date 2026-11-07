/**
 * AI Crypto Quant Trading Bot
 * Evaluates in-game crypto market candle history using Neural Network predictions
 * and executes automated trades on behalf of the player.
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
 * Runs an automated trading cycle for the AI Crypto Bot.
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

  // Pick an asset to evaluate based on strategy
  const eligibleAssets = CRYPTO_ASSETS.filter(a => a.id !== 'usdc');
  const asset = eligibleAssets[Math.floor(Math.random() * eligibleAssets.length)];
  const market = getCryptoMarketData(asset.id, '15m');

  if (!market || !market.history || market.history.length < 10) {
    return { executed: false, message: 'Insufficient market candle history' };
  }

  const hist = market.history;
  const currentPrice = market.price;
  const sma5 = (hist[hist.length - 1] + hist[hist.length - 2] + hist[hist.length - 3] + hist[hist.length - 4] + hist[hist.length - 5]) / 5;
  const sma10 = hist.reduce((a, b) => a + b, 0) / hist.length;

  // Feature extraction for neural network (normalized 0 to 1)
  const features = [
    Math.min(1, currentPrice / (market.high24h || currentPrice * 1.5)),     // Price vs 24h high
    Math.min(1, Math.max(0, market.change24h / 50 + 0.5)),                   // 24h trend sentiment
    Math.min(1, sma5 / sma10),                                             // Moving average crossover ratio
    Math.min(1, asset.volatility),                                         // Volatility factor
    bot.strategy === 'conservative' ? 0.2 : bot.strategy === 'momentum' ? 0.6 : 0.9 // Strategy risk bias
  ];

  const prediction = quantModel.forward(features); // Score between 0.0 and 1.0

  // Decision thresholds (made responsive)
  const buyThreshold = bot.strategy === 'conservative' ? 0.65 : bot.strategy === 'momentum' ? 0.55 : 0.45;
  const sellThreshold = 0.40;

  let actionTaken = false;
  let msg = '';

  const holdings = S.cryptoPortfolio.holdings[asset.id] || 0;
  const holdingValueUsd = holdings * currentPrice;

  if (prediction >= buyThreshold && S.cryptoPortfolio.cash >= 500) {
    // Buy signal
    const tradeUsd = Math.min(S.cryptoPortfolio.cash, Math.min(5000, S.cryptoPortfolio.cash * 0.5));
    if (tradeUsd >= 100) {
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
        confidence: prediction
      };
      bot.tradeHistory.unshift(record);
      if (bot.tradeHistory.length > 30) bot.tradeHistory.pop();

      actionTaken = true;
      msg = `AI Quant Bot BOUGHT ${tokensBought.toFixed(4)} ${asset.symbol} for $${tradeUsd.toLocaleString()} @ $${currentPrice.toLocaleString()} (Conf: ${(prediction * 100).toFixed(1)}%)`;
      pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
    }
  } else if ((prediction <= sellThreshold || holdingValueUsd > 10000) && holdings > 0) {
    // Sell signal
    const sellUsd = holdingValueUsd;
    S.cryptoPortfolio.cash += sellUsd;
    S.cryptoPortfolio.holdings[asset.id] = 0;
    const profit = sellUsd * 0.03; // simulated profit estimate
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
      confidence: prediction
    };
    bot.tradeHistory.unshift(record);
    if (bot.tradeHistory.length > 30) bot.tradeHistory.pop();

    actionTaken = true;
    msg = `AI Quant Bot SOLD all ${asset.symbol} (${holdings.toFixed(4)}) for $${sellUsd.toLocaleString()} @ $${currentPrice.toLocaleString()} (Conf: ${(prediction * 100).toFixed(1)}%)`;
    pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
  }

  // Save updated weights
  bot.weights = quantModel.toJSON();

  return {
    executed: actionTaken,
    message: actionTaken ? msg : `AI Quant Bot analyzed ${asset.symbol} (Score: ${(prediction * 100).toFixed(1)}%) - Holding position.`
  };
}
