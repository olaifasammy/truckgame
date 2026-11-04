import { pushNote } from '../../../systems/notify';
import { toast } from '../../../core/ui';
import { getCryptoMarketData, CRYPTO_ASSETS } from './crypto';

export interface CryptoCollateralLoan {
  id: string;
  assetId: string;
  collateralQty: number;
  collateralValueAtIssue: number;
  borrowedCash: number;
  repayAmount: number;
  ltvPct: number;
  dailyInterestRate: number;
  createdAt: number;
}

export const MAX_COLLATERAL_LTV = 65; // 65% Loan to Value
export const ANNUAL_INTEREST_RATE = 0.045; // 4.5% APR

export function borrowCryptoCollateral(S: any, assetId: string, collateralQty: number): boolean {
  if (collateralQty <= 0) {
    toast('Specify a valid collateral quantity', 'err');
    return false;
  }

  // Check user balance
  const availableQty = assetId === 'flb'
    ? (S.coins || 0)
    : (S.cryptoHoldings && S.cryptoHoldings[assetId]) || 0;

  if (availableQty < collateralQty) {
    toast(`Insufficient ${assetId.toUpperCase()} balance for collateral pledge`, 'err');
    return false;
  }

  const mkt = getCryptoMarketData(assetId);
  const collateralValueUsd = collateralQty * mkt.price;
  const borrowableUsd = Math.round(collateralValueUsd * (MAX_COLLATERAL_LTV / 100));

  if (borrowableUsd < 500) {
    toast('Minimum collateral loan borrowing amount is $500 USD', 'err');
    return false;
  }

  // Deduct collateral from user holdings
  if (assetId === 'flb') {
    S.coins -= collateralQty;
  } else {
    S.cryptoHoldings[assetId] -= collateralQty;
  }

  // Credit cash to user
  S.money += borrowableUsd;

  const loan: CryptoCollateralLoan = {
    id: 'LN-' + Math.floor(100000 + Math.random() * 900000),
    assetId,
    collateralQty,
    collateralValueAtIssue: collateralValueUsd,
    borrowedCash: borrowableUsd,
    repayAmount: borrowableUsd,
    ltvPct: MAX_COLLATERAL_LTV,
    dailyInterestRate: (borrowableUsd * ANNUAL_INTEREST_RATE) / 365,
    createdAt: Date.now()
  };

  if (!S.cryptoLoans) S.cryptoLoans = [];
  S.cryptoLoans.push(loan);

  pushNote(S, `Crypto Credit Line disbursed! Pledged ${collateralQty.toFixed(4)} ${mkt.symbol} for +$${borrowableUsd.toLocaleString()} liquid cash.`, {
    title: 'COLLATERAL CREDIT LINE DISBURSED',
    type: 'finance',
    priority: 2,
    body: `Loan Agreement: #${loan.id}\nPledged Collateral: ${collateralQty.toFixed(4)} ${mkt.symbol} ($${Math.round(collateralValueUsd).toLocaleString()})\nDisbursed Funds: $${borrowableUsd.toLocaleString()} USD\nLTV: 65% · APR: 4.5%`
  });

  toast(`Credit Line Approved: +$${borrowableUsd.toLocaleString()} liquid cash!`, 'success');
  return true;
}

export function repayCryptoCollateral(S: any, loanId: string): boolean {
  if (!S.cryptoLoans) return false;
  const idx = S.cryptoLoans.findIndex((l: any) => l.id === loanId);
  if (idx === -1) return false;

  const loan: CryptoCollateralLoan = S.cryptoLoans[idx];
  if (S.money < loan.repayAmount) {
    toast(`Insufficient funds to repay loan ($${Math.round(loan.repayAmount).toLocaleString()} required)`, 'err');
    return false;
  }

  // Deduct repayment money
  S.money -= loan.repayAmount;

  // Release locked collateral back to user wallet
  if (loan.assetId === 'flb') {
    S.coins = (S.coins || 0) + loan.collateralQty;
  } else {
    if (!S.cryptoHoldings) S.cryptoHoldings = {};
    S.cryptoHoldings[loan.assetId] = (S.cryptoHoldings[loan.assetId] || 0) + loan.collateralQty;
  }

  const asset = CRYPTO_ASSETS.find(a => a.id === loan.assetId) || { symbol: loan.assetId.toUpperCase() };

  S.cryptoLoans.splice(idx, 1);

  pushNote(S, `Loan #${loan.id} settled. Released ${loan.collateralQty.toFixed(4)} ${asset.symbol} collateral back to your corporate wallet.`, {
    title: 'COLLATERAL LOAN SETTLED',
    type: 'finance',
    priority: 2,
    body: `Loan ID: #${loan.id}\nRepaid Principal: $${Math.round(loan.repayAmount).toLocaleString()}\nCollateral Returned: ${loan.collateralQty.toFixed(4)} ${asset.symbol}`
  });

  toast(`Loan Repaid! Released ${loan.collateralQty.toFixed(4)} ${asset.symbol} to wallet.`, 'success');
  return true;
}
