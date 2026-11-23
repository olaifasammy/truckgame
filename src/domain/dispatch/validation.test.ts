import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDispatchEligibilityError } from './validation';

const baseState = {
  licenses: ['adr_hazmat', 'cold_chain', 'heavy_haul', 'lcv_double', 'high_value'],
  depots: ['hub_lagos'],
  unlockedRegions: ['Africa'],
  trailers: ['curtain', 'reefer', 'lowboy']
};

const baseTruck: any = {
  id: 1,
  name: 'Scania S730',
  modelId: 'scania_s730',
  status: 'idle',
  loc: 'LAGOS',
  driverId: 1,
  trailer: 'curtain',
  oil: 90,
  fluids: { coolant: 90, adBlue: 90 },
  components: {
    engine: { health: 95 },
    brakes: { health: 95 },
    tires: { health: 95 },
    transmission: { health: 95 }
  }
};

const baseDriver: any = {
  id: 1,
  name: 'Sam Okafor',
  fatigue: 10,
  hosHours: 2.0,
  certifications: ['Cold Chain', 'ADR Hazmat', 'Heavy Haul', 'Double Trailer LCV', 'High-Value Fragile']
};

const baseJob: any = {
  id: 101,
  from: 'LAGOS',
  to: 'IBADAN',
  km: 130,
  weight: 18,
  cargoId: 'electronics',
  trailer: 'curtain'
};

describe('Dispatch Validation (Phase 2 Realism)', () => {
  it('blocks dispatch when vehicle fails DOT roadworthiness inspection', () => {
    const badBrakes = {
      ...baseTruck,
      components: { ...baseTruck.components, brakes: { health: 10 } }
    };
    const err = getDispatchEligibilityError(baseState, badBrakes, baseJob, baseDriver);
    assert.ok(err && err.includes('DOT Inspection Failed: Brakes'));

    const lowCoolant = {
      ...baseTruck,
      fluids: { coolant: 10, adBlue: 90 }
    };
    const err2 = getDispatchEligibilityError(baseState, lowCoolant, baseJob, baseDriver);
    assert.ok(err2 && err2.includes('DOT Inspection Failed: Coolant'));
  });

  it('prevents swapping trailers outside an owned hub or without yard inventory', () => {
    const reeferJob = { ...baseJob, cargoId: 'frozen_fish', trailer: 'reefer' };

    // Truck parked at non-hub city IBADAN with curtain trailer cannot swap to reefer
    const atNonHub = { ...baseTruck, loc: 'IBADAN', trailer: 'curtain' };
    const err = getDispatchEligibilityError(baseState, atNonHub, reeferJob, baseDriver);
    assert.ok(err && err.includes('cannot swap trailers outside an owned Hub'), `Got: ${err}`);

    // Truck at owned hub LAGOS but reefer is not in state.trailers
    const noReeferState = { ...baseState, trailers: ['curtain'] };
    const err2 = getDispatchEligibilityError(noReeferState, baseTruck, reeferJob, baseDriver);
    assert.ok(err2 && err2.includes('No reefer trailer available'), `Got: ${err2}`);
  });

  it('requires driver-level certification in addition to company license', () => {
    const reeferJob = { ...baseJob, cargoId: 'frozen_fish', trailer: 'reefer' };
    const uncertifiedDriver = { ...baseDriver, certifications: [] };

    const err = getDispatchEligibilityError(baseState, { ...baseTruck, trailer: 'reefer' }, reeferJob, uncertifiedDriver);
    assert.ok(err && err.includes('lacks Cold Chain certification'), `Got: ${err}`);
  });
});
