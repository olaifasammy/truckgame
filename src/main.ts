console.log('Main: Script execution started');

import './app.css'; // Consolidated Navy/Camel/Green theme

import { load, get, set, subscribe, reset } from './core/store';
import { $, toast, dur, fmt } from './core/ui';
import { find } from './core/router';
import authView from './views/auth';
import './views/index';
import * as header from './ui/header';
import * as nav from './ui/nav';
import { replenish, completeJobs, processEconomics } from './systems/jobs';
import { onTruckArrival } from './systems/fleet';
import { fillPool, hireFee, transferFee, skillUpgradeCost } from './systems/drivers';

(window as any).hireFee = hireFee;
(window as any).transferFee = transferFee;
(window as any).skillUpgradeCost = skillUpgradeCost;
import { syncProgressionAudit } from './domain/company/progression';
import { completeRepairs } from './systems/maintenance';
import { renderAiFloatingWidget } from './components/AiFloatingWidget';
import { pushNote } from './systems/notify';
import { activeAuctionModalId, renderModalOverlay } from './views/home/auction-modal';
import { tripMs } from './systems/calc';
import { TRAIT_REGISTRY } from './domain/drivers/drivers.names';
import { getTruckTelematics } from './domain/trucks/trucks.telematics';
import { getCryptoMarketData, processLimitOrders } from './domain/finance/markets/crypto';
import { runAiAutoDispatch, runAiFleetMaintenance } from './domain/ai/ai.engine';
import { runAiCryptoTradingTick } from './domain/ai/ai.quant';

console.log('Main: Imports completed');

if (location.search.includes('reset')) {
  console.log('Main: Resetting state...');
  reset();
  history.replaceState(null, '', location.pathname);
}

let S: any;
try {
  S = load();
  console.log('Main: Store loaded', S);
} catch (e: any) {
  console.error('Main: Store load failed, resetting...', e);
  reset();
  S = load();
}

(window as any).__getStore = get;

let lastRenderedTab = '';
let lastRenderTime = 0;

function renderApp(st: any) {
  try {
    const viewEl = $('view');
    if (!viewEl) return;

    // Throttle rendering to ~20fps to prevent extreme flickering and CPU load
    const now = Date.now();
    if (now - lastRenderTime < 50 && lastRenderedTab === st.tab) return;
    lastRenderTime = now;

    if (!st.isAuthenticated) {
      viewEl.innerHTML = authView.render(st);
      lastRenderedTab = 'auth';
      return;
    }

    const headerEl = $('header');
    const navEl = $('nav');
    if (headerEl) { headerEl.style.display = 'flex'; header.render(st); }
    if (navEl) { navEl.style.display = 'flex'; nav.render(st); }

    const targetTab = st.tab || 'company';
    const view = find(targetTab && find(targetTab) ? targetTab : 'company');
    
    if (view) {
      const newHtml = view.render(st);
      
      if (viewEl.innerHTML !== newHtml || lastRenderedTab !== targetTab) {
        const oldMap = document.getElementById('leaflet-map-container');
        
        if (oldMap && lastRenderedTab === targetTab) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newHtml;
          const newMapPlaceholder = tempDiv.querySelector('#leaflet-map-container');
          
          if (newMapPlaceholder) {
            newMapPlaceholder.replaceWith(oldMap);
            viewEl.innerHTML = '';
            while (tempDiv.firstChild) viewEl.appendChild(tempDiv.firstChild);
          } else {
            viewEl.innerHTML = newHtml;
          }
        } else {
          viewEl.innerHTML = newHtml;
        }
      }
    } else {
      viewEl.innerHTML = 'View not found';
    }
    
    lastRenderedTab = targetTab;

    // Render or update smart AI floating widget
    let widgetContainer = document.getElementById('ai-widget-root');
    if (!widgetContainer) {
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'ai-widget-root';
      document.body.appendChild(widgetContainer);
    }
    widgetContainer.innerHTML = renderAiFloatingWidget(st);
  } catch (e: any) {
    console.error('Main: Render crash', e);
    const viewEl = $('view');
    if (viewEl) {
      viewEl.innerHTML = `<div style="padding:20px;color:#ef4444;background:#111;min-height:100vh;">CRASH: ${e.message}<pre>${e.stack}</pre></div>`;
    }
  }
}

subscribe(st => renderApp(st));

try {
  // Initial render trigger
  renderApp(S);

  // Welcome logic
  if (S.isAuthenticated) {
    const lastActiveStr = localStorage.getItem('last_active');
    const now = Date.now();
    
    if (!lastActiveStr) {
       toast('Welcome to NexHaul!', 'success');
    } else {
       const lastActive = parseInt(lastActiveStr);
       if (now - lastActive > 1000 * 60 * 5) { // 5 minutes away
          toast('Welcome back, Director', 'success');
          toast('Operations synchronized');
       }
    }
    
    localStorage.setItem('last_active', now.toString());
  }

  // Sync systems
  set(st => {
    const now = Date.now();
    // Migrate legacy active jobs with huge end times
    if (st.active && st.active.length > 0) {
      const now = Date.now();
      st.active.forEach((a: any) => {
        const remaining = a.end - now;
        if (remaining > 3600000) { // Cap legacy stuck jobs to 1 hour max
          const fastDuration = tripMs(a.km || 200, 80, a.env);
          a.end = Math.min(a.end, now + fastDuration);
        }
      });
    }
    replenish(st);
    fillPool(st);
    syncProgressionAudit(st);
    processEconomics(st, now);
    completeJobs(st, now);
    completeRepairs(st, now);
    if (st.aiState?.subscriptionActive && st.aiState?.filters?.enabled) {
      runAiAutoDispatch(st);
    }
    if (st.aiState?.subscriptionActive) {
      runAiCryptoTradingTick(st);
    }
    if (st.aiState?.maintenanceAddonActive) {
      runAiFleetMaintenance(st);
    }
  });

  let lastReplenish = Date.now();

  setInterval(() => {
    const st = get();
    if (!st || !st.isAuthenticated) return;
    const now = Date.now();
    
    localStorage.setItem('last_active', now.toString());
    
    // 1. Silent Simulation Processing (No intrusive view teardown or reload)
    processEconomics(st, now);
    processLimitOrders(st);
    const prevAuctionCount = (st.auctions || []).length;
    const { done = [], auctionChanged = false } = completeJobs(st, now) || {};
    if (done.length > 0) {
      done.forEach((id: number) => onTruckArrival(st, id));
    }
    const repCount = completeRepairs(st, now) || 0;

    // AI Automation Engine Processing
    if (st.aiState?.subscriptionActive && st.aiState?.filters?.enabled) {
      runAiAutoDispatch(st);
    }
    if (st.aiState?.subscriptionActive) {
      runAiCryptoTradingTick(st);
    }
    if (st.aiState?.maintenanceAddonActive) {
      runAiFleetMaintenance(st);
    }

    // Periodic freight replenishment (every 30s) or if contracts dry up
    if (now - lastReplenish > 30000 || (st.jobs && st.jobs.length < 3)) {
      replenish(st);
      lastReplenish = now;
    }

    // Live update auction modal if active
    if (activeAuctionModalId !== null) {
      renderModalOverlay(st);
    }

    // Toast delivery completion non-intrusively without view teardown
    if (done.length > 0) {
      toast(`Delivered ${done.length} consignment${done.length > 1 ? 's' : ''}`, 'success');
    }

    // Save state snapshot to localStorage silently on simulation updates
    try {
      localStorage.setItem('sam.v3', JSON.stringify(st));
    } catch (e) {}

    // 2. Surgical Live UI Updates in-place (Completely seamless and non-reloading)
    // Update live delivery and trip countdowns
    document.querySelectorAll('[data-eta]').forEach(el => {
      const targetTime = +(el as HTMLElement).dataset.eta!;
      (el as HTMLElement).textContent = dur(Math.max(0, targetTime - now));
    });
    
    // Update live delivery progress bars
    document.querySelectorAll('[data-end]').forEach(el => {
      const s = +((el as HTMLElement).dataset.start!), e = +((el as HTMLElement).dataset.end!);
      const fill = el.firstElementChild as HTMLElement;
      if (fill) fill.style.width = Math.min(100, Math.max(0, (now - s) / (e - s) * 100)) + '%';
    });

    // Update auction countdown timers surgically
    document.querySelectorAll('[data-auction-eta]').forEach(el => {
      const targetTime = +(el as HTMLElement).dataset.auctionEta!;
      const diff = Math.max(0, targetTime - now);
      (el as HTMLElement).textContent = dur(diff);
    });

    // Update auction card bids, winner text, and card border surgically in real-time
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
          const winText = isWinning ? '★ Winning' : auc.currentWinnerName;
          if (winnerEl.textContent !== winText) {
            winnerEl.textContent = winText;
            (winnerEl as HTMLElement).style.color = isWinning ? 'var(--grn)' : 'var(--mu)';
          }
        }

        const cardEl = document.querySelector(`[data-auc-card="${auc.id}"]`);
        if (cardEl) {
          (cardEl as HTMLElement).style.borderColor = isWinning ? 'var(--grn)' : 'rgba(193,154,91,0.5)';
        }
      }
    });

    // Update truck live odometers continuously during transit
    document.querySelectorAll('[data-truck-odo]').forEach(el => {
      const truckId = +(el as HTMLElement).dataset.truckOdo!;
      const truck = (st.fleet || []).find((t: any) => t.id === truckId);
      if (truck) {
        const activeJob = (st.active || []).find((a: any) => a.truck === truck.id);
        let liveOdo = truck.odometer;
        if (activeJob && activeJob.end > activeJob.start) {
          const pct = Math.min(1, Math.max(0, (now - activeJob.start) / (activeJob.end - activeJob.start)));
          liveOdo += (activeJob.km || 0) * pct;
        }
        const formatted = Math.round(liveOdo).toLocaleString() + ' km';
        if (el.textContent?.trim() !== formatted) el.textContent = formatted;
      }
    });

    // Update company total km stats surgically including in-transit distance
    let inTransitTotalKm = 0;
    (st.active || []).forEach((a: any) => {
      if (a.end > a.start) {
        const pct = Math.min(1, Math.max(0, (now - a.start) / (a.end - a.start)));
        inTransitTotalKm += (a.km || 0) * pct;
      }
    });
    document.querySelectorAll('[data-stat-km]').forEach(el => {
      const formatted = Math.round((st.stats?.km || 0) + inTransitTotalKm).toLocaleString() + ' km';
      if (el.textContent?.trim() !== formatted) el.textContent = formatted;
    });

    // Update live speeds and telematics button labels for active trucks
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

    // Check active drivers on the road for fatigue accumulation & 80% mandatory rest
    if (st.active && st.active.length > 0) {
      st.active.forEach((a: any) => {
        const t = (st.fleet || []).find((tr: any) => tr.id === a.truck);
        if (t && t.driverId) {
          const drv = (st.drivers || []).find((d: any) => d.id === t.driverId);
          if (drv) {
            // Skip fatigue accumulation if currently resting en-route
            if (drv.hosRestUntil && drv.hosRestUntil > now) {
              a.lastFatigueTick = now;
              return;
            }

            // Fatigue accumulation: ~9% per simulation hour (11h drive time = 100% fatigue)
            if (!a.lastFatigueTick) a.lastFatigueTick = now;
            const msElapsed = now - a.lastFatigueTick;
            const simHoursElapsed = msElapsed / 300000;
            
            let fatigueMod = 1.0;
            if (drv.trait) {
              const traitDef = (TRAIT_REGISTRY as any)[drv.trait];
              if (traitDef?.effect?.fatigueMod) {
                fatigueMod += traitDef.effect.fatigueMod;
              }
            }

            const fatigueGain = simHoursElapsed * 9.1 * fatigueMod;
            drv.fatigue = Math.min(100, (drv.fatigue || 0) + fatigueGain);
            drv.fatigue = Math.round(drv.fatigue * 100) / 100;
            a.lastFatigueTick = now;

            if (drv.fatigue >= 80) {
              // Safety stop: reset fatigue/HOS and add 30s (real time) delay
              drv.fatigue = 0;
              drv.hosHours = 0;
              const restDurationMs = 30000;
              drv.hosRestUntil = now + restDurationMs;
              a.end += restDurationMs;
              pushNote(st, `${drv.name} reached 80% fatigue en-route and pulled over at a travel plaza for mandatory sleeper berth rest.`, { title: 'HOS SAFETY REST', type: 'ops' });
              toast(`${drv.name} taking mandatory HOS rest (80% fatigue reached)`, 'info');
            }
          }
        }
      });
    }

    // Only structural updates (e.g. auction finalized/expired, delivery completed, or repair finished) require board refresh
    const currentAuctionCount = (st.auctions || []).length;
    const auctionStructurallyChanged = prevAuctionCount !== currentAuctionCount;

    if ((auctionStructurallyChanged || done.length > 0 || repCount > 0) && (st.tab === 'home' || st.tab === 'garage' || st.tab === 'repair')) {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);
      if (!isInputFocused) {
        const view = find(st.tab);
        const viewEl = $('view');
        if (view && viewEl) {
          const scrollY = window.scrollY;
          viewEl.innerHTML = view.render(st);
          window.scrollTo(0, scrollY);
        }
      }
    }

    // Surgical live updates for Crypto Mining telemetry without re-rendering view
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
      pendingUsdEl.textContent = `$${Math.round(pendingTotal).toLocaleString()}`;
    }

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
  }, 1000);
} catch (e: any) {
  console.error('Main: Initialization error', e);
  const viewEl = $('view');
  if (viewEl) {
    viewEl.innerHTML = `<div style="padding:20px;color:#ef4444;background:#111;min-height:100vh;">INIT ERROR: ${e.message}<pre>${e.stack}</pre></div>`;
  }
}
