import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDriverPerKmRate, DRIVER_RELOCATION_FEE, evaluateDriverProgression, processDriverLifecycleTick, fillDriverPool, forceRefreshDriverPool } from './drivers.engine';
import { FleetManagement } from '../trucks/fleet-management';
import { getDispatchEligibilityError } from '../dispatch/validation';

describe('Driver Simulation (Phase 4 Mileage Pay & Regional Permits)', () => {
  it('scales per-km mileage rate with CDL skill level', () => {
    const r1 = getDriverPerKmRate(1);
    const r3 = getDriverPerKmRate(3);
    const r5 = getDriverPerKmRate(5);
    assert.ok(r1 > 0 && r3 > r1 && r5 > r3, `Expected r1 (${r1}) < r3 (${r3}) < r5 (${r5})`);
  });

  it('enforces regional work permits on assignment and allows relocation', () => {
    const state: any = {
      money: 5000,
      fleet: [{ id: 1, name: 'Scania', status: 'idle', loc: 'LAGOS', driverId: null }],
      drivers: [{ id: 10, name: 'John Doe', region: 'America', skill: 3, assignedTruckId: null }]
    };

    const err = FleetManagement.assignDriver(state, 1, 10);
    assert.ok(err && err.includes('licensed for America'), `Expected region error, got: ${err}`);

    // Relocate driver to Africa
    const relErr = FleetManagement.relocateDriver(state, 10, 'Africa');
    assert.equal(relErr, null);
    assert.equal(state.money, 5000 - DRIVER_RELOCATION_FEE);
    assert.equal(state.drivers[0].region, 'Africa');

    // Assignment now succeeds
    const assignErr = FleetManagement.assignDriver(state, 1, 10);
    assert.equal(assignErr, null);
  });

  it('blocks dispatch when driver region mismatches job origin region', () => {
    const state = {
      licenses: [],
      depots: ['hub_lagos'],
      trailers: ['curtain']
    };
    const truck: any = {
      id: 1,
      modelId: 'scania_s730',
      status: 'idle',
      loc: 'LAGOS',
      driverId: 10,
      trailer: 'curtain',
      oil: 90,
      fluids: { coolant: 90, adBlue: 90 },
      components: { engine: { health: 90 }, brakes: { health: 90 }, tires: { health: 90 }, transmission: { health: 90 } }
    };
    const driver: any = { id: 10, name: 'Hans', region: 'Europe', fatigue: 0, hosHours: 0, certifications: [] };
    const job: any = { id: 1, from: 'LAGOS', to: 'IBADAN', km: 130, weight: 15, cargoId: 'electronics', trailer: 'curtain' };

    const err = getDispatchEligibilityError(state, truck, job, driver);
    assert.ok(err && err.includes('licensed for Europe, not Africa'), `Got: ${err}`);
  });

  it('promotes drivers from experience (accelerated by mentorship) and handles burnout/resignation', () => {
    const rookie: any = {
      id: 21,
      name: 'Kwame',
      skill: 1,
      salary: 200,
      morale: 70,
      mentorId: 99, // +100% Promotion XP (halves 4000km/4trips -> 2000km/2trips)
      stats: { tripsCompleted: 2, kmDriven: 2000, earned: 0 }
    };
    const notesState: any = { notes: [] };
    const promoted = evaluateDriverProgression(rookie, notesState);
    assert.equal(promoted, true);
    assert.equal(rookie.skill, 2);
    assert.equal(rookie.salary, 220);

    // Burnout dispatch gate
    const truck: any = {
      id: 5,
      modelId: 'scania_s730',
      status: 'idle',
      loc: 'LAGOS',
      driverId: 22,
      trailer: 'curtain',
      oil: 90,
      fluids: { coolant: 90, adBlue: 90 },
      components: { engine: { health: 90 }, brakes: { health: 90 }, tires: { health: 90 }, transmission: { health: 90 } }
    };
    const burnedOut: any = { id: 22, name: 'Tunde', region: 'Africa', fatigue: 10, hosHours: 0, morale: 18, stress: 95, certifications: [] };
    const job: any = { id: 2, from: 'LAGOS', to: 'IBADAN', km: 130, weight: 15, cargoId: 'electronics', trailer: 'curtain' };
    const dispatchErr = getDispatchEligibilityError({ licenses: [], depots: ['hub_lagos'], trailers: ['curtain'] }, truck, job, burnedOut);
    assert.ok(dispatchErr && dispatchErr.includes('burned out'), `Expected burnout gate, got: ${dispatchErr}`);

    // Lifecycle tick: idle burned-out driver resigns when morale <= 15; busy driver never quits mid-haul
    const busyDriver: any = { id: 23, name: 'Sadiq', morale: 10, stress: 90 };
    const busyTruck: any = { id: 6, status: 'busy', driverId: 23 };
    const simState: any = {
      money: 5000,
      fleet: [truck, busyTruck],
      drivers: [burnedOut, busyDriver],
      notes: []
    };

    const tickRes = processDriverLifecycleTick(simState, 1);
    assert.deepEqual(tickRes.resigned, ['Tunde']);
    assert.equal(truck.driverId, null);
    assert.equal(simState.drivers.length, 1);
    assert.equal(simState.drivers[0].name, 'Sadiq');
  });

  it('guarantees candidate drivers across all operating regions in recruitment pool', () => {
    const S: any = { pool: [], drivers: [], nextId: 100 };
    const now = 1_700_000_000_000;

    fillDriverPool(S, 2, 12, now);

    const regions = ['America', 'Europe', 'Africa', 'Asia'];
    for (const reg of regions) {
      const count = S.pool.filter((d: any) => d.region === reg).length;
      assert.ok(count >= 2, `Region ${reg} must have at least 2 candidates in pool, got ${count}`);
    }

    assert.ok(S.driverPoolNextRefreshAt > now, 'Must set next refresh timestamp');
  });

  it('allows manual agency search refresh of candidate pool across all regions', () => {
    const S: any = { pool: [], drivers: [], nextId: 100 };
    const now = 1_700_000_000_000;

    fillDriverPool(S, 2, 12, now);
    const initialPool = [...S.pool];

    // Force refresh agency search
    forceRefreshDriverPool(S, now + 1000);

    assert.equal(S.pool.length, 12);
    // At least some candidates refreshed
    assert.notDeepEqual(S.pool, initialPool);
  });
});
