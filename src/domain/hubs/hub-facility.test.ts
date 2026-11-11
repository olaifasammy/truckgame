import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureHubFacilities,
  getHubFacility,
  getHubTotalBerths,
  expandHubBerths,
  expandHubFuelTank,
  buyHubWholesaleFuel,
  bulkRefuelHubFleet,
  isCityUnlockedHub,
  getHubForCity
} from './hub-facility';
import { DispatchExecution } from '../dispatch/execution';

test('Hub Facility - initialization and retrieval', () => {
  const S: any = {
    depots: ['hub_lagos', 'hub_chicago'],
    money: 500000,
    fleet: []
  };

  const facilities = ensureHubFacilities(S);
  assert.ok(facilities['hub_lagos'], 'Lagos hub facility initialized');
  assert.ok(facilities['hub_chicago'], 'Chicago hub facility initialized');
  assert.equal(facilities['hub_lagos'].fuelCapacity, 15000);
});

test('Hub Berths - expansion adds +2 slots to hub', () => {
  const S: any = {
    depots: ['hub_lagos'],
    money: 100000,
    fleet: []
  };

  const initialBerths = getHubTotalBerths(S, 'hub_lagos');
  const success = expandHubBerths(S, 'hub_lagos');
  assert.equal(success, true);
  assert.equal(getHubTotalBerths(S, 'hub_lagos'), initialBerths + 2);
});

test('Hub Fuel Tank - expansion and wholesale fuel order', () => {
  const S: any = {
    depots: ['hub_lagos'],
    money: 200000,
    fleet: []
  };

  ensureHubFacilities(S);
  const facility = getHubFacility(S, 'hub_lagos');
  facility.fuelLiters = 2000;
  const initialCap = facility.fuelCapacity;

  // Expand tank
  const expanded = expandHubFuelTank(S, 'hub_lagos');
  assert.equal(expanded, true);
  assert.equal(facility.fuelCapacity, initialCap + 10000);

  // Buy wholesale fuel
  const ordered = buyHubWholesaleFuel(S, 'hub_lagos', 5000);
  assert.equal(ordered, true);
  assert.equal(facility.fuelLiters, 7000);
});

test('Hub Docking - truck sent to unlocked destination hub parks at hub and does not bounce back', () => {
  const S: any = {
    depots: ['hub_lagos', 'hub_abuja'],
    fleet: [
      { id: 1, name: 'Unit 1', modelId: 'scania_s730', loc: 'LAGOS', status: 'busy', fluids: { fuel: 600 }, components: {} }
    ],
    drivers: [],
    active: [],
    jobs: [],
    money: 10000,
    loads: 0,
    stats: { earned: 0, km: 0 }
  };

  assert.equal(isCityUnlockedHub(S, 'ABUJA'), true);
  assert.equal(isCityUnlockedHub(S, 'LAGOS'), true);

  // Simulate arrival of a job terminating at an unlocked hub (even if flagged as round-trip)
  const activeJob: any = {
    id: 101,
    cargoId: 'general_freight',
    truck: 1,
    from: 'LAGOS',
    to: 'ABUJA',
    km: 760,
    pay: 12000,
    isRoundTrip: true,
    currentLeg: 1
  };

  (DispatchExecution as any)._finalizeJob(S, activeJob);

  const truck = S.fleet[0];
  assert.equal(truck.loc, 'ABUJA', 'Truck must stay parked at destination hub');
  assert.equal(truck.status, 'idle', 'Truck must be idle awaiting new jobs');
  assert.equal(S.active.length, 0, 'No automatic forced return leg launched');
});
