/**
 * Regional & Seasonal Dynamic Weather Engine.
 * Models latitude-dependent seasons, elevation lapse rate, synoptic weather shifts,
 * road surface conditions, and geographical corridor interpolation.
 */

import { LOCATIONS, LocationInfo } from '../../data/world';
import { EnvironmentalConditions } from '../trucks/trucks.physics';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';

export interface CorridorWeather extends EnvironmentalConditions {
  season: Season;
  visibilityKm: number;
  windKmh: number;
  roadSurface: string;
}

const SIM_HOUR_MS = 277_000;
const SYNOPTIC_BLOCK_MS = 3 * SIM_HOUR_MS; // Weather fronts evolve every 3 simulation hours

function weatherHash(seed: number): number {
  let x = (seed | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967296;
}

/**
 * Determines astronomical season from simulation day (360-day cycle) and latitude.
 * Southern hemisphere (lat < 0) experiences inverted seasons.
 */
export function getSeason(simDay: number = 1, lat: number = 45): Season {
  const dayOfYear = ((Math.floor(simDay) - 1) % 360 + 360) % 360;
  let season: Season;
  if (dayOfYear < 90) season = 'winter';
  else if (dayOfYear < 180) season = 'spring';
  else if (dayOfYear < 270) season = 'summer';
  else season = 'autumn';

  if (lat < -5) {
    const flip: Record<Season, Season> = {
      winter: 'summer',
      spring: 'autumn',
      summer: 'winter',
      autumn: 'spring'
    };
    return flip[season];
  }
  return season;
}

/**
 * Computes seasonal ambient temperature (°C) incorporating latitude amplitude and elevation lapse rate.
 */
function computeAmbientTemp(
  baseAvgTemp: number,
  lat: number,
  elevationDiffM: number,
  season: Season,
  diurnalNoise: number
): number {
  const absLat = Math.abs(lat);
  // Tropical band (|lat| < 18°) has small seasonal swing; temperate/nordic has large swing
  const seasonalAmplitude = absLat < 15 ? 2.5 : absLat < 30 ? 6.5 : absLat < 45 ? 10.5 : 13.5;

  const seasonOffset =
    season === 'winter' ? -seasonalAmplitude :
    season === 'summer' ? seasonalAmplitude :
    season === 'spring' ? -1.5 : 1.0;

  // Atmospheric lapse rate relative to midpoint (~6.5°C per 1000m elevation change)
  const lapseOffset = -(elevationDiffM / 1000) * 3.0;
  const microShift = (diurnalNoise - 0.5) * 6; // ±3°C synoptic fluctuation

  return Math.round(baseAvgTemp + seasonOffset + lapseOffset + microShift);
}

/**
 * Computes realistic weather probabilities for a corridor point given climate, season, and temperature.
 */
function rollSynopticWeather(
  locA: LocationInfo | undefined,
  locB: LocationInfo | undefined,
  progress: number,
  tempC: number,
  elevation: number,
  season: Season,
  lat: number,
  roll: number
): WeatherType {
  const near = progress < 0.5 ? (locA || locB) : (locB || locA);
  const region = near?.region || 'Europe';
  const typical = near?.typicalWeather || 'clear';
  const terrain = near?.terrain || 'asphalt';
  const absLat = Math.abs(lat);

  // 1. Sub-freezing / Alpine zones: snow is physically possible ONLY when temp <= 2°C
  if (tempC <= 2) {
    const snowChance =
      typical === 'snow' || terrain === 'mountain_pass' || terrain === 'icy_road' ? 0.52 :
      season === 'winter' ? 0.35 : 0.15;
    const fogChance = 0.15;
    if (roll < snowChance) return 'snow';
    if (roll < snowChance + fogChance) return 'fog';
    return 'clear';
  }

  // 2. Extreme heat zones (Sahel, Sahara, Southwestern US, etc.): heatwaves above 33°C
  if (tempC >= 33) {
    const heatChance = typical === 'heatwave' || terrain === 'desert_corridor' ? 0.55 : 0.30;
    // West African Harmattan dry-season dust/fog or coastal rain
    if (region === 'Africa' && season === 'winter' && roll > 0.82) return 'fog';
    if (roll < heatChance) return 'heatwave';
    if (absLat < 15 && typical === 'rain' && roll > 0.85) return 'rain';
    return 'clear';
  }

  // 3. West African Harmattan / Sahel winter dust haze (dry season: Dec-Feb)
  if (region === 'Africa' && season === 'winter' && absLat >= 8 && absLat <= 22) {
    if (roll < 0.24) return 'fog'; // Harmattan dust haze reduces visibility
    if (tempC >= 30 && roll < 0.45) return 'heatwave';
    return 'clear';
  }

  // 4. Tropical / Monsoon rain corridors (Lagos/Accra/Shanghai/Tokyo wet season)
  if (typical === 'rain' || (absLat < 15 && (season === 'spring' || season === 'summer'))) {
    const rainChance = season === 'summer' || season === 'spring' ? 0.42 : 0.22;
    const fogChance = 0.10;
    if (roll < rainChance) return 'rain';
    if (roll < rainChance + fogChance) return 'fog';
    return 'clear';
  }

  // 5. Maritime / Coastal fog corridors (Rotterdam, London, Los Angeles)
  if (typical === 'fog') {
    const fogChance = season === 'autumn' || season === 'winter' ? 0.38 : 0.22;
    const rainChance = 0.22;
    if (roll < fogChance) return 'fog';
    if (roll < fogChance + rainChance) return 'rain';
    return 'clear';
  }

  // 6. Standard temperate corridor
  const rainChance = season === 'autumn' || season === 'spring' ? 0.25 : 0.14;
  const fogChance = season === 'autumn' || season === 'winter' ? 0.12 : 0.05;
  if (roll < rainChance) return 'rain';
  if (roll < rainChance + fogChance) return 'fog';
  return 'clear';
}

/**
 * Generates dynamic, geographically & seasonally realistic weather conditions along a route.
 */
export function generateCorridorWeather(
  from: string,
  to: string,
  currentKm?: number,
  totalKm?: number,
  now: number = Date.now(),
  simDay?: number
): CorridorWeather {
  const locFrom = LOCATIONS[from];
  const locTo = LOCATIONS[to];

  if (!locFrom && !locTo) {
    return {
      weather: 'clear',
      elevation: 200,
      roadGrade: 1.5,
      temp: 20,
      region: 'Europe',
      terrain: 'asphalt',
      season: 'spring',
      visibilityKm: 18,
      windKmh: 12,
      roadSurface: 'Dry Asphalt'
    };
  }

  const progress =
    typeof currentKm === 'number' && typeof totalKm === 'number' && totalKm > 0
      ? Math.max(0, Math.min(1, currentKm / totalKm))
      : 0.5;

  const latFrom = locFrom?.latLng[0] ?? locTo?.latLng[0] ?? 45;
  const latTo = locTo?.latLng[0] ?? locFrom?.latLng[0] ?? 45;
  const lonFrom = locFrom?.latLng[1] ?? locTo?.latLng[1] ?? 10;
  const lonTo = locTo?.latLng[1] ?? locFrom?.latLng[1] ?? 10;

  const lat = latFrom + (latTo - latFrom) * progress;
  const lon = lonFrom + (lonTo - lonFrom) * progress;

  const elevFrom = locFrom?.elevation ?? 200;
  const elevTo = locTo?.elevation ?? 200;
  const elevation = Math.round(elevFrom + (elevTo - elevFrom) * progress);
  const baseTemp = (locFrom?.avgTemp ?? 20) + ((locTo?.avgTemp ?? 20) - (locFrom?.avgTemp ?? 20)) * progress;
  const roadGrade = Math.max(locFrom?.roadGrade ?? 1.5, locTo?.roadGrade ?? 1.5);
  const region = (progress < 0.5 ? locFrom?.region : locTo?.region) || locFrom?.region || locTo?.region || 'Europe';

  // Derive simulation day from passed simDay or deterministic epoch offset if omitted
  const effectiveSimDay = typeof simDay === 'number' && simDay > 0
    ? simDay
    : Math.max(1, (Math.floor(now / (24 * SIM_HOUR_MS)) % 360) + 1);

  const season = getSeason(effectiveSimDay, lat);
  const synopticSlot = Math.floor(now / SYNOPTIC_BLOCK_MS);
  const zoneBucket = Math.floor(progress * 4); // 4 distinct weather zones along any route
  const spatialSeed =
    Math.round(lat * 100) * 73856093 ^
    Math.round(lon * 100) * 19349663 ^
    synopticSlot * 83492791 ^
    zoneBucket * 297121507;

  const tempNoise = weatherHash(spatialSeed + 17);
  const weatherRoll = weatherHash(spatialSeed + 53);
  const windNoise = weatherHash(spatialSeed + 97);

  const temp = computeAmbientTemp(baseTemp, lat, elevation - ((elevFrom + elevTo) / 2), season, tempNoise);
  const weather = rollSynopticWeather(locFrom, locTo, progress, temp, elevation, season, lat, weatherRoll);

  let terrain = (progress < 0.5 ? locFrom?.terrain : locTo?.terrain) || 'asphalt';
  if (weather === 'snow' && temp <= 0) terrain = 'icy_road';
  else if (weather === 'rain') terrain = 'wet_pavement';

  const visibilityKm =
    weather === 'fog' ? 0.35 :
    weather === 'snow' ? 1.2 :
    weather === 'rain' ? 4.5 :
    weather === 'heatwave' ? 12 : 20;

  const windKmh = Math.round(
    (weather === 'snow' || weather === 'rain' ? 28 : 10) +
    (terrain === 'mountain_pass' ? 15 : 0) +
    windNoise * 22
  );

  const roadSurface =
    weather === 'snow' ? (temp <= -2 ? 'Packed Snow / Black Ice' : 'Slush & Ice') :
    weather === 'rain' ? 'Wet Asphalt (Hydroplaning Risk)' :
    weather === 'fog' ? 'Damp / Low Visibility' :
    weather === 'heatwave' ? 'High-Temp Asphalt (>50°C)' :
    terrain === 'mountain_pass' ? 'Steep Alpine Grade' : 'Dry Asphalt';

  return {
    weather,
    elevation,
    roadGrade,
    terrain,
    temp,
    region,
    season,
    visibilityKm,
    windKmh,
    roadSurface
  };
}
