import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { advanceJourney, SIM_HOUR_MS, STOPS, HOS_MAX_HOURS } from './trucks.journey';

function makeTruck(overrides: any = {}) {
  return {
    id: 1,
    name: 'Test Rig',
    modelId: 'scania_s730',
    trailer: 'curtain',
    fuel: 800,
    fuelPct: 80,
    fuelCap: 1000,
    oil: 100,
    odometer: 0,
    components: {
      engine: { health: 100 },
      transmission: { health: 100 },
      tires: { health: 100 },
      brakes: { health: 100 },
      suspension: { health: 100 },
      airFilter: { health: 100 },
      fuelFilter: { health: 100 },
      windshield: { health: 100 },
      oilFilter: { health: 100 }
    },
    ...overrides
  };
}

function makeJob(now: number, overrides: any = {}) {
  return {
    id: 101,
    truck: 1,
    from: 'ACCRA',
    to: 'KUMASI',
    km: 500,
    kmTravelled: 0,
    dhKm: 0,
    dhTravelled: 0,
    weight: 18,
    stage: 'driving',
    stageStartedAt: now,
    lastAdvanceAt: now,
    tankL: 800,
    speedKmh: 85,
    mode: 'normal',
    env: { weather: 'clear', gradePct: 0 },
    ...overrides
  };
}

describe('Journey Engine (HOS, Rest, & Incidents)', () => {
  it('accumulates driver hosHours alongside fatigue during driving', () => {
    const t0 = 1_000_000;
    const truck = makeTruck();
    const driver = { id: 1, name: 'Kwame', fatigue: 10, hosHours: 2.0, trait: 'careful' };
    const job = makeJob(t0);

    // Advance 1 sim hour
    advanceJourney(job, truck, driver, t0 + SIM_HOUR_MS);
    assert.ok(driver.hosHours > 2.9 && driver.hosHours < 3.1, `Expected hosHours ~3.0, got ${driver.hosHours}`);
    assert.ok(driver.fatigue > 10, `Expected fatigue to increase from 10, got ${driver.fatigue}`);
  });

  it('distinguishes 45-min fatigue break from 10h HOS full rest', () => {
    const t0 = 1_000_000;
    const truck = makeTruck();
    const driver = { id: 1, name: 'Kwame', fatigue: 79.5, hosHours: 5.0, trait: 'careful' };
    const job = makeJob(t0);

    // Trigger fatigue >= 80 while HOS < 8.5 -> should enter 'break'
    advanceJourney(job, truck, driver, t0 + SIM_HOUR_MS * 0.2);
    assert.equal(job.stage, 'resting');
    assert.equal(job.restType, 'break');

    // Finish break
    const afterBreak = job.stageEndsAt + 100;
    advanceJourney(job, truck, driver, afterBreak);
    assert.equal(job.stage, 'driving');
    assert.ok(driver.hosHours >= 5.0, `45-min break must NOT wipe hosHours (got ${driver.hosHours})`);
    assert.ok(driver.fatigue < 50, `Break should reduce fatigue (got ${driver.fatigue})`);
  });

  it('triggers full HOS rest at 11h and resets both fatigue and hosHours', () => {
    const t0 = 1_000_000;
    const truck = makeTruck();
    const driver = { id: 1, name: 'Kwame', fatigue: 40, hosHours: HOS_MAX_HOURS - 0.1, trait: 'careful' };
    const job = makeJob(t0);

    advanceJourney(job, truck, driver, t0 + SIM_HOUR_MS * 0.2);
    assert.equal(job.stage, 'resting');
    assert.equal(job.restType, 'full');
    assert.equal(job.stageEndsAt - job.stageStartedAt, STOPS.REST_MS);

    advanceJourney(job, truck, driver, job.stageEndsAt + 100);
    assert.equal(job.stage, 'driving');
    assert.equal(driver.hosHours, 0);
    assert.equal(driver.fatigue, 0);
  });

  it('triggers deterministic en-route incidents when speeding or components are critical', () => {
    const t0 = 1_000_000;
    const truck = makeTruck({
      components: {
        ...makeTruck().components,
        tires: { health: 10 },
        brakes: { health: 15 },
        suspension: { health: 20 }
      }
    });
    const driver = { id: 1, name: 'Kwame', fatigue: 0, hosHours: 0, trait: 'speed_demon' };
    const job = makeJob(t0, { km: 2500, targetSpeed: 105, env: { weather: 'rain', gradePct: 0 } });
    const incidents: any[] = [];

    // Advance 6 sim hours (~500km) so multiple 25km checks run
    advanceJourney(job, truck, driver, t0 + SIM_HOUR_MS * 6, {
      onIncident: (inc) => incidents.push(inc)
    });
    assert.ok(incidents.length > 0, 'Expected at least one deterministic incident on neglected speed-demon run');
    assert.ok(Array.isArray(job.incidents) && job.incidents.length === incidents.length);
  });
});
