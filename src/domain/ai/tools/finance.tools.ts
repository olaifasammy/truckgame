import { CopilotTool } from '../copilot.types';
import { calculateEnterpriseCreditProfile, executeTakeLoan, executePayoffLoan } from '../../finance/commercialLoans';
import { calculateTradeSlippage } from '../../finance/markets/crypto';
import { calculateUnderwritingProfile, DEDUCTIBLE_TIERS, DeductibleTier } from '../../finance/insurance';

export const FINANCE_TOOLS: CopilotTool[] = [
  {
    name: 'get_financial_summary',
    description: 'Get current cash, gold coins, today and past-days daily revenue/expenses breakdown (fuel, salaries, maintenance, parking, insurance, leases, loans, overdraft, tolls), and active debt.',
    parameters: { type: 'object', properties: {} },
    execute: (S: any) => {
      const ds = S.dailyStats || { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 };
      const breakdown = {
        revenue: Math.round(ds.revenue || 0),
        fuel: Math.round(ds.fuel || 0),
        salaries: Math.round(ds.salaries || 0),
        maintenance: Math.round(ds.maintenance || 0),
        parking: Math.round(ds.parking || 0),
        insurance: Math.round(ds.insurance || 0),
        leases: Math.round(ds.leases || 0),
        loans: Math.round(ds.loans || 0),
        overdraftInterest: Math.round(ds.overdraftInterest || 0),
        tolls: Math.round(ds.tolls || 0)
      };
      const totalExp = breakdown.salaries + breakdown.fuel + breakdown.maintenance + breakdown.parking +
        breakdown.insurance + breakdown.leases + breakdown.loans + breakdown.overdraftInterest + breakdown.tolls;
      const net = breakdown.revenue - totalExp;
      const debt = (S.loans || []).reduce((acc: number, l: any) => acc + (l.balance || 0), 0);

      return {
        success: true,
        message: `Cash: $${Math.round(S.money || 0).toLocaleString()} | Today Rev: $${breakdown.revenue.toLocaleString()} | Exp: $${totalExp.toLocaleString()} (Fuel $${breakdown.fuel.toLocaleString()}, Wages $${breakdown.salaries.toLocaleString()}, Maint $${breakdown.maintenance.toLocaleString()}, Parking $${breakdown.parking.toLocaleString()}, Ins $${breakdown.insurance.toLocaleString()}, Leases $${breakdown.leases.toLocaleString()}, Loans $${breakdown.loans.toLocaleString()}) | Net: ${net >= 0 ? '+' : '-'}$${Math.abs(net).toLocaleString()} | Debt: $${Math.round(debt).toLocaleString()}.`,
        data: {
          cash: Math.round(S.money || 0),
          gold: S.coins || 0,
          todayDate: S.dailyAccountingDate || new Date().toISOString().slice(0, 10),
          todayBreakdown: breakdown,
          dailyRevenue: breakdown.revenue,
          dailyExpenses: totalExp,
          dailyNetProfit: net,
          pastDays: (S.dailyHistory || []).slice(0, 14),
          activeLoansCount: (S.loans || []).length,
          totalDebt: Math.round(debt)
        }
      };
    }
  },
  {
    name: 'manage_loan',
    description: 'Check credit profile, take a commercial bank loan, or repay an active loan.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'status, take, or repay', enum: ['status', 'take', 'repay'] },
        amount: { type: 'number', description: 'Principal amount (for take) or payment amount (for repay)' },
        termDays: { type: 'number', description: 'Loan term in days (default 30)' }
      },
      required: ['action']
    },
    execute: (S: any, { action, amount = 50000, termDays = 30 }: { action: string; amount?: number; termDays?: number }) => {
      if (action === 'status') {
        const credit = calculateEnterpriseCreditProfile(S);
        const active = (S.loans || []).map((l: any) => ({
          id: l.id,
          balance: Math.round(l.balance || 0),
          dailyRate: Math.round(l.dailyRate || 0)
        }));
        return {
          success: true,
          message: `Credit Rating: ${credit.rating} (Score ${credit.score}) | Max Borrowing Power: $${Math.round(credit.maxBorrowingLimit).toLocaleString()} | Active Loans: ${active.length}.`,
          data: { credit, active }
        };
      }
      if (action === 'take') {
        const ok = executeTakeLoan(S, amount, termDays);
        if (!ok) return { success: false, message: `Loan request for $${amount.toLocaleString()} (${termDays}d) was declined. Check credit eligibility.` };
        return { success: true, message: `Approved commercial loan of $${amount.toLocaleString()} over ${termDays} days.` };
      }
      if (action === 'repay') {
        const active = S.loans || [];
        if (active.length === 0) return { success: false, message: 'You have no active loans to repay.' };
        const ok = executePayoffLoan(S, active[0].id, amount);
        if (!ok) return { success: false, message: 'Could not process loan repayment (check cash balance).' };
        return { success: true, message: `Processed loan repayment on ${active[0].id}.` };
      }
      return { success: false, message: `Unknown loan action "${action}".` };
    }
  },
  {
    name: 'trade_crypto',
    description: 'Buy or sell crypto assets in your portfolio.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'buy or sell', enum: ['buy', 'sell'] },
        symbol: { type: 'string', description: 'Symbol (BTC, ETH, SOL, etc.)' },
        usdAmount: { type: 'number', description: 'Amount in USD' }
      },
      required: ['action', 'symbol', 'usdAmount']
    },
    execute: (S: any, { action, symbol, usdAmount }: { action: 'buy' | 'sell'; symbol: string; usdAmount: number }) => {
      if (!S.cryptoPortfolio) S.cryptoPortfolio = { cash: 0, holdings: {} };
      const assetId = (symbol || 'btc').toLowerCase();
      if (usdAmount <= 0) return { success: false, message: 'Trade amount must be greater than zero.' };
      const slip = calculateTradeSlippage(assetId, usdAmount, action);
      const execPrice = slip.effectivePrice || 100;
      const qty = usdAmount / execPrice;

      if (action === 'buy') {
        if ((S.cryptoPortfolio.cash || 0) < usdAmount) {
          return { success: false, message: `Insufficient crypto portfolio cash ($${Math.round(S.cryptoPortfolio.cash || 0).toLocaleString()}).` };
        }
        S.cryptoPortfolio.cash -= usdAmount;
        S.cryptoPortfolio.holdings[assetId] = (S.cryptoPortfolio.holdings[assetId] || 0) + qty;
        return { success: true, message: `Bought ${qty.toFixed(4)} ${assetId.toUpperCase()} for $${usdAmount.toLocaleString()}.` };
      }

      const held = S.cryptoPortfolio.holdings[assetId] || 0;
      if (held < qty) {
        return { success: false, message: `Insufficient ${assetId.toUpperCase()} holdings to sell $${usdAmount.toLocaleString()}.` };
      }
      S.cryptoPortfolio.holdings[assetId] = held - qty;
      S.cryptoPortfolio.cash = (S.cryptoPortfolio.cash || 0) + usdAmount;
      return { success: true, message: `Sold ${qty.toFixed(4)} ${assetId.toUpperCase()} for $${usdAmount.toLocaleString()}.` };
    }
  },
  {
    name: 'toggle_ai_crypto_bot',
    description: 'Enable or disable the AI Crypto Trading Bot.',
    parameters: {
      type: 'object',
      properties: { enabled: { type: 'boolean', description: 'True to enable, false to disable' } },
      required: ['enabled']
    },
    execute: (S: any, { enabled }: { enabled: boolean }) => {
      if (!S.aiCryptoBot) S.aiCryptoBot = { enabled: false, maxAllocationPct: 20, lastTradeAt: 0 };
      S.aiCryptoBot.enabled = enabled;
      return { success: true, message: `AI Crypto Trading Bot ${enabled ? 'ENABLED' : 'DISABLED'}.` };
    }
  },
  {
    name: 'manage_insurance',
    description: 'Inspect underwriting risk profile, enroll/cancel commercial insurance policies (liability, collision, cargo), or change deductible tier (low_deductible, standard, high_deductible).',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'status, enroll, cancel, or set_tier' },
        policyId: { type: 'string', description: 'liability, collision, or cargo (for enroll/cancel)' },
        tier: { type: 'string', description: 'low_deductible, standard, or high_deductible (for set_tier)' }
      },
      required: ['action']
    },
    execute: (S: any, { action, policyId, tier }: { action: string; policyId?: string; tier?: string }) => {
      if (!S.insurance) S.insurance = { liability: true, collision: true, cargo: false };
      if (action === 'enroll' || action === 'cancel') {
        const pid = (policyId || '').toLowerCase() as 'liability' | 'collision' | 'cargo';
        if (!['liability', 'collision', 'cargo'].includes(pid)) {
          return { success: false, message: 'Specify policyId: liability, collision, or cargo.' };
        }
        S.insurance[pid] = action === 'enroll';
        const prof = calculateUnderwritingProfile(S);
        return {
          success: true,
          message: `${pid.toUpperCase()} insurance ${S.insurance[pid] ? 'ENROLLED' : 'CANCELLED'}. Daily fleet premium: $${prof.dailyPremiumUsd.toLocaleString()}/day.`
        };
      }
      if (action === 'set_tier') {
        const t = (tier || '').toLowerCase() as DeductibleTier;
        if (!DEDUCTIBLE_TIERS[t]) {
          return { success: false, message: 'Specify tier: low_deductible, standard, or high_deductible.' };
        }
        S.insuranceTier = t;
        const prof = calculateUnderwritingProfile(S);
        return {
          success: true,
          message: `Insurance deductible schedule set to ${DEDUCTIBLE_TIERS[t].label}. Daily premium: $${prof.dailyPremiumUsd.toLocaleString()}/day.`
        };
      }
      const prof = calculateUnderwritingProfile(S);
      return {
        success: true,
        message: `Risk: ${prof.riskGrade} (${prof.riskScore}/100) · DOT: ${prof.safetyGrade} · Premium: $${prof.dailyPremiumUsd.toLocaleString()}/day (${prof.activePolicies}/3 policies) · Tier: ${prof.tier.label}.`,
        data: prof
      };
    }
  }
];
