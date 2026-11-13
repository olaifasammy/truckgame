import test from 'node:test';
import assert from 'node:assert';
import { calculateTripToll } from './tolls';

test('Tolls & Customs Engine - calculates variable distance, weight, and border tolls', () => {
  // Short domestic run within same region
  const result1 = calculateTripToll(200, 15, 'Lagos', 'Ibadan', false);
  assert.ok(result1.totalTollCost > 0);
  assert.strictEqual(result1.crossBorderTariff, 0);

  // Long cross-border run with EZ-Pass discount
  const result2 = calculateTripToll(850, 24, 'Lagos', 'London', true);
  assert.ok(result2.crossBorderTariff > 0);
  assert.strictEqual(result2.discountApplied, true);
  assert.ok(result2.totalTollCost > result1.totalTollCost);
});
