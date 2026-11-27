import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EconomySimulation } from './simulation';
import { getRegionalRetailFuelPrice } from './fuel-market';

describe('Economy Simulation (Phase 3 Accounting & Fuel)', () => {
  it('accrues staff salaries for end-of-week settlement and settles on day 7', () => {
    const t0 = 1_000_000_000;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const state: any = {
      money: 100,
      lastTick: t0,
      simulationDay: 1,
      drivers: [{ id: 1, name: 'Test Driver', salary: 300 }],
      insurance: { liability: true, collision: false, cargo: false },
      warehouseUpgrades: { cross_docking: false, gantry_crane: false },
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 },
      loans: [],
      contracts: [],
      fleet: []
    };

    // Advance 0.5 sim day (salaries accrue, not paid until end of week)
    EconomySimulation.processTick(state, t0 + MS_PER_DAY * 0.5);

    assert.equal(state.dailyStats.salaries, 0);
    assert.equal(Math.round(state.accruedPayroll), 150);
    assert.ok(state.dailyStats.insurance > 0, 'Insurance should be logged in dailyStats.insurance');
    assert.ok(state.money < 100, `Expected insurance to be deducted from cash, got ${state.money}`);

    // Advance remaining 6.5 days to reach end of week (7 days total)
    EconomySimulation.processTick(state, t0 + MS_PER_DAY * 7);
    assert.equal(state.accruedPayroll, 0);
    assert.equal(state.dailyStats.salaries, 2100);
    assert.ok(state.money < 0, `Expected negative balance after weekly payroll settlement, got ${state.money}`);
  });

  it('prices regional diesel distinctly across Europe, America, and Africa', () => {
    const eu = getRegionalRetailFuelPrice('ROTTERDAM');
    const us = getRegionalRetailFuelPrice('CHICAGO');
    const af = getRegionalRetailFuelPrice('LAGOS');
    assert.ok(eu > us && us > af, `Expected EU (${eu}) > US (${us}) > AF (${af})`);
  });

  it('bills active tractor leases daily and reclaims expired idle leased tractors', () => {
    const t0 = 1_000_000_000;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const state: any = {
      money: 10000,
      homeCity: 'LAGOS',
      lastTick: t0,
      simulationDay: 1,
      drivers: [],
      insurance: { liability: false, collision: false, cargo: false },
      warehouseUpgrades: { cross_docking: false, gantry_crane: false },
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 },
      loans: [],
      contracts: [],
      fleet: [{ id: 10, modelId: 'scania_s730', loc: 'LAGOS', status: 'idle', leased: true }],
      leases: [{ id: 'L1', modelId: 'scania_s730', dailyRate: 480, termDays: 45, daysRemaining: 1, truckId: 10 }],
      notes: []
    };

    // Advance 1 full day -> lease expires and truck is reclaimed, $480 billed
    EconomySimulation.processTick(state, t0 + MS_PER_DAY);
    assert.equal(state.dailyStats.leases, 480);
    assert.equal(state.money, 10000 - 480);
    assert.equal(state.leases.length, 0);
    assert.equal(state.fleet.length, 0);
  });
});
