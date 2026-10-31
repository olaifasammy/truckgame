import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { calculatePerformance, calculateUsage, applyTripWear, EnvironmentalConditions } from '../domain/trucks/trucks.physics';
import { CITIES, LOCATIONS } from '../data/world';
import { pushNote } from './notify';

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
 * Calculates realistic highway driving distances between cities.
 */
export const distKm = (a: string, b: string): number => {
  if (a === b) return 0;
  const locA = LOCATIONS[a];
  const locB = LOCATIONS[b];

  // Specific real-world intercity distances for high accuracy
  const key = `${a}_${b}`;
  const reverseKey = `${b}_${a}`;
  const realDistances: Record<string, number> = {
    // Africa
    'LAGOS_IBADAN': 135,
    'LAGOS_ENUGU': 580,
    'LAGOS_ABUJA': 760,
    'LAGOS_KANO': 1020,
    'LAGOS_MAIDUGURI': 1580,
    'IBADAN_ABUJA': 630,
    'ABUJA_KANO': 365,
    'KANO_MAIDUGURI': 585,
    'ENUGU_ABUJA': 420,

    // Europe
    'ROTTERDAM_MUNICH': 790,
    'ROTTERDAM_LYON': 780,
    'ROTTERDAM_INNSBRUCK': 940,
    'ROTTERDAM_GOTHENBURG': 1180,
    'MUNICH_INNSBRUCK': 165,
    'MUNICH_LYON': 680,
    'MUNICH_GOTHENBURG': 1250,
    'LYON_INNSBRUCK': 690,
    'GOTHENBURG_INNSBRUCK': 1420,

    // America
    'CHICAGO_DENVER': 1620,
    'CHICAGO_DALLAS': 1490,
    'CHICAGO_LOS_ANGELES': 3240,
    'CHICAGO_SALT_LAKE_CITY': 2250,
    'DENVER_DALLAS': 1060,
    'DENVER_LOS_ANGELES': 1640,
    'DENVER_SALT_LAKE_CITY': 850,
    'DALLAS_LOS_ANGELES': 2310,
    'LOS_ANGELES_SALT_LAKE_CITY': 1110,

    // Asia
    'TOKYO_NAGOYA': 350,
    'TOKYO_NAGANO': 245,
    'TOKYO_SHANGHAI': 1780,
    'TOKYO_ALMATY': 5600,
    'NAGOYA_NAGANO': 220,
    'NAGOYA_SHANGHAI': 1560,
    'SHANGHAI_ALMATY': 4150,
    'NAGANO_SHANGHAI': 1680
  };

  if (realDistances[key]) return realDistances[key];
  if (realDistances[reverseKey]) return realDistances[reverseKey];

  if (locA && locB) {
    if (locA.region === locB.region) {
      // Intra-regional calculated distance
      const dx = locA.coords[0] - locB.coords[0];
      const dy = locA.coords[1] - locB.coords[1];
      const direct = Math.hypot(dx, dy);
      return Math.max(120, Math.round(direct * 8.5 / 10) * 10);
    } else {
      // Inter-regional trans-continental logistics corridor
      return 4500 + Math.floor(Math.random() * 2500);
    }
  }

  // Fallback
  const p = (CITIES as any)[a] || [50, 50];
  const q = (CITIES as any)[b] || [150, 150];
  return Math.max(150, Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) * 6.5 / 10) * 10);
};

export function getRouteEnv(from: string, to: string): EnvironmentalConditions {
  const locFrom = LOCATIONS[from];
  const locTo = LOCATIONS[to];

  if (!locFrom && !locTo) return { weather: 'clear', elevation: 200, roadGrade: 1.5, temp: 22 };

  const weather = locTo?.typicalWeather || locFrom?.typicalWeather || 'clear';
  const elevation = Math.round(((locFrom?.elevation || 200) + (locTo?.elevation || 200)) / 2);
  const roadGrade = Math.max(locFrom?.roadGrade || 1.5, locTo?.roadGrade || 1.5);
  const temp = Math.round(((locFrom?.avgTemp || 25) + (locTo?.avgTemp || 25)) / 2);

  return { weather, elevation, roadGrade, temp };
}

export function stats(S: any, t: any, payloadTonnes = 0, env?: EnvironmentalConditions) {
  const d = S.drivers?.find((x: any) => x.id === t.driverId);
  return calculatePerformance(t, payloadTonnes, d, env);
}

export const fuelCostForTrip = (km: number, t: any, payload = 0, env?: EnvironmentalConditions) => {
  const metrics = calculatePerformance(t, payload, undefined, env);
  return (km / 100) * metrics.fuelConsumption;
};

/**
 * Calculates continuous physical transit duration for highway haulage.
 * 
 * Exact Physics Formulation:
 * - Real-world duration: T_real = (distance_km / cruising_speed_kmh) hours.
 * - Real-world duration in seconds: T_sec = (distance_km / cruising_speed_kmh) * 3600.
 * - Deterministic physical time compression scale (1 real minute = 12 simulation minutes, 1:12 scale):
 *   T_simulation_ms = (distance_km / cruising_speed_kmh) * 300 * 1000 ms.
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

  // Exact continuous physics time calculation: T_ms = (km / speed) * 300,000 ms
  const totalSeconds = (km / effectiveSpeed) * 300;
  return Math.round(totalSeconds * 1000);
};

export function applyWear(t: any, km: number, payload = 0, env?: EnvironmentalConditions) {
  applyTripWear(t, km, payload, env);
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
      pushNote(S, `ROADSIDE REFUEL: ${t.name} ran low on diesel en-route and bought ${roadsideLiters}L roadside fuel at $${roadsideRate}/L (-$${roadsideCost.toLocaleString()}).`);
    }
    t.fluids.fuel = Math.max(120, Math.min(800, 800 - Math.round(usage.fuelUsed % 800)));
  } else {
    t.fluids.fuel = Math.max(0, Math.round(startFuel - usage.fuelUsed));
  }

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

  t.odometer += km;
}
