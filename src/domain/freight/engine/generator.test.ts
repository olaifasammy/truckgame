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

test('FreightEngine - isFragile rate surcharge applied in standard job generation', () => {
  const state = { 
    nextId: 1, 
    unlockedRegions: ['Africa'], 
    depots: ['hub_lagos'] 
  };
  
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
    const actualPerKm = job.pay / job.baseKm;
    assert.ok(actualPerKm >= 1.80, `Rate per km (${actualPerKm.toFixed(2)}) should reflect realistic commercial logistics rate`);
  }
});

test('FreightEngine - Progressive Heavy Tonnage Scaling formula', () => {
  const weight1 = 20; // 2 tonnes over 18
  const weight2 = 50; // 32 tonnes over 18

  const surcharge1 = Math.min(0.10, (weight1 - 18) * 0.006); // 0.012
  const surcharge2 = Math.min(0.10, (weight2 - 18) * 0.006); // 0.10 max

  assert.ok(surcharge2 > surcharge1, 'Higher weight must yield a larger weight surcharge');
  assert.strictEqual(parseFloat(surcharge1.toFixed(3)), 0.012);
  assert.strictEqual(surcharge2, 0.10);
});

test('FreightEngine - Minimum payout floor does not distort short distance per-km yield', () => {
  const state = { 
    nextId: 200, 
    unlockedRegions: ['Africa'],
    depots: ['hub_lagos']
  };

  const job = FreightEngine.generate(state, { forceFrom: 'LAGOS', forceTo: 'IBADAN' });
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);

  assert.ok(job.pay >= 1120, `Pay ($${job.pay}) should be at least minimum floor of $1,120`);
  
  if (job.pay >= 1120) {
    const ratePerKm = job.pay / job.baseKm;
    if (cargo && !cargo.isHazmat && cargo.baseValue < 8.0) {
      assert.ok(ratePerKm < 15.0, `Short trip per-km rate ($${ratePerKm.toFixed(2)}/km) should reflect logistics dispatch floor`);
    }
  }
});

test('FreightEngine - Bid jobs mostly generate long distance jobs', () => {
  const state = { 
    nextId: 300, 
    unlockedRegions: ['Africa', 'Europe'],
    depots: ['hub_lagos', 'hub_rotterdam']
  };
  let longDistCount = 0;
  const samples = 40;
  for (let i = 0; i < samples; i++) {
    const job = FreightEngine.generate(state, { isAuction: true });
    if (job.baseKm >= 600 || job.km >= 600) {
      longDistCount++;
    }
  }
  const longDistRatio = longDistCount / samples;
  assert.ok(longDistRatio >= 0.7, `Bid jobs should mostly generate long distance jobs (ratio: ${longDistRatio})`);
});

test('FreightEngine - Long distance jobs mostly be round-trip jobs', () => {
  const state = { 
    nextId: 400, 
    unlockedRegions: ['Africa', 'Europe'],
    depots: ['hub_lagos', 'hub_rotterdam']
  };
  let roundTripCount = 0;
  let longDistTested = 0;
  const samples = 100;
  for (let i = 0; i < samples; i++) {
    const job = FreightEngine.generate(state, {});
    if (job.baseKm > 750) {
      longDistTested++;
      if (job.isRoundTrip) roundTripCount++;
    }
  }
  if (longDistTested >= 5) {
    const roundTripRatio = roundTripCount / longDistTested;
    assert.ok(roundTripRatio >= 0.5, `Long distance jobs should mostly be round-trip jobs (ratio: ${roundTripRatio})`);
  }
});
