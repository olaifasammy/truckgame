import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { calculatePerformance, calculateUsage, applyTripWear, EnvironmentalConditions, fuelCostForTrip } from '../domain/trucks/trucks.physics';
import { CITIES, LOCATIONS } from '../data/world';
import { pushNote } from './notify';
import { generateCorridorWeather } from '../domain/weather/weather';

export { fuelCostForTrip };

export const PART_LABELS: Record<string, string> = { 
  engine: 'Engine Core', 
  transmission: 'Transmission & Gearbox', 
  brakes: 'Pneumatic Braking System', 
  tires: 'Steer & Drive Tires', 
  windshield: 'Safety Vision & Glass', 
  oilFilter: 'Lubrication Filter', 
  fuelFilter: 'High-Pressure Fuel Filter', 
  airFilter: 'Induction Air Filter', 
  suspension: 'Heavy-Duty Suspension'
};

/**
 * Calculates Great Circle distance using Haversine formula.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates realistic highway driving distances between locations.
 * Uses the Haversine formula combined with dynamic GIS spatial circuity factors
 * derived from geographical distance, latitude/longitude delta, country borders, and region terrain.
 * Zero hardcoded city strings: pure domain-driven GIS spatial mathematics.
 */
export const distKm = (a: string, b: string): number => {
  if (a === b) return 0;
  const locA = LOCATIONS[a];
  const locB = LOCATIONS[b];

  if (locA && locB) {
    const rawDist = haversineKm(
      locA.latLng[0], locA.latLng[1],
      locB.latLng[0], locB.latLng[1]
    );

    // Region-based baseline road circuity factor
    let factor = 1.3;
    if (locA.region === 'Africa') factor = 1.45;
    else if (locA.region === 'Europe') factor = 1.25;
    else if (locA.region === 'America') factor = 1.20;
    else if (locA.region === 'Asia') factor = 1.35;

    // Dynamic water body & coastal gulf detour factor:
    // If locations cross high-latitude sea gaps (e.g. Baltic Sea / Gulf of Bothnia),
    // calculate actual highway circuity around coastal peninsulas.
    let additionalCircuity = 1.0;
    const latDiff = Math.abs(locA.latLng[0] - locB.latLng[0]);
    const lngDiff = Math.abs(locA.latLng[1] - locB.latLng[1]);

    if (locA.country !== locB.country) {
      if (locA.latLng[0] > 55 && locB.latLng[0] > 55 && lngDiff > 5) {
        additionalCircuity = 3.5; // Coastal peninsula / Gulf detour (e.g. Sweden to Finland overland)
      } else if (locA.country === 'United Kingdom' || locB.country === 'United Kingdom') {
        additionalCircuity = 1.15; // Channel transit leg
      }
    }

    const roadDist = rawDist * factor * additionalCircuity;
    return Math.max(45, Math.round(roadDist));
  }

  return 500;
};

export function getRouteEnv(
  from: string,
  to: string,
  currentKm?: number,
  totalKm?: number,
  now?: number,
  simDay?: number
): EnvironmentalConditions {
  return generateCorridorWeather(from, to, currentKm, totalKm, now, simDay);
}

export function stats(S: any, t: any, payloadTonnes = 0, env?: EnvironmentalConditions) {
  const d = S?.drivers?.find((x: any) => x.id === t?.driverId);
  return calculatePerformance(t, payloadTonnes, d, env);
}

/**
 * Calculates continuous physical transit duration for highway haulage.
 * 
 * Exact Physics Formulation:
 * - Real-world duration: T_real = (distance_km / cruising_speed_kmh) hours.
 * - Real-world duration in seconds: T_sec = (distance_km / cruising_speed_kmh) * 3600.
 * - Deterministic physical time compression scale (1 real minute = 24 simulation minutes, 1:24 scale):
 *   T_simulation_ms = (distance_km / cruising_speed_kmh) * 150 * 1000 ms.
 */
export const tripMs = (km: number, speed: number = 80, env?: EnvironmentalConditions): number => {
  let effectiveSpeed = Math.max(30, Math.min(125, speed || 80));

  if (env) {
    if (env.weather === 'snow') {
      effectiveSpeed *= 0.80; // Reduced traction
    } else if (env.weather === 'rain') {
      effectiveSpeed *= 0.92; // Wet pavement
    }

    if ((env.roadGrade || 0) > 4) {
      effectiveSpeed *= 0.82; // Incline gravity drag
    } else if ((env.roadGrade || 0) > 2) {
      effectiveSpeed *= 0.92;
    }
  }

  // Exact continuous physics time calculation: T_ms = (km / speed) * 277,000 ms (13:1 ratio: 50h real -> ~3.8h game)
  // Constant factor of 277 ensures 50 real hours (180,000s) = ~3.85 hours in-game (13,846s)
  const totalSeconds = (km / effectiveSpeed) * 277;
  return Math.round(totalSeconds * 1000);
};

export function applyWear(t: any, km: number, payload = 0, env?: EnvironmentalConditions, driver?: any) {
  applyTripWear(t, km, payload, env, driver);
}

export function syncUsage(t: any, km: number, metrics: any, env?: EnvironmentalConditions, S?: any) {
  const usage = calculateUsage(t, km, metrics);
  const startFuel = t.fluids?.fuel !== undefined ? t.fluids.fuel : 800;

  if (usage.fuelUsed > startFuel) {
    const roadsideLiters = Math.ceil(usage.fuelUsed - startFuel);
    const roadsideRate = 1.65;
    const roadsideCost = Math.round(roadsideLiters * roadsideRate);
    if (S) {
      S.money = Math.max(0, (S.money || 0) - roadsideCost);
      pushNote(S, `${t.name} ran low on diesel en-route and bought ${roadsideLiters}L roadside fuel at $${roadsideRate}/L (-$${roadsideCost.toLocaleString()}).`, { title: 'ROADSIDE ASSISTANCE', type: 'ops', priority: 1 });
    }
    t.fluids.fuel = Math.max(120, Math.min(800, 800 - Math.round(usage.fuelUsed % 800)));
  } else {
    t.fluids.fuel = Math.max(0, Math.round(startFuel - usage.fuelUsed));
  }

  const liveSynced = Boolean(t._liveFluidsSynced);
  if (t._liveFluidsSynced !== undefined) delete t._liveFluidsSynced;

  if (!liveSynced) {
    t.fluids.oil = Math.max(0, parseFloat((t.fluids.oil - usage.oilUsed).toFixed(2)));

    // AdBlue / DEF consumption (~4.5% of diesel fuel)
    const adBlueUsedPct = parseFloat(((km / 100) * (metrics.fuelConsumption * 0.045) / 0.8).toFixed(1));
    t.fluids.adBlue = Math.max(0, Math.round((t.fluids.adBlue !== undefined ? t.fluids.adBlue : 100) - adBlueUsedPct));

    // Coolant depletion (higher under desert heatwave or mountain grades)
    const isHeatwave = env?.weather === 'heatwave';
    const coolantLoss = parseFloat(((km / 800) * (isHeatwave ? 3.5 : 1.0)).toFixed(1));
    t.fluids.coolant = Math.max(0, Math.round((t.fluids.coolant !== undefined ? t.fluids.coolant : 100) - coolantLoss));

    // Transmission oil breakdown
    const transLoss = parseFloat(((km / 1000) * 0.8).toFixed(1));
    t.fluids.transmissionOil = Math.max(0, Math.round((t.fluids.transmissionOil !== undefined ? t.fluids.transmissionOil : 100) - transLoss));
  }

  // En-route incidents and accidents are evaluated deterministically by src/domain/simulation/road-events.ts.
  t.odometer += km;
}
