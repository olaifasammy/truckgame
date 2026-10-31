export interface BankLoan {
  id: string;
  name: string;
  principal: number;
  balance: number;
  apr: number; // e.g. 5.5%
  dailyRate: number; // daily interest & principal payment
  termDays: number;
  daysRemaining: number;
}

export interface EquipmentLease {
  id: string;
  modelId: string;
  name: string;
  downPayment: number;
  dailyRate: number;
  termDays: number;
  daysRemaining: number;
  truckId: number;
}

export interface InsurancePolicy {
  id: 'liability' | 'collision' | 'cargo';
  name: string;
  type: string;
  dailyCost: number;
  deductible: number;
  coveragePct: number;
  desc: string;
}

export const INSURANCE_POLICIES: Record<string, InsurancePolicy> = {
  liability: {
    id: 'liability',
    name: 'Statutory Third-Party Liability',
    type: 'Mandatory Road Policy',
    dailyCost: 85,
    deductible: 500,
    coveragePct: 70,
    desc: 'Protects against third-party civil liability, road infrastructure damage, and collision claims.'
  },
  collision: {
    id: 'collision',
    name: 'Comprehensive Collision & Roadside Care',
    type: 'Full Physical Damage',
    dailyCost: 220,
    deductible: 1200,
    coveragePct: 90,
    desc: 'Covers 90% of heavy tractor repairs, towing extraction, rollover recovery, and replacement glass.'
  },
  cargo: {
    id: 'cargo',
    name: 'All-Risk Cargo Spoilage & Hazmat Bond',
    type: 'Freight Protection',
    dailyCost: 310,
    deductible: 800,
    coveragePct: 100,
    desc: '100% indemnification for refrigerated food spoilage, chemical spills, tilt incidents, and stolen cargo.'
  }
};

export const AVAILABLE_LOANS = [
  {
    id: 'working_capital',
    name: 'Commercial Working Capital Facility',
    principal: 50000,
    apr: 5.5,
    termDays: 30,
    dailyRate: 1750,
    minTier: 0,
    requiredRating: 'BBB'
  },
  {
    id: 'fleet_expansion',
    name: 'Fleet Expansion Commercial Line',
    principal: 150000,
    apr: 4.8,
    termDays: 60,
    dailyRate: 2750,
    minTier: 1,
    requiredRating: 'A'
  },
  {
    id: 'infrastructure_bond',
    name: 'Corporate Infrastructure Heavy Loan',
    principal: 350000,
    apr: 3.9,
    termDays: 90,
    dailyRate: 4300,
    minTier: 2,
    requiredRating: 'AA'
  }
];

export function calculateCreditRating(S: any): { rating: 'AAA' | 'AA' | 'A' | 'BBB'; score: number; maxCredit: number } {
  const equity = S.money + ((S.fleet?.length || 0) * 125000) + ((S.offices?.length || 0) * 60000);
  const delivered = S.loads || 0;
  const reputation = S.reputation || 100;

  let score = 600;
  score += Math.min(150, Math.floor(equity / 10000));
  score += Math.min(100, delivered * 5);
  score += Math.min(100, Math.floor(reputation / 2));

  if (score >= 850) return { rating: 'AAA', score, maxCredit: 750000 };
  if (score >= 770) return { rating: 'AA', score, maxCredit: 450000 };
  if (score >= 680) return { rating: 'A', score, maxCredit: 200000 };
  return { rating: 'BBB', score, maxCredit: 80000 };
}

export const REGIONAL_FUEL_SPOT = {
  Lagos: { diesel: 0.82, adBlue: 0.45 },
  Texas: { diesel: 0.94, adBlue: 0.52 },
  Rotterdam: { diesel: 1.48, adBlue: 0.75 },
  Munich: { diesel: 1.68, adBlue: 0.82 },
  Tokyo: { diesel: 1.35, adBlue: 0.68 }
};
