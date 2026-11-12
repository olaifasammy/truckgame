import { fmt, action, toast } from '../../../core/ui';
import { refresh, set } from '../../../core/store';
import { CRYPTO_ASSETS, getCryptoMarketData, getOrderBookDepth, Timeframe, CryptoLimitOrder } from '../../../domain/finance/markets/crypto';
import { getTechnicalIndicators } from '../../../domain/finance/markets/crypto-indicators';
import { formatCryptoQty } from '../../../domain/finance/markets/mining';
import { borrowCryptoCollateral, repayCryptoCollateral, MAX_COLLATERAL_LTV } from '../../../domain/finance/markets/loans';

let activeOrderType: 'buy' | 'sell' = 'buy';
let selectedTimeframe: Timeframe = '15m';

action('set-chart-timeframe', d => {
  selectedTimeframe = (d as any).tf as Timeframe;
  refresh();
});

action('set-limit-order-type', d => {
  activeOrderType = (d as any).type as ('buy' | 'sell');
  refresh();
});

action('place-limit-order', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;

  const assetId = (d as any).id;
  const targetPriceInput = document.getElementById('limit-target-price-input') as HTMLInputElement | null;
  const usdInput = document.getElementById('limit-usd-amount-input') as HTMLInputElement | null;

  const targetPrice = targetPriceInput ? parseFloat(targetPriceInput.value) : 0;
  const usdAmount = usdInput ? parseFloat(usdInput.value) : 0;

  if (isNaN(targetPrice) || targetPrice <= 0) {
    return toast('Enter a valid target limit price', 'err');
  }
  if (isNaN(usdAmount) || usdAmount <= 0) {
    return toast('Enter a valid order USD value', 'err');
  }

  const tokenQty = usdAmount / targetPrice;

  if (activeOrderType === 'buy') {
    if (S.money < usdAmount) {
      return toast(`Insufficient cash balance for $${Math.round(usdAmount).toLocaleString()} limit buy`, 'err');
    }
    // Lock USD in order
    S.money -= usdAmount;
  } else {
    // Sell limit order: check token balance
    const available = assetId === 'flb' ? (S.coins || 0) : ((S.cryptoHoldings && S.cryptoHoldings[assetId]) || 0);
    if (available < tokenQty) {
      return toast(`Insufficient ${assetId.toUpperCase()} balance (requires ${tokenQty.toFixed(4)})`, 'err');
    }
    if (assetId === 'flb') {
      S.coins -= tokenQty;
    } else {
      S.cryptoHoldings[assetId] -= tokenQty;
    }
  }

  const order: CryptoLimitOrder = {
    id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    assetId,
    type: activeOrderType,
    targetPrice,
    usdAmount,
    tokenQty,
    createdAt: Date.now()
  };

  if (!S.cryptoLimitOrders) S.cryptoLimitOrders = [];
  S.cryptoLimitOrders.push(order);

  toast(`Limit ${activeOrderType.toUpperCase()} Order #${order.id} Placed!`, 'success');
  refresh();
});

action('cancel-limit-order', d => {
  const S = (window as any).__getStore?.();
  if (!S || !S.cryptoLimitOrders) return;

  const orderId = (d as any).id;
  const idx = S.cryptoLimitOrders.findIndex((o: any) => o.id === orderId);
  if (idx === -1) return;

  const order: CryptoLimitOrder = S.cryptoLimitOrders[idx];

  // Refund locked capital
  if (order.type === 'buy') {
    S.money += order.usdAmount;
  } else {
    if (order.assetId === 'flb') {
      S.coins = (S.coins || 0) + order.tokenQty;
    } else {
      if (!S.cryptoHoldings) S.cryptoHoldings = {};
      S.cryptoHoldings[order.assetId] = (S.cryptoHoldings[order.assetId] || 0) + order.tokenQty;
    }
  }

  S.cryptoLimitOrders.splice(idx, 1);
  toast(`Order #${order.id} cancelled. Funds returned.`, 'info');
  refresh();
});

action('borrow-collateral-loan', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;

  const assetId = (d as any).id;
  const input = document.getElementById('collateral-pledge-qty-input') as HTMLInputElement | null;
  const qty = input ? parseFloat(input.value) : 0;

  if (isNaN(qty) || qty <= 0) {
    return toast('Enter a valid collateral token quantity', 'err');
  }

  if (borrowCryptoCollateral(S, assetId, qty)) {
    refresh();
  }
});

action('repay-collateral-loan', d => {
  const S = (window as any).__getStore?.();
  if (!S) return;
  const loanId = (d as any).id;
  if (repayCryptoCollateral(S, loanId)) {
    refresh();
  }
});

export function renderCandlestickChart(assetData: any): string {
  const candles = assetData.candles || [];
  if (candles.length === 0) return '';

  const svgWidth = 330;
  const svgHeight = 130;
  const paddingX = 14;
  const paddingY = 12;

  const highPrices = candles.map((c: any) => c.high);
  const lowPrices = candles.map((c: any) => c.low);
  const maxPrice = Math.max(...highPrices);
  const minPrice = Math.min(...lowPrices);
  const range = maxPrice - minPrice || 1;

  const candleWidth = Math.max(4, Math.floor((svgWidth - paddingX * 2) / candles.length) - 2);

  // Compute Technical Indicators from active candle series
  const indicators = getTechnicalIndicators(candles);

  const rsiVal = indicators.rsi;
  const rsiColor = rsiVal <= 30 ? 'var(--grn)' : rsiVal >= 70 ? '#ef4444' : 'var(--gold)';
  const rsiLabel = rsiVal <= 30 ? 'OVERSOLD (BUY SIGNAL)' : rsiVal >= 70 ? 'OVERBOUGHT (SELL SIGNAL)' : 'NEUTRAL';

  const trendBadgeColor = indicators.trend === 'strong_bullish' || indicators.trend === 'bullish' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const trendTextColor = indicators.trend === 'strong_bullish' || indicators.trend === 'bullish' ? 'var(--grn)' : '#ef4444';
  const trendText = indicators.trend.toUpperCase().replace('_', ' ');

  return `
    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; margin-top:8px;">
      <!-- Timeframe selector & price metrics -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-size:9px; color:var(--mu); font-weight:800; text-transform:uppercase;">OHLC INTERVAL:</span>
          <div style="display:flex; gap:4px;">
            ${(['15m', '1h', '4h', '1d'] as Timeframe[]).map(tf => `
              <button class="btn ${selectedTimeframe === tf ? 'gold' : 'alt'}" style="padding:2px 7px; font-size:8px; font-weight:800;" data-act="set-chart-timeframe" data-tf="${tf}">
                ${tf.toUpperCase()}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="font-size:8px; color:var(--mu); font-family:monospace;">
          High: <b style="color:var(--grn);">$${maxPrice.toFixed(2)}</b> · Low: <b style="color:#ef4444;">$${minPrice.toFixed(2)}</b>
        </div>
      </div>

      <!-- Technical Indicator Signals Ribbon -->
      <div style="background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:6px 10px; margin-bottom:8px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        <!-- RSI Meter -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; font-weight:800;">
            <span style="color:var(--mu);">RSI (14)</span>
            <span style="color:${rsiColor}; font-family:monospace;">${rsiVal.toFixed(1)}</span>
          </div>
          <div style="width:100%; height:4px; background:#1e293b; border-radius:2px; margin-top:3px; overflow:hidden; position:relative;">
            <div style="width:${Math.min(100, Math.max(0, rsiVal))}%; height:100%; background:${rsiColor}; border-radius:2px;"></div>
          </div>
          <div style="font-size:7px; color:${rsiColor}; font-weight:800; margin-top:2px;">${rsiLabel}</div>
        </div>

        <!-- MACD & Trend Signal -->
        <div>
          <div style="font-size:8px; color:var(--mu); font-weight:800;">MACD / TREND</div>
          <div style="display:inline-block; background:${trendBadgeColor}; color:${trendTextColor}; border:1px solid ${trendTextColor}44; font-size:8px; font-weight:900; padding:1px 6px; border-radius:3px; margin-top:3px;">
            ${trendText}
          </div>
          <div style="font-size:7px; color:var(--mu); font-family:monospace; margin-top:2px;">
            Hist: <b style="color:${indicators.macd.histogram >= 0 ? 'var(--grn)' : '#ef4444'};">${indicators.macd.histogram >= 0 ? '+' : ''}${indicators.macd.histogram.toFixed(2)}</b>
          </div>
        </div>

        <!-- EMA / Bollinger Volatility -->
        <div>
          <div style="font-size:8px; color:var(--mu); font-weight:800;">VOLATILITY & EMA</div>
          <div style="font-size:8px; font-family:monospace; color:var(--tx); margin-top:2px;">
            EMA9: <b style="color:var(--gold);">$${indicators.ema9.toFixed(2)}</b>
          </div>
          <div style="font-size:7px; color:var(--mu); font-family:monospace; margin-top:2px;">
            BB Bandwidth: <b style="color:var(--tx);">${indicators.bollinger.bandwidth.toFixed(2)}%</b>
          </div>
        </div>
      </div>

      <!-- Candlestick SVG Container -->
      <div style="width:100%; overflow:hidden;">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%; height:130px; display:block;">
          <!-- Grid lines -->
          <line x1="${paddingX}" y1="${paddingY}" x2="${svgWidth - paddingX}" y2="${paddingY}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3,3" />
          <line x1="${paddingX}" y1="${svgHeight / 2}" x2="${svgWidth - paddingX}" y2="${svgHeight / 2}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3,3" />
          <line x1="${paddingX}" y1="${svgHeight - paddingY}" x2="${svgWidth - paddingX}" y2="${svgHeight - paddingY}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3,3" />

          ${candles.map((c: any, i: number) => {
            const x = paddingX + i * ((svgWidth - paddingX * 2) / candles.length) + (candleWidth / 2);
            const isGreen = c.close >= c.open;
            const color = isGreen ? '#22c55e' : '#ef4444';

            const yHigh = paddingY + (1 - (c.high - minPrice) / range) * (svgHeight - paddingY * 2);
            const yLow = paddingY + (1 - (c.low - minPrice) / range) * (svgHeight - paddingY * 2);
            const yOpen = paddingY + (1 - (c.open - minPrice) / range) * (svgHeight - paddingY * 2);
            const yClose = paddingY + (1 - (c.close - minPrice) / range) * (svgHeight - paddingY * 2);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

            return `
              <g>
                <!-- Wick -->
                <line x1="${x}" y1="${yHigh.toFixed(1)}" x2="${x}" y2="${yLow.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.8" />
                <!-- Body -->
                <rect x="${(x - candleWidth / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${candleWidth}" height="${bodyHeight.toFixed(1)}" fill="${color}" rx="1" />
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    </div>
  `;
}

export function renderOrderBookDepth(assetId: string): string {
  const { bids, asks } = getOrderBookDepth(assetId);
  const mkt = getCryptoMarketData(assetId);
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total)) || 1;

  return `
    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:8px; padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:9px; font-weight:800; color:var(--tx); text-transform:uppercase;">LIVE ORDERBOOK DEPTH</span>
        <span style="font-size:8px; color:var(--mu); font-family:monospace;">Spread: 0.5% ($${(mkt.buyPrice - mkt.sellPrice).toFixed(2)})</span>
      </div>

      <!-- Depth Table Headers -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; font-size:8px; color:var(--mu); font-family:monospace; margin-bottom:4px; text-transform:uppercase;">
        <div>Price ($)</div>
        <div style="text-align:right;">Size (${mkt.symbol})</div>
        <div style="text-align:right;">Total ($)</div>
      </div>

      <!-- Asks (Red) -->
      <div style="display:flex; flex-direction:column; gap:2px; margin-bottom:6px;">
        ${asks.slice(0, 4).reverse().map(ask => {
          const depthPct = Math.min(100, (ask.total / maxTotal) * 100);
          return `
            <div style="position:relative; display:grid; grid-template-columns:1fr 1fr 1fr; font-size:9px; font-family:monospace; padding:1px 0;">
              <div style="position:absolute; right:0; top:0; bottom:0; width:${depthPct}%; background:rgba(239,68,68,0.12); z-index:0; border-radius:2px;"></div>
              <div style="color:#ef4444; z-index:1; font-weight:700;">$${ask.price.toFixed(2)}</div>
              <div style="text-align:right; color:var(--tx); z-index:1;">${ask.size.toFixed(3)}</div>
              <div style="text-align:right; color:var(--mu); z-index:1;">$${Math.round(ask.total).toLocaleString()}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Mid Market Price Banner -->
      <div style="background:#111827; border:1px solid #1f293d; border-radius:4px; padding:4px 8px; margin:4px 0; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:8px; color:var(--mu); text-transform:uppercase;">MARKET MIDPOINT:</span>
        <span style="font-size:11px; font-weight:900; color:var(--gold); font-family:monospace;">$${mkt.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>

      <!-- Bids (Green) -->
      <div style="display:flex; flex-direction:column; gap:2px; margin-top:6px;">
        ${bids.slice(0, 4).map(bid => {
          const depthPct = Math.min(100, (bid.total / maxTotal) * 100);
          return `
            <div style="position:relative; display:grid; grid-template-columns:1fr 1fr 1fr; font-size:9px; font-family:monospace; padding:1px 0;">
              <div style="position:absolute; right:0; top:0; bottom:0; width:${depthPct}%; background:rgba(34,197,94,0.12); z-index:0; border-radius:2px;"></div>
              <div style="color:var(--grn); z-index:1; font-weight:700;">$${bid.price.toFixed(2)}</div>
              <div style="text-align:right; color:var(--tx); z-index:1;">${bid.size.toFixed(3)}</div>
              <div style="text-align:right; color:var(--mu); z-index:1;">$${Math.round(bid.total).toLocaleString()}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderLimitOrderDesk(S: any, assetId: string): string {
  const mkt = getCryptoMarketData(assetId);
  const activeOrders: CryptoLimitOrder[] = S.cryptoLimitOrders || [];

  return `
    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:8px; padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-size:10px; font-weight:900; color:var(--tx); text-transform:uppercase;">AUTOMATED LIMIT ORDER DESK</span>
        <div style="display:flex; gap:4px;">
          <button class="btn ${activeOrderType === 'buy' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800;" data-act="set-limit-order-type" data-type="buy">
            LIMIT BUY
          </button>
          <button class="btn ${activeOrderType === 'sell' ? 'danger' : 'alt'}" style="padding:3px 8px; font-size:8px; font-weight:800; ${activeOrderType === 'sell' ? 'color:#fff;' : 'color:#ef4444;'}" data-act="set-limit-order-type" data-type="sell">
            LIMIT SELL
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:10px;">
        <div>
          <label style="font-size:8px; color:var(--mu); text-transform:uppercase; display:block; margin-bottom:3px;">Target Limit Price ($)</label>
          <input 
            id="limit-target-price-input" 
            type="number" 
            value="${activeOrderType === 'buy' ? (mkt.buyPrice * 0.98).toFixed(2) : (mkt.sellPrice * 1.02).toFixed(2)}"
            step="any"
            style="width:100%; box-sizing:border-box; padding:6px 8px; background:#111827; border:1px solid #1f293d; border-radius:6px; color:var(--tx); font-family:monospace; font-size:10px;"
          />
        </div>
        <div>
          <label style="font-size:8px; color:var(--mu); text-transform:uppercase; display:block; margin-bottom:3px;">Order Value ($ USD)</label>
          <input 
            id="limit-usd-amount-input" 
            type="number" 
            placeholder="e.g. 5000" 
            value="2500"
            step="any"
            style="width:100%; box-sizing:border-box; padding:6px 8px; background:#111827; border:1px solid #1f293d; border-radius:6px; color:var(--tx); font-family:monospace; font-size:10px;"
          />
        </div>
      </div>

      <button class="btn ${activeOrderType === 'buy' ? 'gold' : 'danger'}" style="width:100%; padding:7px; font-size:9px; font-weight:900; letter-spacing:0.5px;" data-act="place-limit-order" data-id="${assetId}">
        SUBMIT ${activeOrderType.toUpperCase()} LIMIT ORDER FOR ${mkt.symbol}
      </button>

      <!-- Active Limit Orders List -->
      ${activeOrders.length > 0 ? `
        <div style="margin-top:12px; border-top:1px solid #1e293b; padding-top:10px;">
          <div style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-bottom:6px;">
            ACTIVE WORKING LIMIT ORDERS (${activeOrders.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${activeOrders.map(ord => {
              const ordMkt = CRYPTO_ASSETS.find(a => a.id === ord.assetId) || mkt;
              const isBuy = ord.type === 'buy';
              return `
                <div style="background:#111827; border:1px solid #1f293d; border-radius:6px; padding:6px 8px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-size:8px; font-weight:900; color:${isBuy ? 'var(--grn)' : '#ef4444'}; font-family:monospace;">
                        ${ord.type.toUpperCase()} ${ordMkt.symbol}
                      </span>
                      <span style="font-size:8px; color:var(--mu); font-family:monospace;">#${ord.id}</span>
                    </div>
                    <div style="font-size:8px; color:var(--tx); font-family:monospace; margin-top:1px;">
                      Limit: <b>$${ord.targetPrice.toLocaleString()}</b> · Val: $${Math.round(ord.usdAmount).toLocaleString()} (${ord.tokenQty.toFixed(3)} ${ordMkt.symbol})
                    </div>
                  </div>
                  <button class="btn alt" style="padding:2px 8px; font-size:8px; font-weight:800; color:#ef4444; border-color:rgba(239,68,68,0.4);" data-act="cancel-limit-order" data-id="${ord.id}">
                    CANCEL
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderCollateralLoanDesk(S: any, assetId: string): string {
  const mkt = getCryptoMarketData(assetId);
  const userQty = assetId === 'flb' ? (S.coins || 0) : ((S.cryptoHoldings && S.cryptoHoldings[assetId]) || 0);
  const activeLoans: any[] = S.cryptoLoans || [];

  return `
    <div style="background:linear-gradient(135deg, #0e1726 0%, #0b0f19 100%); border:1px solid rgba(14,165,233,0.3); border-radius:10px; padding:14px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <div>
          <div style="font-size:8px; color:#38bdf8; font-weight:800; text-transform:uppercase;">CREDIT FACILITY</div>
          <div style="font-size:13px; font-weight:900; color:var(--tx);">Crypto-Collateralized Working Capital Line</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; font-weight:900; color:var(--grn); font-family:monospace;">4.5% APR</div>
          <div style="font-size:8px; color:var(--mu);">Max 65% LTV</div>
        </div>
      </div>

      <div style="font-size:9px; color:var(--mu); margin-bottom:10px;">
        Pledge your ${mkt.symbol} reserves as collateral to instantly unlock liquid cash for fleet acquisitions and terminal upgrades without selling your tokens.
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
        <input 
          id="collateral-pledge-qty-input" 
          type="number" 
          placeholder="Pledge ${mkt.symbol} (Max: ${formatCryptoQty(userQty)})" 
          max="${userQty}"
          step="any"
          style="flex:1 1 180px; min-width:0; box-sizing:border-box; padding:6px 8px; background:#080c16; border:1px solid #1e293b; border-radius:6px; color:var(--tx); font-family:monospace; font-size:10px;"
        />
        <button class="btn gold" style="flex:1 1 auto; padding:6px 12px; font-size:9px; font-weight:900; white-space:nowrap;" data-act="borrow-collateral-loan" data-id="${assetId}">
          BORROW CASH (65% LTV)
        </button>
      </div>

      <!-- Active Collateral Loans List -->
      ${activeLoans.length > 0 ? `
        <div style="margin-top:10px; border-top:1px solid #1e293b; padding-top:8px;">
          <div style="font-size:8px; font-weight:800; color:var(--mu); text-transform:uppercase; margin-bottom:6px;">
            OUTSTANDING COLLATERAL CREDIT LINES (${activeLoans.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${activeLoans.map(loan => {
              const loanAsset = CRYPTO_ASSETS.find(a => a.id === loan.assetId) || mkt;
              return `
                <div style="background:#080c16; border:1px solid #1a2336; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:9px; font-weight:800; color:var(--tx); font-family:monospace;">
                      LOAN #${loan.id} · Pledged: <b style="color:var(--gold);">${loan.collateralQty.toFixed(4)} ${loanAsset.symbol}</b>
                    </div>
                    <div style="font-size:8px; color:var(--mu); font-family:monospace; margin-top:1px;">
                      Borrowed: $${Math.round(loan.borrowedCash).toLocaleString()} · Repay: <b style="color:var(--grn);">$${Math.round(loan.repayAmount).toLocaleString()}</b>
                    </div>
                  </div>
                  <button class="btn gold" style="padding:3px 10px; font-size:8px; font-weight:900;" data-act="repay-collateral-loan" data-id="${loan.id}">
                    REPAY & RELEASE
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
