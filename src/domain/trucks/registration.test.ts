import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTruckCode, generateLicensePlate, registerTruckAtCity, getTruckRegistrationStatus, renewVehicleRoadTax, performVehicleInspection } from './registration';
import { createTruck } from './trucks.physics';

describe('Vehicle Registration & DMV Bureau', () => {
  it('generates realistic brand prefix vehicle codes', () => {
    const scania = createTruck(1, 'scania_s730', 'Test Scania', 'LAGOS');
    const man = createTruck(2, 'man_tgx', 'Test MAN', 'BERLIN');
    const merc = createTruck(3, 'merc_actros', 'Test Merc', 'PARIS');

    assert.ok(getTruckCode(scania).startsWith('SC'));
    assert.ok(getTruckCode(man).startsWith('MN'));
    assert.ok(getTruckCode(merc).startsWith('MC'));
  });

  it('generates authentic city license plate numbers', () => {
    const berlinPlate = generateLicensePlate('BERLIN');
    const lagosPlate = generateLicensePlate('LAGOS');
    const customPlate = generateLicensePlate('HOUSTON', 'NEX-001');

    assert.ok(berlinPlate.startsWith('B-'));
    assert.ok(lagosPlate.startsWith('LA-'));
    assert.equal(customPlate, 'NEX-001');
  });

  it('registers unregistered vehicles and issues DOT registration papers', () => {
    const truck = createTruck(10, 'scania_s730', 'Flagship 10', 'BERLIN');
    const mockState: any = {
      money: 10000,
      fleet: [truck],
      notes: [],
      logs: []
    };

    assert.equal(getTruckRegistrationStatus(truck).status, 'unregistered');

    const success = registerTruckAtCity(mockState, 10, 'BERLIN', 'HAUL-88');
    assert.equal(success, true);
    assert.equal(truck.regNo, 'HAUL-88');
    assert.equal(truck.registeredCity, 'BERLIN');
    assert.equal(getTruckRegistrationStatus(truck).status, 'active');
  });

  it('handles road tax renewals and safety inspections', () => {
    const truck = createTruck(11, 'volvo_fh16', 'Volvo 11', 'LAGOS');
    truck.regNo = 'LA-9921-TR';
    truck.registeredCity = 'LAGOS';
    truck.taxExpiresAt = Date.now() - 1000; // Expired

    const mockState: any = {
      money: 20000,
      fleet: [truck],
      notes: [],
      logs: []
    };

    assert.equal(getTruckRegistrationStatus(truck).status, 'tax_expired');

    renewVehicleRoadTax(mockState, 11);
    assert.equal(getTruckRegistrationStatus(truck).status, 'active');

    const inspectRes = performVehicleInspection(mockState, 11);
    assert.equal(inspectRes.passed, true);
  });
});
