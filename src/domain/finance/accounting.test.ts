import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTruckValuation,
  getTruckResaleValue,
  calculateDailyFleetDepreciation,
  calculateWeeklyAccounting,
  CORPORATE_TAX_RATE
} from './accounting';
import { EconomySimulation } from '../economy/simulation';
import { createTruck } from '../trucks/trucks.physics';
import { processLoanTick, checkLoanEligibility } from './commercialLoans';
import { refuelCost } from '../../systems/fleet';

describe('Corporate Accounting, Depreciation & Overdraft Interest (Phase 6)', () => {
  it('depreciates truck book valuation and resale value by odometer and condition', () => {
    const fresh = createTruck(1, 'scania_s730', 'Fresh Scania', 'LAGOS');
    const used = createTruck(2, 'scania_s730', 'Used Scania', 'LAGOS');
    used.odometer = 625_000;
    used.components.engine.health = 60;
    used.components.tires.health = 50;

    const freshVal = calculateTruckValuation(fresh);
    const usedVal = calculateTruckValuation(used);
    assert.ok(usedVal < freshVal * 0.75, `Expected heavy odometer/wear depreciation (${usedVal} vs ${freshVal})`);
    assert.equal(getTruckResaleValue(fresh), Math.round(freshVal * 0.85));
  });

  it('uses real fleet depreciation and actual daily stats without dummy fallbacks', () => {
    const truck = createTruck(1, 'scania_s730', 'Scania 1', 'LAGOS');
    const state: any = {
      money: 50000,
      fleet: [truck],
      trailers: [],
      drivers: [],
      loans: [],
      leases: [],
      contracts: [],
      depots: [],
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0, tolls: 0 }
    };

    const dailyDep = calculateDailyFleetDepreciation(state);
    assert.ok(dailyDep > 0, 'Active fleet should generate positive daily non-cash depreciation');

    const weekly = calculateWeeklyAccounting(state);
    assert.equal(weekly.fuelExpenseUsd, 0, 'Should not fabricate $1,200 dummy fuel');
    assert.equal(weekly.maintenanceExpenseUsd, 0, 'Should not fabricate $800 dummy maintenance');
    assert.equal(weekly.tollAndTariffUsd, 0, 'Should not fabricate $450 dummy tolls');
    assert.equal(weekly.depreciationUsd, dailyDep * 7);
  });

  it('charges 18% APR daily overdraft interest when cash balance is negative', () => {
    const state: any = {
      money: -20000,
      fleet: [],
      drivers: [],
      contracts: [],
      loans: [],
      depots: [],
      insurance: { liability: false, collision: false, cargo: false },
      warehouseUpgrades: { cross_docking: false, gantry_crane: false },
      lastTick: 1_000_000_000,
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 }
    };

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    EconomySimulation.processTick(state, 1_000_000_000 + MS_PER_DAY);

    const expectedInterest = Math.round(20000 * (0.18 / 365));
    assert.equal(state.dailyStats.overdraftInterest, expectedInterest);
    assert.equal(state.money, -20000 - expectedInterest);
    assert.equal(CORPORATE_TAX_RATE, 0.21);
  });

  it('deducts loan auto-payment exactly once (no double charge) and enforces credit freeze', () => {
    const t0 = 1_000_000_000;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const state: any = {
      money: 10000,
      ledger: [],
      notes: [],
      fleet: [],
      depots: [],
      violations: [],
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 },
      loans: [{ id: 'LN-1', lender: 'Apex Bank', balance: 5000, remainingBalance: 5000, dailyRate: 500, daysRemaining: 10, lastPaymentAt: t0 }]
    };

    processLoanTick(state, 1, t0 + MS_PER_DAY);
    assert.equal(state.money, 9500, 'Loan payment must only be deducted once from S.money');
    assert.equal(state.loans[0].balance, 4500);

    // Credit freeze on overdraft < -$25,000
    state.money = -30000;
    const freezeRes = checkLoanEligibility(state, 10000, 10);
    assert.equal(freezeRes.eligible, false);
    assert.ok(freezeRes.error?.includes('Credit Freeze'));
  });

  it('prevents remote fuelBunker teleportation away from homeCity', () => {
    const truck = createTruck(1, 'scania_s730', 'Scania 1', 'TOKYO');
    truck.fluids.fuel = 100;
    const state: any = {
      homeCity: 'LAGOS',
      depots: [],
      fuelBunker: { currentLiters: 5000 }
    };

    const tokyoCost = refuelCost(truck, state);
    assert.ok(tokyoCost > 0, 'Truck in Tokyo must not draw free LAGOS homeCity fuelBunker');

    truck.loc = 'LAGOS';
    const lagosCost = refuelCost(truck, state);
    assert.equal(lagosCost, 0, 'Truck at homeCity LAGOS may draw from homeCity fuelBunker');
  });
});
