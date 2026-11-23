import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DispatchExecution } from './execution';
import { distKm } from '../../systems/calc';

function createTestState(overrides: Record<string, any> = {}): any {
  return {
    isAuthenticated: true,
    hqCity: 'LAGOS',
    depots: ['hub_lagos', 'hub_abuja'],
    unlockedRegions: ['Africa'],
    hubFacilities: {
      hub_lagos: { hubId: 'hub_lagos', level: 1, extraBerths: 0, fuelLiters: 10000, fuelCapacity: 35000, pendingFuelDeliveries: [] },
      hub_abuja: { hubId: 'hub_abuja', level: 1, extraBerths: 0, fuelLiters: 10000, fuelCapacity: 35000, pendingFuelDeliveries: [] }
    },
    fleet: [
      {
        id: 1,
        name: 'Scania S730 #1',
        modelId: 'scania_s730',
        status: 'busy',
        loc: 'LAGOS',
        driverId: 1,
        trailer: 'curtain',
        km: 0,
        oil: 95,
        fluids: { fuel: 600, coolant: 95, adBlue: 95 },
        components: {
          engine: { health: 95 },
          brakes: { health: 95 },
          tires: { health: 95 },
          transmission: { health: 95 }
        }
      }
    ],
    drivers: [
      {
        id: 1,
        name: 'Sam Okafor',
        assignedTruckId: 1,
        fatigue: 10,
        hosHours: 3,
        xp: 100,
        deliveries: 0,
        certifications: []
      }
    ],
    active: [],
    jobs: [],
    money: 50000,
    loads: 0,
    nextId: 500,
    simulationDay: 1,
    stats: { earned: 0, km: 0 },
    notes: [],
    ...overrides
  };
}

describe('DispatchExecution - No-Return Job Deadhead Return', () => {
  it('immediately starts a deadhead return to the nearest user-owned hub upon completing a no-return job at an external city', () => {
    const S = createTestState();
    const now = 1_700_000_000_000;

    // KANO is much closer to ABUJA than LAGOS
    assert.ok(distKm('KANO', 'ABUJA') < distKm('KANO', 'LAGOS'));

    const job: any = {
      id: 101,
      cargoId: 'electronics',
      cargo: 'Electronics',
      truck: 1,
      from: 'LAGOS',
      to: 'KANO',
      km: 950,
      pay: 8500,
      isRoundTrip: false,
      stage: 'done',
      end: now - 1000
    };
    S.active.push(job);

    const result = DispatchExecution.completeJobs(S, now);
    assert.equal(result.done.length, 1);

    const truck = S.fleet[0];
    assert.equal(truck.status, 'busy', 'Truck must stay busy on the deadhead return');
    assert.equal(truck.loc, 'KANO');

    assert.equal(S.active.length, 1, 'A deadhead return leg must be queued immediately');
    const returnLeg = S.active[0];
    assert.equal(returnLeg.kind, 'move');
    assert.equal(returnLeg.status, 'returning');
    assert.equal(returnLeg.from, 'KANO');
    assert.equal(returnLeg.to, 'ABUJA', 'Must route to the nearest user-owned hub (ABUJA)');
    assert.equal(returnLeg.pay, 0);
    assert.equal(returnLeg.km, distKm('KANO', 'ABUJA'));
    assert.ok(returnLeg.stage, 'Journey stage must be initialized');

    // Completing the deadhead return leg parks the truck at the hub without double-counting loads
    returnLeg.stage = 'done';
    const returnRes = DispatchExecution.completeJobs(S, now + 60_000);
    assert.equal(returnRes.done.length, 1);
    assert.equal(S.active.length, 0);
    assert.equal(truck.status, 'idle');
    assert.equal(truck.loc, 'ABUJA');
    assert.equal(S.loads, 1, 'Deadhead return must not increment completed freight loads');
  });

  it('parks idle without deadhead when a no-return job delivers directly to a user-owned hub', () => {
    const S = createTestState();
    const now = 1_700_000_000_000;

    const job: any = {
      id: 102,
      cargoId: 'electronics',
      cargo: 'Electronics',
      truck: 1,
      from: 'LAGOS',
      to: 'ABUJA',
      km: 760,
      pay: 6500,
      isRoundTrip: false,
      stage: 'done',
      end: now - 1000
    };
    S.active.push(job);

    DispatchExecution.completeJobs(S, now);

    assert.equal(S.active.length, 0, 'No deadhead return should be started when already at an owned hub');
    assert.equal(S.fleet[0].status, 'idle');
    assert.equal(S.fleet[0].loc, 'ABUJA');
  });

  it('returns to the hub where the job was taken from when no user-owned hub exists in the destination area', () => {
    // User only owns European hubs (Rotterdam & Munich), no African hubs.
    // Job was taken from ROTTERDAM to TUNIS (Africa). Even though MUNICH is closer to TUNIS,
    // there is no owned hub in Africa, so it must return to ROTTERDAM (originHub / job origin).
    const S = createTestState({
      hqCity: 'ROTTERDAM',
      depots: ['hub_rotterdam', 'hub_munich'],
      unlockedRegions: ['Europe', 'Africa'],
      hubFacilities: {
        hub_rotterdam: { hubId: 'hub_rotterdam', level: 1, extraBerths: 0, fuelLiters: 10000, fuelCapacity: 35000, pendingFuelDeliveries: [] },
        hub_munich: { hubId: 'hub_munich', level: 1, extraBerths: 0, fuelLiters: 10000, fuelCapacity: 35000, pendingFuelDeliveries: [] }
      }
    });
    const now = 1_700_000_000_000;

    const job: any = {
      id: 103,
      cargoId: 'electronics',
      cargo: 'Electronics',
      truck: 1,
      originHub: 'ROTTERDAM',
      from: 'ROTTERDAM',
      to: 'TUNIS',
      km: 1700,
      pay: 9000,
      isRoundTrip: false,
      stage: 'done',
      end: now - 1000
    };
    S.active.push(job);

    DispatchExecution.completeJobs(S, now);

    assert.equal(S.active.length, 1);
    assert.equal(S.active[0].to, 'ROTTERDAM', 'Must return to the hub where the job was taken from when no owned hub exists in the destination area');
  });
});
