import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSeason, generateCorridorWeather } from './weather';
import { getRouteEnv } from '../../systems/calc';

describe('Dynamic Weather & Seasonal Corridors', () => {
  it('computes Northern and Southern hemisphere seasons correctly', () => {
    assert.equal(getSeason(15, 50), 'winter');
    assert.equal(getSeason(120, 50), 'spring');
    assert.equal(getSeason(210, 50), 'summer');
    assert.equal(getSeason(300, 50), 'autumn');

    // Southern hemisphere inverted
    assert.equal(getSeason(15, -25), 'summer');
    assert.equal(getSeason(210, -25), 'winter');
  });

  it('never generates snow on tropical West African routes (LAGOS -> IBADAN)', () => {
    const SIM_HOUR_MS = 277_000;
    for (let day = 1; day <= 360; day += 30) {
      for (let slot = 0; slot < 8; slot++) {
        const now = (day * 24 + slot * 3) * SIM_HOUR_MS;
        const env = generateCorridorWeather('LAGOS', 'IBADAN', 65, 130, now, day);
        assert.notEqual(env.weather, 'snow', `Unexpected snow on LAGOS->IBADAN on day ${day}`);
        assert.ok(env.temp >= 18, `Unrealistic cold temp ${env.temp}°C on LAGOS->IBADAN`);
      }
    }
  });

  it('produces seasonal variation and winter snow risk on Alpine/Nordic corridors', () => {
    const SIM_HOUR_MS = 277_000;
    let sawWinterSnow = false;
    let winterTempSum = 0;
    let summerTempSum = 0;

    for (let slot = 0; slot < 20; slot++) {
      const winterNow = (15 * 24 + slot * 3) * SIM_HOUR_MS;
      const summerNow = (210 * 24 + slot * 3) * SIM_HOUR_MS;
      const wEnv = generateCorridorWeather('INNSBRUCK', 'MUNICH', 40, 160, winterNow, 15);
      const sEnv = generateCorridorWeather('INNSBRUCK', 'MUNICH', 40, 160, summerNow, 210);
      winterTempSum += wEnv.temp;
      summerTempSum += sEnv.temp;
      if (wEnv.weather === 'snow') sawWinterSnow = true;
    }

    assert.ok(winterTempSum / 20 < summerTempSum / 20, 'Winter temperatures should be colder than summer');
    assert.ok(sawWinterSnow, 'Alpine winter corridor should experience snow across synoptic fronts');
  });

  it('evolves weather dynamically across synoptic time slots and corridor distance', () => {
    const SIM_HOUR_MS = 277_000;
    const states = new Set<string>();
    for (let slot = 0; slot < 24; slot++) {
      const now = slot * 3 * SIM_HOUR_MS;
      const env = getRouteEnv('ROTTERDAM', 'LYON', slot * 30, 900, now, 290) as any;
      states.add(`${env.weather}:${env.temp}`);
      assert.ok(typeof env.visibilityKm === 'number' && env.visibilityKm > 0);
      assert.ok(typeof env.windKmh === 'number' && env.windKmh > 0);
      assert.ok(typeof env.roadSurface === 'string' && env.roadSurface.length > 0);
    }
    assert.ok(states.size > 3, `Expected dynamic weather evolution across time/distance, got ${states.size} states`);
  });
});
