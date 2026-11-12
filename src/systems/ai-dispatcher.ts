/**
 * AI Dispatcher & Enterprise Operations System Actions
 * Handles user interactions, plan purchases, filter updates, and manual triggers.
 */

import { set } from '../core/store';
import { toast } from '../core/ui';
import { pushNote } from './notify';
import { AI_SUBSCRIPTION_PLANS, AI_ADDON_PLANS, DEFAULT_AI_STATE } from '../domain/ai/ai.config';
import { AiFilterConfig } from '../domain/ai/ai.types';
import { runAiAutoDispatch } from '../domain/ai/ai.engine';

export function activateAiSuiteSystem(
  planId: '7d' | '1m' | 'auto' | 'year',
  useFlb: boolean = false,
  includeMaintenance: boolean = true,
  includeOfflineDispatch: boolean = true,
  includeQuantTrader: boolean = false,
  autoRenew: boolean = true,
  allowExtension: boolean = false
): boolean {
  let success = false;

  set((S: any) => {
    if (!S.aiState) S.aiState = { ...DEFAULT_AI_STATE };

    const plan = AI_SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      toast('Invalid subscription plan selected', 'err');
      return;
    }

    const addons = AI_ADDON_PLANS[planId];
    const maintCost = includeMaintenance && addons ? addons.maintenance : { priceUsd: 0, priceFlb: 0 };
    const offlineCost = includeOfflineDispatch && addons ? addons.offline_dispatch : { priceUsd: 0, priceFlb: 0 };
    const quantCost = includeQuantTrader && addons ? addons.quant_trader : { priceUsd: 0, priceFlb: 0 };

    const totalUsd = plan.priceUsd + maintCost.priceUsd + offlineCost.priceUsd + quantCost.priceUsd;
    const totalFlb = plan.priceFlb + maintCost.priceFlb + offlineCost.priceFlb + quantCost.priceFlb;

    const now = Date.now();
    const durationMs = plan.days * 86400 * 1000;
    const isAlreadyActive = S.aiState.subscriptionActive && now < S.aiState.expiresTimestamp;

    if (isAlreadyActive && !allowExtension) {
      toast('Active subscription in effect. Check "Extend Existing Subscription" to add days.', 'err');
      return;
    }

    const flbHolding = (S.cryptoHoldings && S.cryptoHoldings['flb']) || S.coins || 0;

    if (useFlb) {
      if (flbHolding < totalFlb) {
        toast(`Insufficient Fleet Bonds (${flbHolding} FLB available, ${totalFlb} FLB required)`, 'err');
        return;
      }
      if (S.cryptoHoldings && S.cryptoHoldings['flb'] !== undefined) {
        S.cryptoHoldings['flb'] -= totalFlb;
      } else {
        S.coins = Math.max(0, (S.coins || 0) - totalFlb);
      }
    } else {
      if ((S.money || 0) < totalUsd) {
        toast(`Insufficient Treasury ($${(S.money || 0).toLocaleString()} available, $${totalUsd.toLocaleString()} required)`, 'err');
        return;
      }
      S.money -= totalUsd;
    }

    // Calculate new expiration timestamps
    const baseSubTime = isAlreadyActive ? S.aiState.expiresTimestamp : now;
    const baseMaintTime = S.aiState.maintenanceAddonActive && now < S.aiState.maintenanceExpiresTimestamp
      ? S.aiState.maintenanceExpiresTimestamp : now;
    const baseOfflineTime = S.aiState.offlineDispatchActive && now < S.aiState.offlineExpiresTimestamp
      ? S.aiState.offlineExpiresTimestamp : now;
    const baseQuantTime = S.aiState.quantTraderActive && now < S.aiState.quantTraderExpiresTimestamp
      ? S.aiState.quantTraderExpiresTimestamp : now;

    S.aiState.subscriptionActive = true;
    S.aiState.expiresTimestamp = baseSubTime + durationMs;
    S.aiState.planId = planId;
    S.aiState.autoRenew = planId === 'auto' ? true : autoRenew;

    if (includeMaintenance) {
      S.aiState.maintenanceAddonActive = true;
      S.aiState.maintenanceExpiresTimestamp = baseMaintTime + durationMs;
    }

    if (includeOfflineDispatch) {
      S.aiState.offlineDispatchActive = true;
      S.aiState.offlineExpiresTimestamp = baseOfflineTime + durationMs;
    }

    if (includeQuantTrader) {
      S.aiState.quantTraderActive = true;
      S.aiState.quantTraderExpiresTimestamp = baseQuantTime + durationMs;
    }

    S.aiState.filters.enabled = true;

    // Immediately trigger auto-dispatch for any idle fleet units upon activation
    try {
      const immediateResult = runAiAutoDispatch(S);
      if (immediateResult.dispatchedCount > 0) {
        pushNote(S, `Initial dispatch active: ${immediateResult.dispatchedCount} truck(s) assigned immediately upon licensing.`, { title: 'IMMEDIATE DISPATCH', type: 'ops' });
      }
    } catch (e) {}

    const paymentText = useFlb ? `${totalFlb} Fleet Bonds (FLB)` : `$${totalUsd.toLocaleString()} USD`;
    const actionTitle = isAlreadyActive ? '🤖 AI SUITE EXTENDED' : '🤖 AI SUITE ACTIVATED';
    
    pushNote(S, `Subscribed to ${plan.label} (${paymentText}). Neural auto-dispatch and selected enterprise add-ons are active.`, {
      title: actionTitle,
      type: 'ops',
      priority: 1
    });

    toast(isAlreadyActive ? `Extended AI Suite by ${plan.days} days!` : `Activated ${plan.label}!`, 'success');
    success = true;
  });

  return success;
}

export function updateAiFiltersSystem(filtersPatch: Partial<AiFilterConfig>): void {
  set((S: any) => {
    if (!S.aiState) S.aiState = { ...DEFAULT_AI_STATE };
    S.aiState.filters = { ...S.aiState.filters, ...filtersPatch };
    toast('AI Dispatcher strategy updated', 'success');
  });
}

export function toggleAiEngineSystem(): void {
  set((S: any) => {
    if (!S.aiState) S.aiState = { ...DEFAULT_AI_STATE };
    const nextState = !S.aiState.filters.enabled;
    S.aiState.filters.enabled = nextState;
    toast(`AI Auto-Dispatch Engine ${nextState ? 'RESUMED' : 'PAUSED'}`, nextState ? 'success' : 'err');
  });
}

export function executeInstantAutoDispatchSystem(): { dispatchedCount: number; message: string } {
  let result = { dispatchedCount: 0, message: '' };
  set((S: any) => {
    result = runAiAutoDispatch(S);
    if (result.dispatchedCount > 0) {
      toast(result.message, 'success');
    } else {
      toast(result.message, 'err');
    }
  });
  return result;
}

export function clearAiLogsSystem(): void {
  set((S: any) => {
    if (S.aiState) {
      S.aiState.logs = [];
      toast('Neural telemetry logs cleared', 'success');
    }
  });
}

export function updateAiIntensitySystem(intensity: 'conservative' | 'balanced' | 'aggressive'): void {
  set((S: any) => {
    if (!S.aiState) S.aiState = { ...DEFAULT_AI_STATE };
    S.aiState.filters.intensity = intensity;
    if (S.aiCryptoBot) {
      S.aiCryptoBot.intensity = intensity;
    }
    toast(`AI Intensity set to ${intensity.toUpperCase()}`, 'success');
  });
}
