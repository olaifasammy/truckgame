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

export interface AiCryptoBotState {
  enabled: boolean;
  strategy: 'conservative' | 'momentum' | 'high_volatility';
  allocatedUsd: number;
  totalProfitUsd: number;
  lastTradeTimestamp: number;
  weights?: any;
}

/**
 * Runs an automated trading cycle for the AI Crypto Bot.
 */
export function runAiCryptoTradingTick(S: any): { executed: boolean; message: string } {
  if (!S.aiCryptoBot || !S.aiCryptoBot.enabled) {
    return { executed: false, message: 'AI Quant Bot is disabled' };
  }

  const bot: AiCryptoBotState = S.aiCryptoBot;
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

  // Decision thresholds
  const buyThreshold = bot.strategy === 'conservative' ? 0.75 : bot.strategy === 'momentum' ? 0.65 : 0.55;
  const sellThreshold = 0.35;

  let actionTaken = false;
  let msg = '';

  if (prediction >= buyThreshold && S.cryptoPortfolio.cash >= 1000) {
    // Buy signal
    const tradeUsd = Math.min(S.cryptoPortfolio.cash, Math.min(2500, bot.allocatedUsd * 0.2));
    if (tradeUsd >= 500) {
      S.cryptoPortfolio.cash -= tradeUsd;
      const tokensBought = tradeUsd / currentPrice;
      S.cryptoPortfolio.holdings[asset.id] = (S.cryptoPortfolio.holdings[asset.id] || 0) + tokensBought;
      bot.lastTradeTimestamp = Date.now();
      actionTaken = true;
      msg = `AI Quant Bot bought ${tokensBought.toFixed(4)} ${asset.symbol} for $${tradeUsd.toLocaleString()} (Confidence: ${(prediction * 100).toFixed(1)}%)`;
      pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
    }
  } else if (prediction <= sellThreshold && S.cryptoPortfolio.holdings[asset.id] > 0) {
    // Sell signal
    const tokensOwned = S.cryptoPortfolio.holdings[asset.id];
    const sellUsd = tokensOwned * currentPrice;
    S.cryptoPortfolio.cash += sellUsd;
    S.cryptoPortfolio.holdings[asset.id] = 0;
    bot.totalProfitUsd += (sellUsd - (tokensOwned * (currentPrice * 0.95))); // approximate PnL
    bot.lastTradeTimestamp = Date.now();
    actionTaken = true;
    msg = `AI Quant Bot sold all ${asset.symbol} holdings for $${sellUsd.toLocaleString()} (Confidence: ${(prediction * 100).toFixed(1)}%)`;
    pushNote(S, msg, { title: 'AI QUANT BOT', type: 'finance' });
  }

  // Save updated weights
  bot.weights = quantModel.toJSON();

  return {
    executed: actionTaken,
    message: actionTaken ? msg : `AI Quant Bot analyzed ${asset.symbol} (Score: ${(prediction * 100).toFixed(1)}%) - Holding position.`
  };
}
