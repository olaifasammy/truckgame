import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureHubFacilities,
  getHubFacility,
  getHubTotalBerths,
  getHubMaxFacilityLevel,
  getHubFacilityUpgradeCost,
  upgradeHubFacility,
  expandHubBerths,
  expandHubFuelTank,
  buyHubWholesaleFuel,
  processPendingFuelDeliveries,
  getHubFacilityYieldBonus,
  bulkRefuelHubFleet,
  isCityUnlockedHub,
  getHubForCity,
  getHubBerthOccupancy,
  calculateFleetDailyParkingFees,
  OVERFLOW_HUB_PARKING_DAILY_FEE,
  NON_HUB_PARKING_DAILY_FEE
} from './hub-facility';
import { EconomySimulation } from '../economy/simulation';
import { getHubEffectiveDailyJobLimit } from './characteristics';
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
  assert.equal(facilities['hub_lagos'].fuelCapacity, 35000);
});

test('Hub Tier Max Levels & Dynamic Bond Yield Upgrade Pricing', () => {
  // Lagos is Tier 1 (Max Lvl 10)
  assert.equal(getHubMaxFacilityLevel('hub_lagos'), 10);
  // Munich is Tier 2 (Max Lvl 6)
  assert.equal(getHubMaxFacilityLevel('hub_munich'), 6);
  // Kano is Tier 2 or Feeder (Max Lvl 6 or 3)
  assert.ok(getHubMaxFacilityLevel('hub_kano') <= 6);

  const S: any = {
    depots: ['hub_lagos'],
    money: 10000000,
    finance: { bondYield: 0.08 } // 8.0% corporate bond yield raises financing capital factor
  };

  ensureHubFacilities(S);
  const facility = getHubFacility(S, 'hub_lagos');
  
  const costAtNormalBond = getHubFacilityUpgradeCost(facility, { finance: { bondYield: 0.04 } });
  const costAtHighBond = getHubFacilityUpgradeCost(facility, S);
  assert.ok(costAtHighBond > costAtNormalBond, 'Higher bond yield increases dynamic infrastructure upgrade cost');
});

test('Hub Facility - Level upgrade expands berths, fuel tank, daily jobs, and yield bonus', () => {
  const S: any = {
    depots: ['hub_lagos'],
    money: 500000,
    fleet: []
  };

  ensureHubFacilities(S);
  const facility = getHubFacility(S, 'hub_lagos');
  assert.equal(facility.level, 1);

  const initialBerths = getHubTotalBerths(S, 'hub_lagos');
  const initialFuelCap = facility.fuelCapacity;
  const initialJobLimit = getHubEffectiveDailyJobLimit(S, 'hub_lagos');
  assert.equal(getHubFacilityYieldBonus(S, 'hub_lagos'), 1.0);

  // Perform facility upgrade
  const upgraded = upgradeHubFacility(S, 'hub_lagos');
  assert.equal(upgraded, true);
  assert.equal(facility.level, 2);
  assert.equal(getHubTotalBerths(S, 'hub_lagos'), initialBerths + 2);
  assert.equal(facility.fuelCapacity, initialFuelCap + 10000);
  assert.equal(getHubEffectiveDailyJobLimit(S, 'hub_lagos'), initialJobLimit + 3);
  assert.equal(getHubFacilityYieldBonus(S, 'hub_lagos'), 1.04);
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

  // Buy wholesale fuel (dispatches road fuel tanker)
  const ordered = buyHubWholesaleFuel(S, 'hub_lagos', 5000);
  assert.equal(ordered, true);
  
  // Fast forward in-transit tanker delivery completion
  processPendingFuelDeliveries(S, Date.now() + 300000);
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

test('Hub Parking Berths - enforces overflow fees and off-hub staging fees in daily economy', () => {
  const S: any = {
    depots: ['hub_lagos'],
    hubFacilities: { hub_lagos: { hubId: 'hub_lagos', level: 1, extraBerths: 0, fuelLiters: 10000, fuelCapacity: 35000, pendingFuelDeliveries: [] } },
    fleet: [],
    drivers: [],
    insurance: { liability: false, collision: false, cargo: false },
    warehouseUpgrades: { cross_docking: false, gantry_crane: false },
    loans: [],
    contracts: [],
    money: 10000,
    lastTick: 1_000_000_000,
    simulationDay: 1,
    dailyStats: { revenue: 0, salaries: 0, fuel: 0, maintenance: 0, insurance: 0, loans: 0, parking: 0 }
  };

  const berths = getHubTotalBerths(S, 'hub_lagos');
  // Park berths + 2 overflow idle trucks at LAGOS, plus 1 idle truck in IBADAN (non-hub), plus 1 busy truck (exempt)
  for (let i = 1; i <= berths + 2; i++) {
    S.fleet.push({ id: i, loc: 'LAGOS', status: 'idle' });
  }
  S.fleet.push({ id: 90, loc: 'IBADAN', status: 'idle' });
  S.fleet.push({ id: 91, loc: 'IBADAN', status: 'busy' });

  const lagosOcc = getHubBerthOccupancy(S, 'LAGOS');
  assert.equal(lagosOcc.overflow, 2);
  assert.equal(lagosOcc.dailyParkingFee, 2 * OVERFLOW_HUB_PARKING_DAILY_FEE);

  const fleetParking = calculateFleetDailyParkingFees(S);
  assert.equal(fleetParking.overflowTrucks, 2);
  assert.equal(fleetParking.offHubTrucks, 1);
  assert.equal(fleetParking.totalDailyFee, 2 * OVERFLOW_HUB_PARKING_DAILY_FEE + NON_HUB_PARKING_DAILY_FEE);

  // Advance 0.5 sim day -> half daily parking fee deducted
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  EconomySimulation.processTick(S, 1_000_000_000 + MS_PER_DAY * 0.5);
  const expectedParking = Math.round(fleetParking.totalDailyFee * 0.5);
  assert.equal(S.dailyStats.parking, expectedParking);
  assert.equal(S.money, 10000 - expectedParking);
});
