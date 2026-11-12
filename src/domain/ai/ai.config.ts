/**
 * AI Dispatcher Configuration & Strategy Definitions
 * All subscription tiers, add-ons, pricing matrices, and strategy profiles.
 */

import { AiSubscriptionPlan, AiAddonPlan, AiDispatchProfile, AiFilterConfig, AiState } from './ai.types';

export const AI_SUBSCRIPTION_PLANS: Record<string, AiSubscriptionPlan> = {
  '7d': {
    id: '7d',
    label: '7-Day Express License',
    days: 7,
    priceUsd: 45000,
    priceFlb: 40,
    description: 'Short-term tactical AI license for rapid fleet automation.'
  },
  '1m': {
    id: '1m',
    label: '1-Month Corporate License',
    days: 30,
    priceUsd: 165000,
    priceFlb: 120,
    badge: 'Popular',
    description: 'Full 30-day enterprise operating license with neural dispatching.'
  },
  'auto': {
    id: 'auto',
    label: 'Monthly Auto-Renew Enterprise',
    days: 30,
    priceUsd: 145000,
    priceFlb: 100,
    badge: 'Save $20k',
    description: 'Discounted auto-renewing 30-day enterprise license.'
  },
  'year': {
    id: 'year',
    label: '1-Year Annual Fleet License',
    days: 365,
    priceUsd: 950000,
    priceFlb: 650,
    badge: 'Best Value',
    description: '365 days of continuous enterprise logistics automation.'
  }
};

export const AI_ADDON_PLANS: Record<string, Record<'maintenance' | 'offline_dispatch' | 'quant_trader', AiAddonPlan>> = {
  '7d': {
    maintenance: {
      id: 'maintenance',
      label: 'Autonomous Fleet Maintenance',
      priceUsd: 25000,
      priceFlb: 20,
      description: 'Monitors component wear and triggers automatic servicing.'
    },
    offline_dispatch: {
      id: 'offline_dispatch',
      label: 'Offline Auto-Dispatch Engine',
      priceUsd: 25000,
      priceFlb: 20,
      description: 'Continuous background dispatching while offline.'
    },
    quant_trader: {
      id: 'quant_trader',
      label: 'AI Quant Trading Bot',
      priceUsd: 35000,
      priceFlb: 25,
      description: 'Autonomous high-frequency cryptocurrency trading engine.'
    }
  },
  '1m': {
    maintenance: {
      id: 'maintenance',
      label: 'Autonomous Fleet Maintenance',
      priceUsd: 85000,
      priceFlb: 60,
      description: 'Monitors component wear and triggers automatic servicing.'
    },
    offline_dispatch: {
      id: 'offline_dispatch',
      label: 'Offline Auto-Dispatch Engine',
      priceUsd: 85000,
      priceFlb: 60,
      description: 'Continuous background dispatching while offline.'
    },
    quant_trader: {
      id: 'quant_trader',
      label: 'AI Quant Trading Bot',
      priceUsd: 120000,
      priceFlb: 80,
      description: 'Autonomous high-frequency cryptocurrency trading engine.'
    }
  },
  'auto': {
    maintenance: {
      id: 'maintenance',
      label: 'Autonomous Fleet Maintenance',
      priceUsd: 75000,
      priceFlb: 50,
      description: 'Monitors component wear and triggers automatic servicing.'
    },
    offline_dispatch: {
      id: 'offline_dispatch',
      label: 'Offline Auto-Dispatch Engine',
      priceUsd: 75000,
      priceFlb: 50,
      description: 'Continuous background dispatching while offline.'
    },
    quant_trader: {
      id: 'quant_trader',
      label: 'AI Quant Trading Bot',
      priceUsd: 95000,
      priceFlb: 65,
      description: 'Autonomous high-frequency cryptocurrency trading engine.'
    }
  },
  'year': {
    maintenance: {
      id: 'maintenance',
      label: 'Autonomous Fleet Maintenance',
      priceUsd: 550000,
      priceFlb: 400,
      description: 'Monitors component wear and triggers automatic servicing.'
    },
    offline_dispatch: {
      id: 'offline_dispatch',
      label: 'Offline Auto-Dispatch Engine',
      priceUsd: 550000,
      priceFlb: 400,
      description: 'Continuous background dispatching while offline.'
    },
    quant_trader: {
      id: 'quant_trader',
      label: 'AI Quant Trading Bot',
      priceUsd: 850000,
      priceFlb: 600,
      description: 'Autonomous high-frequency cryptocurrency trading engine.'
    }
  }
};

export interface AiStrategyMeta {
  id: AiDispatchProfile;
  title: string;
  shortDesc: string;
  icon: string;
  details: string;
}

export const AI_STRATEGY_PROFILES: AiStrategyMeta[] = [
  {
    id: 'highest_payout',
    title: 'Highest Payout USD',
    shortDesc: 'Maximizes gross revenue per consignment',
    icon: 'cash',
    details: 'Prioritizes jobs with the highest total dollar payout ($), ignoring distance.'
  },
  {
    id: 'highest_yield_per_km',
    title: 'Highest Yield ($/km)',
    shortDesc: 'Maximizes financial efficiency per kilometer driven',
    icon: 'activity',
    details: 'Selects consignments offering the greatest revenue rate per kilometer.'
  },
  {
    id: 'nearest_origin',
    title: 'Nearest Origin Proximity',
    shortDesc: 'Minimizes deadhead transit distance to load origin',
    icon: 'pin',
    details: 'Pairs trucks with consignments departing closest to their current location.'
  },
  {
    id: 'shortest_distance',
    title: 'Shortest Distance Run',
    shortDesc: 'Prioritizes quick regional turnaround cycles',
    icon: 'route',
    details: 'Selects the shortest distance freight runs for rapid job completion.'
  },
  {
    id: 'balanced_efficiency',
    title: 'Balanced Optimization',
    shortDesc: 'Optimal blend of yield rate and low deadhead distance',
    icon: 'cpu',
    details: 'Weighted score balancing $/km rate against deadhead transit distance.'
  }
];

export const DEFAULT_AI_FILTERS: AiFilterConfig = {
  enabled: true,
  profile: 'highest_payout',
  intensity: 'balanced',
  minPayoutUsd: 0,
  minYieldUsdPerKm: 0,
  maxDistanceKm: 25000,
  minTruckHealthPct: 0,
  autoRefuel: true,
  requireHazmatCert: false,
  allowSubcontracted: true,
  priorityCargoTypes: []
};

export const DEFAULT_AI_STATE: AiState = {
  subscriptionActive: false,
  expiresTimestamp: 0,
  planId: '1m',
  autoRenew: true,
  maintenanceAddonActive: false,
  maintenanceExpiresTimestamp: 0,
  offlineDispatchActive: false,
  offlineExpiresTimestamp: 0,
  quantTraderActive: false,
  quantTraderExpiresTimestamp: 0,
  filters: DEFAULT_AI_FILTERS,
  logs: [],
  totalDispatchedCount: 0,
  totalRevenueGeneratedUsd: 0
};
