/**
 * Commercial Banking, Loans, and Credit Rating Domain Engine
 * Implements strict real-life loan guardrails, competitive introductory startup rates,
 * company rank and tier eligibility, required permits, and bank committee approval.
 */

import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export interface LoanOffer {
  id: string;
  name: string;
  category: 'startup' | 'fleet' | 'enterprise' | 'special';
  lender: string;
  principal: number;
  apr: number;
  termDays: number;
  dailyRate: number;
  totalRepayment: number;
  totalInterest: number;
  requiredRating: string;
  requiredTier: number; // Company rank tier required (0 to 10+)
  requiredPermit?: string; // Required permit / certification
  minAssetsRequired: number;
  badge: string;
  description: string;
  benefits: string[];
  expiresAtMs?: number;
}

export interface EnterpriseCreditProfile {
  creditScore: number;
  score: number;
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  rating: string;
  borrowingLimitUsd: number;
  maxCreditLimitUsd: number;
  availableCreditUsd: number;
  totalAssetsUsd: number;
  activeDebtUsd: number;
  debtToAssetRatio: number;
  scoreFactors: string[];
}

/**
 * Calculates credit score and strict debt capacity limits (max 12% debt-to-asset guardrail).
 */
export function calculateEnterpriseCreditProfile(S: any): EnterpriseCreditProfile {
  let assets = 150000; // Base baseline assets
  if (typeof S.money === 'number') assets += S.money;
  if (Array.isArray(S.fleet)) {
    assets += S.fleet.length * 140000;
  }
  if (Array.isArray(S.depots)) {
    assets += S.depots.length * 250000;
  }

  const activeLoans = S.loans || [];
  const activeDebtUsd = activeLoans.reduce((sum: number, l: any) => sum + (l.remainingBalance || l.principal), 0);

  const debtToAssetRatio = assets > 0 ? activeDebtUsd / assets : 0;

  // Credit scoring algorithm (300 - 850)
  let score = 580; // Baseline
  if (assets > 500000) score += 90;
  if (assets > 2000000) score += 110;
  if (activeLoans.length === 0) score += 45;
  if (debtToAssetRatio < 0.08) score += 55;
  else if (debtToAssetRatio > 0.15) score -= 120; // Heavy debt penalty

  score = Math.max(300, Math.min(850, score));

  let creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' = 'BBB';
  let capacityMultiplier = 0.12; // Strict guardrail: max 12% debt-to-asset limit

  if (score >= 800) { creditRating = 'AAA'; capacityMultiplier = 0.15; }
  else if (score >= 730) { creditRating = 'AA'; capacityMultiplier = 0.14; }
  else if (score >= 650) { creditRating = 'A'; capacityMultiplier = 0.13; }
  else if (score >= 580) { creditRating = 'BBB'; capacityMultiplier = 0.12; }
  else if (score >= 480) { creditRating = 'BB'; capacityMultiplier = 0.10; }
  else { creditRating = 'B'; capacityMultiplier = 0.08; }

  const borrowingLimitUsd = Math.round(assets * capacityMultiplier);
  const maxCreditLimitUsd = borrowingLimitUsd;
  const availableCreditUsd = Math.max(0, maxCreditLimitUsd - activeDebtUsd);

  const scoreFactors: string[] = [];
  if (debtToAssetRatio > 0.12) scoreFactors.push('⚠️ High Debt-to-Asset ratio restricting new credit approvals.');
  if (activeLoans.length > 2) scoreFactors.push('⚠️ Multiple active credit facilities increase default risk.');
  if (score >= 730) scoreFactors.push('✓ Excellent commercial credit standing.');
  if (assets > 1000000) scoreFactors.push('✓ Strong enterprise asset collateral backing.');

  return {
    creditScore: score,
    score,
    creditRating,
    rating: creditRating,
    borrowingLimitUsd,
    maxCreditLimitUsd,
    availableCreditUsd,
    totalAssetsUsd: Math.round(assets),
    activeDebtUsd: Math.round(activeDebtUsd),
    debtToAssetRatio: Math.round(debtToAssetRatio * 100) / 100,
    scoreFactors
  };
}

/**
 * Calculates exact daily loan amortization rate and total cost.
 */
export function calculateLoanAmortization(principal: number, aprPct: number, termDays: number) {
  const totalInterest = Math.round(principal * (aprPct / 100) * (termDays / 365));
  const totalRepayment = principal + totalInterest;
  const dailyRate = Math.ceil(totalRepayment / termDays);
  return { totalInterest, totalRepayment, dailyRate };
}

/**
 * Generates dynamic, realistic loan offers requiring specific company ranks, permits, and committee approval.
 */
export function getAvailableLoanOffers(S: any): LoanOffer[] {
  const profile = calculateEnterpriseCreditProfile(S);
  const assets = profile.totalAssetsUsd;
  const offers: LoanOffer[] = [];

  // ==========================================
  // 1. Startup Micro-Credit (Tier 0 - Newbie) - Lower introductory interest rate (9.5% APR)
  // ==========================================
  const seedPrincipal = 15000;
  const seedAmort = calculateLoanAmortization(seedPrincipal, 9.5, 21);
  offers.push({
    id: 'startup_seed',
    name: 'Founder Startup Micro-Credit',
    category: 'startup',
    lender: 'First Commercial Small Business Trust',
    principal: seedPrincipal,
    apr: 9.5,
    termDays: 21,
    dailyRate: seedAmort.dailyRate,
    totalRepayment: seedAmort.totalRepayment,
    totalInterest: seedAmort.totalInterest,
    requiredRating: 'B',
    requiredTier: 0,
    minAssetsRequired: 0,
    badge: 'STARTUP BOOSTER (9.5% APR)',
    description: 'Low-interest introductory startup capital designed for new carriers to acquire fuel, licenses, and basic shop supplies.',
    benefits: ['Low introductory 9.5% APR', 'Zero collateral requirement', 'Available at Newbie rank']
  });

  // ==========================================
  // 2. Working Capital Line (Tier 1 - Professional)
  // ==========================================
  const payrollPrincipal = 40000;
  const payrollAmort = calculateLoanAmortization(payrollPrincipal, 18.5, 30);
  offers.push({
    id: 'working_capital',
    name: 'Operating Cashflow & Payroll Facility',
    category: 'startup',
    lender: 'Apex Logistics Capital',
    principal: payrollPrincipal,
    apr: 18.5,
    termDays: 30,
    dailyRate: payrollAmort.dailyRate,
    totalRepayment: payrollAmort.totalRepayment,
    totalInterest: payrollAmort.totalInterest,
    requiredRating: 'BB',
    requiredTier: 1,
    requiredPermit: 'Logistics License Tier 1',
    minAssetsRequired: 30000,
    badge: 'EXPEDITION CASH',
    description: 'Short-term liquidity facility to float driver wages, insurance deductibles, and unexpected breakdown repairs.',
    benefits: ['Requires Professional Rank (Tier 1)', 'Requires Logistics License', '30-day term']
  });

  // ==========================================
  // 3. Equipment Financing (Tier 2 - Expert)
  // ==========================================
  const tractorPrincipal = 120000;
  const tractorAmort = calculateLoanAmortization(tractorPrincipal, 24.0, 60);
  offers.push({
    id: 'single_tractor_facility',
    name: 'Heavy Commercial Tractor Equipment Facility',
    category: 'fleet',
    lender: 'Volvo-Scania Financial Services',
    principal: tractorPrincipal,
    apr: 24.0,
    termDays: 60,
    dailyRate: tractorAmort.dailyRate,
    totalRepayment: tractorAmort.totalRepayment,
    totalInterest: tractorAmort.totalInterest,
    requiredRating: 'BBB',
    requiredTier: 2,
    requiredPermit: 'Commercial Transport Permit',
    minAssetsRequired: 100000,
    badge: 'EQUIPMENT FINANCING',
    description: 'Asset-backed commercial equipment facility calibrated to purchase heavy tractor units. Requires Expert rank and Transport Permit.',
    benefits: ['Requires Expert Rank (Tier 2)', 'Requires Commercial Permit', '60-day repayment runway']
  });

  // ==========================================
  // 4. Multi-Truck Fleet Credit Line (Tier 3 - VIP 1+)
  // ==========================================
  const multiFleetPrincipal = Math.min(250000, Math.max(100000, Math.round(assets * 0.10 / 25000) * 25000));
  const multiAmort = calculateLoanAmortization(multiFleetPrincipal, 26.5, 90);
  offers.push({
    id: 'fleet_expansion',
    name: 'Commercial Fleet Multi-Tractor Credit Line',
    category: 'fleet',
    lender: 'National Freight Equipment Credit',
    principal: multiFleetPrincipal,
    apr: 26.5,
    termDays: 90,
    dailyRate: multiAmort.dailyRate,
    totalRepayment: multiAmort.totalRepayment,
    totalInterest: multiAmort.totalInterest,
    requiredRating: 'A',
    requiredTier: 3,
    requiredPermit: 'Interstate Commerce Permit',
    minAssetsRequired: 250000,
    badge: 'MULTI-TRUCK LINE',
    description: `Scalable multi-truck facility. Requires VIP Rank (Tier 3+) and Interstate Commerce Permit.`,
    benefits: ['Requires VIP Tier 3+', 'Requires Interstate Permit', '90-day facility']
  });

  // ==========================================
  // 5. Syndicated Corporate Expansion (Tier 4 - VIP 3+)
  // ==========================================
  if (assets >= 400000 && (S.companyTier || 0) >= 4) {
    const corpPrincipal = Math.min(500000, Math.max(200000, Math.round(assets * 0.12 / 50000) * 50000));
    const corpAmort = calculateLoanAmortization(corpPrincipal, 28.0, 120);
    offers.push({
      id: 'syndicated_enterprise',
      name: 'Syndicated Corporate Expansion Facility',
      category: 'enterprise',
      lender: 'Continental Infrastructure Consortium',
      principal: corpPrincipal,
      apr: 28.0,
      termDays: 120,
      dailyRate: corpAmort.dailyRate,
      totalRepayment: corpAmort.totalRepayment,
      totalInterest: corpAmort.totalInterest,
      requiredRating: 'AA',
      requiredTier: 4,
      requiredPermit: 'International Transport Certificate',
      minAssetsRequired: 400000,
      badge: 'SYNDICATED FACILITY',
      description: `Institutional credit facility for Tier 4+ conglomerates with International Transport Certificates.`,
      benefits: ['Requires Tier 4+ (VIP 3)', 'Requires International Certificate', '120-day term']
    });
  }

  // ==========================================
  // 6. Sovereign Infrastructure Bond (Tier 5 - VIP 5+)
  // ==========================================
  if (assets >= 1000000 && (S.companyTier || 0) >= 5) {
    const bondPrincipal = 1000000;
    const bondAmort = calculateLoanAmortization(bondPrincipal, 31.0, 180);
    offers.push({
      id: 'infrastructure_bond',
      name: 'Corporate Intermodal Infrastructure Bond',
      category: 'enterprise',
      lender: 'Global Logistics Sovereign Investment Board',
      principal: bondPrincipal,
      apr: 31.0,
      termDays: 180,
      dailyRate: bondAmort.dailyRate,
      totalRepayment: bondAmort.totalRepayment,
      totalInterest: bondAmort.totalInterest,
      requiredRating: 'AAA',
      requiredTier: 5,
      requiredPermit: 'Sovereign Trade License',
      minAssetsRequired: 1000000,
      badge: 'SOVEREIGN BOND',
      description: `Top-tier corporate bond issuance for premier conglomerates with AAA standing and Sovereign Trade License.`,
      benefits: ['Requires Tier 5+ (VIP 5)', 'Requires Sovereign License', '180-day institutional term']
    });
  }

  const companyTier = S.companyTier || 0;
  return offers.filter(o => companyTier >= o.requiredTier);
}

/**
 * Executes a loan application with strict guardrails, rank checks, permit verifications, and committee approval.
 */
export function executeTakeLoan(S: any, offerId: string): boolean {
  const offers = getAvailableLoanOffers(S);
  const offer = offers.find(o => o.id === offerId);
  if (!offer) {
    toast('Loan offer not found or expired.', 'err');
    return false;
  }

  const profile = calculateEnterpriseCreditProfile(S);
  const companyTier = S.companyTier || 0;
  const certs = S.certifications || [];

  // Guardrail 1: Company Rank Tier Check
  if (companyTier < offer.requiredTier) {
    toast(`Loan Committee Rejected: Requires Company Rank Tier ${offer.requiredTier} (Current: Tier ${companyTier})`, 'err');
    return false;
  }

  // Guardrail 2: Operating Permit Check
  if (offer.requiredPermit && !certs.includes(offer.requiredPermit) && companyTier < offer.requiredTier + 1) {
    toast(`Loan Committee Rejected: Missing required operating permit (${offer.requiredPermit})`, 'err');
    return false;
  }

  // Guardrail 3: Strict Debt Ceiling (Max 12% Debt-to-Asset)
  const projectedDebt = profile.activeDebtUsd + offer.principal;
  const projectedRatio = profile.totalAssetsUsd > 0 ? projectedDebt / profile.totalAssetsUsd : 0;
  if (projectedRatio > 0.12) {
    toast(`Bank Committee Denied: Exceeds maximum 12% debt-to-asset leverage guardrail ($${Math.round(profile.totalAssetsUsd * 0.12).toLocaleString()} max allowed)`, 'err');
    return false;
  }

  // Guardrail 4: Minimum Asset Threshold
  if (profile.totalAssetsUsd < offer.minAssetsRequired) {
    toast(`Loan Committee Denied: Insufficient enterprise asset valuation ($${offer.minAssetsRequired.toLocaleString()} required)`, 'err');
    return false;
  }

  // All checks passed -> Committee Approval & Disbursement
  if (!S.loans) S.loans = [];
  const loanRecord = {
    id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: offer.name,
    lender: offer.lender,
    principal: offer.principal,
    remainingBalance: offer.totalRepayment,
    dailyRate: offer.dailyRate,
    termDays: offer.termDays,
    daysRemaining: offer.termDays,
    apr: offer.apr,
    status: 'active'
  };

  S.loans.push(loanRecord);
  S.money += offer.principal;

  if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
  S.stats.borrowed = (S.stats.borrowed || 0) + offer.principal;

  pushNote(S, `🏦 Loan Committee Approved: $${offer.principal.toLocaleString()} facility secured from ${offer.lender} at ${offer.apr}% APR (${offer.termDays}-day term).`, {
    title: 'COMMERCIAL LOAN APPROVED',
    type: 'finance',
    priority: 'high'
  });

  toast(`Successfully secured $${offer.principal.toLocaleString()} commercial loan (${offer.apr}% APR)!`, 'success');
  return true;
}

export function executePayoffLoan(S: any, loanId: string): boolean {
  if (!S.loans) return false;
  const idx = S.loans.findIndex((l: any) => l.id === loanId);
  if (idx === -1) {
    toast('Loan account not found.', 'err');
    return false;
  }
  const loan = S.loans[idx];
  const payoffAmount = loan.remainingBalance;
  if (S.money < payoffAmount) {
    toast(`Insufficient funds to payoff loan. Needs $${payoffAmount.toLocaleString()}`, 'err');
    return false;
  }
  S.money -= payoffAmount;
  S.loans.splice(idx, 1);
  pushNote(S, `🏦 Commercial Loan Fully Settled: $${payoffAmount.toLocaleString()} paid to ${loan.lender}. Credit rating updated.`, {
    title: 'LOAN FULLY SETTLED',
    type: 'finance',
    priority: 'medium'
  });
  toast(`Successfully paid off loan account (${loan.name})!`, 'success');
  return true;
}
