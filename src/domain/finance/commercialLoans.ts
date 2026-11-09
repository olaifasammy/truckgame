/**
 * Commercial Loans & Enterprise Credit Facilities Domain Engine
 *
 * Implements realistic corporate lending, dynamic valuation-based borrowing capacity,
 * tiered credit facilities (Startup, Fleet Expansion, Enterprise Syndicated), and
 * rotating time-limited relationship bank offers.
 */

import { calculateBalanceSheet } from './accounting';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export type CreditRatingGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';

export interface EnterpriseCreditProfile {
  rating: CreditRatingGrade;
  score: number;
  totalAssetsUsd: number;
  netEnterpriseValueUsd: number;
  currentDebtUsd: number;
  maxCreditLimitUsd: number;
  availableCreditUsd: number;
  debtToEquityPct: number;
  utilizationPct: number;
  scoreFactors: {
    label: string;
    impact: 'positive' | 'neutral' | 'negative';
    detail: string;
  }[];
}

export interface LoanOffer {
  id: string;
  name: string;
  category: 'startup' | 'fleet' | 'enterprise' | 'special';
  lender: string;
  principal: number;
  apr: number; // e.g. 4.5%
  termDays: number;
  dailyRate: number;
  totalRepayment: number;
  totalInterest: number;
  requiredRating: CreditRatingGrade;
  minAssetsRequired: number;
  badge?: string;
  expiresAtMs?: number; // for time-limited special offers
  description: string;
  benefits: string[];
}

export interface ActiveBankLoan {
  id: string;
  name: string;
  category: string;
  lender: string;
  principal: number;
  balance: number;
  apr: number;
  dailyRate: number;
  termDays: number;
  daysRemaining: number;
  createdAt: number;
}

const RATING_ORDER: CreditRatingGrade[] = ['B', 'BB', 'BBB', 'A', 'AA', 'AAA'];

/**
 * Calculates authoritative enterprise credit rating and borrowing capacity
 * dynamically based on balance sheet asset valuation, liquidity, reputation, and leverage.
 */
export function calculateEnterpriseCreditProfile(S: any): EnterpriseCreditProfile {
  const bs = calculateBalanceSheet(S);
  const totalAssets = Math.max(35000, bs.totalAssetsUsd || 0);
  const netWorth = Math.max(10000, bs.netEnterpriseValueUsd || 0);
  const currentDebt = (S.loans || []).reduce((sum: number, l: any) => sum + (l.balance || 0), 0);
  const delivered = S.loads || 0;
  const reputation = S.reputation ?? 100;

  let score = 580; // Baseline commercial score
  const scoreFactors: EnterpriseCreditProfile['scoreFactors'] = [];

  // 1. Asset Base & Net Worth Impact
  if (netWorth >= 5000000) {
    score += 180;
    scoreFactors.push({ label: 'Institutional Balance Sheet', impact: 'positive', detail: `Tangible net equity > $5M (+180 pts)` });
  } else if (netWorth >= 1500000) {
    score += 130;
    scoreFactors.push({ label: 'Substantial Asset Backing', impact: 'positive', detail: `Net enterprise equity > $1.5M (+130 pts)` });
  } else if (netWorth >= 500000) {
    score += 85;
    scoreFactors.push({ label: 'Solid Mid-Market Equity', impact: 'positive', detail: `Net enterprise equity > $500k (+85 pts)` });
  } else if (netWorth >= 150000) {
    score += 45;
    scoreFactors.push({ label: 'Commercial Fleet Base', impact: 'positive', detail: `Net equity > $150k (+45 pts)` });
  } else {
    score += 15;
    scoreFactors.push({ label: 'Early-Stage Carrier', impact: 'neutral', detail: `Initial capital reserves (+15 pts)` });
  }

  // 2. Track Record & Delivered Freight
  const deliveryPoints = Math.min(100, delivered * 4);
  score += deliveryPoints;
  if (delivered >= 20) {
    scoreFactors.push({ label: 'Proven Operating Track Record', impact: 'positive', detail: `${delivered} completed hauls (+${deliveryPoints} pts)` });
  } else if (delivered > 0) {
    scoreFactors.push({ label: 'Active Delivery History', impact: 'neutral', detail: `${delivered} hauls completed (+${deliveryPoints} pts)` });
  } else {
    scoreFactors.push({ label: 'No Operating History', impact: 'neutral', detail: `Fresh carrier operating authority` });
  }

  // 3. Carrier Safety & Commercial Reputation
  if (reputation >= 90) {
    score += 40;
    scoreFactors.push({ label: 'Pristine Safety Rating', impact: 'positive', detail: `Reputation ${reputation}/100 (+40 pts)` });
  } else if (reputation >= 70) {
    score += 20;
    scoreFactors.push({ label: 'Compliant Carrier Rating', impact: 'neutral', detail: `Reputation ${reputation}/100 (+20 pts)` });
  } else {
    score -= 40;
    scoreFactors.push({ label: 'Regulatory Infractions', impact: 'negative', detail: `Reputation degraded to ${reputation} (-40 pts)` });
  }

  // 4. Financial Leverage & Debt-to-Equity (D/E)
  const debtToEquityPct = netWorth > 0 ? Math.round((currentDebt / netWorth) * 100) : 100;
  if (currentDebt === 0) {
    score += 50;
    scoreFactors.push({ label: 'Zero Debt Leverage', impact: 'positive', detail: 'Unencumbered balance sheet (+50 pts)' });
  } else if (debtToEquityPct <= 35) {
    score += 25;
    scoreFactors.push({ label: 'Conservative Leverage', impact: 'positive', detail: `D/E ratio at ${debtToEquityPct}% (+25 pts)` });
  } else if (debtToEquityPct <= 65) {
    score -= 20;
    scoreFactors.push({ label: 'Moderate Debt Load', impact: 'neutral', detail: `D/E ratio at ${debtToEquityPct}% (-20 pts)` });
  } else {
    score -= 75;
    scoreFactors.push({ label: 'Over-Leveraged Balance Sheet', impact: 'negative', detail: `D/E ratio at ${debtToEquityPct}% (-75 pts)` });
  }

  score = Math.max(380, Math.min(880, Math.round(score)));

  let rating: CreditRatingGrade = 'BBB';
  let capacityMultiplier = 0.35;

  if (score >= 800) {
    rating = 'AAA';
    capacityMultiplier = 0.60;
  } else if (score >= 730) {
    rating = 'AA';
    capacityMultiplier = 0.52;
  } else if (score >= 650) {
    rating = 'A';
    capacityMultiplier = 0.44;
  } else if (score >= 580) {
    rating = 'BBB';
    capacityMultiplier = 0.36;
  } else if (score >= 480) {
    rating = 'BB';
    capacityMultiplier = 0.28;
  } else {
    rating = 'B';
    capacityMultiplier = 0.20;
  }

  // Guaranteed startup minimum borrowing capacity ($35,000 - $50,000) for new companies
  const minStartupLimit = 35000;
  const valuationDerivedCredit = Math.round(totalAssets * capacityMultiplier);
  const maxCreditLimitUsd = Math.max(minStartupLimit, valuationDerivedCredit);
  const availableCreditUsd = Math.max(0, maxCreditLimitUsd - currentDebt);
  const utilizationPct = maxCreditLimitUsd > 0 ? Math.round((currentDebt / maxCreditLimitUsd) * 100) : 0;

  return {
    rating,
    score,
    totalAssetsUsd: totalAssets,
    netEnterpriseValueUsd: netWorth,
    currentDebtUsd: currentDebt,
    maxCreditLimitUsd,
    availableCreditUsd,
    debtToEquityPct,
    utilizationPct,
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
 * Generates dynamic, realistic loan offers tailored to company valuation and progression stage.
 */
export function getAvailableLoanOffers(S: any): LoanOffer[] {
  const profile = calculateEnterpriseCreditProfile(S);
  const assets = profile.totalAssetsUsd;
  const now = Date.now();
  const offers: LoanOffer[] = [];

  // ==========================================
  // Category 1: Startup & Working Capital
  // ==========================================
  const seedPrincipal = 20000;
  const seedAmort = calculateLoanAmortization(seedPrincipal, 6.8, 21);
  offers.push({
    id: 'startup_seed',
    name: 'Founder Startup Micro-Credit',
    category: 'startup',
    lender: 'First Commercial Small Business Trust',
    principal: seedPrincipal,
    apr: 6.8,
    termDays: 21,
    dailyRate: seedAmort.dailyRate,
    totalRepayment: seedAmort.totalRepayment,
    totalInterest: seedAmort.totalInterest,
    requiredRating: 'B',
    minAssetsRequired: 0,
    badge: 'STARTUP BOOSTER',
    description: 'Unsecured initial working capital designed for new carriers to acquire fuel, licenses, and basic shop supplies.',
    benefits: ['Zero collateral requirement', 'Rapid automatic clearance', 'Early payoff without penalty']
  });

  const payrollPrincipal = 50000;
  const payrollAmort = calculateLoanAmortization(payrollPrincipal, 5.9, 30);
  offers.push({
    id: 'working_capital',
    name: 'Operating Cashflow & Payroll Line',
    category: 'startup',
    lender: 'Apex Logistics Capital',
    principal: payrollPrincipal,
    apr: 5.9,
    termDays: 30,
    dailyRate: payrollAmort.dailyRate,
    totalRepayment: payrollAmort.totalRepayment,
    totalInterest: payrollAmort.totalInterest,
    requiredRating: 'BB',
    minAssetsRequired: 40000,
    badge: 'EXPEDITION CASH',
    description: 'Short-term liquidity facility to float driver wages, insurance deductibles, and unexpected breakdown repairs.',
    benefits: ['Low fixed daily repayment', 'Builds commercial credit rating fast', 'Immediate cash injection']
  });

  // ==========================================
  // Category 2: Fleet & Asset Expansion
  // ==========================================
  // Dynamically sized to realistic heavy commercial tractor costs ($150,000 - $180,000)
  const tractorPrincipal = 160000;
  const tractorAmort = calculateLoanAmortization(tractorPrincipal, 5.2, 60);
  offers.push({
    id: 'single_tractor_facility',
    name: 'Heavy Commercial Tractor Equipment Facility',
    category: 'fleet',
    lender: 'Volvo-Scania Financial Services',
    principal: tractorPrincipal,
    apr: 5.2,
    termDays: 60,
    dailyRate: tractorAmort.dailyRate,
    totalRepayment: tractorAmort.totalRepayment,
    totalInterest: tractorAmort.totalInterest,
    requiredRating: 'BBB',
    minAssetsRequired: 120000,
    badge: 'EQUIPMENT FINANCING',
    description: 'Asset-backed commercial equipment facility calibrated to purchase a brand-new 6x4 tractor unit and trailer hitch.',
    benefits: ['Subsidized equipment rate', 'Tractor acts as collateral backing', 'Extended 60-day repayment runway']
  });

  // Multi-truck fleet credit line: dynamically scales with company size
  const multiFleetPrincipal = Math.min(
    1500000,
    Math.max(450000, Math.round(assets * 0.35 / 50000) * 50000)
  );
  const multiAmort = calculateLoanAmortization(multiFleetPrincipal, 4.6, 90);
  offers.push({
    id: 'fleet_expansion',
    name: 'Commercial Fleet Multi-Tractor Credit Line',
    category: 'fleet',
    lender: 'National Freight Equipment Credit',
    principal: multiFleetPrincipal,
    apr: 4.6,
    termDays: 90,
    dailyRate: multiAmort.dailyRate,
    totalRepayment: multiAmort.totalRepayment,
    totalInterest: multiAmort.totalInterest,
    requiredRating: 'A',
    minAssetsRequired: 350000,
    badge: 'MULTI-TRUCK LINE',
    description: `Scalable equipment acquisition facility sized to purchase 3-8 commercial tractors simultaneously as your contract network expands.`,
    benefits: ['4.6% prime transport APR', 'High capacity headroom', '90-day amortization curve']
  });

  // ==========================================
  // Category 3: Enterprise & Syndicated Facilities
  // (Scales up into the millions for high net worth companies!)
  // ==========================================
  if (assets >= 600000) {
    const corpPrincipal = Math.min(
      6000000,
      Math.max(600000, Math.round(assets * 0.45 / 100000) * 100000)
    );
    const corpAmort = calculateLoanAmortization(corpPrincipal, 3.9, 120);
    offers.push({
      id: 'syndicated_enterprise',
      name: 'Syndicated Corporate Expansion Facility',
      category: 'enterprise',
      lender: 'Continental Infrastructure & Commerce Consortium',
      principal: corpPrincipal,
      apr: 3.9,
      termDays: 120,
      dailyRate: corpAmort.dailyRate,
      totalRepayment: corpAmort.totalRepayment,
      totalInterest: corpAmort.totalInterest,
      requiredRating: 'AA',
      minAssetsRequired: 600000,
      badge: 'SYNDICATED FACILITY',
      description: `Institutional credit facility structured against your corporate asset portfolio (${Math.round(corpPrincipal / 1000).toLocaleString()}k USD) for intercontinental terminal acquisitions and major logistics hubs.`,
      benefits: ['Low 3.9% institutional APR', 'Proportionally sized to your multi-million enterprise valuation', '120-day enterprise runway']
    });
  }

  if (assets >= 2000000) {
    const debenturePrincipal = Math.min(
      15000000,
      Math.max(1500000, Math.round(assets * 0.55 / 250000) * 250000)
    );
    const debAmort = calculateLoanAmortization(debenturePrincipal, 3.2, 180);
    offers.push({
      id: 'infrastructure_bond',
      name: 'Corporate Intermodal Infrastructure Bond',
      category: 'enterprise',
      lender: 'Global Logistics Sovereign Investment Board',
      principal: debenturePrincipal,
      apr: 3.2,
      termDays: 180,
      dailyRate: debAmort.dailyRate,
      totalRepayment: debAmort.totalRepayment,
      totalInterest: debAmort.totalInterest,
      requiredRating: 'AAA',
      minAssetsRequired: 2000000,
      badge: 'SOVEREIGN BOND',
      description: `Top-tier corporate bond issuance for premier logistics conglomerates with AAA credit standing, offering massive expansion liquidity.`,
      benefits: ['Lowest 3.2% sovereign tier rate', 'Up to 55% of enterprise worth', 'Half-year 180-day institutional term']
    });
  }

  // ==========================================
  // Category 4: Dynamic Time-Limited Special Bank Offers
  // ==========================================
  // Rotate offers deterministically based on hour blocks
  const hourBlock = Math.floor(now / (1000 * 60 * 60 * 4)); // 4-hour cycle
  const specialCycle = hourBlock % 3;

  if (specialCycle === 0) {
    const specialPrincipal = Math.min(2500000, Math.max(100000, Math.round(assets * 0.40 / 50000) * 50000));
    const specialAmort = calculateLoanAmortization(specialPrincipal, 2.8, 60);
    offers.push({
      id: 'special_green_fleet',
      name: 'Trans-European Green Fleet Modernization Grant-Loan',
      category: 'special',
      lender: 'Rotterdam Ecological Transport Fund',
      principal: specialPrincipal,
      apr: 2.8,
      termDays: 60,
      dailyRate: specialAmort.dailyRate,
      totalRepayment: specialAmort.totalRepayment,
      totalInterest: specialAmort.totalInterest,
      requiredRating: 'A',
      minAssetsRequired: 150000,
      badge: '⚡ LIMITED PROMO: 2.8% APR',
      expiresAtMs: (hourBlock + 1) * (1000 * 60 * 60 * 4),
      description: 'Subsidized environmental efficiency initiative providing low-rate liquidity for euro-6 low-emission tractor upgrades.',
      benefits: ['Ultra-low 2.8% promotional APR', 'Government subsidized interest', 'Fast-track approval']
    });
  } else if (specialCycle === 1) {
    const specialPrincipal = Math.min(1800000, Math.max(75000, Math.round(assets * 0.35 / 25000) * 25000));
    const specialAmort = calculateLoanAmortization(specialPrincipal, 3.4, 45);
    offers.push({
      id: 'special_maritime_bridge',
      name: 'Deepwater Port Ocean Corridor Bridge Facility',
      category: 'special',
      lender: 'Yangshan & Apapa Maritime Trade Syndicate',
      principal: specialPrincipal,
      apr: 3.4,
      termDays: 45,
      dailyRate: specialAmort.dailyRate,
      totalRepayment: specialAmort.totalRepayment,
      totalInterest: specialAmort.totalInterest,
      requiredRating: 'BBB',
      minAssetsRequired: 80000,
      badge: '🌊 MARITIME TRADE SPECIAL',
      expiresAtMs: (hourBlock + 1) * (1000 * 60 * 60 * 4),
      description: 'Special liquidity line for cross-continental operators managing maritime Ro-Ro freight shipments and port drayage.',
      benefits: ['Zero origination surcharge', 'Priority port clearance credit', 'Flexible draw schedule']
    });
  } else {
    const specialPrincipal = Math.min(3000000, Math.max(120000, Math.round(assets * 0.38 / 50000) * 50000));
    const specialAmort = calculateLoanAmortization(specialPrincipal, 3.1, 75);
    offers.push({
      id: 'special_express_logistics',
      name: 'Apex Capital Prime Liquidity Surge Facility',
      category: 'special',
      lender: 'Apex Global Merchant Bankers',
      principal: specialPrincipal,
      apr: 3.1,
      termDays: 75,
      dailyRate: specialAmort.dailyRate,
      totalRepayment: specialAmort.totalRepayment,
      totalInterest: specialAmort.totalInterest,
      requiredRating: 'A',
      minAssetsRequired: 180000,
      badge: '⭐ RELATIONSHIP SPECIAL',
      expiresAtMs: (hourBlock + 1) * (1000 * 60 * 60 * 4),
      description: 'Exclusive relationship banking opportunity triggered by high carrier reputation and clean treasury accounting.',
      benefits: ['Reduced debt-service ratio', '75-day commercial term', 'Prime relationship terms']
    });
  }

  return offers;
}

/**
 * Executes a loan drawdown for the company.
 */
export function executeTakeLoan(S: any, offerId: string, customAmount?: number): boolean {
  if (!S.loans) S.loans = [];
  const profile = calculateEnterpriseCreditProfile(S);
  const offers = getAvailableLoanOffers(S);
  const offer = offers.find(o => o.id === offerId);

  let principal = offer ? offer.principal : (customAmount || 0);
  let apr = offer ? offer.apr : 5.5;
  let termDays = offer ? offer.termDays : 60;
  let lender = offer ? offer.lender : 'Commercial Credit Facility';
  let name = offer ? offer.name : 'Custom Enterprise Drawdown';
  let category = offer ? offer.category : 'enterprise';

  if (customAmount && customAmount > 0) {
    principal = customAmount;
  }

  if (principal <= 0) {
    toast('Specify a valid borrowing amount', 'err');
    return false;
  }

  // 1. Check borrowing capacity against company worth
  if (principal > profile.availableCreditUsd) {
    toast(`Exceeds Available Credit Limit ($${profile.availableCreditUsd.toLocaleString()} available)`, 'err');
    return false;
  }

  // 2. Check credit rating requirement
  if (offer) {
    const playerRatingIdx = RATING_ORDER.indexOf(profile.rating);
    const requiredRatingIdx = RATING_ORDER.indexOf(offer.requiredRating);
    if (playerRatingIdx < requiredRatingIdx) {
      toast(`Requires Credit Rating ${offer.requiredRating} or higher (Current: ${profile.rating})`, 'err');
      return false;
    }
  }

  // 3. Avoid duplicate active facility of the exact same offer ID
  if (offer && S.loans.some((l: any) => l.id === offer.id)) {
    toast(`An active tranche of this facility is already open`, 'err');
    return false;
  }

  const { dailyRate, totalRepayment, totalInterest } = calculateLoanAmortization(principal, apr, termDays);

  const newLoan: ActiveBankLoan = {
    id: offer ? offer.id : `LN-${Date.now().toString().slice(-6)}`,
    name,
    category,
    lender,
    principal,
    balance: totalRepayment, // Total balance includes principal and accrued term interest
    apr,
    dailyRate,
    termDays,
    daysRemaining: termDays,
    createdAt: Date.now()
  };

  S.loans.push(newLoan);
  S.money = (S.money || 0) + principal;

  pushNote(S, `Disbursed +$${principal.toLocaleString()} USD from ${lender}. Daily debt service: -$${dailyRate.toLocaleString()}/day (${termDays} days).`, {
    title: 'CREDIT FACILITY DISBURSED',
    type: 'finance',
    priority: 2,
    body: `Facility: ${name}\nLender: ${lender}\nPrincipal: $${principal.toLocaleString()}\nAPR: ${apr}%\nDaily Amortization: $${dailyRate.toLocaleString()}/day\nRemaining Capacity: $${Math.max(0, profile.availableCreditUsd - principal).toLocaleString()}`
  });

  toast(`Credit Disbursed: +$${principal.toLocaleString()}`, 'success');
  return true;
}

/**
 * Early loan payoff handler.
 */
export function executePayoffLoan(S: any, loanId: string): boolean {
  if (!S.loans || S.loans.length === 0) return false;
  const idx = S.loans.findIndex((l: any) => l.id === loanId);
  if (idx === -1) {
    toast('Loan facility not found', 'err');
    return false;
  }

  const loan: ActiveBankLoan = S.loans[idx];
  const payoffAmount = Math.round(loan.balance);

  if ((S.money || 0) < payoffAmount) {
    toast(`Insufficient treasury funds ($${payoffAmount.toLocaleString()} required)`, 'err');
    return false;
  }

  S.money -= payoffAmount;
  S.loans.splice(idx, 1);

  pushNote(S, `Settled facility ${loan.name} for $${payoffAmount.toLocaleString()}. Credit capacity fully restored!`, {
    title: 'CREDIT FACILITY SETTLED',
    type: 'finance',
    priority: 2,
    body: `Settled: ${loan.name}\nPaid Balance: $${payoffAmount.toLocaleString()}\nDaily Debt Service Reduced: -$${loan.dailyRate.toLocaleString()}/day`
  });

  toast(`Facility Settled: $${payoffAmount.toLocaleString()}`, 'success');
  return true;
}
