import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VehicleMaintenance, THIRD_PARTY_REPAIR_SURCHARGE, PART_BASE_PRICES } from './maintenance';
import { createTruck } from './trucks.physics';
import { advanceJourney } from './trucks.journey';
import { TRUCK_MODELS } from './trucks.data';

describe('Maintenance, Workshop Location & Live Fluid Consumption', () => {
  it('applies +25% 3rd-party dealer surcharge and blocks HQ stock outside owned hubs', () => {
    const truck = createTruck(1, 'scania_s730', 'Scania 1', 'IBADAN'); // Not owned hub
    truck.components.brakes.health = 50;

    const state: any = {
      money: 50000,
      depots: ['hub_lagos'],
      partsInventory: { brakes: 2 },
      fleet: [truck],
      repairs: [],
      nextId: 1,
      notes: [],
      ledger: [],
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 }
    };

    const remoteFacility = VehicleMaintenance.getRepairFacilityInfo(state, truck);
    assert.equal(remoteFacility.atOwnedHub, false);
    assert.equal(remoteFacility.costMultiplier, THIRD_PARTY_REPAIR_SURCHARGE);
    assert.equal(remoteFacility.canUseInventory, false);

    const remoteEff = VehicleMaintenance.getPartEffectiveCost(state, truck, 'brakes');
    assert.equal(remoteEff.fromInventory, false);
    assert.equal(remoteEff.cost, Math.round(PART_BASE_PRICES.brakes * 0.5 * THIRD_PARTY_REPAIR_SURCHARGE));

    // Move truck to owned hub LAGOS -> 1.0x cost and HQ warehouse stock applies
    truck.loc = 'LAGOS';
    const hubFacility = VehicleMaintenance.getRepairFacilityInfo(state, truck);
    assert.equal(hubFacility.atOwnedHub, true);
    assert.equal(hubFacility.canUseInventory, true);

    const hubEff = VehicleMaintenance.getPartEffectiveCost(state, truck, 'brakes');
    assert.equal(hubEff.fromInventory, true);
    const expectedBase = PART_BASE_PRICES.brakes * 0.5;
    assert.equal(hubEff.cost, Math.min(150, Math.max(25, Math.round(expectedBase * 0.08))));
  });

  it('restores oil to model oilCapacity (not 100L) and records maintenance transaction', () => {
    const truck = createTruck(2, 'scania_s730', 'Scania 2', 'LAGOS');
    const oilCap = TRUCK_MODELS.scania_s730.oilCapacity;
    truck.fluids.oil = 12;

    const state: any = {
      money: 20000,
      depots: ['hub_lagos'],
      partsInventory: {},
      fleet: [truck],
      repairs: [],
      nextId: 1,
      notes: [],
      ledger: [],
      dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0 }
    };

    const err = VehicleMaintenance.startRepair(state, 2, ['oil']);
    assert.equal(err, null);
    assert.equal(state.money, 20000 - PART_BASE_PRICES.oil);
    assert.equal(state.dailyStats.maintenance, PART_BASE_PRICES.oil);

    const rep = state.repairs[0];
    VehicleMaintenance.completeRepairs(state, rep.end + 100);
    assert.equal(truck.fluids.oil, oilCap);
    assert.equal(truck.status, 'idle');
  });

  it('consumes live AdBlue, oil & coolant during journey and triggers DEF derate below 5%', () => {
    const truck = createTruck(3, 'scania_s730', 'Scania 3', 'LAGOS');
    truck.fluids.adBlue = 2; // Critically low -> SCR/DEF derate (<= 65 km/h)
    const startOil = truck.fluids.oil;
    const startCoolant = truck.fluids.coolant;

    const t0 = 1_000_000;
    const job: any = {
      id: 99,
      from: 'LAGOS',
      to: 'IBADAN',
      km: 200,
      kmTravelled: 0,
      dh: 0,
      dhTravelled: 0,
      stage: 'driving',
      stageStart: t0,
      lastAdvanceAt: t0,
      tankL: 500,
      speedKmh: 85,
      targetSpeed: 85,
      env: { weather: 'clear', gradePct: 0 }
    };

    advanceJourney(job, truck, { id: 1, fatigue: 0, hosHours: 0 }, t0 + 180_000);
    assert.ok(job.liveFluidsSynced, 'Journey should mark liveFluidsSynced');
    assert.ok(job.speedKmh <= 65.5, `Expected SCR/DEF speed derate <= 65 km/h, got ${job.speedKmh}`);
    assert.ok(truck.fluids.oil < startOil, 'Oil should deplete per km');
    assert.ok(truck.fluids.coolant < startCoolant, 'Coolant should deplete per km');
    assert.ok(truck.fluids.adBlue < 2, 'AdBlue should deplete with diesel burn');
  });
});
