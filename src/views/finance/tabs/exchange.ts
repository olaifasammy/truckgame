import { fmt } from '../../../core/ui';
import { getGoldMarketData } from '../../../domain/finance/banking';
import { CRYPTO_ASSETS, getCryptoMarketData, getTotalCryptoValue } from '../../../domain/finance/markets/crypto';
import { MINING_RIG_TYPES, MINING_ADDITIONS, MINING_DURATIONS, calculateMiningStats, getSubstationUpgradeCost, getSubscriptionCost, calculateRigDailyCoinYield, getVipLevel, MiningSubscription, formatCryptoQty, MINING_TUNING_PROFILES } from '../../../domain/finance/markets/mining';
import { renderCandlestickChart, renderOrderBookDepth, renderLimitOrderDesk, renderCollateralLoanDesk } from './exchange-orderbook';
import { renderNextGenHardwareShop, renderNextGenAestheticBay } from './nextgen-shop';

export function renderExchangeTab(S: any) {
  const goldMarket = getGoldMarketData(S);
  const trendColor = goldMarket.trend === 'bullish' ? 'var(--grn)' : '#ef4444';

  const activeSubTab = (window as any).cryptoSubTab || 'exchange';
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
    <div style="display:flex; flex-direction:column; gap:12px;">
      
      <!-- TOP EXECUTIVE TICKER & SUB-NAVIGATION BAR -->
      <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 14px; display:flex; flex-direction:column; gap:10px;">
        
        <!-- Live Global Metrics Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <div>
              <span style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">FLB BOND</span>
              <span style="font-size:12px; font-weight:900; color:${trendColor}; font-family:monospace; margin-left:4px;">$${goldMarket.buyPrice.toLocaleString()}</span>
            </div>
            <div style="height:12px; width:1px; background:rgba(255,255,255,0.1);"></div>
            <div>
              <span style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">PORTFOLIO</span>
              <span style="font-size:12px; font-weight:900; color:var(--grn); font-family:monospace; margin-left:4px;">$${Math.round(totalCryptoPortfolioVal).toLocaleString()}</span>
            </div>
            <div style="height:12px; width:1px; background:rgba(255,255,255,0.1);"></div>
            <div>
              <span style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase;">UNCLAIMED YIELD</span>
              <span style="font-size:12px; font-weight:900; color:var(--gold); font-family:monospace; margin-left:4px;" data-mining-pending-usd>~$${Math.round(totalPendingUsd).toLocaleString()}</span>
            </div>
          </div>

          <button class="btn gold" style="padding:5px 12px; font-size:9px; font-weight:900;" data-act="claim-mining-rewards">
            CLAIM YIELDS
          </button>
        </div>

        <!-- Sleek Sub-Tab Nav Controls -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; background:#05080f; padding:3px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
          <button class="btn ${activeSubTab === 'exchange' ? 'gold' : 'alt'}" style="padding:6px 4px; font-size:9px; font-weight:900;" data-act="crypto-sub-tab" data-tab="exchange">
            📈 SPOT & BONDS
          </button>
          <button class="btn ${activeSubTab === 'orderbook' ? 'gold' : 'alt'}" style="padding:6px 4px; font-size:9px; font-weight:900;" data-act="crypto-sub-tab" data-tab="orderbook">
            📊 ORDERBOOK & CREDIT
          </button>
          <button class="btn ${activeSubTab === 'mining' ? 'gold' : 'alt'}" style="padding:6px 4px; font-size:9px; font-weight:900;" data-act="crypto-sub-tab" data-tab="mining">
            ⛏️ MINING DATACENTER
          </button>
        </div>

      </div>

      ${activeSubTab === 'exchange' ? `
        <!-- ==================== SUB-TAB 1: SPOT TRADING & FLEET BONDS ==================== -->
        <div style="display:flex; flex-direction:column; gap:12px;">

          <!-- 1. Carrier Reserve Market & Corporate Staking Pool -->
          <div style="background:#090d16; border:1px solid rgba(193,154,91,0.25); border-radius:10px; padding:12px;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
              <div>
                <span style="font-size:8px; color:var(--gold); font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Fleet Bond Reserve & Staking</span>
                <div style="font-size:15px; font-weight:900; color:var(--tx); margin-top:1px;">Fleet Bond (FLB) Market</div>
              </div>

              <!-- Compact Balance Strip -->
              <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:5px; text-align:right;">
                  <span style="font-size:7px; color:var(--mu); text-transform:uppercase;">LIQUID: </span>
                  <b style="font-size:10px; color:var(--gold); font-family:monospace;">${formatCryptoQty(userCoins)} FLB</b>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:5px; text-align:right;">
                  <span style="font-size:7px; color:var(--mu); text-transform:uppercase;">STAKED: </span>
                  <b style="font-size:10px; color:var(--grn); font-family:monospace;">${formatCryptoQty(miningStats.stakedBonds)} FLB</b>
                </div>
                ${cryptoFlbQty > 0 ? `
                  <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:5px; text-align:right;">
                    <span style="font-size:7px; color:var(--mu); text-transform:uppercase;">WALLET: </span>
                    <b style="font-size:10px; color:#38bdf8; font-family:monospace;">${formatCryptoQty(cryptoFlbQty)} FLB</b>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- FLB Trading Dual Form (Custom Quantity + Quick Presets) -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:8px; margin-bottom:10px;">
              
              <!-- BUY FLB BOX -->
              <div style="background:#05080f; border:1px solid rgba(34,197,94,0.25); border-radius:6px; padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:8px; font-weight:900; color:var(--grn); text-transform:uppercase;">BUY FLEET BONDS (FLB)</span>
                  <span style="font-size:8px; color:var(--mu); font-family:monospace;">$${goldMarket.buyPrice.toLocaleString()}/FLB</span>
                </div>
                <div style="display:flex; gap:4px; margin-bottom:4px;">
                  <input type="number" id="flb-buy-qty-input" placeholder="FLB Qty (e.g. 5)" min="0.0001" step="any"
                    style="flex:1; padding:4px 6px; background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:var(--tx); font-family:monospace; font-size:9px;" />
                  <button class="btn gold" style="padding:4px 10px; font-size:8px; font-weight:900; white-space:nowrap;" data-act="exchange-buy-gold">
                    BUY FLB
                  </button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px;">
                  <button class="btn gold" style="padding:3px 2px; font-size:7px; font-weight:800;" data-act="exchange-buy-gold" data-qty="1">+1 FLB</button>
                  <button class="btn gold" style="padding:3px 2px; font-size:7px; font-weight:800;" data-act="exchange-buy-gold" data-qty="5">+5 FLB</button>
                  <button class="btn gold" style="padding:3px 2px; font-size:7px; font-weight:800;" data-act="exchange-buy-gold" data-qty="10">+10 FLB</button>
                  <button class="btn gold" style="padding:3px 2px; font-size:7px; font-weight:800;" data-act="exchange-buy-gold" data-qty="${Math.max(1, Math.floor(S.money / goldMarket.buyPrice))}">MAX</button>
                </div>
              </div>

              <!-- SELL FLB BOX -->
              <div style="background:#05080f; border:1px solid rgba(239,68,68,0.25); border-radius:6px; padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:8px; font-weight:900; color:#ef4444; text-transform:uppercase;">SELL FLEET BONDS (FLB)</span>
                  <span style="font-size:8px; color:var(--mu); font-family:monospace;">$${goldMarket.sellPrice.toLocaleString()}/FLB</span>
                </div>
                <div style="display:flex; gap:4px; margin-bottom:4px;">
                  <input type="number" id="flb-sell-qty-input" placeholder="FLB Qty (e.g. 2)" min="0.0001" step="any"
                    style="flex:1; padding:4px 6px; background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:var(--tx); font-family:monospace; font-size:9px;" />
                  <button class="btn alt" style="padding:4px 10px; font-size:8px; font-weight:900; color:#ef4444; border-color:#ef4444; white-space:nowrap;" data-act="exchange-sell-gold">
                    SELL FLB
                  </button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px;">
                  <button class="btn alt" style="padding:3px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="exchange-sell-gold" data-qty="1">1 FLB</button>
                  <button class="btn alt" style="padding:3px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="exchange-sell-gold" data-qty="5">5 FLB</button>
                  <button class="btn alt" style="padding:3px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="exchange-sell-gold" data-qty="10">10 FLB</button>
                  <button class="btn alt" style="padding:3px 2px; font-size:7px; font-weight:800; color:#ef4444; border-color:#ef4444;" data-act="exchange-sell-gold" data-qty="${userCoins}">ALL</button>
                </div>
              </div>

            </div>

            ${cryptoFlbQty > 0 ? `
              <!-- Compact FLB Withdraw Box -->
              <div style="background:rgba(8,12,22,0.8); border:1px solid rgba(193,154,91,0.25); border-radius:6px; padding:8px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:8px; font-weight:900; color:var(--gold); text-transform:uppercase;">Withdraw FLB from Crypto Wallet to Treasury Balance</span>
                  <span style="font-size:8px; color:var(--grn); font-family:monospace;">${formatCryptoQty(cryptoFlbQty)} FLB Available</span>
                </div>
                <div style="display:flex; gap:4px;">
                  <input type="number" id="flb-withdraw-input" placeholder="Qty (e.g. ${Math.min(5, Math.ceil(cryptoFlbQty))})" min="0.0001" step="any"
                    style="flex:1; padding:4px 8px; background:#05080f; border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:var(--tx); font-family:monospace; font-size:9px;" />
                  <button class="btn gold" style="padding:4px 10px; font-size:8px; font-weight:900; white-space:nowrap;" data-act="withdraw-flb-to-bonds">
                    WITHDRAW
                  </button>
                  <button class="btn alt" style="padding:4px 8px; font-size:8px; font-weight:800; white-space:nowrap; color:var(--tx);" data-act="withdraw-flb-to-bonds" data-qty="${cryptoFlbQty}">
                    ALL
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Staking Tiers & Control Strip -->
            <div style="background:#05080f; border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:4px;">
                  <span style="font-size:11px;">🏛️</span>
                  <span style="font-size:9px; font-weight:900; color:var(--gold); text-transform:uppercase;">Corporate Treasury Staking</span>
                </div>
                <span style="font-size:8px; font-weight:900; color:var(--grn); background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); padding:1px 5px; border-radius:3px;">
                  ${miningStats.stakingApyPct}% APY (~+$${Math.round(miningStats.dailyStakingYieldUsd).toLocaleString()}/day)
                </span>
              </div>

              <!-- Staking Tiers Flex Strip -->
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px; margin-bottom:8px;">
                <div style="background:${miningStats.stakedBonds >= 5 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 5 ? 'var(--grn)' : 'rgba(255,255,255,0.06)'}; border-radius:4px; padding:4px; text-align:center;">
                  <div style="font-size:6px; color:var(--mu);">T1 (5+ FLB)</div>
                  <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 5 ? 'var(--grn)' : 'var(--tx)'};">-10% Fuel</div>
                </div>
                <div style="background:${miningStats.stakedBonds >= 15 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 15 ? 'var(--grn)' : 'rgba(255,255,255,0.06)'}; border-radius:4px; padding:4px; text-align:center;">
                  <div style="font-size:6px; color:var(--mu);">T2 (15+ FLB)</div>
                  <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 15 ? 'var(--grn)' : 'var(--tx)'};">+15% Freight</div>
                </div>
                <div style="background:${miningStats.stakedBonds >= 35 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 35 ? 'var(--grn)' : 'rgba(255,255,255,0.06)'}; border-radius:4px; padding:4px; text-align:center;">
                  <div style="font-size:6px; color:var(--mu);">T3 (35+ FLB)</div>
                  <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 35 ? 'var(--grn)' : 'var(--tx)'};">-50% Labor</div>
                </div>
                <div style="background:${miningStats.stakedBonds >= 75 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${miningStats.stakedBonds >= 75 ? 'var(--grn)' : 'rgba(255,255,255,0.06)'}; border-radius:4px; padding:4px; text-align:center;">
                  <div style="font-size:6px; color:var(--mu);">T4 (75+ FLB)</div>
                  <div style="font-size:8px; font-weight:900; color:${miningStats.stakedBonds >= 75 ? 'var(--grn)' : 'var(--tx)'};">-80% Power</div>
                </div>
              </div>

              <!-- Staking Action Controls -->
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px;">
                <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:900;" data-act="stake-flb" data-qty="1" ${userCoins >= 1 ? '' : 'disabled'}>STAKE 1</button>
                <button class="btn gold" style="padding:5px 2px; font-size:8px; font-weight:900;" data-act="stake-flb" data-qty="5" ${userCoins >= 5 ? '' : 'disabled'}>STAKE 5</button>
                <button class="btn alt" style="padding:5px 2px; font-size:8px; font-weight:900; color:var(--tx);" data-act="unstake-flb" data-qty="1" ${miningStats.stakedBonds >= 1 ? '' : 'disabled'}>UNSTAKE 1</button>
                <button class="btn alt" style="padding:5px 2px; font-size:8px; font-weight:900; color:var(--tx);" data-act="unstake-flb" data-qty="${miningStats.stakedBonds}" ${miningStats.stakedBonds > 0 ? '' : 'disabled'}>UNSTAKE ALL</button>
              </div>
            </div>

          </div>

          <!-- 2. Institutional Crypto Terminal -->
          <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
            
            <!-- Coin Selector Horizontal Scroll Bar -->
            <div style="display:flex; gap:4px; overflow-x:auto; padding:6px; background:#05080f; border-bottom:1px solid rgba(255,255,255,0.06);">
              ${CRYPTO_ASSETS.map(asset => {
                const isSel = asset.id === selectedAssetId;
                return `
                  <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:5px 10px; border-radius:6px; white-space:nowrap; font-size:9px; font-weight:800;" data-act="select-crypto-asset" data-id="${asset.id}">
                    ${asset.icon} ${asset.symbol}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Price & Interactive Chart Area -->
            <div style="padding:12px; background:#090d16; border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                <div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:16px; color:${assetData.color};">${assetData.icon}</span>
                    <span style="font-size:15px; font-weight:900; color:var(--tx);">${assetData.name}</span>
                    <span style="font-size:10px; color:var(--mu); font-family:monospace;">${assetData.symbol}/USD</span>
                  </div>
                  <div style="font-size:18px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;">
                    $${assetData.price.toLocaleString(undefined, { minimumFractionDigits: assetData.price < 10 ? 2 : 0, maximumFractionDigits: 4 })}
                  </div>
                </div>
                
                <div style="text-align:right;">
                  <div style="font-size:10px; font-weight:900; color:${chartColor}; font-family:monospace;">
                    ${isUp ? '▲' : '▼'} ${Math.abs(assetData.change24h).toFixed(2)}%
                  </div>
                  <div style="font-size:8px; color:var(--mu); margin-top:2px; font-family:monospace;">
                    24h H: $${assetData.high24h.toLocaleString(undefined, { maximumFractionDigits: 2 })} · 24h L: $${assetData.low24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <!-- SVG Interactive Line Chart -->
              <div style="width:100%; height:90px; position:relative; background:#05080f; border:1px solid rgba(255,255,255,0.05); border-radius:6px; overflow:hidden; margin-bottom:8px;">
                <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad-${selectedAssetId}" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="${chartColor}" stop-opacity="0.35" />
                      <stop offset="100%" stop-color="${chartColor}" stop-opacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="${svgHeight * 0.25}" x2="${svgWidth}" y2="${svgHeight * 0.25}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2,2" stroke-width="1" />
                  <line x1="0" y1="${svgHeight * 0.5}" x2="${svgWidth}" y2="${svgHeight * 0.5}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2,2" stroke-width="1" />
                  <line x1="0" y1="${svgHeight * 0.75}" x2="${svgWidth}" y2="${svgHeight * 0.75}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2,2" stroke-width="1" />
                  
                  <polygon points="${areaPointsString}" fill="url(#chartGrad-${selectedAssetId})" />
                  <polyline fill="none" stroke="${chartColor}" stroke-width="2" points="${pointsString}" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              ${renderCandlestickChart(assetData)}
            </div>

            <!-- Dual Side-by-Side Buy / Sell Order Desk -->
            <div style="padding:12px; background:#060911;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:9px;">
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

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px;">
                
                <!-- BUY PANEL -->
                <div style="background:#090d16; border:1px solid rgba(34,197,94,0.25); border-radius:8px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:9px; font-weight:900; color:var(--grn); text-transform:uppercase;">BUY ${assetData.symbol}</span>
                    <span style="font-size:8px; color:var(--mu); font-family:monospace;">Ask: $${assetData.buyPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </div>

                  <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <div style="position:relative; flex:1; min-width:0;">
                      <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); font-size:10px; color:var(--mu); font-family:monospace;">$</span>
                      <input type="number" id="crypto-buy-amount-input" placeholder="USD Amount" min="1" step="any"
                        style="width:100%; box-sizing:border-box; padding:5px 6px 5px 18px; background:#05080f; border:1px solid rgba(255,255,255,0.08); border-radius:5px; color:var(--tx); font-family:monospace; font-size:10px; font-weight:700;" />
                    </div>
                    <button class="btn gold" style="padding:5px 10px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="crypto-buy-usd" data-id="${assetData.id}">
                      BUY
                    </button>
                  </div>

                  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px;">
                    <button class="btn gold" style="padding:4px 2px; font-size:7px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="1000">+$1k</button>
                    <button class="btn gold" style="padding:4px 2px; font-size:7px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="5000">+$5k</button>
                    <button class="btn gold" style="padding:4px 2px; font-size:7px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="25000">+$25k</button>
                    <button class="btn gold" style="padding:4px 2px; font-size:7px; font-weight:800;" data-act="crypto-buy-usd" data-id="${assetData.id}" data-amount="${Math.floor(S.money)}">MAX</button>
                  </div>
                </div>

                <!-- SELL PANEL -->
                <div style="background:#090d16; border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:9px; font-weight:900; color:#ef4444; text-transform:uppercase;">SELL ${assetData.symbol}</span>
                    <span style="font-size:8px; color:var(--mu); font-family:monospace;">Bid: $${assetData.sellPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </div>

                  <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <div style="position:relative; flex:1; min-width:0;">
                      <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); font-size:10px; color:var(--mu); font-family:monospace;">$</span>
                      <input type="number" id="crypto-sell-amount-input" placeholder="USD Value" min="1" step="any"
                        style="width:100%; box-sizing:border-box; padding:5px 6px 5px 18px; background:#05080f; border:1px solid rgba(255,255,255,0.08); border-radius:5px; color:var(--tx); font-family:monospace; font-size:10px; font-weight:700;" />
                    </div>
                    <button class="btn alt" style="padding:5px 10px; font-size:9px; font-weight:900; color:#ef4444; border-color:#ef4444; white-space:nowrap;" data-act="crypto-sell-custom" data-id="${assetData.id}">
                      SELL
                    </button>
                  </div>

                  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4px;">
                    <button class="btn alt" style="padding:4px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="25">25%</button>
                    <button class="btn alt" style="padding:4px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="50">50%</button>
                    <button class="btn alt" style="padding:4px 2px; font-size:7px; font-weight:800; color:var(--tx);" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="75">75%</button>
                    <button class="btn alt" style="padding:4px 2px; font-size:7px; font-weight:800; color:#ef4444; border-color:#ef4444;" data-act="crypto-sell-pct" data-id="${assetData.id}" data-pct="100">ALL</button>
                  </div>
                </div>

              </div>

              ${assetData.id === 'flb' && cryptoFlbQty > 0 ? `
                <div style="background:#080c16; border:1px solid var(--gold); border-radius:6px; padding:8px; margin-top:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:8px; font-weight:900; color:var(--gold); text-transform:uppercase;">WITHDRAW FLB TO COMPANY BOND BALANCE</span>
                    <span style="font-size:8px; color:var(--grn); font-family:monospace;">${formatCryptoQty(cryptoFlbQty)} FLB in Wallet</span>
                  </div>
                  <div style="display:flex; gap:4px;">
                    <input type="number" id="flb-withdraw-input-term" placeholder="Qty" min="0.0001" step="any"
                      style="flex:1; padding:4px 8px; background:#05080f; border:1px solid rgba(255,255,255,0.08); border-radius:4px; color:var(--tx); font-family:monospace; font-size:9px;" />
                    <button class="btn gold" style="padding:4px 10px; font-size:8px; font-weight:900; white-space:nowrap;" data-act="withdraw-flb-to-bonds">
                      WITHDRAW
                    </button>
                    <button class="btn alt" style="padding:4px 8px; font-size:8px; font-weight:800; white-space:nowrap; color:var(--tx);" data-act="withdraw-flb-to-bonds" data-qty="${cryptoFlbQty}">
                      ALL
                    </button>
                  </div>
                </div>
              ` : ''}

            </div>

          </div>

        </div>
      ` : activeSubTab === 'orderbook' ? `
        <!-- ==================== SUB-TAB 2: ORDERBOOK DEPTH, LIMIT DESK & CREDIT ==================== -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px;">
            ${renderOrderBookDepth(selectedAssetId)}
            ${renderLimitOrderDesk(S, selectedAssetId)}
          </div>

          <div>
            ${renderCollateralLoanDesk(S, selectedAssetId)}
          </div>

        </div>
      ` : `
        <!-- ==================== SUB-TAB 3: ENTERPRISE MINING & DATACENTER ==================== -->
        <div style="display:flex; flex-direction:column; gap:12px;">

          <!-- Telemetry Banner & Substation Power Box -->
          <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
            
            <div style="padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.06); background:linear-gradient(90deg, #0d1527 0%, #090d16 100%); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:9px; color:${miningStats.activeSubsCount > 0 ? 'var(--grn)' : 'var(--mu)'}; font-weight:900;">
                  ${miningStats.activeSubsCount > 0 ? '🟢 LIVE OPERATIONAL' : '⚪ FARM IDLE'}
                </span>
                <div style="font-size:14px; font-weight:900; color:var(--tx); margin-top:1px; font-family:monospace;">
                  MINING TELEMETRY TERMINAL
                </div>
              </div>
              <button class="btn gold" style="padding:5px 12px; font-size:9px; font-weight:900;" data-act="claim-mining-rewards">
                Claim
              </button>
            </div>

            <!-- Pending Mined Yields Strip -->
            <div style="padding:8px 12px; background:#05080f; border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:8px; color:var(--gold); font-weight:800; text-transform:uppercase;">Unclaimed Mined Yields</span>
                <span style="font-size:8px; color:var(--grn); font-family:monospace; font-weight:800;" data-mining-pending-usd>~$${Math.round(totalPendingUsd).toLocaleString()} USD</span>
              </div>

              <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;">
                ${Object.entries(pendingYield).filter(([_, qty]) => (qty as number) > 0).length === 0 ? `
                  <div style="font-size:8px; color:var(--mu);">No pending yield accrued yet. Deploy a hosting contract below.</div>
                ` : Object.entries(pendingYield).map(([coinId, qty]) => {
                  const q = qty as number;
                  if (q <= 0) return '';
                  const coin = CRYPTO_ASSETS.find(c => c.id === coinId)!;
                  const valUsd = q * (getCryptoMarketData(coinId)?.sellPrice || (coinId === 'flb' ? 5000 : 0));

                  return `
                    <div style="background:#090d16; border:1px solid ${coin.color}30; border-radius:5px; padding:4px 8px; min-width:95px; flex:0 0 auto;">
                      <div style="display:flex; align-items:center; gap:3px; font-size:9px; font-weight:900; color:${coin.color};">
                        <span>${coin.icon}</span> ${coin.symbol}
                      </div>
                      <div style="font-size:10px; font-weight:900; color:var(--tx); font-family:monospace;" data-mining-yield-coin="${coinId}">
                        ${formatCryptoQty(q)}
                      </div>
                      <div style="font-size:7px; color:var(--grn); font-family:monospace;">
                        ~$${valUsd < 0.01 ? valUsd.toFixed(4) : valUsd.toFixed(2)} USD
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Substation Power & Tuning Controls -->
            <div style="padding:10px 12px; display:flex; flex-direction:column; gap:8px;">
              
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:6px;">
                <div style="background:#05080f; padding:8px 10px; border-radius:6px; border:1px solid ${miningStats.isOverloaded ? '#ef4444' : 'rgba(255,255,255,0.06)'};">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:7px; color:var(--mu); text-transform:uppercase;">SUBSTATION (LVL ${miningStats.substationLevel})</span>
                    <span style="font-size:7px; font-weight:900; color:${miningStats.isOverloaded ? '#ef4444' : 'var(--grn)'};" data-mining-status>${miningStats.transformerStatus}</span>
                  </div>
                  <div style="font-size:12px; font-weight:900; color:var(--tx); font-family:monospace; margin-top:2px;" data-mining-power-kw>
                    ${miningStats.usedPowerKw.toFixed(1)} kW / ${miningStats.currentPowerKw} kW
                  </div>
                  <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; margin-top:4px;">
                    <div data-mining-power-bar style="width:${miningStats.powerUsagePct}%; height:100%; background:${miningStats.isOverloaded ? '#ef4444' : miningStats.powerUsagePct > 85 ? '#f59e0b' : 'var(--gold)'}; transition:width 0.4s ease;"></div>
                  </div>
                </div>

                <div style="background:#05080f; padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                  <div style="font-size:7px; color:var(--mu); text-transform:uppercase;">NET DAILY PROFIT</div>
                  <div style="font-size:12px; font-weight:900; color:${miningStats.netDailyProfitUsd >= 0 ? 'var(--grn)' : '#ef4444'}; font-family:monospace; margin-top:2px;">
                    ${miningStats.netDailyProfitUsd >= 0 ? '+' : ''}$${Math.round(miningStats.netDailyProfitUsd).toLocaleString()}/day
                  </div>
                  <div style="font-size:7px; color:var(--mu); margin-top:2px;">
                    Yield Boost: <b style="color:var(--gold);">${Math.round(miningStats.yieldMultiplier * 100)}%</b> | Power: <b style="color:var(--grn);">${Math.round(miningStats.powerCostMultiplier * 100)}%</b>
                  </div>
                </div>
              </div>

              ${miningStats.isOverloaded ? `
                <div style="background:rgba(239,68,68,0.12); border:1px solid #ef4444; border-radius:5px; padding:6px 10px; font-size:8px; color:#fca5a5; display:flex; align-items:center; gap:6px;">
                  <span style="font-size:12px;">⚠️</span>
                  <div>
                    <b>SUBSTATION OVERLOAD:</b> Rigs (${miningStats.usedPowerKw.toFixed(1)} kW) exceed transformer limit (${miningStats.currentPowerKw} kW). Breaker triggered <b>50% thermal throttling</b>.
                  </div>
                </div>
              ` : ''}

              <!-- Tuning Profile Bar -->
              <div style="background:#05080f; border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span style="font-size:8px; font-weight:800; color:var(--tx); text-transform:uppercase;">
                  TUNING: <span style="color:var(--grn); font-family:monospace;">${miningStats.pue} PUE</span>
                </span>
                <div style="display:flex; gap:4px;">
                  <button class="btn ${miningStats.tuning === 'eco' ? 'gold' : 'alt'}" style="padding:3px 6px; font-size:7px; font-weight:800;" data-act="set-mining-tuning" data-profile="eco">🌱 ECO</button>
                  <button class="btn ${miningStats.tuning === 'balanced' ? 'gold' : 'alt'}" style="padding:3px 6px; font-size:7px; font-weight:800;" data-act="set-mining-tuning" data-profile="balanced">⚖️ NOMINAL</button>
                  <button class="btn ${miningStats.tuning === 'overclock' ? 'danger' : 'alt'}" style="padding:3px 6px; font-size:7px; font-weight:800;" data-act="set-mining-tuning" data-profile="overclock">⚡ OVERCLOCK</button>
                </div>
              </div>

              <button class="btn alt" style="width:100%; padding:6px; font-size:8px; font-weight:800; color:var(--gold); border-color:rgba(193,154,91,0.3);" data-act="upgrade-substation">
                UPGRADE TRANSFORMER (+350 kW) — ${nextSubstationCost.bondsCost > 0 ? `$${nextSubstationCost.cashCost.toLocaleString()} + ${nextSubstationCost.bondsCost} FLB` : `$${nextSubstationCost.cashCost.toLocaleString()}`}
              </button>

            </div>

          </div>

          <!-- Datacenter Aesthetic Bay -->
          ${renderNextGenAestheticBay(S)}

          <!-- System Additions & Hardware Boosters Horizontal Scroll Carousel -->
          <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
            <div style="padding:8px 12px; background:#0d1527; border-bottom:1px solid rgba(255,255,255,0.06); font-size:9px; font-weight:900; color:var(--gold); text-transform:uppercase;">
              System Additions & Hardware Boosters
            </div>

            <div style="display:flex; gap:8px; overflow-x:auto; padding:10px; background:#060911; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
              ${MINING_ADDITIONS.map(add => {
                const isInstalled = !!userUpgrades[add.id];
                const canAffordCash = S.money >= add.cashCost;
                const canAffordBonds = userCoins >= add.bondsCost;
                const hasVip = playerVip >= add.requiredVipLevel;
                const canInstall = !isInstalled && canAffordCash && canAffordBonds && hasVip;

                return `
                  <div style="flex:0 0 200px; min-width:200px; scroll-snap-align:start; background:#0b0f19; border:1px solid ${isInstalled ? 'var(--grn)' : 'rgba(255,255,255,0.08)'}; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:15px;">${add.icon}</span>
                        ${isInstalled ? `
                          <span style="font-size:7px; color:var(--grn); background:rgba(34,197,94,0.12); padding:1px 4px; border-radius:3px; font-weight:900;">INSTALLED</span>
                        ` : `
                          <span style="font-size:7px; color:${hasVip ? 'var(--gold)' : '#ef4444'}; font-family:monospace;">VIP ${add.requiredVipLevel}+</span>
                        `}
                      </div>
                      <div style="font-size:10px; font-weight:900; color:var(--tx); margin-top:4px;">${add.name}</div>
                      <div style="font-size:8px; color:var(--mu); margin-top:2px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${add.description}</div>
                    </div>

                    ${!isInstalled ? `
                      <button class="btn ${canInstall ? 'gold' : 'alt'}" style="padding:5px; font-size:8px; font-weight:900; margin-top:8px; opacity:${canInstall ? 1 : 0.6};" data-act="buy-mining-addition" data-id="${add.id}">
                        INSTALL (${add.bondsCost > 0 ? `$${add.cashCost.toLocaleString()} + ${add.bondsCost} FLB` : `$${add.cashCost.toLocaleString()}`})
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Next-Gen Mining Hardware Shop Component -->
          ${renderNextGenHardwareShop(S)}

          <!-- Configure Hosting Contract -->
          <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px;">
            <div style="font-size:9px; font-weight:900; color:var(--gold); text-transform:uppercase; margin-bottom:8px;">
              Deploy Hosting Contract
            </div>
            
            <!-- Step 1 & 2 side-by-side -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:10px;">
              <div>
                <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:4px;">1. Target Asset</div>
                <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:4px;">
                  ${minableAssets.map(coin => {
                    const isSel = coin.id === miningTargetCoin;
                    return `
                      <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:4px 8px; font-size:9px; font-weight:800; white-space:nowrap;" data-act="select-mining-coin" data-id="${coin.id}">
                        ${coin.icon} ${coin.symbol}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <div>
                <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:4px;">2. Duration</div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">
                  ${MINING_DURATIONS.map(dur => {
                    const isSel = dur.days === miningSelectedDuration;
                    return `
                      <button class="btn ${isSel ? 'gold' : 'alt'}" style="padding:5px 2px; font-size:8px; font-weight:900;" data-act="select-mining-duration" data-days="${dur.days}">
                        ${dur.label}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- Step 3: Select Hardware Tier Rigs -->
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:6px;">3. Select Hardware Rig Tier</div>

            <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
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
                  <div style="flex:0 0 220px; min-width:220px; scroll-snap-align:start; background:#05080f; border:1px solid ${rig.category === 'NextGen' ? 'rgba(56,189,248,0.4)' : hasVip ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)'}; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:10px; font-weight:900; color:${hasVip ? 'var(--tx)' : '#999'};">${rig.name}</span>
                        <span style="font-size:8px; color:var(--gold); font-family:monospace;">${rig.hashrate}</span>
                      </div>
                      <div style="font-size:7px; color:var(--mu); margin-top:2px;">
                        Power: ${rig.powerKw} kW ($${rig.dailyPowerCost}/d) · VIP ${rig.requiredVipLevel}+
                      </div>
                      <div style="font-size:9px; font-weight:900; color:var(--grn); font-family:monospace; margin-top:4px;">
                        ~${formatCryptoQty(dailyCoinYield)} ${targetSymbol}/d
                      </div>
                    </div>

                    <button class="btn ${isEligible ? 'gold' : 'alt'}" style="width:100%; padding:5px; font-size:8px; font-weight:900; opacity:${isEligible ? 1 : 0.6}; margin-top:6px;" data-act="subscribe-mining-contract" data-type-id="${rig.id}" data-coin="${miningTargetCoin}" data-duration="${miningSelectedDuration}">
                      SUBSCRIBE ${miningSelectedDuration}D (${costs.bondsCost > 0 ? `$${costs.cashCost.toLocaleString()} + ${costs.bondsCost} FLB` : `$${costs.cashCost.toLocaleString()}`})
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Active Multi-Coin Subscriptions Roster -->
          <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px;">
            <div style="font-size:8px; color:var(--mu); font-weight:800; text-transform:uppercase; margin-bottom:8px;">
              Active Hosting Contracts (${activeSubscriptions.length})
            </div>

            ${activeSubscriptions.length === 0 ? `
              <div style="font-size:8px; color:var(--mu); text-align:center; padding:12px; background:#05080f; border:1px dashed rgba(255,255,255,0.06); border-radius:6px;">
                No active contracts running. Deploy a contract above to start earning yield.
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:6px;">
                ${activeSubscriptions.map(sub => {
                  const def = MINING_RIG_TYPES.find(t => t.id === sub.typeId) || MINING_RIG_TYPES[0];
                  const coin = CRYPTO_ASSETS.find(c => c.id === sub.targetAssetId) || CRYPTO_ASSETS[0];
                  const msRemaining = Math.max(0, sub.expiresAt - Date.now());
                  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
                  const daysRemaining = (hoursRemaining / 24).toFixed(1);

                  const dailyCoinYield = calculateRigDailyCoinYield(sub.typeId, sub.targetAssetId, S);

                  return `
                    <div style="background:#05080f; border:1px solid rgba(193,154,91,0.3); border-radius:6px; padding:8px; display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:14px; color:${coin.color};">${coin.icon}</span>
                        <div>
                          <div style="font-size:10px; font-weight:900; color:var(--tx);">${def.name}</div>
                          <div style="font-size:7px; color:var(--mu); font-family:monospace;">
                            ${coin.symbol} · ${def.hashrate}
                          </div>
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:8px; color:var(--grn); font-weight:900; font-family:monospace;">
                          +${formatCryptoQty(dailyCoinYield)} ${coin.symbol}/d
                        </div>
                        <div style="font-size:7px; color:var(--gold); font-family:monospace;">
                          ⏳ ${daysRemaining}d left
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

        </div>
      `}

    </div>
  `;
}
