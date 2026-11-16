/**
 * NexHaul Logistics - Surgical DOM Telemetry Synchronizer
 * Updates live countdown timers, progress bars, odometers, speeds, and financial tickers
 * directly in-place without triggering full view re-renders, input loss, or layout shifts.
 */

import { dur, fmt } from '../../core/ui';
import { getTruckTelematics } from '../trucks/trucks.telematics';
import { getCryptoMarketData } from '../finance/markets/crypto';
import { activeAuctionModalId, renderModalOverlay } from '../../views/home/auction-modal';

/**
 * Updates all live UI elements in the current document seamlessly.
 */
export function syncLiveDomTelemetry(st: any, now: number): void {
  // If tab is in background, skip DOM updates to conserve CPU
  if (typeof document !== 'undefined' && document.hidden) return;

  // 1. Delivery & Consignment ETAs
  document.querySelectorAll('[data-eta]').forEach(el => {
    const targetTime = +(el as HTMLElement).dataset.eta!;
    const remainingMs = Math.max(0, targetTime - now);
    const formatted = dur(remainingMs);
    if (el.textContent !== formatted) el.textContent = formatted;
  });

  // 2. Delivery Progress Bars
  document.querySelectorAll('[data-end]').forEach(el => {
    const s = +((el as HTMLElement).dataset.start!);
    const e = +((el as HTMLElement).dataset.end!);
    const fill = el.firstElementChild as HTMLElement;
    if (fill && e > s) {
      const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
      const widthStr = `${pct.toFixed(1)}%`;
      if (fill.style.width !== widthStr) fill.style.width = widthStr;
    }
  });

  // 3. Auction Countdown Timers
  document.querySelectorAll('[data-auction-eta]').forEach(el => {
    const targetTime = +(el as HTMLElement).dataset.auctionEta!;
    const diff = Math.max(0, targetTime - now);
    const formatted = dur(diff);
    if (el.textContent !== formatted) el.textContent = formatted;
  });

  // Tender Reset Countdown Timers
  document.querySelectorAll('[data-tender-reset-eta]').forEach(el => {
    const targetTime = +(el as HTMLElement).dataset.tenderResetEta!;
    const diff = Math.max(0, targetTime - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${hours}:${pad(minutes)}:${pad(seconds)}`;
    if (el.textContent !== formatted) el.textContent = formatted;
  });

  // 4. Live Auction Bids, Winner Badges, and Border Highlights
  document.querySelectorAll('[data-auc-bid]').forEach(el => {
    const aucId = +(el as HTMLElement).dataset.aucBid!;
    const auc = (st.auctions || []).find((a: any) => a.id === aucId);
    if (auc) {
      const isWinning = auc.currentWinner === 'player';
      const formatted = fmt(auc.currentBid || 0);
      if (el.textContent?.trim() !== formatted) {
        el.textContent = formatted;
      }
      (el as HTMLElement).style.color = isWinning ? 'var(--grn)' : 'var(--gold)';

      const winnerEl = document.querySelector(`[data-auc-winner="${auc.id}"]`);
      if (winnerEl) {
        const winText = isWinning ? '★ Your Fleet (Lowest Bidder)' : auc.currentWinnerName;
        if (winnerEl.textContent !== winText) {
          winnerEl.textContent = winText;
          (winnerEl as HTMLElement).style.color = isWinning ? 'var(--grn)' : 'var(--gold)';
        }
      }

      const cardEl = document.querySelector(`[data-auc-card="${auc.id}"]`);
      if (cardEl) {
        (cardEl as HTMLElement).style.borderColor = isWinning ? 'var(--grn)' : 'rgba(193,154,91,0.5)';
      }
    }
  });

  // 5. Truck Live Odometers
  document.querySelectorAll('[data-truck-odo]').forEach(el => {
    const truckId = +(el as HTMLElement).dataset.truckOdo!;
    const truck = (st.fleet || []).find((t: any) => t.id === truckId);
    if (truck) {
      const activeJob = (st.active || []).find((a: any) => a.truck === truck.id);
      let liveOdo = truck.odometer || 0;
      if (activeJob && activeJob.end > activeJob.start) {
        const pct = Math.min(1, Math.max(0, (now - activeJob.start) / (activeJob.end - activeJob.start)));
        liveOdo += (activeJob.km || 0) * pct;
      }
      const formatted = `${Math.round(liveOdo).toLocaleString()} km`;
      if (el.textContent?.trim() !== formatted) el.textContent = formatted;
    }
  });

  // 6. Company Cumulative Distance
  let inTransitTotalKm = 0;
  (st.active || []).forEach((a: any) => {
    if (a.end > a.start) {
      const pct = Math.min(1, Math.max(0, (now - a.start) / (a.end - a.start)));
      inTransitTotalKm += (a.km || 0) * pct;
    }
  });
  document.querySelectorAll('[data-stat-km]').forEach(el => {
    const formatted = `${Math.round((st.stats?.km || 0) + inTransitTotalKm).toLocaleString()} km`;
    if (el.textContent?.trim() !== formatted) el.textContent = formatted;
  });

  // 7. Live Speeds & Telematics Badges
  (st.active || []).forEach((a: any) => {
    const truck = (st.fleet || []).find((t: any) => t.id === a.truck);
    if (!truck) return;
    const drv = (st.drivers || []).find((d: any) => d.id === truck.driverId);
    const telem = getTruckTelematics(truck, a, drv, now);

    document.querySelectorAll(`[data-truck-speed="${truck.id}"]`).forEach(el => {
      const txt = telem.speedKmh > 0 ? `${telem.speedKmh} km/h` : '';
      if (el.textContent !== txt) el.textContent = txt;
    });

    document.querySelectorAll(`[data-truck-telem-btn="${truck.id}"]`).forEach(el => {
      const label = `🛰️ LIVE TELEMATICS · ${telem.stateLabel} (${telem.speedKmh} KM/H)`;
      if (el.textContent?.trim() !== label) {
        el.innerHTML = `<span>🛰️</span> ${label}`;
      }
    });
  });

  // 8. Header Cash & Coins
  const cashEl = document.getElementById('hdr-cash-val');
  if (cashEl) {
    const formatted = fmt(st.money);
    if (cashEl.textContent !== formatted) cashEl.textContent = formatted;
  }
  const coinEl = document.getElementById('hdr-coin-val');
  if (coinEl) {
    const c = st.coins || 0;
    const formattedCoins = c >= 1000 ? Math.round(c).toLocaleString() : c % 1 === 0 ? String(c) : c.toFixed(2);
    if (coinEl.textContent !== formattedCoins) coinEl.textContent = formattedCoins;
  }

  // 9. Crypto Mining Unclaimed Telemetry
  const pendingUsdEl = document.querySelector('[data-mining-pending-usd]');
  if (pendingUsdEl && st.mining?.pendingYield) {
    let pendingTotal = 0;
    for (const [coinId, qty] of Object.entries(st.mining.pendingYield)) {
      const q = qty as number;
      if (q > 0) {
        const coinEl = document.querySelector(`[data-mining-yield-coin="${coinId}"]`);
        if (coinEl) {
          const formattedQty = q >= 100 ? q.toFixed(2) : q >= 1 ? q.toFixed(4) : q >= 0.001 ? q.toFixed(5) : q.toFixed(7);
          if (coinEl.textContent !== formattedQty) coinEl.textContent = formattedQty;
        }
        const price = getCryptoMarketData(coinId)?.sellPrice || 1;
        pendingTotal += q * price;
      }
    }
    const txt = `$${Math.round(pendingTotal).toLocaleString()}`;
    if (pendingUsdEl.textContent !== txt) pendingUsdEl.textContent = txt;
  }

  // 10. AI Quant Bot Telemetry
  const aiBotStatusEl = document.querySelector('[data-ai-bot-status-val]');
  if (aiBotStatusEl) {
    const active = !!st.aiCryptoBot?.enabled;
    const txt = active ? 'Active & Trading' : 'Paused';
    if (aiBotStatusEl.textContent !== txt) {
      aiBotStatusEl.textContent = txt;
      (aiBotStatusEl as HTMLElement).style.color = active ? 'var(--grn)' : 'var(--red)';
    }
  }

  const aiDailyPnlEl = document.querySelector('[data-ai-daily-pnl-val]');
  if (aiDailyPnlEl) {
    const pnl = st.aiCryptoBot?.dailyProfitUsd || 0;
    const text = `${pnl >= 0 ? '+' : ''}$${Math.round(pnl).toLocaleString()} USD`;
    if (aiDailyPnlEl.textContent?.trim() !== text) {
      aiDailyPnlEl.textContent = text;
      (aiDailyPnlEl as HTMLElement).style.color = pnl >= 0 ? 'var(--grn)' : 'var(--red)';
    }
  }

  const aiTotalPnlEl = document.querySelector('[data-ai-total-pnl-val]');
  if (aiTotalPnlEl) {
    const pnl = st.aiCryptoBot?.totalProfitUsd || 0;
    const text = `${pnl >= 0 ? '+' : ''}$${Math.round(pnl).toLocaleString()} USD`;
    if (aiTotalPnlEl.textContent?.trim() !== text) {
      aiTotalPnlEl.textContent = text;
      (aiTotalPnlEl as HTMLElement).style.color = pnl >= 0 ? 'var(--grn)' : 'var(--red)';
    }
  }

  const aiPortfolioCashEl = document.querySelector('[data-ai-portfolio-cash-val]');
  if (aiPortfolioCashEl) {
    const cash = st.cryptoPortfolio?.cash || 10000;
    const text = `$${Math.round(cash).toLocaleString()} USD`;
    if (aiPortfolioCashEl.textContent?.trim() !== text) {
      aiPortfolioCashEl.textContent = text;
    }
  }

  // 11. Modal Overlays (removed automatic second-by-second re-render to prevent flicker)
  // Logic moved to main.ts and auction-modal.ts with data-attributes for live updates.
}
