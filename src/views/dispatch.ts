import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { refresh, get } from '../core/store';
import { AI_SUBSCRIPTION_PLANS, AI_ADDON_PLANS, AI_STRATEGY_PROFILES } from '../domain/ai/ai.config';
import { AiDispatchProfile } from '../domain/ai/ai.types';
import { runAiCryptoTradingTick, depositAiQuantCapital, withdrawAiQuantCapital } from '../domain/ai/ai.quant';
import {
  activateAiSuiteSystem,
  updateAiFiltersSystem,
  toggleAiEngineSystem,
  executeInstantAutoDispatchSystem,
  clearAiLogsSystem
} from '../systems/ai-dispatcher';
import { blocker } from '../systems/jobs';

// View state
let activeSubTab: 'dashboard' | 'strategy' | 'brain' | 'plans' | 'telemetry' = 'dashboard';
let selectedPlan: '7d' | '1m' | 'auto' | 'year' = '1m';
let includeMaintenance: boolean = true;
let includeOfflineDispatch: boolean = true;
let autoRenew: boolean = false;
let allowExtension: boolean = false;

// Action Bindings
action('ai-set-tab', d => {
  activeSubTab = (d as any).tab;
  refresh();
});

action('ai-toggle-quant', () => {
  const S = get();
  if (!S.aiCryptoBot) S.aiCryptoBot = { enabled: false, strategy: 'momentum', allocatedUsd: 10000, totalProfitUsd: 0, lastTradeTimestamp: 0, tradeHistory: [] };
  S.aiCryptoBot.enabled = !S.aiCryptoBot.enabled;
  refresh();
});

action('ai-set-quant-strategy', d => {
  const S = get();
  if (!S.aiCryptoBot) S.aiCryptoBot = { enabled: false, strategy: 'momentum', allocatedUsd: 10000, totalProfitUsd: 0, lastTradeTimestamp: 0, tradeHistory: [] };
  S.aiCryptoBot.strategy = (d as any).strategy;
  refresh();
});

action('ai-run-quant-now', () => {
  const S = get();
  const result = runAiCryptoTradingTick(S);
  toast(result.message, result.executed ? 'success' : 'info');
  refresh();
});

action('ai-deposit-capital', d => {
  const amt = +(d as any).amount || 10000;
  const res = depositAiQuantCapital(get(), amt);
  toast(res.message, res.success ? 'success' : 'err');
  refresh();
});

action('ai-withdraw-capital', d => {
  const amt = +(d as any).amount || 10000;
  const res = withdrawAiQuantCapital(get(), amt);
  toast(res.message, res.success ? 'success' : 'err');
  refresh();
});

action('ai-set-plan', d => {
  selectedPlan = (d as any).plan;
  refresh();
});

action('ai-toggle-maint', () => {
  includeMaintenance = !includeMaintenance;
  refresh();
});

action('ai-toggle-offline', () => {
  includeOfflineDispatch = !includeOfflineDispatch;
  refresh();
});

action('ai-toggle-autorenew', () => {
  autoRenew = !autoRenew;
  refresh();
});

action('ai-toggle-extension', () => {
  allowExtension = !allowExtension;
  refresh();
});

action('ai-checkout-usd', () => {
  activateAiSuiteSystem(selectedPlan, false, includeMaintenance, includeOfflineDispatch, autoRenew, allowExtension);
  refresh();
});

action('ai-checkout-flb', () => {
  activateAiSuiteSystem(selectedPlan, true, includeMaintenance, includeOfflineDispatch, autoRenew, allowExtension);
  refresh();
});

action('ai-toggle-engine', () => {
  toggleAiEngineSystem();
  refresh();
});

action('ai-execute-now', () => {
  executeInstantAutoDispatchSystem();
  refresh();
});

action('ai-clear-logs', () => {
  clearAiLogsSystem();
  refresh();
});

action('ai-set-profile', d => {
  const profile = (d as any).profile as AiDispatchProfile;
  updateAiFiltersSystem({ profile });
  refresh();
});

action('ai-update-filter', d => {
  const field = (d as any).field;
  const val = (d as any).val;
  if (field === 'minPayoutUsd') updateAiFiltersSystem({ minPayoutUsd: Math.max(0, +val || 0) });
  if (field === 'minYieldUsdPerKm') updateAiFiltersSystem({ minYieldUsdPerKm: Math.max(0, +val || 0) });
  if (field === 'maxDistanceKm') updateAiFiltersSystem({ maxDistanceKm: Math.max(100, +val || 10000) });
  if (field === 'minTruckHealthPct') updateAiFiltersSystem({ minTruckHealthPct: Math.min(100, Math.max(10, +val || 30)) });
  if (field === 'autoRefuel') updateAiFiltersSystem({ autoRefuel: !!val });
  if (field === 'requireHazmatCert') updateAiFiltersSystem({ requireHazmatCert: !!val });
  if (field === 'allowSubcontracted') updateAiFiltersSystem({ allowSubcontracted: !!val });
  refresh();
});

function formatRemaining(expiresTimestamp: number): string {
  const diff = Math.max(0, expiresTimestamp - Date.now());
  if (diff <= 0) return 'Expired';
  const totalMins = Math.floor(diff / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatExpiryDate(expiresTimestamp: number): string {
  if (!expiresTimestamp) return 'N/A';
  return new Date(expiresTimestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default {
  id: 'dispatch',
  hidden: true,
  label: 'AI DISPATCH',
  icon: 'cpu',
  render(S: any) {
    const aiState = S.aiState || {};
    const filters = aiState.filters || {};
    const now = Date.now();

    const isSubActive = !!(aiState.subscriptionActive && now < (aiState.expiresTimestamp || 0));
    const isMaintActive = !!(aiState.maintenanceAddonActive && now < (aiState.maintenanceExpiresTimestamp || 0));
    const isOfflineActive = !!(aiState.offlineDispatchActive && now < (aiState.offlineExpiresTimestamp || 0));
    const isEngineRunning = isSubActive && filters.enabled;

    const currentPlan = AI_SUBSCRIPTION_PLANS[selectedPlan];
    const addons = AI_ADDON_PLANS[selectedPlan];
    const maintCost = includeMaintenance && addons ? addons.maintenance : { priceUsd: 0, priceFlb: 0 };
    const offlineCost = includeOfflineDispatch && addons ? addons.offline_dispatch : { priceUsd: 0, priceFlb: 0 };
    const totalUsd = currentPlan.priceUsd + maintCost.priceUsd + offlineCost.priceUsd;
    const totalFlb = currentPlan.priceFlb + maintCost.priceFlb + offlineCost.priceFlb;

    const playerFlb = (S.cryptoHoldings && S.cryptoHoldings['flb']) || S.coins || 0;
    const canAffordUsd = (S.money || 0) >= totalUsd;
    const canAffordFlb = playerFlb >= totalFlb;

    const idleTrucks = (S.fleet || []).filter((t: any) => t.status === 'idle' && t.driverId);
    const availableJobs = S.jobs || [];

    return `
      <div class="ai-view">
        
        <!-- HEADER CARD -->
        <div class="ai-header-card">
          <div class="ai-title-row">
            <div class="ai-title-icon">
              ${ic('cpu')}
            </div>
            <div>
              <div class="ai-title-main">
                <span>Neural AI Dispatcher</span>
                <span class="ai-badge ${isSubActive ? 'active' : 'inactive'}">
                  ${isSubActive ? `ACTIVE (${formatRemaining(aiState.expiresTimestamp)})` : 'LICENSE REQUIRED'}
                </span>
              </div>
              <div class="ai-sub-desc">
                Autonomous freight matching & fleet telemetry (Zero-hallucination market dispatch)
              </div>
            </div>
          </div>

          <!-- TOP STATS METRICS -->
          <div class="ai-stat-grid">
            <div class="ai-stat-box">
              <span class="ai-stat-lbl">Dispatches</span>
              <span class="ai-stat-val">${(aiState.totalDispatchedCount || 0).toLocaleString()}</span>
            </div>
            <div class="ai-stat-box">
              <span class="ai-stat-lbl">AI Revenue</span>
              <span class="ai-stat-val" style="color:var(--grn);">$${(aiState.totalRevenueGeneratedUsd || 0).toLocaleString()}</span>
            </div>
            <div class="ai-stat-box">
              <span class="ai-stat-lbl">Fleet / Jobs</span>
              <span class="ai-stat-val">${idleTrucks.length} Units / ${availableJobs.length} Jobs</span>
            </div>
          </div>
        </div>

        <!-- 5-WAY SUB NAVIGATION BAR -->
        <div class="ai-subnav">
          <button data-act="ai-set-tab" data-tab="dashboard" class="ai-tab-btn ${activeSubTab === 'dashboard' ? 'on' : ''}">
            ${ic('bolt')} CONTROL
          </button>
          
          <button data-act="ai-set-tab" data-tab="strategy" class="ai-tab-btn ${activeSubTab === 'strategy' ? 'on' : ''}">
            ${ic('route')} STRATEGY
          </button>

          <button data-act="ai-set-tab" data-tab="brain" class="ai-tab-btn ${activeSubTab === 'brain' ? 'on' : ''}">
            🧠 BRAIN & BOT
          </button>

          <button data-act="ai-set-tab" data-tab="plans" class="ai-tab-btn ${activeSubTab === 'plans' ? 'on' : ''}">
            ${ic('shield')} PLANS & ADD-ONS
          </button>

          <button data-act="ai-set-tab" data-tab="telemetry" class="ai-tab-btn ${activeSubTab === 'telemetry' ? 'on' : ''}">
            ${ic('activity')} LOGS
          </button>
        </div>

        <!-- SUB TAB 1: OPERATIONS & CONTROL -->
        ${activeSubTab === 'dashboard' ? `
          <div class="ai-card">
            <div class="ai-card-title">
              <span>Continuous Dispatch Engine</span>
              <span class="ai-badge ${isEngineRunning ? 'active' : 'inactive'}">
                ${isEngineRunning ? 'RUNNING' : isSubActive ? 'PAUSED' : 'LICENSE REQUIRED'}
              </span>
            </div>

            <div style="font-size:11px; color:var(--mu); line-height:1.4;">
              ${isEngineRunning
                ? 'The Neural Core automatically evaluates state.jobs on every simulation tick, dispatching idle fleet units based on your active optimization profile.'
                : isSubActive
                ? 'Continuous background dispatching is paused. Resume engine to start automatic fleet matching.'
                : 'Subscribe to an AI Corporate License to activate continuous automated freight dispatch.'}
            </div>

            ${isSubActive ? `
              <button data-act="ai-toggle-engine" class="btn ${isEngineRunning ? 'alt' : ''}">
                ${isEngineRunning ? 'Pause Engine' : 'Resume Engine'}
              </button>
            ` : ''}

            <!-- INSTANT BULK DISPATCH TRIGGER -->
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--line); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700;">
                <span style="color:var(--tx);">Manual Instant Dispatch</span>
                <span style="color:var(--gold);">${idleTrucks.length} idle truck(s)</span>
              </div>
              <button data-act="ai-execute-now" ${!isSubActive || idleTrucks.length === 0 ? 'disabled' : ''} class="btn gold">
                ${ic('bolt')} Execute Bulk Auto-Dispatch Now
              </button>
            </div>
          </div>

          <!-- ZERO-HALLUCINATION MARKET BULLETIN INSPECTOR -->
          <div class="ai-card">
            <div class="ai-card-title">
              <span>Market Bulletin Inspector</span>
              <span style="font-size:10px; color:var(--grn); font-weight:800;">Real Jobs Only</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto;">
              ${availableJobs.length === 0 ? `
                <div style="text-align:center; padding:20px; font-size:11px; color:var(--mu);">
                  0 market jobs currently available in bulletin board.<br>
                  <small style="color:var(--gold);">AI strictly matches real market jobs and never hallucinates jobs.</small>
                </div>
              ` : availableJobs.slice(0, 8).map((j: any) => {
                const blockerReason = blocker(S, j);
                const isMatchable = !blockerReason && idleTrucks.length > 0;
                return `
                  <div class="ai-log-item">
                    <div class="ai-log-top">
                      <span style="color:var(--tx);">${j.cargo || j.cargoId || 'Load'}</span>
                      <span style="color:var(--grn); font-family:monospace;">$${(j.pay || 0).toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--mu);">
                      <span>${j.from} → ${j.to} (${j.km} km)</span>
                      <span style="color:${isMatchable ? 'var(--grn)' : 'var(--red)'}; font-weight:700;">
                        ${isMatchable ? '✓ Eligible' : blockerReason ? `✕ ${blockerReason}` : '✕ No idle truck'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- SUB TAB: NEURAL BRAIN & CRYPTO QUANT BOT -->
        ${activeSubTab === 'brain' ? `
          <div class="ai-card" style="border-color:var(--gold);">
            <div class="ai-card-title">
              <span>🧠 Neural Network Brain Inspector</span>
              <span class="ai-badge ${isSubActive ? 'active' : 'inactive'}">${isSubActive ? 'ACTIVE' : 'STANDBY'}</span>
            </div>
            <div style="font-size:11px; color:var(--mu); line-height:1.4; margin-bottom:12px;">
              Inspect live Multi-Layer Perceptron (MLP) weights, inputs, activation functions, and control the AI Crypto Quant Trading Bot.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
              <div class="ai-stat-box">
                <span class="ai-stat-lbl">Architecture</span>
                <span class="ai-stat-val" style="font-size:10px;">5 Inputs → 6 Hidden (ReLU) → Output (Sigmoid)</span>
              </div>
              <div class="ai-stat-box">
                <span class="ai-stat-lbl">Execution Speed</span>
                <span class="ai-stat-val" style="color:var(--grn);">0.42 ms (Mobile Optimized)</span>
              </div>
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>🪙 AI Crypto Quant Trading Bot</span>
              <span class="ai-badge ${S.aiCryptoBot?.enabled ? 'active' : 'inactive'}">
                ${S.aiCryptoBot?.enabled ? 'RUNNING' : 'PAUSED'}
              </span>
            </div>

            <div style="font-size:11px; color:var(--mu); line-height:1.4; margin-bottom:12px;">
              Automated crypto trading bot powered by neural network candle sentiment analysis. Trades virtual assets (BTC, ETH, SOL, FLB) autonomously.
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; font-size:11px;">
                <span style="color:var(--mu);">Bot Status:</span>
                <span style="color:${S.aiCryptoBot?.enabled ? 'var(--grn)' : 'var(--red)'}; font-weight:800;">
                  ${S.aiCryptoBot?.enabled ? 'Active & Trading' : 'Paused'}
                </span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:11px;">
                <span style="color:var(--mu);">Total Bot PnL:</span>
                <span style="color:${(S.aiCryptoBot?.totalProfitUsd || 0) >= 0 ? 'var(--grn)' : 'var(--red)'}; font-weight:800;">
                  $${(S.aiCryptoBot?.totalProfitUsd || 0).toLocaleString()} USD
                </span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:11px;">
                <span style="color:var(--mu);">Crypto Cash Portfolio:</span>
                <span style="color:var(--gold); font-weight:800;">
                  $${(S.cryptoPortfolio?.cash || 10000).toLocaleString()} USD
                </span>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button data-act="ai-toggle-quant" class="btn ${S.aiCryptoBot?.enabled ? 'alt' : 'gold'}" style="flex:1;">
                ${S.aiCryptoBot?.enabled ? 'Pause Bot' : 'Start Quant Bot'}
              </button>
              <button data-act="ai-run-quant-now" class="btn gold" style="flex:1;" ${!isSubActive ? 'disabled' : ''}>
                Execute AI Trade Now
              </button>
            </div>

            <div style="font-size:10px; font-weight:800; color:var(--tx); margin-bottom:6px;">TRADING STRATEGY PROFILE</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
              ${['conservative', 'momentum', 'high_volatility'].map(strat => {
                const isSelected = (S.aiCryptoBot?.strategy || 'momentum') === strat;
                return `
                  <button data-act="ai-set-quant-strategy" data-strategy="${strat}" class="btn ${isSelected ? 'gold' : 'alt'}" style="font-size:9px; padding:6px; text-transform:uppercase;">
                    ${strat.replace('_', ' ')}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>Capital Funding & Treasury</span>
              <span style="font-size:10px; color:var(--gold);">Treasury: $${(S.money || 0).toLocaleString()}</span>
            </div>
            <div style="font-size:11px; color:var(--mu); margin-bottom:10px;">
              Allocate company cash to fund the AI Quant Bot trading portfolio.
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
              <button data-act="ai-deposit-capital" data-amount="10000" class="btn gold" style="font-size:10px;">Deposit $10k USD</button>
              <button data-act="ai-deposit-capital" data-amount="50000" class="btn gold" style="font-size:10px;">Deposit $50k USD</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <button data-act="ai-withdraw-capital" data-amount="10000" class="btn alt" style="font-size:10px;">Withdraw $10k USD</button>
              <button data-act="ai-withdraw-capital" data-amount="50000" class="btn alt" style="font-size:10px;">Withdraw $50k USD</button>
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>Active Portfolio Holdings</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${!S.cryptoPortfolio?.holdings || Object.keys(S.cryptoPortfolio.holdings).filter(k => S.cryptoPortfolio.holdings[k] > 0).length === 0 ? `
                <div style="text-align:center; padding:15px; font-size:11px; color:var(--mu);">
                  No active token holdings. Bot is holding cash or searching for entry signals.
                </div>
              ` : Object.entries(S.cryptoPortfolio.holdings).filter(([id, qty]) => (qty as number) > 0).map(([id, qty]) => {
                const q = qty as number;
                return `
                  <div class="ai-log-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <span style="color:var(--tx); font-weight:800; text-transform:uppercase;">${id}</span>
                      <div style="font-size:10px; color:var(--mu);">${q.toFixed(4)} tokens</div>
                    </div>
                    <span style="color:var(--grn); font-weight:800; font-family:monospace;">ACTIVE HOLDING</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>Live AI Trade History Feed</span>
              <span style="font-size:10px; color:var(--mu);">${(S.aiCryptoBot?.tradeHistory || []).length} trades</span>
            </div>
            <div class="ai-log-list" style="max-height:220px; overflow-y:auto;">
              ${(!S.aiCryptoBot?.tradeHistory || S.aiCryptoBot.tradeHistory.length === 0) ? `
                <div style="text-align:center; padding:20px; font-size:11px; color:var(--mu);">
                  No trades executed yet. Start the bot and ensure AI subscription is active!
                </div>
              ` : S.aiCryptoBot.tradeHistory.map((tr: any) => `
                <div class="ai-log-item">
                  <div class="ai-log-top">
                    <span style="color:${tr.type === 'BUY' ? 'var(--grn)' : 'var(--gold)'}; font-weight:800;">
                      ${tr.type} ${tr.symbol}
                    </span>
                    <span style="color:var(--mu); font-size:10px;">${new Date(tr.time).toLocaleTimeString()}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--mu);">
                    <span>Qty: ${tr.qty.toFixed(4)} @ $${tr.price.toLocaleString()}</span>
                    <span style="color:var(--tx); font-weight:700;">$${tr.usd.toLocaleString()} (Conf: ${(tr.confidence * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- SUB TAB 2: STRATEGY & FILTERS -->
        ${activeSubTab === 'strategy' ? `
          <div class="ai-card">
            <div class="ai-card-title">
              <span>Optimization Profile</span>
            </div>

            <div class="ai-strategy-grid">
              ${AI_STRATEGY_PROFILES.map(prof => {
                const isSelected = (filters.profile || 'highest_payout') === prof.id;
                return `
                  <div data-act="ai-set-profile" data-profile="${prof.id}" class="ai-prof-card ${isSelected ? 'on' : ''}">
                    <div class="ai-prof-title">
                      <span>${prof.title}</span>
                      ${isSelected ? '<span style="color:var(--gold); font-size:9px;">ACTIVE</span>' : ''}
                    </div>
                    <div class="ai-prof-desc">${prof.shortDesc}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>Dispatch Constraints & Filters</span>
            </div>

            <div class="ai-filter-grid">
              <div class="ai-input-group">
                <label>Min Payout ($ USD)</label>
                <input type="number" value="${filters.minPayoutUsd || 0}" onchange="window.__aiFilterChange('minPayoutUsd', this.value)" class="ai-input" placeholder="0" />
              </div>

              <div class="ai-input-group">
                <label>Min Yield ($/km)</label>
                <input type="number" value="${filters.minYieldUsdPerKm || 0}" onchange="window.__aiFilterChange('minYieldUsdPerKm', this.value)" class="ai-input" placeholder="0" />
              </div>

              <div class="ai-input-group">
                <label>Max Distance (km)</label>
                <input type="number" value="${filters.maxDistanceKm || 10000}" onchange="window.__aiFilterChange('maxDistanceKm', this.value)" class="ai-input" placeholder="10000" />
              </div>

              <div class="ai-input-group">
                <label>Min Health (%)</label>
                <input type="number" value="${filters.minTruckHealthPct || 30}" onchange="window.__aiFilterChange('minTruckHealthPct', this.value)" class="ai-input" placeholder="30" />
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; margin-top:6px;">
              <label class="ai-toggle-row">
                <input type="checkbox" ${filters.autoRefuel !== false ? 'checked' : ''} onchange="window.__aiFilterChange('autoRefuel', this.checked)" />
                <span>Auto-Refuel before Departure</span>
              </label>

              <label class="ai-toggle-row">
                <input type="checkbox" ${filters.requireHazmatCert ? 'checked' : ''} onchange="window.__aiFilterChange('requireHazmatCert', this.checked)" />
                <span>Require ADR Hazmat Endorsement</span>
              </label>

              <label class="ai-toggle-row">
                <input type="checkbox" ${filters.allowSubcontracted ? 'checked' : ''} onchange="window.__aiFilterChange('allowSubcontracted', this.checked)" />
                <span>Allow Subcontracted Charter Units</span>
              </label>
            </div>
          </div>
        ` : ''}

        <!-- SUB TAB 3: SUBSCRIPTIONS & ADD-ONS -->
        ${activeSubTab === 'plans' ? `
          <div class="ai-card">
            <div class="ai-card-title">
              <span>Select Plan Duration</span>
              <span style="font-size:10px; color:var(--gold); font-weight:700;">FLB Balance: ${playerFlb}</span>
            </div>

            <div class="ai-plan-grid">
              ${Object.keys(AI_SUBSCRIPTION_PLANS).map(key => {
                const p = AI_SUBSCRIPTION_PLANS[key];
                const isSelected = selectedPlan === key;
                return `
                  <div data-act="ai-set-plan" data-plan="${key}" class="ai-plan-card ${isSelected ? 'on' : ''}">
                    <div>
                      <div style="font-size:11px; font-weight:800; color:var(--tx);">${p.label}</div>
                      <div style="font-size:9px; color:var(--mu);">${p.days} simulation days</div>
                    </div>
                    <div class="ai-plan-price">
                      $${p.priceUsd.toLocaleString()} USD <br>
                      <span style="color:var(--gold); font-size:10px;">or ${p.priceFlb} FLB</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="ai-card">
            <div class="ai-card-title">
              <span>Enterprise Add-ons</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <label class="ai-toggle-row" style="align-items:flex-start;">
                <input type="checkbox" ${includeMaintenance ? 'checked' : ''} data-act="ai-toggle-maint" style="margin-top:2px;" />
                <div>
                  <span style="color:var(--tx); font-weight:800;">Autonomous Fleet Maintenance Add-on</span>
                  <div style="font-size:10px; color:var(--mu);">Auto-repairs components below 60% health (+$${maintCost.priceUsd.toLocaleString()} USD or ${maintCost.priceFlb} FLB).</div>
                </div>
              </label>

              <label class="ai-toggle-row" style="align-items:flex-start; padding-top:8px; border-top:1px solid var(--line);">
                <input type="checkbox" ${includeOfflineDispatch ? 'checked' : ''} data-act="ai-toggle-offline" style="margin-top:2px;" />
                <div>
                  <span style="color:var(--tx); font-weight:800;">Autonomous Offline AI Dispatcher Add-on</span>
                  <div style="font-size:10px; color:var(--mu);">Continuously matches real market jobs while offline (+$${offlineCost.priceUsd.toLocaleString()} USD or ${offlineCost.priceFlb} FLB).</div>
                </div>
              </label>

              <label class="ai-toggle-row" style="align-items:flex-start; padding-top:8px; border-top:1px solid var(--line);">
                <input type="checkbox" ${selectedPlan === 'auto' || autoRenew ? 'checked' : ''} ${selectedPlan === 'auto' ? 'disabled' : ''} data-act="ai-toggle-autorenew" style="margin-top:2px;" />
                <div>
                  <span style="color:var(--tx); font-weight:800;">Auto-Renewal</span>
                  <div style="font-size:10px; color:var(--mu);">Automatically renews company license to prevent downtime.</div>
                </div>
              </label>
            </div>
          </div>

          <!-- CHECKOUT & EXTENSION -->
          <div class="ai-card" style="border-color:var(--gold);">
            <div class="ai-card-title">
              <span>Total Bundled License</span>
              <span style="color:var(--grn); font-weight:800;">$${totalUsd.toLocaleString()} USD / ${totalFlb} FLB</span>
            </div>

            ${isSubActive ? `
              <label class="ai-toggle-row" style="background:rgba(193,154,91,0.1); padding:8px; border-radius:8px;">
                <input type="checkbox" ${allowExtension ? 'checked' : ''} data-act="ai-toggle-extension" />
                <span style="color:var(--gold); font-size:11px;">Extend Existing Subscription (+${currentPlan.label})</span>
              </label>
            ` : ''}

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <button data-act="ai-checkout-usd" ${isSubActive && !allowExtension || !canAffordUsd ? 'disabled' : ''} class="btn">
                Pay USD ($${totalUsd.toLocaleString()})
              </button>

              <button data-act="ai-checkout-flb" ${isSubActive && !allowExtension || !canAffordFlb ? 'disabled' : ''} class="btn gold">
                Pay FLB (${totalFlb} FLB)
              </button>
            </div>
          </div>
        ` : ''}

        <!-- SUB TAB 4: NEURAL TELEMETRY LOGS -->
        ${activeSubTab === 'telemetry' ? `
          <div class="ai-card">
            <div class="ai-card-title">
              <span>Telemetry Audit Logs</span>
              <button data-act="ai-clear-logs" class="btn alt" style="padding:4px 8px; font-size:9px;">Clear Logs</button>
            </div>

            <div class="ai-log-list">
              ${(!aiState.logs || aiState.logs.length === 0) ? `
                <div style="text-align:center; padding:20px; font-size:11px; color:var(--mu);">
                  No neural telemetry logs recorded yet.
                </div>
              ` : aiState.logs.map((log: any) => `
                <div class="ai-log-item">
                  <div class="ai-log-top">
                    <span style="color:var(--tx);">${log.status === 'serviced' ? '🛠️ SERVICE' : '⚡ DISPATCH'}: ${log.truckName || 'Unit'}</span>
                    <span style="color:var(--mu); font-size:10px;">${log.simTimeFormatted || 'Live'}</span>
                  </div>
                  <div style="font-size:10px; color:var(--mu);">${log.message}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;
  }
};

// Global helper for filter changes
(window as any).__aiFilterChange = (field: string, val: any) => {
  if (field === 'minPayoutUsd') updateAiFiltersSystem({ minPayoutUsd: Math.max(0, +val || 0) });
  if (field === 'minYieldUsdPerKm') updateAiFiltersSystem({ minYieldUsdPerKm: Math.max(0, +val || 0) });
  if (field === 'maxDistanceKm') updateAiFiltersSystem({ maxDistanceKm: Math.max(100, +val || 10000) });
  if (field === 'minTruckHealthPct') updateAiFiltersSystem({ minTruckHealthPct: Math.min(100, Math.max(10, +val || 30)) });
  if (field === 'autoRefuel') updateAiFiltersSystem({ autoRefuel: !!val });
  if (field === 'requireHazmatCert') updateAiFiltersSystem({ requireHazmatCert: !!val });
  if (field === 'allowSubcontracted') updateAiFiltersSystem({ allowSubcontracted: !!val });
  refresh();
};
