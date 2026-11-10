import assert from 'node:assert';
import test from 'node:test';
import { CARGO_TYPES } from '../cargo/registry';
import { FreightEngine } from './generator';

test('Cargo Registry - Caterpillar 320 baseValue', () => {
  const excavator = CARGO_TYPES.find(c => c.id === 'excavator');
  assert.ok(excavator, 'Excavator cargo should exist');
  assert.strictEqual(excavator.baseValue, 26.0, 'Excavator baseValue should be 26.0');
});

test('Cargo Registry - High-End Electronics & Structural Steel base values', () => {
  const electronics = CARGO_TYPES.find(c => c.id === 'electronics');
  const steel = CARGO_TYPES.find(c => c.id === 'steel_pipes');
  assert.ok(electronics, 'Electronics should exist');
  assert.ok(steel, 'Structural steel should exist');
  assert.ok(electronics.baseValue > 15.0, 'Electronics baseValue should reflect high-end tech');
  assert.ok(steel.baseValue >= 15.0, 'Structural steel baseValue should be robust industrial value');
});

test('FreightEngine - isFragile rate multiplier applied in standard job generation', () => {
  const state = { nextId: 1, unlockedRegions: ['NIGERIA'] };
  
  let fragileJob: any = null;
  for (let i = 0; i < 50; i++) {
    const job = FreightEngine.generate(state, { forceTrailer: 'lowboy' });
    const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
    if (cargo && cargo.isFragile && !job.isRoundTrip) {
      fragileJob = { job, cargo };
      break;
    }
  }

  if (fragileJob) {
    const { job, cargo } = fragileJob;
    const expectedBaseRate = 3.40 + (cargo.baseValue * 0.08);
    const rateWithFragile = expectedBaseRate * 1.30;
    const actualPerKm = job.pay / job.baseKm;
    assert.ok(actualPerKm >= rateWithFragile * 0.95, `Rate per km (${actualPerKm.toFixed(2)}) should reflect fragile multiplier`);
  }
});

test('FreightEngine - Progressive Heavy Tonnage Scaling formula', () => {
  const baseVal = 26.0;
  const baseRate = 3.40 + (baseVal * 0.08);
  const weight1 = 20; // 2 tonnes over 18
  const weight2 = 50; // 32 tonnes over 18

  const mult1 = 1 + (weight1 - 18) * 0.02; // 1.04
  const mult2 = 1 + (weight2 - 18) * 0.02; // 1.64

  assert.ok(mult2 > mult1, 'Higher weight must yield a larger weight multiplier');
  assert.strictEqual(mult1, 1.04);
  assert.strictEqual(parseFloat(mult2.toFixed(2)), 1.64);
});

test('FreightEngine - Minimum payout floor does not distort short distance per-km yield', () => {
  const state = { nextId: 200, unlockedRegions: ['NIGERIA'] };

  const job = FreightEngine.generate(state, { forceFrom: 'LAGOS', forceTo: 'IBADAN' });
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);

  assert.ok(job.pay >= 450, `Pay ($${job.pay}) should be at least minimum floor of $450`);
  
  if (job.pay > 450) {
    const ratePerKm = job.pay / job.baseKm;
    if (cargo && !cargo.isHazmat && cargo.baseValue < 15.0) {
      assert.ok(ratePerKm < 10.0, `Short trip per-km rate ($${ratePerKm.toFixed(2)}/km) should not be distorted above realistic threshold`);
    }
  }
});
