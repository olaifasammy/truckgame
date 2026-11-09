console.log('Main: Script execution started');

import './app.css'; // Consolidated Navy/Camel/Green theme

import { load, get, set, subscribe, reset } from './core/store';
import { $, toast } from './core/ui';
import { find } from './core/router';
import authView from './views/auth';
import './views/index';
import * as header from './ui/header';
import * as nav from './ui/nav';
import { replenish } from './systems/jobs';
import { fillPool, hireFee, transferFee, skillUpgradeCost } from './systems/drivers';

(window as any).hireFee = hireFee;
(window as any).transferFee = transferFee;
(window as any).skillUpgradeCost = skillUpgradeCost;

import { syncProgressionAudit } from './domain/company/progression';
import { renderAiFloatingWidget } from './components/AiFloatingWidget';
import { pushNote } from './systems/notify';
import { tripMs } from './systems/calc';
import { processOfflineAiDispatch } from './domain/ai/ai.engine';
import { executeSimulationStep } from './domain/simulation/engine';
import { syncLiveDomTelemetry } from './domain/simulation/telemetry';

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
    
    // Prevent view re-render disruption if user is actively typing in an input, textarea, or select
    const activeEl = document.activeElement;
    const isInputFocused = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);
    if (isInputFocused && lastRenderedTab === targetTab) {
      return;
    }

    if (view) {
      const newHtml = view.render(st);
      
      if (viewEl.innerHTML !== newHtml || lastRenderedTab !== targetTab) {
        const scrollY = window.scrollY;
        const scrollableElements = viewEl.querySelectorAll('[style*="overflow"], [class*="scroll"]');
        const scrollStates: { scrollTop: number; scrollLeft: number }[] = [];
        scrollableElements.forEach(el => {
          scrollStates.push({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
        });

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

        window.scrollTo(0, scrollY);

        const newScrollableElements = viewEl.querySelectorAll('[style*="overflow"], [class*="scroll"]');
        newScrollableElements.forEach((el, idx) => {
          if (scrollStates[idx]) {
            el.scrollTop = scrollStates[idx].scrollTop;
            el.scrollLeft = scrollStates[idx].scrollLeft;
          }
        });
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

  // Welcome & Offline Catchup logic
  if (S.isAuthenticated) {
    const lastActiveStr = localStorage.getItem('last_active');
    const now = Date.now();
    
    if (!lastActiveStr) {
       toast('Welcome to NexHaul!', 'success');
    } else {
       const lastActive = parseInt(lastActiveStr, 10);
       const elapsed = now - lastActive;
       if (elapsed > 1000 * 60 * 5) { // 5 minutes away
          toast('Welcome back, Director', 'success');
          toast('Operations synchronized');
       }
       if (S.aiState?.offlineDispatchActive && now < (S.aiState?.offlineExpiresTimestamp || 0) && elapsed > 15000) {
          const offRes = processOfflineAiDispatch(S, elapsed);
          if (offRes.dispatches > 0) {
             pushNote(S, `Autonomous Offline AI Dispatcher executed ${offRes.dispatches} consignments while you were away.`, { title: 'OFFLINE DISPATCH', type: 'ops' });
             toast(`Offline AI Dispatcher: ${offRes.dispatches} loads processed`, 'success');
          }
       }
    }
    
    localStorage.setItem('last_active', now.toString());
  }

  // Initial synchronization step
  set(st => {
    const now = Date.now();
    // Migrate legacy active jobs with huge end times
    if (st.active && st.active.length > 0) {
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
    executeSimulationStep(st, now);
  });

  // Smart Central Simulation Tick Orchestration
  let lastSaveTimestamp = Date.now();

  const runSimulationTick = () => {
    const st = get();
    if (!st || !st.isAuthenticated) return;
    const now = Date.now();
    localStorage.setItem('last_active', now.toString());

    // 1. Authoritative Domain Step across subsystems
    const tickResult = executeSimulationStep(st, now);

    // 2. Intelligent Reactive Persistence:
    // When structural operational changes occur (deliveries completed, repairs finished, trucks dispatched, or trades executed),
    // persist state and trigger reactive store subscribers cleanly
    if (tickResult.hasStructuralChange || tickResult.botTraded) {
      set(() => {}); // Persist and trigger subscribers
      lastSaveTimestamp = now;
    } else if (now - lastSaveTimestamp > 10000) {
      // Background heartbeat save (every 10s) to avoid expensive JSON.stringify on the main thread every second
      try {
        localStorage.setItem('sam.v3', JSON.stringify(st));
        lastSaveTimestamp = now;
      } catch (e) {}
    }

    // 3. Surgical in-place DOM telemetry sync (live ETAs, progress bars, tickers, odometers, telematics)
    syncLiveDomTelemetry(st, now);
  };

  // Run simulation interval every 1 second
  setInterval(runSimulationTick, 1000);

  // Background tab visibility & sleep recovery management
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const st = get();
        if (!st || !st.isAuthenticated) return;
        const now = Date.now();
        const lastActive = parseInt(localStorage.getItem('last_active') || '0', 10);
        const elapsed = now - lastActive;

        // If user was away on another tab or minimized for more than 3 seconds, run immediate catch-up
        if (elapsed > 3000) {
          runSimulationTick();
        }
      }
    });
  }
} catch (e: any) {
  console.error('Main: Initialization error', e);
  const viewEl = $('view');
  if (viewEl) {
    viewEl.innerHTML = `<div style="padding:20px;color:#ef4444;background:#111;min-height:100vh;">INIT ERROR: ${e.message}<pre>${e.stack}</pre></div>`;
  }
}
