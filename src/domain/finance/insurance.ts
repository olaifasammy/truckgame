import { INSURANCE_POLICIES, InsurancePolicy } from './banking';
import { getCompanySafetyRating } from '../trucks/registration';

export type DeductibleTier = 'low_deductible' | 'standard' | 'high_deductible';

export interface DeductibleTierConfig {
  id: DeductibleTier;
  label: string;
  premiumMult: number;
  deductibleMult: number;
  desc: string;
}

export const DEDUCTIBLE_TIERS: Record<DeductibleTier, DeductibleTierConfig> = {
  low_deductible: {
    id: 'low_deductible',
    label: 'Low Deductible (+15%)',
    premiumMult: 1.15,
    deductibleMult: 0.5,
    desc: 'Halves out-of-pocket deductibles on collision & cargo claims.'
  },
  standard: {
    id: 'standard',
    label: 'Standard Terms',
    premiumMult: 1.0,
    deductibleMult: 1.0,
    desc: 'Balanced commercial carrier deductible and premium schedule.'
  },
  high_deductible: {
    id: 'high_deductible',
    label: 'High Deductible (-15%)',
    premiumMult: 0.85,
    deductibleMult: 1.75,
    desc: 'Reduces daily premiums by 15% with higher per-incident deductible.'
  }
};

export interface UnderwritingProfile {
  riskScore: number; // 0 (safest) to 100 (highest risk)
  riskGrade: 'LOW RISK' | 'MODERATE' | 'ELEVATED' | 'HIGH RISK';
  safetyGrade: string;
  premiumMultiplier: number;
  fleetCount: number;
  avgFleetHealth: number;
  uncompliantTrucks: number;
  fatiguedDrivers: number;
  tier: DeductibleTierConfig;
  activePolicies: number;
  dailyPremiumUsd: number;
  annualizedPremiumUsd: number;
  totalClaimsPaidUsd: number;
  claimCount: number;
}

export function getEffectivePolicyNumbers(
  policy: InsurancePolicy,
  profile: UnderwritingProfile
): { dailyCost: number; deductible: number } {
  const unitScale = Math.max(1, profile.fleetCount);
  const perUnitMap: Record<string, number> = {
    liability: 65,
    collision: 140,
    cargo: 110
  };
  const baseUnit = perUnitMap[policy.id] ?? policy.dailyCost;
  const rawDaily = profile.fleetCount > 0 ? baseUnit * unitScale : policy.dailyCost;
  const dailyCost = Math.round(rawDaily * profile.premiumMultiplier * profile.tier.premiumMult);
  const deductible = Math.round(policy.deductible * profile.tier.deductibleMult);
  return { dailyCost, deductible };
}

export function calculateUnderwritingProfile(S: any): UnderwritingProfile {
  const fleet = Array.isArray(S?.fleet) ? S.fleet : [];
  const drivers = Array.isArray(S?.drivers) ? S.drivers : [];
  const ins = S?.insurance || { liability: true, collision: true, cargo: false };
  const tierId: DeductibleTier =
    S?.insuranceTier && DEDUCTIBLE_TIERS[S.insuranceTier as DeductibleTier]
      ? (S.insuranceTier as DeductibleTier)
      : 'standard';
  const tier = DEDUCTIBLE_TIERS[tierId];

  const safety = getCompanySafetyRating(S);

  let healthSum = 0;
  let uncompliantTrucks = 0;
  for (const t of fleet) {
    const parts = t?.components ? Object.values(t.components) : [];
    const avgPart =
      parts.length > 0
        ? parts.reduce((acc: number, p: any) => acc + (Number(p?.health) || 0), 0) / parts.length
        : (Number(t?.condition) || 100);
    healthSum += avgPart;
    if (!t?.regNo || t?.registrationStatus === 'unregistered' || t?.registrationStatus === 'suspended' || t?.registrationStatus === 'inspection_expired') {
      uncompliantTrucks++;
    }
  }
  const avgFleetHealth = fleet.length > 0 ? Math.round(healthSum / fleet.length) : 100;

  let fatiguedDrivers = 0;
  for (const d of drivers) {
    if ((Number(d?.fatigue) || 0) >= 70 || (Number(d?.stress) || 0) >= 80) {
      fatiguedDrivers++;
    }
  }

  const claims = Array.isArray(S?.insuranceClaims) ? S.insuranceClaims : [];
  const claimCount = claims.length;
  const totalClaimsPaidUsd = claims.reduce((sum: number, c: any) => sum + (Number(c?.payoutUsd) || 0), 0);

  // Risk score calculation (0 - 100)
  let riskScore = 18;
  if (safety.grade === 'CONDITIONAL') riskScore += 18;
  if (safety.grade === 'UNSATISFACTORY') riskScore += 35;
  if (avgFleetHealth < 85) riskScore += Math.round((85 - avgFleetHealth) * 0.6);
  riskScore += uncompliantTrucks * 8;
  riskScore += fatiguedDrivers * 6;
  riskScore += Math.min(25, claimCount * 5);
  riskScore = Math.max(5, Math.min(100, riskScore));

  const riskGrade: UnderwritingProfile['riskGrade'] =
    riskScore <= 25 ? 'LOW RISK' : riskScore <= 50 ? 'MODERATE' : riskScore <= 75 ? 'ELEVATED' : 'HIGH RISK';

  // Safe carrier discount (-15% at lowest risk) up to +35% surcharge
  const premiumMultiplier = Math.round((0.85 + (riskScore / 100) * 0.5) * 100) / 100;

  const tempProfile: UnderwritingProfile = {
    riskScore,
    riskGrade,
    safetyGrade: safety.grade,
    premiumMultiplier,
    fleetCount: fleet.length,
    avgFleetHealth,
    uncompliantTrucks,
    fatiguedDrivers,
    tier,
    activePolicies: 0,
    dailyPremiumUsd: 0,
    annualizedPremiumUsd: 0,
    totalClaimsPaidUsd,
    claimCount
  };

  let activePolicies = 0;
  let dailyPremiumUsd = 0;
  for (const policy of Object.values(INSURANCE_POLICIES)) {
    if (ins[policy.id]) {
      activePolicies++;
      dailyPremiumUsd += getEffectivePolicyNumbers(policy, tempProfile).dailyCost;
    }
  }

  return {
    ...tempProfile,
    activePolicies,
    dailyPremiumUsd,
    annualizedPremiumUsd: dailyPremiumUsd * 365
  };
}
