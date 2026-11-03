import { CRYPTO_ASSETS, getCryptoMarketData } from './crypto';

// Simulation time acceleration factor for mining (360x speed: 4 real minutes = 1 simulation day)
export const MINING_TIME_SCALE = 360;

export interface MiningRigTypeDef {
  id: string;
  name: string;
  category: 'ASIC' | 'GPU' | 'Container' | 'Hydro';
  base7dCash: number;     // 7-day base cash cost
  base7dBonds: number;    // 7-day base FLB cost
  powerKw: number;
  dailyPowerCost: number; // USD / day
  grossDailyUsdYield: number; // Daily gross value generated in USD
  hashrate: string;
  requiredVipLevel: number;
}

export interface MiningSubscription {
  id: string;
  typeId: string;
  targetAssetId: string;
  startedAt: number;
  expiresAt: number;
  durationDays: number;
  cashPaid: number;
  bondsPaid: number;
  active: boolean;
}

export interface MiningAdditionDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  cashCost: number;
  bondsCost: number;
  yieldBoostPct: number;    // e.g. +25% yield boost
  powerSavePct: number;     // e.g. -30% power cost reduction
  requiredVipLevel: number;
}

export const MINING_RIG_TYPES: MiningRigTypeDef[] = [
  {
    id: 'asic_s19',
    name: 'Antminer S19 Pro (ASIC)',
    category: 'ASIC',
    base7dCash: 12000,
    base7dBonds: 5,
    powerKw: 3.25,
    dailyPowerCost: 20,
    grossDailyUsdYield: 45,
    hashrate: '110 TH/s',
    requiredVipLevel: 2
  },
  {
    id: 'gpu_array_6',
    name: 'Octa-GPU Rig Cluster',
    category: 'GPU',
    base7dCash: 35000,
    base7dBonds: 15,
    powerKw: 8.50,
    dailyPowerCost: 55,
    grossDailyUsdYield: 120,
    hashrate: '650 MH/s',
    requiredVipLevel: 5
  },
  {
    id: 'container_rig',
    name: 'Modular Hydro Container',
    category: 'Container',
    base7dCash: 110000,
    base7dBonds: 35,
    powerKw: 35.00,
    dailyPowerCost: 220,
    grossDailyUsdYield: 480,
    hashrate: '1,450 TH/s',
    requiredVipLevel: 10
  },
  {
    id: 'datacenter_hydro',
    name: 'MegaWatt Hydro Farm Pod',
    category: 'Hydro',
    base7dCash: 350000,
    base7dBonds: 85,
    powerKw: 120.00,
    dailyPowerCost: 750,
    grossDailyUsdYield: 1650,
    hashrate: '12,500 SOL/s',
    requiredVipLevel: 15
  }
];

export const MINING_ADDITIONS: MiningAdditionDef[] = [
  {
    id: 'liquid_cooling',
    name: 'Immersion Liquid Cooling Tank',
    icon: '❄️',
    description: '+25% Mining Yield boost via extreme thermal dissipation',
    cashCost: 35000,
    bondsCost: 12,
    yieldBoostPct: 25,
    powerSavePct: 0,
    requiredVipLevel: 3
  },
  {
    id: 'solar_auxiliary',
    name: 'Solar Auxiliary Substation',
    icon: '☀️',
    description: '-30% Electricity bill reduction via solar renewable grid',
    cashCost: 65000,
    bondsCost: 20,
    yieldBoostPct: 0,
    powerSavePct: 30,
    requiredVipLevel: 6
  },
  {
    id: 'ai_overclocker',
    name: 'AI Neural Core Overclocker',
    icon: '⚡',
    description: '+35% Yield boost via real-time algorithm tuning',
    cashCost: 120000,
    bondsCost: 35,
    yieldBoostPct: 35,
    powerSavePct: 0,
    requiredVipLevel: 10
  },
  {
    id: 'quantum_hash_accelerator',
    name: 'Quantum Hash Co-Processor',
    icon: '🔮',
    description: '+50% Yield boost & -15% Power cost savings combined',
    cashCost: 280000,
    bondsCost: 75,
    yieldBoostPct: 50,
    powerSavePct: 15,
    requiredVipLevel: 14
  },
  {
    id: 'bess_storage',
    name: 'Industrial BESS Battery System',
    icon: '🔋',
    description: '+30 kW Substation Surge Capacity buffer & -25% power cost via peak-load shaving',
    cashCost: 95000,
    bondsCost: 28,
    yieldBoostPct: 15,
    powerSavePct: 25,
    requiredVipLevel: 8
  }
];

export const MINING_DURATIONS = [
  { days: 7, label: '7 Days', costMult: 1.0 },
  { days: 14, label: '14 Days (10% Off)', costMult: 1.8 },
  { days: 30, label: '30 Days (25% Off)', costMult: 3.4 }
];

export function getVipLevel(S: any): number {
  if (S.companyTier !== undefined) {
    return S.companyTier >= 3 ? (S.companyTier - 2) : 0;
  }
  if (S.vip !== undefined) return Math.max(0, S.vip);
  if (S.vipLevel !== undefined) return Math.max(0, S.vipLevel);
  return 0;
}

export function getSubscriptionCost(typeId: string, durationDays: number) {
  const rigDef = MINING_RIG_TYPES.find(t => t.id === typeId) || MINING_RIG_TYPES[0];
  const durDef = MINING_DURATIONS.find(d => d.days === durationDays) || MINING_DURATIONS[0];

  return {
    cashCost: Math.round(rigDef.base7dCash * durDef.costMult),
    bondsCost: Math.round(rigDef.base7dBonds * durDef.costMult)
  };
}

export function getSubstationUpgradeCost(currentLevel: number) {
  const lvl = Math.max(0, currentLevel || 0);
  return {
    cashCost: Math.round(50000 * Math.pow(1.8, lvl)),
    bondsCost: Math.round(10 * Math.pow(1.5, lvl))
  };
}

export function getSubstationPowerKw(currentLevel: number, S?: any): number {
  let kw = 20 + (currentLevel || 0) * 50;
  if (S?.mining?.upgrades?.['bess_storage']) {
    kw += 30; // +30 kW industrial battery surge buffer
  }
  return kw;
}

export function calculateRigDailyCoinYield(typeId: string, targetAssetId: string, S?: any): number {
  const rigDef = MINING_RIG_TYPES.find(t => t.id === typeId);
  if (!rigDef) return 0;

  let yieldMult = 1.0;
  if (S && S.mining && S.mining.upgrades) {
    for (const addition of MINING_ADDITIONS) {
      if (S.mining.upgrades[addition.id]) {
        yieldMult += addition.yieldBoostPct / 100;
      }
    }
  }

  const market = getCryptoMarketData(targetAssetId);
  const coinPrice = market ? market.sellPrice : (targetAssetId === 'flb' ? 5000 : 1);
  const baseDailyUsd = rigDef.grossDailyUsdYield * yieldMult;
  return coinPrice > 0 ? (baseDailyUsd / coinPrice) : 0;
}

export function processMiningTick(S: any, elapsedMs: number) {
  if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
  const subscriptions: MiningSubscription[] = S.mining.subscriptions || [];

  // Scale elapsedMs by MINING_TIME_SCALE so simulation days advance at game speed
  const simElapsedMs = elapsedMs * MINING_TIME_SCALE;
  const daysElapsed = simElapsedMs / (1000 * 60 * 60 * 24);
  if (daysElapsed <= 0) return;

  if (!S.mining.pendingYield) S.mining.pendingYield = {};

  const now = Date.now();
  let totalPowerCostUSD = 0;

  // Compute active multipliers from system additions
  let yieldMult = 1.0;
  let powerSaveTotalPct = 0;

  if (S.mining.upgrades) {
    for (const add of MINING_ADDITIONS) {
      if (S.mining.upgrades[add.id]) {
        yieldMult += add.yieldBoostPct / 100;
        powerSaveTotalPct += add.powerSavePct;
      }
    }
  }

  // Corporate FLB Staking Tier 4 discount
  const stakedBonds = S.stakedBonds || 0;
  if (stakedBonds >= 75) {
    powerSaveTotalPct += 50;
  }

  const powerCostMult = Math.max(0.05, 1 - Math.min(95, powerSaveTotalPct) / 100);

  const currentPowerKw = getSubstationPowerKw(S.mining.substationLevel || 0, S);
  let totalActivePowerKw = 0;
  subscriptions.forEach(s => {
    if (s.active && now < s.expiresAt) {
      const def = MINING_RIG_TYPES.find(t => t.id === s.typeId);
      if (def) totalActivePowerKw += def.powerKw;
    }
  });

  // If overloaded, thermal throttle efficiency by 50%
  const throttleMult = totalActivePowerKw > currentPowerKw ? 0.5 : 1.0;

  for (const sub of subscriptions) {
    if (!sub.active) continue;

    if (now >= sub.expiresAt) {
      sub.active = false;
      continue;
    }

    const def = MINING_RIG_TYPES.find(t => t.id === sub.typeId);
    if (!def) continue;

    // Power cost check & deduction
    const powerCost = def.dailyPowerCost * powerCostMult * daysElapsed;
    totalPowerCostUSD += powerCost;

    // Yield accrual with booster multiplier & thermal throttle
    const dailyCoinYield = calculateRigDailyCoinYield(sub.typeId, sub.targetAssetId, S) * throttleMult;
    const yieldMined = dailyCoinYield * daysElapsed;

    S.mining.pendingYield[sub.targetAssetId] = (S.mining.pendingYield[sub.targetAssetId] || 0) + yieldMined;
  }

  // FLB Staking Rewards accrual (18.5% APY)
  if (stakedBonds > 0) {
    const dailyStakingFlb = (stakedBonds * 0.185) / 365;
    const flbMined = dailyStakingFlb * daysElapsed;
    S.mining.pendingYield['flb'] = (S.mining.pendingYield['flb'] || 0) + flbMined;
  }

  if (totalPowerCostUSD > 0) {
    S.money = Math.max(0, S.money - totalPowerCostUSD);
  }
}

export function calculateMiningStats(S: any) {
  const mining = S.mining || { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {} };
  const currentPowerKw = getSubstationPowerKw(mining.substationLevel || 0, S);
  const subscriptions: MiningSubscription[] = mining.subscriptions || [];

  const now = Date.now();
  let usedPowerKw = 0;
  let dailyPowerCost = 0;
  let dailyRevenueUsd = 0;

  let yieldMult = 1.0;
  let powerSaveTotalPct = 0;

  if (mining.upgrades) {
    for (const add of MINING_ADDITIONS) {
      if (mining.upgrades[add.id]) {
        yieldMult += add.yieldBoostPct / 100;
        powerSaveTotalPct += add.powerSavePct;
      }
    }
  }

  // Corporate FLB Staking Tier 4 discount
  const stakedBonds = S.stakedBonds || 0;
  if (stakedBonds >= 75) {
    powerSaveTotalPct += 50;
  }

  const powerCostMult = Math.max(0.05, 1 - Math.min(95, powerSaveTotalPct) / 100);

  const activeCoinsSet = new Set<string>();

  for (const sub of subscriptions) {
    if (!sub.active || now >= sub.expiresAt) continue;
    const def = MINING_RIG_TYPES.find(t => t.id === sub.typeId);
    if (!def) continue;

    usedPowerKw += def.powerKw;
    dailyPowerCost += def.dailyPowerCost * powerCostMult;
    activeCoinsSet.add(sub.targetAssetId);

    const dailyCoinYield = calculateRigDailyCoinYield(sub.typeId, sub.targetAssetId, S);
    const market = getCryptoMarketData(sub.targetAssetId);
    const price = market ? market.sellPrice : (sub.targetAssetId === 'flb' ? 5000 : 1);
    dailyRevenueUsd += dailyCoinYield * price;
  }

  const isOverloaded = usedPowerKw > currentPowerKw;
  const powerUsagePct = currentPowerKw > 0 ? (usedPowerKw / currentPowerKw) * 100 : 0;
  const transformerTempC = Math.round(36 + Math.min(65, (powerUsagePct / 100) * 46));
  const transformerStatus = isOverloaded ? 'OVERLOAD TRIPPED' : powerUsagePct > 85 ? 'HIGH LOAD' : 'NOMINAL';
  const cleanEnergyKw = mining.upgrades?.['solar_auxiliary'] ? 12.5 : 0;
  const bessSurgeKw = mining.upgrades?.['bess_storage'] ? 30 : 0;
  const netDailyProfitUsd = dailyRevenueUsd - dailyPowerCost;
  const activeSubsCount = subscriptions.filter(s => s.active && now < s.expiresAt).length;

  // Staking metrics
  const stakingApyPct = 18.5;
  const dailyStakingYieldUsd = (stakedBonds * 5000 * (stakingApyPct / 100)) / 365;
  const dailyStakingYieldFlb = (stakedBonds * (stakingApyPct / 100)) / 365;

  return {
    substationLevel: mining.substationLevel || 0,
    currentPowerKw,
    usedPowerKw,
    isOverloaded,
    transformerTempC,
    transformerStatus,
    cleanEnergyKw,
    bessSurgeKw,
    powerUsagePct: Math.min(100, powerUsagePct),
    rawPowerUsagePct: powerUsagePct,
    dailyPowerCost,
    dailyRevenueUsd,
    netDailyProfitUsd,
    yieldMultiplier: yieldMult,
    powerCostMultiplier: powerCostMult,
    activeCoinsCount: activeCoinsSet.size,
    activeCoinsList: Array.from(activeCoinsSet),
    activeSubsCount,
    totalSubsCount: subscriptions.length,
    pendingYield: mining.pendingYield || {},
    stakedBonds,
    stakingApyPct,
    dailyStakingYieldUsd,
    dailyStakingYieldFlb
  };
}

export function formatCryptoQty(qty: number): string {
  if (qty <= 0) return '0';
  if (qty >= 100) return qty.toFixed(2);
  if (qty >= 1) return qty.toFixed(4);
  if (qty >= 0.001) return qty.toFixed(5);
  return qty.toFixed(7);
}
