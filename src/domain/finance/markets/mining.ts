import { CRYPTO_ASSETS, getCryptoMarketData } from './crypto';
import { recordTransaction } from '../../../core/ledger';

// Simulation time acceleration factor for mining (360x speed: 4 real minutes = 1 simulation day)
export const MINING_TIME_SCALE = 360;

export interface MiningRigTypeDef {
  id: string;
  name: string;
  category: 'ASIC' | 'GPU' | 'Container' | 'Hydro' | 'NextGen';
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
    base7dCash: 450,
    base7dBonds: 0,
    powerKw: 3.25,
    dailyPowerCost: 0.04,
    grossDailyUsdYield: 0.24,
    hashrate: '110 TH/s',
    requiredVipLevel: 1
  },
  {
    id: 'gpu_array_6',
    name: 'Industrial GPU Rack',
    category: 'GPU',
    base7dCash: 1200,
    base7dBonds: 2,
    powerKw: 7.50,
    dailyPowerCost: 0.12,
    grossDailyUsdYield: 0.65,
    hashrate: '650 MH/s',
    requiredVipLevel: 3
  },
  {
    id: 'container_rig',
    name: 'Modular Cooling Container',
    category: 'Container',
    base7dCash: 4500,
    base7dBonds: 5,
    powerKw: 24.00,
    dailyPowerCost: 0.38,
    grossDailyUsdYield: 2.45,
    hashrate: '1,850 TH/s',
    requiredVipLevel: 5
  },
  {
    id: 'datacenter_hydro',
    name: 'Hydro-Cooled Hashing Farm',
    category: 'Hydro',
    base7dCash: 12500,
    base7dBonds: 12,
    powerKw: 55.00,
    dailyPowerCost: 0.85,
    grossDailyUsdYield: 6.80,
    hashrate: '8,500 TH/s',
    requiredVipLevel: 8
  },
  {
    id: 'hpc_tier_1',
    name: 'Enterprise High-Density Node',
    category: 'NextGen',
    base7dCash: 35000,
    base7dBonds: 25,
    powerKw: 90.00,
    dailyPowerCost: 1.45,
    grossDailyUsdYield: 18.50,
    hashrate: '28,000 TH/s',
    requiredVipLevel: 12
  },
  {
    id: 'hpc_tier_2',
    name: 'Parallel Compute Infrastructure',
    category: 'NextGen',
    base7dCash: 75000,
    base7dBonds: 55,
    powerKw: 140.00,
    dailyPowerCost: 2.30,
    grossDailyUsdYield: 38.00,
    hashrate: '75,000 TH/s',
    requiredVipLevel: 15
  },
  {
    id: 'datacenter_modular',
    name: 'Industrial Data Center Hub',
    category: 'NextGen',
    base7dCash: 180000,
    base7dBonds: 120,
    powerKw: 210.00,
    dailyPowerCost: 3.50,
    grossDailyUsdYield: 85.00,
    hashrate: '185,000 TH/s',
    requiredVipLevel: 20
  }
];

export const MINING_ADDITIONS: MiningAdditionDef[] = [
  {
    id: 'liquid_cooling',
    name: 'Immersion Liquid Cooling Tank',
    icon: '❄️',
    description: '+15% Mining Yield boost via improved thermal stability',
    cashCost: 1200,
    bondsCost: 1,
    yieldBoostPct: 15,
    powerSavePct: 0,
    requiredVipLevel: 2
  },
  {
    id: 'solar_auxiliary',
    name: 'Solar Auxiliary Array',
    icon: '☀️',
    description: '-15% Electricity bill reduction via renewable offsets',
    cashCost: 2800,
    bondsCost: 1,
    yieldBoostPct: 0,
    powerSavePct: 15,
    requiredVipLevel: 2
  },
  {
    id: 'ai_overclocker',
    name: 'Firmware Optimization Suite',
    icon: '⚡',
    description: '+20% Yield boost via custom ASIC autotuning firmware',
    cashCost: 6500,
    bondsCost: 2,
    yieldBoostPct: 20,
    powerSavePct: 0,
    requiredVipLevel: 3
  },
  {
    id: 'bess_storage',
    name: 'Industrial Battery Backup (BESS)',
    icon: '🔋',
    description: '+50 kW Power Buffer & -10% power cost via peak-load shaving',
    cashCost: 14500,
    bondsCost: 4,
    yieldBoostPct: 8,
    powerSavePct: 10,
    requiredVipLevel: 4
  }
];

export interface NextGenHardwareUpgrade {
  id: string;
  tier: number;
  name: string;
  codename: string;
  icon: string;
  accentColor: string;
  glowColor: string;
  aestheticName: string;
  aestheticDesc: string;
  cashCost: number;
  bondsCost: number;
  bonusYieldPct: number;
  bonusPowerEfficiencyPct: number;
  auxiliaryPowerKw: number;
  pueReduction: number;
  specialCapability: string;
  requiredVipLevel: number;
}

export const NEXT_GEN_HARDWARE: NextGenHardwareUpgrade[] = [
  {
    id: 'ng_photonic_bus',
    tier: 1,
    name: 'Optical Data Interconnect',
    codename: 'LUMEN-I',
    icon: '💡',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    aestheticName: 'OPTICAL FABRIC ACTIVE',
    aestheticDesc: 'High-speed fiber interconnects reduce latency between clusters for improved block submission.',
    cashCost: 12000,
    bondsCost: 5,
    bonusYieldPct: 5,
    bonusPowerEfficiencyPct: 4,
    auxiliaryPowerKw: 15,
    pueReduction: 0.02,
    specialCapability: 'Reduced network jitter',
    requiredVipLevel: 5
  },
  {
    id: 'ng_cryo_chiller',
    tier: 2,
    name: 'Industrial Refrigeration Loop',
    codename: 'CHILL-X',
    icon: '❄️',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    aestheticName: 'COOLING LOOP ON-LINE',
    aestheticDesc: 'Closed-loop industrial refrigeration maintains board stability under heavy sustained load.',
    cashCost: 28000,
    bondsCost: 15,
    bonusYieldPct: 8,
    bonusPowerEfficiencyPct: 7,
    auxiliaryPowerKw: 35,
    pueReduction: 0.04,
    specialCapability: 'Improved thermal stability',
    requiredVipLevel: 10
  },
  {
    id: 'ng_neuromorphic_coprocessor',
    tier: 3,
    name: 'Algorithmic Load Balancer',
    codename: 'BALANCER-V',
    icon: '🧠',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    aestheticName: 'LOAD BALANCER ACTIVE',
    aestheticDesc: 'Automated workload distribution shifts hashing power to the most stable network pool.',
    cashCost: 65000,
    bondsCost: 35,
    bonusYieldPct: 12,
    bonusPowerEfficiencyPct: 6,
    auxiliaryPowerKw: 45,
    pueReduction: 0.03,
    specialCapability: 'Dynamic algorithm rebalancing',
    requiredVipLevel: 15
  },
  {
    id: 'ng_quantum_annealer',
    tier: 4,
    name: 'Parallel Compute Lattice',
    codename: 'LATTICE-P',
    icon: '🔮',
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    aestheticName: 'COMPUTE LATTICE STABILIZED',
    aestheticDesc: 'Advanced hardware lattice maximizes hashing efficiency for multi-threaded extraction.',
    cashCost: 145000,
    bondsCost: 75,
    bonusYieldPct: 15,
    bonusPowerEfficiencyPct: 10,
    auxiliaryPowerKw: 80,
    pueReduction: 0.05,
    specialCapability: 'Dual-Coin Hashing capability',
    requiredVipLevel: 20
  },
  {
    id: 'ng_zeropoint_grid',
    tier: 5,
    name: 'On-Site Modular Power Substation',
    codename: 'GRID-PRO',
    icon: '⚛️',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    aestheticName: 'POWER SUBSTATION ACTIVE',
    aestheticDesc: 'Dedicated industrial substation provides massive clean baseload power for scale-out deployment.',
    cashCost: 450000,
    bondsCost: 150,
    bonusYieldPct: 25,
    bonusPowerEfficiencyPct: 15,
    auxiliaryPowerKw: 150,
    pueReduction: 0.08,
    specialCapability: '+150 kW Dedicated baseload power',
    requiredVipLevel: 25
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

export type MiningTuningProfile = 'eco' | 'balanced' | 'overclock';

export interface TuningConfig {
  name: string;
  powerFactor: number;
  yieldFactor: number;
  baseTempC: number;
  pueDelta: number;
  badge: string;
  description: string;
}

export const MINING_TUNING_PROFILES: Record<MiningTuningProfile, TuningConfig> = {
  eco: {
    name: 'Eco-Efficiency Mode',
    powerFactor: 0.75,
    yieldFactor: 0.82,
    baseTempC: 42,
    pueDelta: -0.05,
    badge: '🌱 ECO',
    description: 'Undervolts ASICs & GPUs by 18%. Reduces power draw and operating temperatures.'
  },
  balanced: {
    name: 'Standard Nominal Mode',
    powerFactor: 1.00,
    yieldFactor: 1.00,
    baseTempC: 56,
    pueDelta: 0.00,
    badge: '⚖️ NOMINAL',
    description: 'Factory clock speeds and standard OEM thermal envelope.'
  },
  overclock: {
    name: 'Industrial Overclock (+28%)',
    powerFactor: 1.35,
    yieldFactor: 1.28,
    baseTempC: 78,
    pueDelta: 0.12,
    badge: '⚡ OVERCLOCK',
    description: 'Pushes clock frequencies for peak hash throughput. Demands heavy substation power & cooling.'
  }
};

export function getSubstationUpgradeCost(currentLevel: number) {
  const lvl = Math.max(0, currentLevel || 0);
  return {
    cashCost: Math.round(48000 * Math.pow(1.5, lvl)),
    bondsCost: Math.max(1, Math.floor(lvl * 1.5) + 1)
  };
}

export function getSubstationPowerKw(currentLevel: number, S?: any): number {
  let kw = 250 + (currentLevel || 0) * 350;
  if (S?.mining?.upgrades?.['bess_storage']) {
    kw += 100; // +100 kW industrial battery surge buffer
  }
  if (S?.mining?.nextGenHardware) {
    for (const hw of NEXT_GEN_HARDWARE) {
      if (S.mining.nextGenHardware[hw.id]) {
        kw += hw.auxiliaryPowerKw;
      }
    }
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

  // Apply permanent Next-Gen hardware yield bonuses
  if (S?.mining?.nextGenHardware) {
    for (const hw of NEXT_GEN_HARDWARE) {
      if (S.mining.nextGenHardware[hw.id]) {
        yieldMult += hw.bonusYieldPct / 100;
      }
    }
  }

  // Apply tuning profile multiplier
  const tuning: MiningTuningProfile = S?.mining?.tuning || 'balanced';
  const tuningDef = MINING_TUNING_PROFILES[tuning] || MINING_TUNING_PROFILES.balanced;
  yieldMult *= tuningDef.yieldFactor;

  const market = getCryptoMarketData(targetAssetId);
  const coinPrice = market ? market.sellPrice : (targetAssetId === 'flb' ? 5000 : 1);
  const baseDailyUsd = rigDef.grossDailyUsdYield * yieldMult;
  return coinPrice > 0 ? (baseDailyUsd / coinPrice) : 0;
}

export function processMiningTick(S: any, elapsedMs: number) {
  if (!S.mining) S.mining = { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {}, tuning: 'balanced', nextGenHardware: {} };
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

  // Apply Next-Gen hardware power savings
  if (S.mining.nextGenHardware) {
    for (const hw of NEXT_GEN_HARDWARE) {
      if (S.mining.nextGenHardware[hw.id]) {
        powerSaveTotalPct += hw.bonusPowerEfficiencyPct;
      }
    }
  }

  // Corporate FLB Staking Tier 4 discount
  const stakedBonds = S.stakedBonds || 0;
  if (stakedBonds >= 75) {
    powerSaveTotalPct += 50;
  }

  const tuning: MiningTuningProfile = S.mining.tuning || 'balanced';
  const tuningDef = MINING_TUNING_PROFILES[tuning] || MINING_TUNING_PROFILES.balanced;
  const powerCostMult = Math.max(0.05, (1 - Math.min(95, powerSaveTotalPct) / 100) * tuningDef.powerFactor);

  const currentPowerKw = getSubstationPowerKw(S.mining.substationLevel || 0, S);
  let totalActivePowerKw = 0;
  subscriptions.forEach(s => {
    if (s.active && now < s.expiresAt) {
      const def = MINING_RIG_TYPES.find(t => t.id === s.typeId);
      if (def) totalActivePowerKw += def.powerKw * tuningDef.powerFactor;
    }
  });

  // Automated circuit breaker load shedding or thermal throttle
  const isOverloaded = totalActivePowerKw > currentPowerKw;
  const throttleMult = isOverloaded ? 0.35 : 1.0;

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

  // FLB Staking Rewards accrual (28.5% APY)
  if (stakedBonds > 0) {
    const dailyStakingFlb = (stakedBonds * 0.285) / 365;
    const flbMined = dailyStakingFlb * daysElapsed;
    S.mining.pendingYield['flb'] = (S.mining.pendingYield['flb'] || 0) + flbMined;
  }

  if (totalPowerCostUSD > 0) {
    recordTransaction(S, 'expense_fuel', -totalPowerCostUSD, `Crypto Data Center Electricity & Power Draw`);
  }
}

export function calculateMiningStats(S: any) {
  const mining = S.mining || { substationLevel: 0, subscriptions: [], upgrades: {}, pendingYield: {}, tuning: 'balanced', nextGenHardware: {} };
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

  // Next-Gen hardware active bonuses
  let nextGenBonusYieldPct = 0;
  let nextGenPowerSavePct = 0;
  let nextGenCleanKw = 0;
  let nextGenPueReduction = 0;
  const installedNextGenList: NextGenHardwareUpgrade[] = [];

  if (mining.nextGenHardware) {
    for (const hw of NEXT_GEN_HARDWARE) {
      if (mining.nextGenHardware[hw.id]) {
        installedNextGenList.push(hw);
        nextGenBonusYieldPct += hw.bonusYieldPct;
        nextGenPowerSavePct += hw.bonusPowerEfficiencyPct;
        nextGenCleanKw += hw.auxiliaryPowerKw;
        nextGenPueReduction += hw.pueReduction;
      }
    }
  }

  yieldMult += nextGenBonusYieldPct / 100;
  powerSaveTotalPct += nextGenPowerSavePct;

  // Corporate FLB Staking Tier 4 discount
  const stakedBonds = S.stakedBonds || 0;
  if (stakedBonds >= 75) {
    powerSaveTotalPct += 50;
  }

  const tuning: MiningTuningProfile = mining.tuning || 'balanced';
  const tuningDef = MINING_TUNING_PROFILES[tuning] || MINING_TUNING_PROFILES.balanced;
  const powerCostMult = Math.max(0.05, (1 - Math.min(95, powerSaveTotalPct) / 100) * tuningDef.powerFactor);

  const activeCoinsSet = new Set<string>();

  for (const sub of subscriptions) {
    if (!sub.active || now >= sub.expiresAt) continue;
    const def = MINING_RIG_TYPES.find(t => t.id === sub.typeId);
    if (!def) continue;

    usedPowerKw += def.powerKw * tuningDef.powerFactor;
    dailyPowerCost += def.dailyPowerCost * powerCostMult;
    activeCoinsSet.add(sub.targetAssetId);

    const dailyCoinYield = calculateRigDailyCoinYield(sub.typeId, sub.targetAssetId, S);
    const market = getCryptoMarketData(sub.targetAssetId);
    const price = market ? market.sellPrice : (sub.targetAssetId === 'flb' ? 5000 : 1);
    dailyRevenueUsd += dailyCoinYield * price;
  }

  const isOverloaded = usedPowerKw > currentPowerKw;
  const powerUsagePct = currentPowerKw > 0 ? (usedPowerKw / currentPowerKw) * 100 : 0;
  
  // Dynamic PUE (Power Usage Effectiveness) based on infrastructure & tuning
  let basePue = 1.22 + tuningDef.pueDelta - nextGenPueReduction;
  if (mining.upgrades?.['cryo_immersion']) basePue -= 0.10;
  if (mining.upgrades?.['geothermal_loop']) basePue -= 0.05;
  const pue = Math.max(1.02, Math.round(basePue * 100) / 100);

  // Sub-zero cryo drops transformer temp
  const cryoInstalled = !!mining.nextGenHardware?.['ng_subzero_cryo'];
  const baseTempMod = cryoInstalled ? -18 : 0;
  const transformerTempC = Math.max(22, Math.round(tuningDef.baseTempC + baseTempMod + Math.min(45, (powerUsagePct / 100) * 32)));
  const transformerStatus = isOverloaded ? 'OVERLOAD TRIPPED' : powerUsagePct > 85 ? 'HIGH LOAD' : 'NOMINAL';
  
  const cleanEnergyKw = (mining.upgrades?.['solar_auxiliary'] ? 12.5 : 0) + nextGenCleanKw;
  const bessSurgeKw = mining.upgrades?.['bess_storage'] ? 100 : 0;
  const netDailyProfitUsd = dailyRevenueUsd - dailyPowerCost;
  const activeSubsCount = subscriptions.filter(s => s.active && now < s.expiresAt).length;

  // Staking metrics
  const stakingApyPct = 28.5;
  const dailyStakingYieldUsd = (stakedBonds * 25000 * (stakingApyPct / 100)) / 365;
  const dailyStakingYieldFlb = (stakedBonds * (stakingApyPct / 100)) / 365;

  return {
    substationLevel: mining.substationLevel || 0,
    currentPowerKw,
    usedPowerKw,
    isOverloaded,
    transformerTempC,
    transformerStatus,
    pue,
    tuning,
    tuningDef,
    cleanEnergyKw,
    bessSurgeKw,
    powerUsagePct: Math.min(100, powerUsagePct),
    rawPowerUsagePct: powerUsagePct,
    dailyPowerCost,
    dailyRevenueUsd,
    netDailyProfitUsd,
    yieldMultiplier: yieldMult * tuningDef.yieldFactor,
    powerCostMultiplier: powerCostMult,
    activeCoinsCount: activeCoinsSet.size,
    activeCoinsList: Array.from(activeCoinsSet),
    activeSubsCount,
    totalSubsCount: subscriptions.length,
    pendingYield: mining.pendingYield || {},
    stakedBonds,
    stakingApyPct,
    dailyStakingYieldUsd,
    dailyStakingYieldFlb,
    nextGenBonusYieldPct,
    nextGenPowerSavePct,
    nextGenCleanKw,
    installedNextGenList,
    dualMiningUnlocked: !!mining.nextGenHardware?.['ng_quantum_annealer']
  };
}

export function formatCryptoQty(qty: number): string {
  if (qty <= 0) return '0';
  if (qty >= 100) return qty.toFixed(2);
  if (qty >= 1) return qty.toFixed(4);
  if (qty >= 0.001) return qty.toFixed(5);
  return qty.toFixed(7);
}
