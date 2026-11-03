export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  basePrice: number;
  volatility: number;
  color: string;
}

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: 'flb', symbol: 'FLB', name: 'Fleet Logistics Bond', icon: '🪙', basePrice: 5000, volatility: 0.08, color: '#f59e0b' },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: '₿', basePrice: 98500, volatility: 0.15, color: '#f59e0b' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', basePrice: 2750, volatility: 0.25, color: '#6366f1' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', icon: '◎', basePrice: 145, volatility: 0.45, color: '#14f195' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', icon: '✕', basePrice: 2.45, volatility: 0.35, color: '#00aae4' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', basePrice: 0.38, volatility: 0.55, color: '#cb9800' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', icon: '₳', basePrice: 0.85, volatility: 0.30, color: '#0033ad' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', icon: '▲', basePrice: 38.50, volatility: 0.40, color: '#e84142' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', icon: '⬢', basePrice: 18.20, volatility: 0.32, color: '#375bd2' },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '$', basePrice: 1.00, volatility: 0.001, color: '#2775ca' }
];

export function getCryptoMarketData(assetId: string) {
  const asset = CRYPTO_ASSETS.find(a => a.id === assetId) || CRYPTO_ASSETS[0];

  const hourSeed = Math.floor(Date.now() / (1000 * 60 * 15)); // Update every 15 mins
  const seed = asset.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + hourSeed;
  
  // Historical points for central chart (24 periods = 6 hours of 15-min candles)
  const history: number[] = [];
  for (let i = 24; i >= 0; i--) {
    const s = seed - i;
    const wave = Math.sin(s * 0.35) * asset.volatility + Math.cos(s * 0.18) * (asset.volatility * 0.6);
    const noise = (Math.sin(s * 1.7) * 0.15) * asset.volatility;
    const price = Math.max(0.0001, asset.basePrice * (1 + wave + noise));
    history.push(price);
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
    price,
    change24h,
    high24h,
    low24h,
    history,
    spread,
    buyPrice,
    sellPrice
  };
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
