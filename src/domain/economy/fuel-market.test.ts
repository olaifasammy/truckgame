import { test } from 'node:test';
import assert from 'node:assert';
import { getRegionalRetailFuelPrice, getHubWholesaleFuelPrice } from './fuel-market';

test('Fuel Market - Regional retail price diversification', () => {
  const priceEurope = getRegionalRetailFuelPrice('ROTTERDAM');
  const priceAfrica = getRegionalRetailFuelPrice('LAGOS');
  const priceAmerica = getRegionalRetailFuelPrice('CHICAGO');
  const priceAsia = getRegionalRetailFuelPrice('TOKYO');

  assert.strictEqual(priceEurope, 1.85, 'Rotterdam European retail fuel price matches EU rate');
  assert.strictEqual(priceAfrica, 0.85, 'Lagos African retail fuel price matches regional rate');
  assert.strictEqual(priceAmerica, 1.25, 'Chicago American retail fuel price matches US rate');
  assert.strictEqual(priceAsia, 1.40, 'Tokyo Asian retail fuel price matches Asian rate');
});

test('Fuel Market - Wholesale bulk fuel discount (20% off local retail price)', () => {
  const retailRotterdam = getRegionalRetailFuelPrice('ROTTERDAM');
  const wholesaleRotterdam = getHubWholesaleFuelPrice('ROTTERDAM');

  assert.strictEqual(wholesaleRotterdam, parseFloat((retailRotterdam * 0.80).toFixed(2)), 'Wholesale fuel in Rotterdam is 20% cheaper than retail station');
  assert.ok(wholesaleRotterdam < retailRotterdam, 'Wholesale price is strictly lower than retail station price');

  const retailLagos = getRegionalRetailFuelPrice('LAGOS');
  const wholesaleLagos = getHubWholesaleFuelPrice('LAGOS');
  assert.strictEqual(wholesaleLagos, parseFloat((retailLagos * 0.80).toFixed(2)), 'Wholesale fuel in Lagos is 20% cheaper than local retail station');
});

test('Fuel Market - Simulation day market volatility fluctuation', () => {
  const mockState1 = { simulationDay: 1 };
  const mockState2 = { simulationDay: 5 };

  const priceDay1 = getRegionalRetailFuelPrice('ROTTERDAM', mockState1);
  const priceDay5 = getRegionalRetailFuelPrice('ROTTERDAM', mockState2);

  assert.ok(priceDay1 > 0 && priceDay5 > 0, 'Dynamic market prices exist across simulation days');
  assert.ok(Math.abs(priceDay1 - priceDay5) <= 0.20, 'Market volatility stays within realistic ±5% boundaries');
});
