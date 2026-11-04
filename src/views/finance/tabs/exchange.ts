import { fmt } from '../../../core/ui';
import { getGoldMarketData } from '../../../domain/finance/banking';
import { CRYPTO_ASSETS, getCryptoMarketData, getTotalCryptoValue } from '../../../domain/finance/markets/crypto';
import { MINING_RIG_TYPES, MINING_ADDITIONS, MINING_DURATIONS, calculateMiningStats, getSubstationUpgradeCost, getSubscriptionCost, calculateRigDailyCoinYield, getVipLevel, MiningSubscription, formatCryptoQty, MINING_TUNING_PROFILES } from '../../../domain/finance/markets/mining';
import { renderCandlestickChart, renderOrderBookDepth, renderLimitOrderDesk, renderCollateralLoanDesk } from './exchange-orderbook';
import { renderNextGenHardwareShop, renderNextGenAestheticBay } from './nextgen-shop';

export function renderExchangeTab(S: any) {
  const goldMarket = getGoldMarketData(S);
  const trendColor = goldMarket.trend === 'bullish' ? 'var(--grn)' : '#ef4444';

  const selectedAssetId = (window as any).selectedCryptoAsset || 'btc';
  const miningTargetCoin = (window as any).miningTargetCoin || 'btc';
  const miningSelectedDuration = (window as any).miningSelectedDuration || 7;

  const assetData = getCryptoMarketData(selectedAssetId)!;
  const isUp = assetData.change24h >= 0;
  const chartColor = isUp ? '#22c55e' : '#ef4444';

  const userCryptoHoldings = S.cryptoHoldings || {};
  const currentAssetQty = userCryptoHoldings[selectedAssetId] || 0;
  const currentAssetUsdVal = currentAssetQty * assetData.sellPrice;
  const totalCryptoPortfolioVal = getTotalCryptoValue(S);

  // Mining Data
  const playerVip = getVipLevel(S);
  const userCoins = S.coins || 0;
  const cryptoFlbQty = (S.cryptoHoldings && S.cryptoHoldings['flb']) || 0;
  const miningStats = calculateMiningStats(S);
  const nextSubstationCost = getSubstationUpgradeCost(miningStats.substationLevel);
  const activeSubscriptions: MiningSubscription[] = (S.mining?.subscriptions || []).filter((s: any) => s.active && Date.now() < s.expiresAt);
  const userUpgrades = S.mining?.upgrades || {};
  const pendingYield = S.mining?.pendingYield || {};

  // Compute total pending yield in USD
  let totalPendingUsd = 0;
  for (const [coinId, qty] of Object.entries(pendingYield)) {
    const q = qty as number;
    if (q > 0) {
      const mkt = getCryptoMarketData(coinId);
      totalPendingUsd += q * (mkt ? mkt.sellPrice : 0);
    }
  }

  // Central SVG Chart rendering
  const history = assetData.history;
  const minPrice = assetData.low24h;
  const maxPrice = assetData.high24h;
  const priceRange = maxPrice - minPrice || 1;
  const svgWidth = 320;
  const svgHeight = 110;
  const padding = 10;

  const points = history.map((val, idx) => {
    const x = padding + (idx / (history.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((val - minPrice) / priceRange) * (svgHeight - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pointsString = points.join(' ');
  const areaPointsString = `${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding}`;

  const minableAssets = CRYPTO_ASSETS.filter(a => a.id !== 'usdc');

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- 1. Carrier Reserve Market (Fleet Bonds) & Corporate Staking Pool -->
      <div style="background:linear-gradient(135deg, #111827 0%, #0f172a 100%); border:1px solid var(--gold); border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">Carrier Reserve Market & Security Token</div>
            <div style="font-size:18px; font-weight:900; color:var(--tx); margin-top:2px;">Fleet Bond (FLB)</div>
          </div>
          <div style="text-align:right;">
             <div style="font-size:14px; font-weight:900; color:${trendColor}; font-family:monospace;">$${goldMarket.buyPrice.toLocaleString()}</div>
             <div style="font-size:9px; color:var(--mu);">Spread: 2.5% · Asset-Backed</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid #1e293b;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">LIQUID BONDS</div>
            <div style="font-size:13px; font-weight:900; color:var(--gold); font-family:monospace;">${formatCryptoQty(userCoins)} FLB</div>
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">$${Math.round(userCoins * goldMarket.sellPrice).toLocaleString()} USD</div>
          </div>
          ${cryptoFlbQty > 0 ? `
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid #1e293b;">
              <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">CRYPTO WALLET FLB</div>
              <div style="font-size:13px; font-weight:900; color:#38bdf8; font-family:monospace;">${formatCryptoQty(cryptoFlbQty)} FLB</div>
              <div style="font-size:8px; color:var(--mu); font-family:monospace;">$${Math.round(cryptoFlbQty * goldMarket.sellPrice).toLocaleString()} USD</div>
            </div>
          ` : ''}
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid #1e293b;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">STAKED IN POOL</div>
            <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace;">${formatCryptoQty(miningStats.stakedBonds)} FLB</div>
            <div style="font-size:8px; color:var(--mu); font-family:monospace;">$${Math.round(miningStats.stakedBonds * goldMarket.sellPrice).toLocaleString()} USD</div>
          </div>
        </div>

        ${cryptoFlbQty > 0 ? `
          <div style="background:#080c16; border:1px solid rgba(193,154,91,0.3); border-radius:8px; padding:10px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:9px; font-weight:900; color:var(--gold); text-transform:uppercase;">Withdraw FLB from Crypto Wallet to Company Bond Balance</span>
              <span style="font-size:8px; color:var(--grn); font-family:monospace; font-weight:800;">${formatCryptoQty(cryptoFlbQty)} FLB Available</span>
            </div>
            <div style="display:flex; gap:6px;">
              <input type="number" id="flb-withdraw-input" placeholder="FLB Qty (e.g. ${Math.min(5, Math.ceil(cryptoFlbQty))})" min="0.0001" step="any"
                style="flex:1; padding:6px 8px; background:#0b0f19; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:10px;" />
              <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="withdraw-flb-to-bonds">
                WITHDRAW
              </button>
              <button class="btn alt" style="padding:6px 10px; font-size:9px; font-weight:800; white-space:nowrap; color:var(--tx);" data-act="withdraw-flb-to-bonds" data-qty="${cryptoFlbQty}">
                ALL
              </button>
            </div>
          </div>
        ` : ''}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
          <button class="btn gold" style="padding:8px; font-size:9px; font-weight:900;" data-act="exchange-buy-gold" data-qty="1">BUY 1 FLB ($${goldMarket.buyPrice.toLocaleString()})</button>
          <button class="btn alt" style="padding:8px; font-size:9px; font-weight:900; color:var(--tx);" data-act="exchange-sell-gold" data-qty="1">SELL 1 FLB ($${goldMarket.sellPrice.toLocaleString()})</button>
        </div>

        <!-- Corporate Treasury Staking Pool Box -->
        <div style="background:#080c16; border:1px solid #1a2336; border-radius:8px; padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:13px;">🏛️</span>
              <span style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase;">Corporate Treasury Staking Pool</span>
            </div>
            <span style="font-size:9px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); padding:2px 6px; border-radius:4px;">
              ${miningStats.stakingApyPct}% APY
            </span>
          </div>

          <div style="font-size:9px; color:var(--mu); line-height:1.4; margin-bottom:10px;">
            Lock FLB tokens into the corporate treasury smart contract to earn daily dividends (~<b style="color:var(--grn); font-family:monospace;">+$${Math.round(miningStats.dailyStakingYieldUsd).toLocaleString()}/day</b>) and unlock enterprise fleet discounts:
          </div>

          <!-- Staking Tiers Readout -->
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px; margin-bottom:10px;">
            <div style="background:${miningStats.stakedBonds >= 5 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 5 ? 'var(--grn)' : '#1e293b'}; border-radius:4px; padding:6px 4px; text-align:center;">
              <div style="font-size:7px; color:var(--mu);">TIER 1 (5+ FLB)</div>
              <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 5 ? 'var(--grn)' : 'var(--tx)'}; margin-top:2px;">-10% Fuel Cost</div>
            </div>
            <div style="background:${miningStats.stakedBonds >= 15 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 15 ? 'var(--grn)' : '#1e293b'}; border-radius:4px; padding:6px 4px; text-align:center;">
              <div style="font-size:7px; color:var(--mu);">TIER 2 (15+ FLB)</div>
              <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 15 ? 'var(--grn)' : 'var(--tx)'}; margin-top:2px;">+15% Freight Rate</div>
            </div>
            <div style="background:${miningStats.stakedBonds >= 35 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 35 ? 'var(--grn)' : '#1e293b'}; border-radius:4px; padding:6px 4px; text-align:center;">
              <div style="font-size:7px; color:var(--mu);">TIER 3 (35+ FLB)</div>
              <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 35 ? 'var(--grn)' : 'var(--tx)'}; margin-top:2px;">-50% Bay Labor</div>
            </div>
            <div style="background:${miningStats.stakedBonds >= 75 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 75 ? 'var(--grn)' : '#1e293b'}; border-radius:4px; padding:6px 4px; text-align:center;">
              <div style="font-size:7px; color:var(--mu);">TIER 4 (75+ FLB)</div>
              <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 75 ? 'var(--grn)' : 'var(--tx)'}; margin-top:2px;">-80% Power Grid</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:6px;">
            <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:900;" data-act="stake-flb" data-qty="1" ${userCoins >= 1 ? '' : 'disabled'}>STAKE 1 FLB</button>
            <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:900;" data-act="stake-flb" data-qty="5" ${userCoins >= 5 ? '' : 'disabled'}>STAKE 5 FLB</button>
            <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:900; color:var(--tx);" data-act="unstake-flb" data-qty="1" ${miningStats.stakedBonds >= 1 ? '' : 'disabled'}>UNSTAKE 1</button>
            <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:900; color:var(--tx);" data-act="unstake-flb" data-qty="${miningStats.stakedBonds}" ${miningStats.stakedBonds > 0 ? '' : 'disabled'}>UNSTAKE ALL</button>
          </div>
        </div>
      </div>

      <!-- 2. Institutional Crypto Terminal -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; overflow:hidden;">
        
        <div style="padding:14px 16px; border-bottom:1px solid #1e293b; background:#111827; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">Institutional Crypto Terminal</div>
            <div style="font-size:15px; font-weight:900; color:var(--tx); margin-top:2px;">Digital Asset Desk</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">PORTFOLIO VALUE</div>
            <div style="font-size:13px; font-weight:900; color:var(--grn); font-family:monospace;">$${Math.round(totalCryptoPortfolioVal).toLocaleString()}</div>
          </div>
        </div>

        <!-- 9 Coin Selector Tabs -->
        <div style="display:flex; gap:4px; overflow-x:auto; padding:6px; background:#0b0f19; border-bottom:1px solid #1e293b;">
          ${CRYPTO_ASSETS.map(asset => {
            const isSel = asset.id === selectedAssetId;
            return `
              <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:6px 10px; border-radius:6px; white-space:nowrap; font-size:10px; font-weight:800;" data-act="select-crypto-asset" data-id="${asset.id}">
                ${asset.icon} ${asset.symbol}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Central Interactive Price Chart -->
        <div style="padding:16px; background:#0f172a; border-bottom:1px solid #1e293b;">
          
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px; color:${assetData.color};">${assetData.icon}</span>
                <span style="font-size:18px; font-weight:900; color:var(--tx);">${assetData.name}</span>
                <span style="font-size:11px; color:var(--mu); font-family:monospace;">${assetData.symbol}/USD</span>
              </div>
              <div style="font-size:22px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:4px;">
                $${assetData.price.toLocaleString(undefined, { minimumFractionDigits: assetData.price < 10 ? 2 : 0, maximumFractionDigits: 4 })}
              </div>
            </div>
            
            <div style="text-align:right;">
              <div style="font-size:11px; font-weight:900; color:${chartColor}; font-family:monospace;">
                ${isUp ? '▲' : '▼'} ${Math.abs(assetData.change24h).toFixed(2)}%
              </div>
              <div style="font-size:9px; color:var(--mu); margin-top:4px; font-family:monospace;">
                24h H: $${assetData.high24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>
                24h L: $${assetData.low24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <!-- SVG Chart -->
          <div style="width:100%; height:110px; position:relative; background:#0a0e17; border:1px solid #1e293b; border-radius:8px; overflow:hidden;">
            <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad-${selectedAssetId}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${chartColor}" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="${chartColor}" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="${svgHeight * 0.25}" x2="${svgWidth}" y2="${svgHeight * 0.25}" stroke="#1e293b" stroke-dasharray="2,2" stroke-width="1" />
              <line x1="0" y1="${svgHeight * 0.5}" x2="${svgWidth}" y2="${svgHeight * 0.5}" stroke="#1e293b" stroke-dasharray="2,2" stroke-width="1" />
              <line x1="0" y1="${svgHeight * 0.75}" x2="${svgWidth}" y2="${svgHeight * 0.75}" stroke="#1e293b" stroke-dasharray="2,2" stroke-width="1" />
              
              <polygon points="${areaPointsString}" fill="url(#chartGrad-${selectedAssetId})" />
              <polyline fill="none" stroke="${chartColor}" stroke-width="2.5" points="${pointsString}" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          ${renderCandlestickChart(assetData)}
        </div>

        <!-- Buy / Sell Central Order Desk -->
        <div style="padding:16px; background:#0b0f19;">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:10px;">
            <div>
              <span style="color:var(--mu);">Available Cash:</span>
              <b style="color:var(--grn); font-family:monospace; margin-left:4px;">$${S.money.toLocaleString()}</b>
            </div>
            <div>
              <span style="color:var(--mu);">${assetData.symbol} Holding:</span>
              <b style="color:var(--gold); font-family:monospace; margin-left:4px;">
                ${formatCryptoQty(currentAssetQty)} ($${Math.round(currentAssetUsdVal).toLocaleString()})
              </b>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <!-- BUY SECTION -->
            <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:10px; font-weight:800; color:var(--grn); text-transform:uppercase;">BUY ${assetData.symbol}</span>
                <span style="font-size:9px; color:var(--mu); font-family:monospace;">Ask: $${assetData.buyPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>

              <!-- Custom USD Amount Input -->
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                <div style="position:relative; flex:1 1 140px; min-width:0;">
                  <span style="position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:11px; color:var(--mu); font-family:monospace;">$</span>
                  <input type="number" id="crypto-buy-amount-input" placeholder="Custom USD (e.g. 1200)" min="1" step="any"
                    style="width:100%; box-sizing:border-box; padding:7px 8px 7px 22px; background:#0b0f19; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:11px; font-weight:700;" />
                </div>
                <button class="btn gold" style="flex:1 1 auto; padding:7px 14px; font-size:10px; font-weight:900; white-space:nowrap;" data-act="crypto-buy-usd" data-id="${assetData.id}">
                  BUY ${assetData.symbol}
                </button>
              </div>

              <!-- Quick Presets -->
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
                <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="1000">+$1k</button>
                <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="5000">+$5k</button>
                <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="25000">+$25k</button>
                <button class="btn gold" style="padding:6px 4px; font-size:8px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="${Math.floor(S.money)}">MAX</button>
              </div>
            </div>

            <!-- SELL SECTION -->
            <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:10px; font-weight:800; color:#ef4444; text-transform:uppercase;">SELL ${assetData.symbol}</span>
                <span style="font-size:9px; color:var(--mu); font-family:monospace;">Bid: $${assetData.sellPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>

              <!-- Custom USD Amount Input -->
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                <div style="position:relative; flex:1 1 140px; min-width:0;">
                  <span style="position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:11px; color:var(--mu); font-family:monospace;">$</span>
                  <input type="number" id="crypto-sell-amount-input" placeholder="Custom USD (e.g. 356)" min="1" step="any"
                    style="width:100%; box-sizing:border-box; padding:7px 8px 7px 22px; background:#0b0f19; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:11px; font-weight:700;" />
                </div>
                <button class="btn alt" style="flex:1 1 auto; padding:7px 14px; font-size:10px; font-weight:900; color:#ef4444; border-color:#ef4444; white-space:nowrap;" data-act="crypto-sell-custom" data-id="${assetData.id}">
                  SELL ${assetData.symbol}
                </button>
              </div>

              <!-- Quick Presets -->
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
                <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="25">25%</button>
                <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="50">50%</button>
                <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="75">75%</button>
                <button class="btn alt" style="padding:6px 4px; font-size:8px; font-weight:800; color:#ef4444; border-color:#ef4444;" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="100">ALL</button>
              </div>
            </div>

            ${assetData.id === 'flb' && cryptoFlbQty > 0 ? `
              <!-- FLB Withdrawal Card when FLB selected -->
              <div style="background:#080c16; border:1px solid var(--gold); border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase;">WITHDRAW FLB TO COMPANY BOND BALANCE</span>
                  <span style="font-size:9px; color:var(--grn); font-family:monospace; font-weight:800;">${formatCryptoQty(cryptoFlbQty)} FLB in Wallet</span>
                </div>
                <div style="font-size:9px; color:var(--mu); margin-bottom:8px;">
                  Transfer FLB directly to Company Bond balance for staking, substation power upgrades, and contract dispatch quotas:
                </div>
                <div style="display:flex; gap:6px;">
                  <input type="number" id="flb-withdraw-input-term" placeholder="FLB Qty (e.g. ${Math.min(5, Math.ceil(cryptoFlbQty))})" min="0.0001" step="any"
                    style="flex:1; padding:6px 8px; background:#0b0f19; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:10px;" />
                  <button class="btn gold" style="padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="withdraw-flb-to-bonds">
                    WITHDRAW
                  </button>
                  <button class="btn alt" style="padding:6px 10px; font-size:9px; font-weight:800; white-space:nowrap; color:var(--tx);" data-act="withdraw-flb-to-bonds" data-qty="${cryptoFlbQty}">
                    ALL
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Live Orderbook Depth Ladder & Automated Limit Order Desk -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px; margin-top:8px;">
              ${renderOrderBookDepth(selectedAssetId)}
              ${renderLimitOrderDesk(S, selectedAssetId)}
            </div>

            <!-- Crypto-Collateralized Working Capital Line -->
            <div style="margin-top:8px;">
              ${renderCollateralLoanDesk(S, selectedAssetId)}
            </div>

          </div>
        </div>
      </div>

      <!-- 3. Enterprise Mining Live Visual Screen & Telemetry Center -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; overflow:hidden;">
        
        <!-- Live Terminal Banner -->
        <div style="padding:14px 16px; border-bottom:1px solid #1e293b; background:linear-gradient(90deg, #111827 0%, #0b0f19 100%); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:10px; color:${miningStats.activeSubsCount > 0 ? 'var(--grn)' : 'var(--mu)'}; font-weight:900;">
                ${miningStats.activeSubsCount > 0 ? '🟢 LIVE MINING OPERATIONAL' : '⚪ FARM IDLE'}
              </span>
            </div>
            <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px; font-family:monospace;">
              MINING TELEMETRY TERMINAL
            </div>
          </div>
          <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900;" data-act="claim-mining-rewards">
            Claim
          </button>
        </div>

        <!-- Live Pending Rewards Breakdown Screen -->
        <div style="padding:12px 16px; background:#0a0e17; border-bottom:1px solid #1e293b;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:9px; color:var(--gold); font-weight:800; text-transform:uppercase;">Unclaimed Live Mined Yields</span>
            <span style="font-size:9px; color:var(--grn); font-family:monospace; font-weight:800;" data-mining-pending-usd>~$${Math.round(totalPendingUsd).toLocaleString()} USD</span>
          </div>

          <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;">
            ${Object.entries(pendingYield).filter(([_, qty]) => (qty as number) > 0).length === 0 ? `
              <div style="font-size:9px; color:var(--mu);">No pending yield yet. Start a mining contract below to see live coin yield accruals.</div>
            ` : Object.entries(pendingYield).map(([coinId, qty]) => {
              const q = qty as number;
              if (q <= 0) return '';
              const coin = CRYPTO_ASSETS.find(c => c.id === coinId)!;
              const valUsd = q * (getCryptoMarketData(coinId)?.sellPrice || (coinId === 'flb' ? 5000 : 0));

              return `
                <div style="background:#111827; border:1px solid ${coin.color}40; border-radius:6px; padding:6px 10px; min-width:110px; flex:0 0 auto;">
                  <div style="display:flex; align-items:center; gap:4px; font-size:10px; font-weight:900; color:${coin.color};">
                    <span>${coin.icon}</span> ${coin.symbol}
                  </div>
                  <div style="font-size:11px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;" data-mining-yield-coin="${coinId}">
                    ${formatCryptoQty(q)}
                  </div>
                  <div style="font-size:8px; color:var(--grn); font-family:monospace;">
                    ~$${valUsd < 0.01 ? valUsd.toFixed(4) : valUsd.toFixed(2)} USD
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Live Power Substation & Booster Telemetry Box -->
        <div style="padding:14px; background:#0b0f19; border-bottom:1px solid #1e293b; display:flex; flex-direction:column; gap:10px;">
          
          ${renderNextGenAestheticBay(S)}

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:8px;">
            <div style="background:#111827; padding:10px; border-radius:8px; border:1px solid ${miningStats.isOverloaded ? '#ef4444' : '#1f293d'};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">SUBSTATION POWER (LVL ${miningStats.substationLevel})</div>
                <div style="font-size:8px; font-weight:900; color:${miningStats.isOverloaded ? '#ef4444' : 'var(--grn)'};" data-mining-status>${miningStats.transformerStatus}</div>
              </div>
              <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;" data-mining-power-kw>
                ${miningStats.usedPowerKw.toFixed(1)} kW / ${miningStats.currentPowerKw} kW
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-top:6px;">
                <div data-mining-power-bar style="width:${miningStats.powerUsagePct}%; height:100%; background:${miningStats.isOverloaded ? '#ef4444' : miningStats.powerUsagePct > 85 ? '#f59e0b' : 'var(--gold)'}; transition:width 0.4s ease;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; color:var(--mu); font-family:monospace; margin-top:5px;">
                <span>Grid: 480V 3-Phase · 59.99 Hz</span>
                <span>Core: <b data-mining-temp style="color:${miningStats.transformerTempC > 75 ? '#ef4444' : 'var(--gold)'};">${miningStats.transformerTempC}°C</b></span>
              </div>
            </div>

            <div style="background:#111827; padding:10px; border-radius:8px; border:1px solid #1f293d;">
              <div style="font-size:8px; color:var(--mu); text-transform:uppercase;">LIVE NET DAILY PROFIT</div>
              <div style="font-size:13px; font-weight:900; color:${miningStats.netDailyProfitUsd >= 0 ? 'var(--grn)' : '#ef4444'}; font-family:monospace; margin-top:2px;">
                ${miningStats.netDailyProfitUsd >= 0 ? '+' : ''}$${Math.round(miningStats.netDailyProfitUsd).toLocaleString()}/day
              </div>
              <div style="font-size:8px; color:var(--mu); margin-top:4px;">
                Yield Boost: <b style="color:var(--gold);">${Math.round(miningStats.yieldMultiplier * 100)}%</b> | Power Bill: <b style="color:var(--grn);">${Math.round(miningStats.powerCostMultiplier * 100)}%</b>
              </div>
              <div style="display:flex; gap:6px; font-size:8px; color:var(--mu); font-family:monospace; margin-top:5px;">
                <span>${miningStats.cleanEnergyKw > 0 ? `<b style="color:#10b981;">☀️ +${miningStats.cleanEnergyKw} kW Solar</b>` : '☀️ 0 kW Solar'}</span>
                <span>·</span>
                <span>${miningStats.bessSurgeKw > 0 ? `<b style="color:#06b6d4;">🔋 +${miningStats.bessSurgeKw} kW BESS</b>` : '🔋 0 kW BESS'}</span>
              </div>
            </div>
          </div>

          ${miningStats.isOverloaded ? `
            <div style="background:rgba(239,68,68,0.12); border:1px solid #ef4444; border-radius:6px; padding:8px 12px; font-size:9px; color:#fca5a5; display:flex; align-items:center; gap:8px;">
              <span style="font-size:14px;">⚠️</span>
              <div>
                <b>SUBSTATION GRID OVERLOAD:</b> Rigs demand (${miningStats.usedPowerKw.toFixed(1)} kW) exceeds transformer limit (${miningStats.currentPowerKw} kW). Breaker triggered <b>50% thermal throttling</b>. Upgrade transformer below to restore full hash velocity!
              </div>
            </div>
          ` : ''}

          <!-- Industrial Rig Tuning Profile & Thermal Efficiency Controls -->
          <div style="background:#111827; border:1px solid #1f293d; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-size:9px; font-weight:800; color:var(--tx); text-transform:uppercase;">
                RIG TUNING PROFILE · PUE EFFICIENCY: <span style="color:var(--grn); font-family:monospace; font-weight:900;">${miningStats.pue}</span>
              </div>
              <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-top:2px;">
                ${miningStats.tuningDef?.description || ''}
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn ${miningStats.tuning === 'eco' ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:8px; font-weight:800;" data-act="set-mining-tuning" data-profile="eco">
                🌱 ECO (-25% PWR)
              </button>
              <button class="btn ${miningStats.tuning === 'balanced' ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:8px; font-weight:800;" data-act="set-mining-tuning" data-profile="balanced">
                ⚖️ NOMINAL (100%)
              </button>
              <button class="btn ${miningStats.tuning === 'overclock' ? 'danger' : 'alt'}" style="padding:4px 8px; font-size:8px; font-weight:800; ${miningStats.tuning === 'overclock' ? 'color:#fff;' : 'color:#ef4444;'}" data-act="set-mining-tuning" data-profile="overclock">
                ⚡ OVERCLOCK (+28%)
              </button>
            </div>
          </div>

          <!-- Active Multi-Coin Mining Badges -->
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:9px;">
            <span style="color:var(--mu); font-weight:800;">ACTIVE MINING CURRENCIES:</span>
            ${miningStats.activeCoinsList.length === 0 ? `
              <span style="color:var(--mu); opacity:0.6;">None (Deploy a hosting contract below)</span>
            ` : miningStats.activeCoinsList.map(coinId => {
              const asset = CRYPTO_ASSETS.find(a => a.id === coinId)!;
              return `
                <span style="background:${asset.color}20; color:${asset.color}; border:1px solid ${asset.color}40; padding:2px 6px; border-radius:4px; font-weight:900; font-family:monospace;">
                  ${asset.icon} ${asset.symbol}
                </span>
              `;
            }).join('')}
          </div>

          <button class="btn alt" style="width:100%; padding:8px; font-size:9px; font-weight:800; color:var(--gold); border-color:var(--gold)40;" data-act="upgrade-substation">
            UPGRADE SUBSTATION TRANSFORMER (+350 kW) — ${nextSubstationCost.bondsCost > 0 ? `$${nextSubstationCost.cashCost.toLocaleString()} + ${nextSubstationCost.bondsCost} FLB` : `$${nextSubstationCost.cashCost.toLocaleString()}`}
          </button>
        </div>

        <!-- 4. System Additions & Hardware Boosters Catalog -->
        <div style="padding:14px; background:#0f172a; border-bottom:1px solid #1e293b;">
          <div style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase; margin-bottom:10px;">
            System Additions & Hardware Boosters
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:8px;">
            ${MINING_ADDITIONS.map(add => {
              const isInstalled = !!userUpgrades[add.id];
              const canAffordCash = S.money >= add.cashCost;
              const canAffordBonds = userCoins >= add.bondsCost;
              const hasVip = playerVip >= add.requiredVipLevel;
              const canInstall = !isInstalled && canAffordCash && canAffordBonds && hasVip;

              return `
                <div style="background:#111827; border:1px solid ${isInstalled ? 'var(--grn)' : '#1f293d'}; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:16px;">${add.icon}</span>
                      ${isInstalled ? `
                        <span style="font-size:8px; color:var(--grn); background:rgba(34,197,94,0.1); padding:2px 4px; border-radius:3px; font-weight:900;">INSTALLED</span>
                      ` : `
                        <span style="font-size:8px; color:${hasVip ? 'var(--gold)' : '#ef4444'};">VIP ${add.requiredVipLevel}+</span>
                      `}
                    </div>
                    <div style="font-size:10px; font-weight:900; color:var(--tx); margin-top:4px;">${add.name}</div>
                    <div style="font-size:8px; color:var(--mu); margin-top:2px; line-height:1.3;">${add.description}</div>
                  </div>

                  ${!isInstalled ? `
                    <button class="btn ${canInstall ? 'gold' : 'alt'}" style="padding:6px; font-size:8px; font-weight:900; margin-top:8px; opacity:${canInstall ? 1 : 0.6};" data-act="buy-mining-addition" data-id="${add.id}">
                      INSTALL (${add.bondsCost > 0 ? `$${add.cashCost.toLocaleString()} + ${add.bondsCost} FLB` : `$${add.cashCost.toLocaleString()}`})
                    </button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Next-Gen Mining Hardware Upgrades Shop Component -->
        <div style="padding:14px; background:#0f172a; border-bottom:1px solid #1e293b;">
          ${renderNextGenHardwareShop(S)}
        </div>

        <!-- 5. Configure Hosting Contract -->
        <div style="padding:14px; background:#0f172a; border-bottom:1px solid #1e293b;">
          <div style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase; margin-bottom:10px;">
            Step 1: Select Target Coin to Mine
          </div>
          
          <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:6px; margin-bottom:12px;">
            ${minableAssets.map(coin => {
              const isSel = coin.id === miningTargetCoin;
              return `
                <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:6px 10px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="select-mining-coin" data-id="${coin.id}">
                  ${coin.icon} ${coin.symbol}
                </button>
              `;
            }).join('')}
          </div>

          <div style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase; margin-bottom:10px;">
            Step 2: Select Subscription Duration
          </div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:14px;">
            ${MINING_DURATIONS.map(dur => {
              const isSel = dur.days === miningSelectedDuration;
              return `
                <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:8px 4px; font-size:9px; font-weight:900;" data-act="select-mining-duration" data-days="${dur.days}">
                  ${dur.label}
                </button>
              `;
            }).join('')}
          </div>

          <div style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase; margin-bottom:10px;">
            Step 3: Select Hardware Tier
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            ${MINING_RIG_TYPES.map(rig => {
              const costs = getSubscriptionCost(rig.id, miningSelectedDuration);
              const dailyCoinYield = calculateRigDailyCoinYield(rig.id, miningTargetCoin, S);
              const canAffordCash = S.money >= costs.cashCost;
              const canAffordBonds = userCoins >= costs.bondsCost;
              const hasPower = miningStats.usedPowerKw + rig.powerKw <= miningStats.currentPowerKw;
              const hasVip = playerVip >= rig.requiredVipLevel;
              const isEligible = canAffordCash && canAffordBonds && hasPower && hasVip;

              const targetSymbol = miningTargetCoin.toUpperCase();

              return `
                <div style="background:#111827; border:1px solid ${rig.category === 'NextGen' ? 'rgba(56,189,248,0.4)' : hasVip ? '#1f293d' : '#331010'}; border-radius:8px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
                    <div>
                      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:11px; font-weight:900; color:${hasVip ? 'var(--tx)' : '#999'};">${rig.name}</span>
                        <span style="font-size:9px; color:var(--gold); font-family:monospace;">[${rig.hashrate}]</span>
                        ${rig.category === 'NextGen' ? `
                          <span style="font-size:8px; font-weight:900; color:#38bdf8; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); padding:1px 5px; border-radius:4px; font-family:monospace;">
                            ⚡ NEXT-GEN
                          </span>
                        ` : ''}
                      </div>
                      <div style="font-size:8px; color:var(--mu); margin-top:2px;">
                        Power: ${rig.powerKw} kW ($${rig.dailyPowerCost}/d) · Target: <b style="color:var(--grn);">${targetSymbol}</b> · Requires: <b style="color:${hasVip ? 'var(--grn)' : '#ef4444'};">VIP ${rig.requiredVipLevel}+</b>
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:10px; font-weight:900; color:var(--grn); font-family:monospace;">
                        ~${formatCryptoQty(dailyCoinYield)} ${targetSymbol}/d
                      </div>
                    </div>
                  </div>

                  <button class="btn ${isEligible ? 'gold' : 'alt'}" style="width:100%; padding:8px; font-size:9px; font-weight:900; opacity:${isEligible ? 1 : 0.6}; margin-top:4px;" data-act="subscribe-mining-contract" data-type-id="${rig.id}" data-coin="${miningTargetCoin}" data-duration="${miningSelectedDuration}">
                    SUBSCRIBE ${miningSelectedDuration} DAYS (${costs.bondsCost > 0 ? `$${costs.cashCost.toLocaleString()} + ${costs.bondsCost} FLB` : `$${costs.cashCost.toLocaleString()}`})
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 6. Active Multi-Coin Subscriptions Roster -->
        <div style="padding:14px; background:#0b0f19;">
          <div style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:10px;">
            Active Hosting Contracts (${activeSubscriptions.length})
          </div>

          ${activeSubscriptions.length === 0 ? `
            <div style="font-size:9px; color:var(--mu); text-align:center; padding:16px; background:#111827; border:1px dashed #1f293d; border-radius:8px;">
              No active mining contracts running. Select a coin and hardware tier above to deploy your first contract.
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${activeSubscriptions.map(sub => {
                const def = MINING_RIG_TYPES.find(t => t.id === sub.typeId) || MINING_RIG_TYPES[0];
                const coin = CRYPTO_ASSETS.find(c => c.id === sub.targetAssetId) || CRYPTO_ASSETS[0];
                const msRemaining = Math.max(0, sub.expiresAt - Date.now());
                const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
                const daysRemaining = (hoursRemaining / 24).toFixed(1);

                const dailyCoinYield = calculateRigDailyCoinYield(sub.typeId, sub.targetAssetId, S);

                return `
                  <div style="background:#111827; border:1px solid var(--gold)40; border-radius:8px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px; color:${coin.color};">${coin.icon}</span>
                        <div>
                          <div style="font-size:11px; font-weight:900; color:var(--tx);">${def.name}</div>
                          <div style="font-size:8px; color:var(--mu); font-family:monospace;">
                            Mining <b style="color:var(--tx);">${coin.symbol}</b> · ${def.hashrate} · ${def.powerKw} kW
                          </div>
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:9px; color:var(--grn); font-weight:900; font-family:monospace;">
                          +${formatCryptoQty(dailyCoinYield)} ${coin.symbol}/d
                        </div>
                        <div style="font-size:8px; color:var(--gold); font-family:monospace; margin-top:2px;">
                          ⏳ ${daysRemaining} days left
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>

    </div>
  `;
}
