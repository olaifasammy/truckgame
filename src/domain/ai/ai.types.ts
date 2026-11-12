/**
 * AI Dispatcher & Enterprise Operations System Domain Types
 */

export type AiDispatchProfile =
  | 'highest_payout'
  | 'highest_yield_per_km'
  | 'nearest_origin'
  | 'shortest_distance'
  | 'balanced_efficiency';

export interface AiSubscriptionPlan {
  id: '7d' | '1m' | 'auto' | 'year';
  label: string;
  days: number;
  priceUsd: number;
  priceFlb: number;
  badge?: string;
  description: string;
}

export interface AiAddonPlan {
  id: 'maintenance' | 'offline_dispatch' | 'quant_trader';
  label: string;
  priceUsd: number;
  priceFlb: number;
  description: string;
}

export interface AiFilterConfig {
  enabled: boolean;
  profile: AiDispatchProfile;
  intensity: 'conservative' | 'balanced' | 'aggressive';
  minPayoutUsd: number;
  minYieldUsdPerKm: number;
  maxDistanceKm: number;
  minTruckHealthPct: number;
  autoRefuel: boolean;
  requireHazmatCert: boolean;
  allowSubcontracted: boolean;
  priorityCargoTypes: string[];
}

export interface AiLogEntry {
  id: string;
  timestamp: number;
  simTimeFormatted: string;
  truckId: number;
  truckName: string;
  jobId: number;
  cargoName: string;
  from: string;
  to: string;
  payoutUsd: number;
  km: number;
  yieldPerKm: number;
  profileUsed: AiDispatchProfile;
  status: 'dispatched' | 'serviced' | 'offline_dispatched' | 'failed';
  message: string;
  features?: number[];
}

export interface AiState {
  subscriptionActive: boolean;
  expiresTimestamp: number;
  planId: string;
  autoRenew: boolean;
  maintenanceAddonActive: boolean;
  maintenanceExpiresTimestamp: number;
  offlineDispatchActive: boolean;
  offlineExpiresTimestamp: number;
  quantTraderActive: boolean;
  quantTraderExpiresTimestamp: number;
  filters: AiFilterConfig;
  logs: AiLogEntry[];
  totalDispatchedCount: number;
  totalRevenueGeneratedUsd: number;
}
