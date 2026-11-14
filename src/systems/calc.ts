import { TRUCK_MODELS } from '../domain/trucks/trucks.data';
import { calculatePerformance, calculateUsage, applyTripWear, EnvironmentalConditions, fuelCostForTrip } from '../domain/trucks/trucks.physics';
import { CITIES, LOCATIONS } from '../data/world';
import { pushNote } from './notify';

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
 * Calculates realistic highway driving distances between cities.
 * Uses the Haversine Great Circle formula combined with regional road circuity factors.
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

    // Apply region-specific road circuity factors (winding roads vs straight highways)
    // Africa: 1.45 (indirect routing due to terrain/infrastructure)
    // Europe: 1.25 (dense highway network)
    // America: 1.2 (direct interstate grid)
    // Asia: 1.35 (mountainous/varied terrain)
    let factor = 1.3;
    if (locA.region === 'Africa') factor = 1.45;
    else if (locA.region === 'Europe') factor = 1.25;
    else if (locA.region === 'America') factor = 1.2;
    else if (locA.region === 'Asia') factor = 1.35;

    const roadDist = rawDist * factor;
    // Minimum distance for any inter-city trip to account for terminal exit/entry
    return Math.max(45, Math.round(roadDist));
  }

  return 500; // Fallback
};

export function getRouteEnv(from: string, to: string): EnvironmentalConditions {
  const locFrom = LOCATIONS[from];
  const locTo = LOCATIONS[to];

  if (!locFrom && !locTo) return { weather: 'clear', elevation: 200, roadGrade: 1.5, temp: 22, region: 'Europe' };

  const weather = locTo?.typicalWeather || locFrom?.typicalWeather || 'clear';
  const elevation = Math.round(((locFrom?.elevation || 200) + (locTo?.elevation || 200)) / 2);
  const roadGrade = Math.max(locFrom?.roadGrade || 1.5, locTo?.roadGrade || 1.5);
  const temp = Math.round(((locFrom?.avgTemp || 25) + (locTo?.avgTemp || 25)) / 2);
  const region = locFrom?.region || locTo?.region || 'Europe';

  return { weather, elevation, roadGrade, temp, region };
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

  // Exact continuous physics time calculation: T_ms = (km / speed) * 360,000 ms (10:1 ratio: 50h real -> 5h game)
  const totalSeconds = (km / effectiveSpeed) * 360;
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

  // --- INCIDENT SIMULATION ---
  // We use a more realistic weighted probability for road incidents.
  // Factors: distance, component health, weather, driver skill.
  const tireHealth = (t.components?.tires?.health || 100) / 100;
  const engineHealth = (t.components?.engine?.health || 100) / 100;
  const brakesHealth = (t.components?.brakes?.health || 100) / 100;
  
  const riskMultiplier = (env?.weather === 'snow' ? 2.5 : env?.weather === 'rain' ? 1.5 : 1.0);
  const healthRisk = (2 - tireHealth) * (2 - brakesHealth) * (2 - engineHealth);
  
  const baseIncidentChance = (km / 1000) * 0.008 * riskMultiplier * healthRisk;
  const roll = Math.random();

  if (S && roll < baseIncidentChance) {
    if (roll < baseIncidentChance * 0.05) {
      // 5% of incidents are MAJOR ACCIDENTS
      const damage = 35 + Math.random() * 40;
      Object.values(t.components).forEach((c: any) => {
        c.health = Math.max(0, parseFloat((c.health - damage).toFixed(2)));
      });
      const fine = 2500 + Math.floor(Math.random() * 5000);
      S.money = Math.max(0, S.money - fine);
      pushNote(S, `MAJOR ROAD ACCIDENT: Unit #${t.id} (${t.name}) collided with another vehicle. Total loss of cargo and severe chassis damage. Insurance deductible + towing: -$${fine.toLocaleString()}`, {
        title: 'CRITICAL ACCIDENT',
        type: 'alert',
        priority: 2
      });
      S.reputation = Math.max(0, (S.reputation || 0) - 50);
    } else if (roll < baseIncidentChance * 0.4) {
      // 35% are MECHANICAL BREAKDOWNS (due to low health)
      const towFee = 850 + Math.floor(Math.random() * 1200);
      S.money = Math.max(0, S.money - towFee);
      t.components.engine.health = Math.max(5, t.components.engine.health - 15);
      pushNote(S, `MECHANICAL BREAKDOWN: ${t.name} suffered a drivetrain failure near ${t.loc}. Roadside assistance and emergency towing: -$${towFee.toLocaleString()}`, {
        title: 'BREAKDOWN',
        type: 'ops',
        priority: 1
      });
    } else {
      // 60% are MINOR INCIDENTS (Tire blowout, mirror clip, etc.)
      const minorCost = 200 + Math.floor(Math.random() * 600);
      S.money = Math.max(0, S.money - minorCost);
      t.components.tires.health = Math.max(0, t.components.tires.health - 10);
      pushNote(S, `MINOR INCIDENT: Tire blowout on ${t.name} during transit. Emergency mobile repair: -$${minorCost.toLocaleString()}`, {
        title: 'ROADSIDE REPAIR',
        type: 'ops'
      });
    }
  }

  t.odometer += km;
}
