console.log('Main: Script execution started');

import './app.css'; // Consolidated Navy/Camel/Green theme

import { load, get, set, subscribe, reset } from './core/store';
import { $, toast, dur, fmt } from './core/ui';
import { find } from './core/router';
import authView from './views/auth';
import './views/index';
import * as header from './ui/header';
import * as nav from './ui/nav';
import { replenish, completeJobs } from './systems/jobs';
import { fillPool } from './systems/drivers';
import { completeRepairs } from './systems/maintenance';

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

function renderApp(st: any) {
  try {
    const viewEl = $('view');
    if (!viewEl) return;

    if (!st.isAuthenticated) {
      viewEl.innerHTML = authView.render(st);
      return;
    }

    const headerEl = $('header');
    const navEl = $('nav');
    if (headerEl) { headerEl.style.display = 'flex'; header.render(st); }
    if (navEl) { navEl.style.display = 'flex'; nav.render(st); }
    
    const view = find(st.tab);
    viewEl.innerHTML = view ? view.render(st) : 'View not found';
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
    replenish(st);
    fillPool(st);
    completeJobs(st, Date.now());
    completeRepairs(st, Date.now());
  });

  let lastReplenish = Date.now();

  setInterval(() => {
    const st = get();
    if (!st || !st.isAuthenticated) return;
    const now = Date.now();
    
    localStorage.setItem('last_active', now.toString());
    
    // 1. Silent Simulation Processing (No intrusive view teardown or reload)
    const done = completeJobs(st, now) || [];
    const repCount = completeRepairs(st, now) || 0;

    // Periodic freight replenishment (every 45s) or if contracts dry up
    if (now - lastReplenish > 45000 || (st.jobs && st.jobs.length < 3)) {
      replenish(st);
      lastReplenish = now;
    }

    // Refresh UI only if a delivery or repair actually finished
    if (done.length > 0 || repCount > 0) {
      if (done.length > 0) {
        toast(`Delivered ${done.length} consignment${done.length > 1 ? 's' : ''}`, 'success');
      }
      set(() => {}); // Saves and cleanly updates UI for real events
      return;
    }

    // Save state snapshot to localStorage periodically (every 10s) without triggering full render
    if (Math.floor(now / 1000) % 10 === 0) {
      try {
        localStorage.setItem('sam.v3', JSON.stringify(st));
      } catch (e) {}
    }

    // 2. Surgical Live UI Updates in-place (Completely silent to the user)
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

    // Update auction countdown timers surgically if active on screen
    document.querySelectorAll('[data-auction-eta]').forEach(el => {
      const targetTime = +(el as HTMLElement).dataset.auctionEta!;
      const diff = Math.max(0, targetTime - now);
      (el as HTMLElement).textContent = dur(diff);
      if (diff <= 0) {
        set(() => {}); // Auction finalized
      }
    });

    // Update live header cash & bonds surgically if changed without re-rendering header
    const cashEl = document.getElementById('hdr-cash-val');
    if (cashEl) {
      const formatted = fmt(st.money);
      if (cashEl.textContent !== formatted) cashEl.textContent = formatted;
    }
    const coinEl = document.getElementById('hdr-coin-val');
    if (coinEl && coinEl.textContent !== String(st.coins)) {
      coinEl.textContent = String(st.coins);
    }
  }, 1000);
} catch (e: any) {
  console.error('Main: Initialization error', e);
  const viewEl = $('view');
  if (viewEl) {
    viewEl.innerHTML = `<div style="padding:20px;color:#ef4444;background:#111;min-height:100vh;">INIT ERROR: ${e.message}<pre>${e.stack}</pre></div>`;
  }
}
