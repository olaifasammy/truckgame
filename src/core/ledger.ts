import { set } from './store';

/**
 * Enterprise Transaction Ledger
 * ----------------------------
 * Captures every movement of treasury funds into categorized ledger entries.
 * This allows for real-time, non-simulated accounting reports.
 */

export type LedgerCategory = 
  | 'revenue_freight'   // Job payouts
  | 'revenue_bonus'     // Tenders, bonuses
  | 'revenue_crypto'    // Selling crypto
  | 'revenue_asset'     // Selling trucks/hubs
  | 'revenue_other'
  | 'expense_fuel'      // Diesel, electricity
  | 'expense_toll'      // Highway/border tolls
  | 'expense_payroll'   // Driver salaries, hiring fees
  | 'expense_maintenance' // Repairs, service
  | 'expense_purchase'  // Buying trucks, trailers
  | 'expense_permit'    // DMV fees, registrations, inspections
  | 'expense_unlock'    // Region/hub unlocks
  | 'expense_crypto'    // Buying crypto
  | 'expense_finance'   // Loan interest, fees
  | 'expense_other';

export interface Transaction {
  id: string;
  timestamp: number;
  category: LedgerCategory;
  amount: number; // Positive for inflow, negative for outflow
  description: string;
}

/**
 * Tracks a financial transaction in the ledger and updates treasury balance.
 */
export function recordTransaction(S: any, category: LedgerCategory, amount: number, description: string) {
  if (!S.ledger) S.ledger = [];
  
  const tx: Transaction = {
    id: Math.random().toString(36).substring(2, 11),
    timestamp: Date.now(),
    category,
    amount,
    description
  };

  S.ledger.push(tx);
  S.money = (S.money || 0) + amount;

  // Keep ledger size manageable (last 2000 transactions)
  if (S.ledger.length > 2000) {
    S.ledger.shift();
  }
}

/**
 * Wraps store.set to provide a transactional update path.
 */
export function transact(category: LedgerCategory, amount: number, description: string) {
  set((S: any) => {
    recordTransaction(S, category, amount, description);
  });
}
