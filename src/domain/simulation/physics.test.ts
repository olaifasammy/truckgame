import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMechanicalLimits, fuelPer100km } from './physics';

const baseTruck = {
  id: 1,
  modelId: 'scania_s730',
  trailer: 'curtain',
  components: {
    engine: { health: 100 },
    transmission: { health: 100 },
    tires: { health: 100 },
    brakes: { health: 100 },
    airFilter: { health: 100 },
    fuelFilter: { health: 100 },
    suspension: { health: 100 }
  }
} as any;

describe('Simulation Physics (Unified Realism)', () => {
  it('increases fuel consumption in bad weather and with worn tires/filters', () => {
    const clearCtx = { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 1.0, trailerType: 'curtain' };
    const snowCtx = { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 0.6, trailerType: 'curtain' };

    const clearFuel = fuelPer100km(baseTruck, clearCtx, 85);
    const snowFuel = fuelPer100km(baseTruck, snowCtx, 85);
    assert.ok(snowFuel > clearFuel, `Expected snow fuel (${snowFuel}) > clear fuel (${clearFuel})`);

    const wornTruck = {
      ...baseTruck,
      components: {
        ...baseTruck.components,
        tires: { health: 30 },
        airFilter: { health: 25 },
        fuelFilter: { health: 25 }
      }
    };
    const wornFuel = fuelPer100km(wornTruck, clearCtx, 85);
    assert.ok(wornFuel > clearFuel, `Expected worn truck fuel (${wornFuel}) > healthy truck fuel (${clearFuel})`);
  });

  it('accounts for trailer tare and aerodynamics vs bobtail', () => {
    const bobtailCtx = { cargoWeightKg: 0, gradientPct: 0, weatherCoeff: 1.0, trailerType: undefined };
    const doubleCtx = { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 1.0, trailerType: 'double_trailer' };

    const bobtailFuel = fuelPer100km({ ...baseTruck, trailer: undefined }, bobtailCtx, 85);
    const doubleFuel = fuelPer100km({ ...baseTruck, trailer: 'double_trailer' }, doubleCtx, 85);
    assert.ok(doubleFuel > bobtailFuel * 1.4, `Expected double trailer fuel (${doubleFuel}) >> bobtail (${bobtailFuel})`);
  });

  it('caps maxAttainableSpeed in severe weather and with worn brakes/tires', () => {
    const clearLimits = calculateMechanicalLimits(baseTruck, { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 1.0 });
    const snowLimits = calculateMechanicalLimits(baseTruck, { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 0.6 });
    assert.ok(snowLimits.maxAttainableSpeed < clearLimits.maxAttainableSpeed);

    const badBrakesTruck = {
      ...baseTruck,
      components: { ...baseTruck.components, brakes: { health: 20 }, tires: { health: 20 } }
    };
    const badLimits = calculateMechanicalLimits(badBrakesTruck, { cargoWeightKg: 20000, gradientPct: 0, weatherCoeff: 1.0 });
    assert.ok(badLimits.maxAttainableSpeed < clearLimits.maxAttainableSpeed);
  });
});
