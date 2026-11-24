import { test } from 'node:test';
import assert from 'node:assert';
import { 
  getHubCharacteristics, 
  getHubSectorBonus, 
  calculateHubCost, 
  getHubNetworkSynergyBonus,
  getHubDailyUsage,
  recordHubJobDispatched,
  isHubDailyLimitReached,
  getHubEffectiveDailyTonnageCapacity
} from './characteristics';
import { ensureHubFacilities, getHubFacility, getHubTotalBerths } from './hub-facility';

test('Hub Characteristics - Tier 1 Mega-Hubs have high capacities and specialties', () => {
  const rotterdam = getHubCharacteristics('hub_rotterdam');
  assert.strictEqual(rotterdam.tier, 1);
  assert.ok(rotterdam.dailyJobLimit >= 20, 'Rotterdam daily job limit is at least 20');
  assert.ok(rotterdam.dailyTonnageCapacity >= 800, 'Rotterdam daily tonnage is at least 800T');
  assert.ok(rotterdam.baseFuelTankLiters >= 40000, 'Rotterdam base fuel tank is at least 40,000L');
  assert.ok(rotterdam.baseBerths >= 6, 'Rotterdam base berths is at least 6');
  assert.ok(rotterdam.specialties.some(s => s.id === 'containers'), 'Rotterdam has container specialty');
});

test('Hub Characteristics - Sector rate bonuses apply to specialized cargo', () => {
  const containerBonus = getHubSectorBonus('hub_rotterdam', 'container_iso');
  assert.ok(containerBonus > 1.0, 'ISO container cargo gets rate bonus at Rotterdam');

  const petroBonus = getHubSectorBonus('hub_algiers', 'fuel_tanker_adr');
  assert.ok(petroBonus > 1.0, 'ADR fuel tanker gets rate bonus at Algiers');
});

test('Hub Characteristics - Tier 3 Feeder Depots have smaller caps', () => {
  const innsbruck = getHubCharacteristics('hub_innsbruck');
  assert.strictEqual(innsbruck.tier, 3);
  assert.ok(innsbruck.dailyJobLimit <= 9, 'Innsbruck daily job limit is <= 9');
  assert.ok(innsbruck.baseFuelTankLiters <= 12000, 'Innsbruck fuel tank is <= 12,000L');
});

test('Hub Characteristics - Facility initialization respects hub fuel capacity', () => {
  const mockState: any = {
    depots: ['hub_rotterdam', 'hub_innsbruck'],
    hubFacilities: {}
  };

  ensureHubFacilities(mockState);
  const rFac = getHubFacility(mockState, 'hub_rotterdam');
  const iFac = getHubFacility(mockState, 'hub_innsbruck');

  assert.ok(rFac.fuelCapacity > iFac.fuelCapacity, 'Mega-hub fuel capacity is larger than feeder depot');
  assert.strictEqual(rFac.fuelCapacity, 45000, 'Rotterdam initial fuel capacity matches characteristics');
});

test('Hub Characteristics - Dynamic valuation calculation formula', () => {
  const costTier1 = calculateHubCost(1, 6, 45000, 24, 950);
  const costTier3 = calculateHubCost(3, 3, 10000, 7, 180);

  assert.ok(costTier1 > costTier3, 'Tier 1 cost is significantly higher than Tier 3');
});

test('Hub Characteristics - Inter-Hub Network Synergy Bonus (+8% terminal savings on owned corridors)', () => {
  const mockState: any = {
    depots: ['hub_rotterdam', 'hub_munich']
  };

  const synergy = getHubNetworkSynergyBonus(mockState, 'ROTTERDAM', 'MUNICH');
  assert.strictEqual(synergy.isNetworkCorridor, true);
  assert.strictEqual(synergy.rateMultiplier, 1.08);

  const unownedSynergy = getHubNetworkSynergyBonus(mockState, 'ROTTERDAM', 'PARIS');
  assert.strictEqual(unownedSynergy.isNetworkCorridor, false);
  assert.strictEqual(unownedSynergy.rateMultiplier, 1.0);
});

test('Hub Characteristics - Daily payload tonnage and job limits tracking', () => {
  const mockState: any = {
    simulationDay: 2,
    hubDailyUsage: {}
  };

  const innsbruck = getHubCharacteristics('hub_innsbruck');
  assert.ok(innsbruck.dailyTonnageCapacity >= 1200, 'Lowest hub base tonnage is at least 1200T');

  assert.strictEqual(isHubDailyLimitReached(mockState, 'hub_innsbruck'), false);

  // Record dispatching jobs at Innsbruck (daily job limit: 7, base tonnage limit: 1250T)
  recordHubJobDispatched(mockState, 'hub_innsbruck', 700);
  assert.strictEqual(isHubDailyLimitReached(mockState, 'hub_innsbruck'), false);

  // Dispatch another 600 tonnes (total 1300T > 1250T limit)
  recordHubJobDispatched(mockState, 'hub_innsbruck', 600);
  assert.strictEqual(isHubDailyLimitReached(mockState, 'hub_innsbruck'), true, 'Innsbruck daily tonnage capacity limit reached');
});

test('Hub Facility - Significant Upgrade Tonnage Increase (+500 T/day per level)', () => {
  const S: any = {
    depots: ['hub_innsbruck'],
    hubFacilities: {
      hub_innsbruck: { level: 2 }
    }
  };
  const baseCap = getHubCharacteristics('hub_innsbruck').dailyTonnageCapacity;
  const upgradedCap = getHubEffectiveDailyTonnageCapacity(S, 'hub_innsbruck');
  assert.strictEqual(upgradedCap, baseCap + 500, 'Level 2 adds exactly 500 tonnes/day');
});
