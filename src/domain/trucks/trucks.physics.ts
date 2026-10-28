import { TRUCK_MODELS } from './trucks.data';
import { Truck, TruckModel, TrailerType } from './trucks.types';
import { Driver } from '../drivers/drivers.types';

export const PART_WEAR_COEFFICIENTS: Record<string, number> = {
  engine: 0.0001,
  transmission: 0.00008,
  brakes: 0.00015,
  tires: 0.0002,
  windshield: 0.00002,
  oilFilter: 0.0005,
  fuelFilter: 0.0004,
  airFilter: 0.0003,
  suspension: 0.00012
};

export interface EnvironmentalConditions {
  weather?: 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';
  elevation?: number; // meters
  roadGrade?: number; // percentage incline
  temp?: number; // Celsius
  terrain?: string;
}

export interface PerformanceMetrics {
  topSpeed: number; // km/h
  acceleration: number; // 0-1 (normalized)
  fuelConsumption: number; // L/100km
  oilConsumption: number; // L/100km
  brakingDistance: number; // meters from 80km/h
  tractionFactor: number; // 0-1
  environmentalLoad: number; // multiplier
}

/**
 * Calculates current truck performance based on state, payload, and regional environmental physics.
 */
export function calculatePerformance(
  truck: Truck,
  payloadTonnes: number,
  driver?: Driver,
  env?: EnvironmentalConditions
): PerformanceMetrics {
  const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
  const totalWeight = model.baseWeight + payloadTonnes;
  
  // 1. Component Health Modifiers
  const engineHealth = (truck.components?.engine?.health || 100) / 100;
  const transHealth = (truck.components?.transmission?.health || 100) / 100;
  const tireHealth = (truck.components?.tires?.health || 100) / 100;
  const brakeHealth = (truck.components?.brakes?.health || 100) / 100;

  // 2. Environmental Physics Modifiers
  let weatherSpeedMod = 1.0;
  let weatherTractionMod = 1.0;
  let weatherBrakeMod = 1.0;
  let weatherFuelMod = 1.0;
  let weatherWearMod = 1.0;

  const weather = env?.weather || 'clear';
  if (weather === 'rain') {
    weatherTractionMod = 0.82;
    weatherBrakeMod = 1.25;
    weatherSpeedMod = 0.92;
  } else if (weather === 'snow') {
    weatherTractionMod = 0.58;
    weatherBrakeMod = 1.60;
    weatherSpeedMod = 0.78;
    weatherWearMod = 1.35;
  } else if (weather === 'fog') {
    weatherSpeedMod = 0.85;
    weatherBrakeMod = 1.15;
  } else if (weather === 'heatwave') {
    weatherFuelMod = 1.12; // Extra cooling fan and cabin AC fuel burn
    weatherWearMod = 1.25; // High oil breakdown and tire degradation
  }

  // 3. Elevation & Thin Air Physics
  const elevation = env?.elevation || 200;
  let altitudeAirDensityMod = 1.0;
  if (elevation > 800) {
    // Air density drop decreases naturally aspirated / cooling efficiency
    altitudeAirDensityMod = Math.max(0.85, 1 - ((elevation - 800) / 1000) * 0.08);
  }

  // 4. Road Incline Grade Physics
  const grade = env?.roadGrade || 1.5;
  const gradeInclineDrag = 1 + (grade * 0.035); // Steeper grade = higher fuel & drag

  // Driver skill mitigation (experienced drivers optimize gears and retarders)
  const driverSkill = driver ? driver.skill : 1;
  const skillMitigation = 1 - (driverSkill - 1) * 0.08;

  // 5. Power / Weight Ratio
  const effectiveHp = model.engine.hp * engineHealth * altitudeAirDensityMod;
  const powerWeightRatio = effectiveHp / totalWeight;

  // 6. Realistic Top Speed
  let topSpeed = (powerWeightRatio * 15) * weatherSpeedMod / Math.sqrt(gradeInclineDrag);
  topSpeed = Math.min(topSpeed, 135);
  topSpeed = Math.max(45, topSpeed);
  if (driver) topSpeed *= (1 + (driverSkill / 45));

  // 7. Acceleration Factor
  const acceleration = (powerWeightRatio / 100) * transHealth * weatherTractionMod;

  // 8. Dynamic Fuel Consumption (L/100km)
  let fuelConsumption = ((model.engine.displacement * 1.6) + (payloadTonnes * 0.75)) * gradeInclineDrag * weatherFuelMod;
  fuelConsumption *= (2 - engineHealth);
  if (truck.upgrades?.ecoTuning > 0) {
    fuelConsumption *= (1 - 0.05 * truck.upgrades.ecoTuning);
  }
  fuelConsumption *= (1 - (driverSkill - 1) * 0.03); // Good drivers save fuel

  // 9. Oil Consumption
  let oilConsumption = (model.engine.displacement / 2) * (2 - engineHealth);
  if (weather === 'heatwave') oilConsumption *= 1.25;

  // 10. Braking Distance (meters)
  let brakingDistance = 35 * (totalWeight / 10) * (2 - brakeHealth) * (2 - tireHealth) * weatherBrakeMod;
  brakingDistance *= skillMitigation;

  return {
    topSpeed: Math.round(topSpeed),
    acceleration: parseFloat(acceleration.toFixed(2)),
    fuelConsumption: parseFloat(fuelConsumption.toFixed(1)),
    oilConsumption: parseFloat(oilConsumption.toFixed(2)),
    brakingDistance: Math.round(brakingDistance),
    tractionFactor: parseFloat(weatherTractionMod.toFixed(2)),
    environmentalLoad: parseFloat((weatherWearMod * gradeInclineDrag).toFixed(2))
  };
}

/**
 * Applies wear to all components based on distance traveled and regional environment.
 */
export function applyTripWear(
  truck: Truck,
  distanceKm: number,
  payloadTonnes: number,
  env?: EnvironmentalConditions
) {
  const loadFactor = 1 + (payloadTonnes / 20);
  const envFactor = env?.weather === 'snow' ? 1.35 : env?.weather === 'heatwave' ? 1.25 : 1.0;
  const gradeFactor = 1 + ((env?.roadGrade || 1.5) * 0.03);
  
  Object.keys(truck.components).forEach(key => {
    const component = (truck.components as any)[key];
    const coefficient = PART_WEAR_COEFFICIENTS[key] || 0.0001;
    
    // Calculate wear amount
    let wear = distanceKm * coefficient * loadFactor * envFactor * gradeFactor;
    
    // Apply health reduction
    component.health = Math.max(0, parseFloat((component.health - wear).toFixed(2)));
  });
}

/**
 * Calculates fuel and oil usage for a trip.
 */
export function calculateUsage(truck: Truck, distanceKm: number, metrics: PerformanceMetrics) {
  const fuelUsed = (distanceKm / 100) * metrics.fuelConsumption;
  const oilUsed = (distanceKm / 100) * metrics.oilConsumption;
  
  return { fuelUsed, oilUsed };
}

/**
 * Initializes a new truck based on a model.
 */
export function createTruck(id: number, modelId: string, name: string, loc: string, trailer: TrailerType | null = null): Truck {
  const model = TRUCK_MODELS[modelId] || TRUCK_MODELS['scania_s730'];
  
  return {
    id,
    modelId,
    name,
    odometer: 0,
    loc,
    status: 'idle',
    driverId: null,
    trailer,
    fluids: {
      fuel: model.tankSize,
      oil: model.oilCapacity,
      coolant: 100,
      adBlue: 100
    },
    components: {
      engine: { health: 100, wearRate: 1 },
      transmission: { health: 100, wearRate: 1 },
      brakes: { health: 100, wearRate: 1 },
      tires: { health: 100, wearRate: 1 },
      windshield: { health: 100, wearRate: 1 },
      oilFilter: { health: 100, wearRate: 1 },
      fuelFilter: { health: 100, wearRate: 1 },
      airFilter: { health: 100, wearRate: 1 },
      suspension: { health: 100, wearRate: 1 }
    },
    upgrades: {
      ecoTuning: 0,
      performanceChip: 0,
      heavyDutySuspension: false
    }
  };
}
