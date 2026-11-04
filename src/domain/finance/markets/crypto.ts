import { pushNote } from '../../../systems/notify';
import { toast } from '../../../core/ui';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  basePrice: number;
  volatility: number;
  color: string;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoLimitOrder {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  targetPrice: number;
  usdAmount: number;
  tokenQty: number;
  createdAt: number;
}

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: 'flb', symbol: 'FLB', name: 'Fleet Logistics Bond', icon: '🪙', basePrice: 25000, volatility: 0.48, color: '#f59e0b' },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: '₿', basePrice: 98500, volatility: 0.25, color: '#f59e0b' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', basePrice: 2750, volatility: 0.25, color: '#6366f1' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', icon: '◎', basePrice: 145, volatility: 0.45, color: '#14f195' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', icon: '✕', basePrice: 2.45, volatility: 0.35, color: '#00aae4' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', basePrice: 0.38, volatility: 0.55, color: '#cb9800' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', icon: '₳', basePrice: 0.85, volatility: 0.30, color: '#0033ad' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', icon: '▲', basePrice: 38.50, volatility: 0.40, color: '#e84142' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', icon: '⬢', basePrice: 18.20, volatility: 0.32, color: '#375bd2' },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '$', basePrice: 1.00, volatility: 0.001, color: '#2775ca' }
];

export function getCryptoMarketData(assetId: string, timeframe: Timeframe = '15m') {
  const asset = CRYPTO_ASSETS.find(a => a.id === assetId) || CRYPTO_ASSETS[0];

  const intervalMinutes = timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : timeframe === '4h' ? 240 : 1440;
  const timeBlock = Math.floor(Date.now() / (1000 * 60 * intervalMinutes));
  const seed = asset.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + timeBlock;
  
  // Historical points for central chart (24 periods)
  const history: number[] = [];
  const candles: Candle[] = [];

  for (let i = 24; i >= 0; i--) {
    const s = seed - i;
    const wave = Math.sin(s * 0.35) * asset.volatility + Math.cos(s * 0.18) * (asset.volatility * 0.6);
    const noise = (Math.sin(s * 1.7) * 0.15) * asset.volatility;
    const close = Math.max(0.0001, asset.basePrice * (1 + wave + noise));
    
    // Previous close becomes current open
    const prevClose = history.length > 0 ? history[history.length - 1] : close * (1 - (Math.sin(s * 0.9) * 0.02));
    const open = prevClose;
    const high = Math.max(open, close) * (1 + Math.abs(Math.sin(s * 2.3) * 0.015));
    const low = Math.min(open, close) * (1 - Math.abs(Math.cos(s * 2.1) * 0.015));
    const volume = Math.round(50000 + Math.abs(Math.sin(s * 1.1)) * 450000);

    history.push(close);
    candles.push({
      time: Date.now() - i * intervalMinutes * 60 * 1000,
      open,
      high,
      low,
      close,
      volume
    });
  }

  const price = history[history.length - 1];
  const startPrice = history[0];
  const change24h = ((price - startPrice) / startPrice) * 100;
  const high24h = Math.max(...history);
  const low24h = Math.min(...history);

  const spread = 0.005; // 0.5% exchange fee
  const buyPrice = price * (1 + spread / 2);
  const sellPrice = price * (1 - spread / 2);

  return {
    ...asset,
    timeframe,
    price,
    change24h,
    high24h,
    low24h,
    history,
    candles,
    spread,
    buyPrice,
    sellPrice
  };
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export function getOrderBookDepth(assetId: string): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const mkt = getCryptoMarketData(assetId);
  const currentPrice = mkt.price;
  
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  let cumBidTotal = 0;
  for (let i = 1; i <= 6; i++) {
    const p = currentPrice * (1 - (i * 0.0035));
    const size = Math.max(0.1, (25000 / p) * (1 + Math.sin(i * 1.5) * 0.5));
    cumBidTotal += size * p;
    bids.push({ price: p, size, total: cumBidTotal });
  }

  let cumAskTotal = 0;
  for (let i = 1; i <= 6; i++) {
    const p = currentPrice * (1 + (i * 0.0035));
    const size = Math.max(0.1, (25000 / p) * (1 + Math.cos(i * 1.5) * 0.5));
    cumAskTotal += size * p;
    asks.push({ price: p, size, total: cumAskTotal });
  }

  return { bids, asks };
}

export function getTotalCryptoValue(S: any): number {
  let total = 0;
  for (const asset of CRYPTO_ASSETS) {
    const qty = asset.id === 'flb' 
      ? (S.coins || 0) + ((S.stakedBonds) || 0)
      : ((S.cryptoHoldings && S.cryptoHoldings[asset.id]) || 0);
    if (qty > 0) {
      const data = getCryptoMarketData(asset.id);
      total += qty * (data?.sellPrice || asset.basePrice);
    }
  }
  return total;
}

/**
 * Limit Order Processing Engine
 * Evaluates pending orders against current market prices and executes triggered orders.
 */
export function processLimitOrders(S: any) {
  if (!S.cryptoLimitOrders || S.cryptoLimitOrders.length === 0) return;

  const remainingOrders: CryptoLimitOrder[] = [];

  for (const order of S.cryptoLimitOrders) {
    const mkt = getCryptoMarketData(order.assetId);
    let triggered = false;

    if (order.type === 'buy') {
      // Buy order triggers when market ask price is at or below target limit
      if (mkt.buyPrice <= order.targetPrice) {
        triggered = true;
        const actualTokens = order.tokenQty;
        if (order.assetId === 'flb') {
          S.coins = (S.coins || 0) + actualTokens;
        } else {
          if (!S.cryptoHoldings) S.cryptoHoldings = {};
          S.cryptoHoldings[order.assetId] = (S.cryptoHoldings[order.assetId] || 0) + actualTokens;
        }

        pushNote(S, `Limit BUY filled! Purchased ${actualTokens.toFixed(4)} ${mkt.symbol} @ $${mkt.buyPrice.toFixed(2)} ($${Math.round(order.usdAmount).toLocaleString()}).`, {
          title: 'LIMIT ORDER EXECUTED',
          type: 'finance',
          priority: 2,
          body: `Order ID: #${order.id}\nAction: LIMIT BUY\nAsset: ${mkt.symbol}\nLimit Target: $${order.targetPrice.toLocaleString()}\nExecution Price: $${mkt.buyPrice.toLocaleString()}\nFilled: ${actualTokens.toFixed(4)} ${mkt.symbol}`
        });
        toast(`Limit BUY Filled: +${actualTokens.toFixed(4)} ${mkt.symbol}!`, 'success');
      }
    } else if (order.type === 'sell') {
      // Sell order triggers when market bid price is at or above target limit
      if (mkt.sellPrice >= order.targetPrice) {
        triggered = true;
        const proceeds = order.usdAmount;
        S.money += proceeds;

        pushNote(S, `Limit SELL filled! Sold ${order.tokenQty.toFixed(4)} ${mkt.symbol} @ $${mkt.sellPrice.toFixed(2)} (+$${Math.round(proceeds).toLocaleString()}).`, {
          title: 'LIMIT ORDER EXECUTED',
          type: 'finance',
          priority: 2,
          body: `Order ID: #${order.id}\nAction: LIMIT SELL\nAsset: ${mkt.symbol}\nLimit Target: $${order.targetPrice.toLocaleString()}\nExecution Price: $${mkt.sellPrice.toLocaleString()}\nProceeds: $${Math.round(proceeds).toLocaleString()}`
        });
        toast(`Limit SELL Filled: +$${Math.round(proceeds).toLocaleString()} USD!`, 'success');
      }
    }

    if (!triggered) {
      remainingOrders.push(order);
    }
  }

  S.cryptoLimitOrders = remainingOrders;
}
