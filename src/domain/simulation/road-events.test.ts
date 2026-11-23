import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRoadEvents } from './road-events';

function makeInput(overrides: any = {}) {
  return {
    jobId: 101,
    truckId: 1,
    legKmDone: 25,
    isDeadhead: false,
    isRepositioning: false,
    mode: 'normal' as const,
    weather: 'clear',
    gradePct: 0,
    cargoWeightTonnes: 18,
    riskMod: 1.0,
    driverSkill: 4,
    driverFatigue: 10,
    driverHosHours: 2,
    hasRegNo: true,
    components: { engine: 95, brakes: 95, tires: 95, suspension: 95, windshield: 95 },
    coolant: 95,
    now: 1_000_000,
    ...overrides
  };
}

describe('Ultra-Realistic Road Events, Incidents & Accidents', () => {
  it('never causes accidents for a healthy, rested driver in clear weather', () => {
    const truck: any = { components: { engine: { health: 95 }, brakes: { health: 95 }, tires: { health: 95 }, suspension: { health: 95 }, windshield: { health: 95 } } };
    const driver: any = { stress: 10, morale: 90 };

    for (let km = 25; km <= 2500; km += 25) {
      const job: any = {};
      const events = evaluateRoadEvents(makeInput({ legKmDone: km }), job, truck, driver);
      const accidents = events.filter(e => e.category === 'accident');
      assert.equal(accidents.length, 0, `Unexpected accident at ${km} km for healthy/rested run`);
    }
  });

  it('triggers risk-driven collisions when fatigue, speeding, bad weather, and worn brakes stack', () => {
    let foundAccident = false;
    for (let km = 25; km <= 3000; km += 25) {
      const truck: any = {
        components: { engine: { health: 90 }, brakes: { health: 18 }, tires: { health: 20 }, suspension: { health: 80 }, windshield: { health: 95 } }
      };
      const driver: any = { stress: 10, morale: 90 };
      const job: any = {};
      const events = evaluateRoadEvents(
        makeInput({
          legKmDone: km,
          mode: 'speeding',
          weather: 'snow',
          riskMod: 1.5,
          driverSkill: 1,
          driverFatigue: 85,
          components: { engine: 90, brakes: 18, tires: 20, suspension: 80, windshield: 95 }
        }),
        job,
        truck,
        driver
      );
      const acc = events.find(e => e.category === 'accident');
      if (acc) {
        foundAccident = true;
        assert.ok(truck.components.windshield.health < 95, 'Accident should damage windshield');
        assert.ok(driver.stress > 10, 'Accident should increase driver stress');
        assert.ok(job.speedCapKmH > 0, 'Accident should apply recovery speed cap');
        break;
      }
    }
    assert.ok(foundAccident, 'Expected at least one collision when severe risk factors stacked');
  });

  it('triggers tire blowout on critically worn tires and applies speed cap', () => {
    let foundBlowout = false;
    for (let km = 25; km <= 2500; km += 25) {
      const truck: any = { components: { tires: { health: 12 }, brakes: { health: 90 }, engine: { health: 90 }, suspension: { health: 90 }, windshield: { health: 90 } } };
      const job: any = {};
      const events = evaluateRoadEvents(
        makeInput({ legKmDone: km, components: { engine: 90, brakes: 90, tires: 12, suspension: 90, windshield: 90 } }),
        job,
        truck,
        {}
      );
      const blowout = events.find(e => e.type === 'tire_blowout');
      if (blowout) {
        foundBlowout = true;
        assert.ok(truck.components.tires.health === 0, 'Blowout should severely degrade tire health');
        assert.equal(job.speedCapKmH, 45);
        break;
      }
    }
    assert.ok(foundBlowout, 'Expected tire blowout when tires at 12%');
  });
});
