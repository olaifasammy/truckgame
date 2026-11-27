/**
 * Commercial Banking, Loans, and Credit Rating Domain Engine
 * Implements strict real-life loan guardrails, competitive introductory startup rates,
 * company rank and tier eligibility, required permits, and bank committee approval.
 */

import { recordTransaction } from '../../core/ledger';
import { toast } from '../../core/ui';
import { pushNote } from '../../systems/notify';
import { REGIONAL_HUBS } from '../logistics/network';
import { TRUCK_MODELS } from '../trucks/trucks.data';
import { getCompanySafetyRating } from '../trucks/registration';

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
  const activeDebtUsd = activeLoans.reduce((sum: number, l: any) => {
    const bal = l.balance !== undefined ? l.balance : (l.remainingBalance !== undefined ? l.remainingBalance : (l.principal || 0));
    return sum + bal;
  }, 0);

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
 * Checks if the enterprise is eligible for a specific loan principal and term.
 * Max term is strictly 30 days. Max debt-to-asset ratio is 12%.
 */
export function checkLoanEligibility(S: any, principal: number, termDays: number): {
  eligible: boolean;
  error?: string;
  apr?: number;
  dailyRate?: number;
  totalRepayment?: number;
  totalInterest?: number;
} {
  if (principal <= 0) return { eligible: false, error: 'Invalid principal amount.' };
  if (termDays <= 0 || termDays > 30) return { eligible: false, error: 'Maximum loan term is strictly 30 days.' };
  if ((S.money || 0) < -25000) {
    return { eligible: false, error: 'Credit Freeze: Treasury overdraft exceeds -$25,000 limit.' };
  }
  if (getCompanySafetyRating(S).grade === 'UNSATISFACTORY') {
    return { eligible: false, error: 'Credit Freeze: Resolve FMCSA Unsatisfactory safety rating before taking new credit.' };
  }

  const profile = calculateEnterpriseCreditProfile(S);
  const companyTier = S.companyTier || 0;

  // Guardrail 1: Strict Debt Ceiling (Max 12% Debt-to-Asset)
  const projectedDebt = profile.activeDebtUsd + principal;
  const projectedRatio = profile.totalAssetsUsd > 0 ? projectedDebt / profile.totalAssetsUsd : 0;
  if (projectedRatio > 0.12) {
    const maxAllowed = Math.round(profile.totalAssetsUsd * 0.12) - profile.activeDebtUsd;
    return {
      eligible: false,
      error: `Bank Committee Denied: Exceeds maximum 12% debt-to-asset leverage guardrail. Max additional borrowing capacity: $${Math.max(0, maxAllowed).toLocaleString()}.`
    };
  }

  // Guardrail 2: Credit Rating vs Amount
  if (principal > 50000 && profile.creditRating === 'B') {
    return { eligible: false, error: 'Loan Committee Denied: High-capital facility requires credit rating of BB or higher.' };
  }
  if (principal > 200000 && companyTier < 3) {
    return { eligible: false, error: 'Loan Committee Denied: Enterprise-scale financing requires VIP Rank (Tier 3+).' };
  }

  const apr = getCustomLoanApr(profile.rating);
  const amort = calculateLoanAmortization(principal, apr, termDays);

  return {
    eligible: true,
    apr,
    dailyRate: amort.dailyRate,
    totalRepayment: amort.totalRepayment,
    totalInterest: amort.totalInterest
  };
}

/**
 * Returns the effective APR based on commercial credit rating.
 */
export function getCustomLoanApr(rating: string): number {
  switch (rating) {
    case 'AAA': return 24.5;
    case 'AA': return 26.5;
    case 'A': return 28.5;
    case 'BBB': return 32.0;
    case 'BB': return 35.0;
    case 'B': return 42.0;
    default: return 45.0;
  }
}

/**
 * Calculates daily payments and total interest for a fixed-term loan.
 */
export function calculateLoanAmortization(principal: number, apr: number, termDays: number) {
  const dailyRateDecimal = (apr / 100) / 365;
  // Total cost = P * (1 + r*t) - Simple interest approximation for short terms
  const totalInterest = Math.round(principal * dailyRateDecimal * termDays);
  const totalRepayment = principal + totalInterest;
  const dailyRate = Math.round(totalRepayment / termDays);

  return {
    dailyRate,
    totalRepayment,
    totalInterest
  };
}

/**
 * Executes a loan application with strict guardrails, rank checks, and committee approval.
 */
export function executeTakeLoan(S: any, principal: number, termDays: number): boolean {
  const check = checkLoanEligibility(S, principal, termDays);

  if (!check.eligible) {
    toast(check.error || 'Loan application rejected.', 'err');
    return false;
  }

  // All checks passed -> Disbursement
  if (!S.loans) S.loans = [];
  const loanRecord = {
    id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: 'Enterprise Commercial Credit',
    lender: 'First National Logistics Credit',
    principal: principal,
    balance: check.totalRepayment,
    remainingBalance: check.totalRepayment,
    dailyRate: check.dailyRate,
    termDays: termDays,
    daysRemaining: termDays,
    apr: check.apr,
    issuedAt: Date.now(),
    status: 'active',
    missedPayments: 0
  };

  S.loans.push(loanRecord);
  recordTransaction(S, 'revenue_bonus', principal, `Commercial Loan Disbursal: $${principal.toLocaleString()}`);

  if (!S.stats) S.stats = { earned: 0, spent: 0, km: 0, jobs: 0 };
  S.stats.borrowed = (S.stats.borrowed || 0) + principal;

  pushNote(S, `🏦 Loan Disbursement: $${principal.toLocaleString()} facility secured at ${check.apr}% APR (${termDays}-day term). Daily repayment: $${check.dailyRate.toLocaleString()}.`, {
    title: 'COMMERCIAL LOAN DISBURSED',
    type: 'finance',
    priority: 'high'
  });

  toast(`Successfully secured $${principal.toLocaleString()} commercial loan (${check.apr}% APR)!`, 'success');
  return true;
}

/**
 * Processes loan ticks: handles daily deductions, delinquency interest hikes, and asset seizure.
 */
export function processLoanTick(S: any, elapsedDays: number, now: number): void {
  if (!S.loans || S.loans.length === 0) return;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (let i = S.loans.length - 1; i >= 0; i--) {
    const loan = S.loans[i];
    if (loan.status === 'settled') continue;

    loan.accruedDays = (loan.accruedDays || 0) + elapsedDays;
    if (loan.accruedDays < 1) continue;

    const wholeDays = Math.floor(loan.accruedDays);
    loan.accruedDays -= wholeDays;

    const remaining = loan.balance ?? loan.remainingBalance ?? 0;
    const paymentDue = Math.min(remaining, Math.round(loan.dailyRate * wholeDays));
    if (paymentDue <= 0) continue;

    if (S.money >= paymentDue) {
      // Normal payment (recordTransaction updates S.money once)
      loan.balance = Math.max(0, remaining - paymentDue);
      loan.remainingBalance = loan.balance;
      loan.daysRemaining = Math.max(0, loan.daysRemaining - wholeDays);
      recordTransaction(S, 'expense_finance', -paymentDue, `Daily Auto-Payment (${wholeDays}d): ${loan.lender}`);
      if (!S.dailyStats) S.dailyStats = { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
      S.dailyStats.loans = (S.dailyStats.loans || 0) + paymentDue;
    } else {
      // DELINQUENCY: Insufficient funds
      loan.missedPayments = (loan.missedPayments || 0) + wholeDays;
      // Penalty: APR increases by 5% per missed day (up to double)
      const penaltyApr = 5.0 * wholeDays;
      const prevApr = loan.apr || 35;
      loan.apr = Math.min(prevApr * 2, prevApr + penaltyApr);
      
      // Capitalize missed interest
      const missedInterest = Math.round(loan.balance * (penaltyApr / 100 / 365));
      loan.balance += missedInterest;
      loan.remainingBalance = loan.balance;

      pushNote(S, `⚠️ DELINQUENT LOAN: Insufficient funds to service $${paymentDue.toLocaleString()} payment for ${loan.lender}. APR hiked to ${loan.apr.toFixed(1)}%.`, {
        title: 'LOAN PAYMENT MISSED',
        type: 'finance',
        priority: 'high'
      });
      toast(`⚠️ Loan Payment Missed! Interest rate hiked for ${loan.lender}.`, 'err');
    }

    // SEIZURE GUARDRAIL: Max term is 30 days. If expired or heavily delinquent, seize assets.
    const ageDays = (now - loan.issuedAt) / MS_PER_DAY;
    if (ageDays > 30 || loan.missedPayments > 7) {
      seizePropertyForDebt(S, i);
    } else if (loan.balance <= 0) {
      S.loans.splice(i, 1);
    }
  }
}


/**
 * Seizes enterprise property (Trucks or Hubs) to settle outstanding debt.
 */
function seizePropertyForDebt(S: any, loanIdx: number): void {
  const loan = S.loans[loanIdx];
  const debt = Math.round(loan.balance || loan.remainingBalance);
  if (debt <= 0) {
    S.loans.splice(loanIdx, 1);
    return;
  }

  // Priority 1: Seize Trucks
  if (S.fleet && S.fleet.length > 0) {
    const truckIdx = S.fleet.length - 1; 
    const truck = S.fleet[truckIdx];
    const model = TRUCK_MODELS[truck.modelId];
    const value = truck.resaleValue || Math.round((model?.price || 150000) * 0.65);
    
    S.fleet.splice(truckIdx, 1);
    S.loans.splice(loanIdx, 1); 

    const excess = value - debt;
    if (excess > 0) {
      recordTransaction(S, 'revenue_bonus', excess, `Asset Seizure Balance Return: ${truck.modelId}`);
    } else if (excess < 0) {
       // If truck value didn't cover debt, remaining debt is "forgiven" but rating trashed
       const profile = calculateEnterpriseCreditProfile(S);
       // Internal penalty logic could go here
    }

    pushNote(S, `🏛️ ASSET SEIZURE: Collections agents have seized Tractor [${truck.id}] to settle ${debt.toLocaleString()} debt. ${excess > 0 ? `Excess value of ${excess.toLocaleString()} returned to accounts.` : ''}`, {
      title: 'COLLECTIONS SEIZURE',
      type: 'finance',
      priority: 'high'
    });
    toast(`🏛️ ASSET SEIZURE: Truck ${truck.id} seized by ${loan.lender}!`, 'err');
    return;
  }

  // Priority 2: Seize Hubs
  if (S.depots && S.depots.length > 1) { // Never seize the last hub (HQ)
    const hubId = S.depots.pop();
    const value = 250000; // Average hub resale valuation

    S.loans.splice(loanIdx, 1); // Debt settled
    const excess = value - debt;
    if (excess > 0) {
      recordTransaction(S, 'revenue_bonus', excess, `Asset Seizure Balance Return: Hub ${hubId}`);
    }

    pushNote(S, `🏛️ HUB SEIZURE: ${loan.lender} has seized Terminal [${hubId}] to settle $${debt.toLocaleString()} debt.`, {
      title: 'TERMINAL SEIZURE',
      type: 'finance',
      priority: 'high'
    });
    toast(`🏛️ HUB SEIZURE: Terminal ${hubId} seized by ${loan.lender}!`, 'err');
    return;
  }

  // Final fallback: Bankrupt / Locked account
  S.money = Math.round(S.money * 0.1); // Massive hair cut
  S.loans.splice(loanIdx, 1);
  toast('Total Default: Bank has cleared liquid accounts.', 'err');
}


export function executePayoffLoan(S: any, loanId: string, customAmount?: number): boolean {
  if (!S.loans) return false;
  const idx = S.loans.findIndex((l: any) => l.id === loanId);
  if (idx === -1) {
    toast('Loan account not found.', 'err');
    return false;
  }
  const loan = S.loans[idx];
  const currentBalance = loan.balance || loan.remainingBalance || 0;
  const payoffAmount = customAmount !== undefined ? Math.min(customAmount, currentBalance) : currentBalance;

  if (payoffAmount <= 0) {
    toast('Invalid repayment amount.', 'err');
    return false;
  }

  if (S.money < payoffAmount) {
    toast(`Insufficient funds. Needs ${payoffAmount.toLocaleString()}`, 'err');
    return false;
  }

  recordTransaction(S, 'expense_finance', -payoffAmount, `Commercial Loan ${payoffAmount >= currentBalance ? 'Full Settlement' : 'Principal Paydown'}: ${loan.name}`);
  
  if (payoffAmount >= currentBalance) {
    S.loans.splice(idx, 1);
    pushNote(S, `🏦 Commercial Loan Fully Settled: ${payoffAmount.toLocaleString()} paid to ${loan.lender}. Credit rating updated.`, {
      title: 'LOAN FULLY SETTLED',
      type: 'finance',
      priority: 'medium'
    });
    toast(`Successfully paid off loan account (${loan.name})!`, 'success');
  } else {
    loan.balance = Math.max(0, currentBalance - payoffAmount);
    loan.remainingBalance = loan.balance;
    if (loan.daysRemaining && loan.daysRemaining > 0) {
      loan.dailyRate = Math.round((loan.balance / Math.max(1, loan.daysRemaining)) * (1 + loan.apr / 100 / 365));
    }
    pushNote(S, `🏦 Loan Principal Paydown: ${payoffAmount.toLocaleString()} paid towards ${loan.name}. Remaining balance: ${loan.balance.toLocaleString()}.`, {
      title: 'LOAN PRINCIPAL REDUCED',
      type: 'finance',
      priority: 'medium'
    });
    toast(`Successfully paid ${payoffAmount.toLocaleString()} towards loan!`, 'success');
  }
  return true;
}
