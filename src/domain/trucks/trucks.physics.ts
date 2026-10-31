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
 * 
 * Physics formulation:
 * - Gross Mass GVW = Tractor Base Mass + Trailer Tare Mass + Cargo Mass.
 * - Effective Horsepower Peff = Model HP * Engine Health * Altitude Air Density Factor.
 * - Power-To-Weight Ratio PWR = Peff / GVW.
 * - Incline Drag Factor = 1 + (Road Grade * 0.045 * (GVW / 30)).
 * - Aerodynamic Drag CdA depends on trailer coupling body.
 * - Equilibrium Cruising Speed v_cruise = min(Legal Governor, PWR * 12.5 / sqrt(CdA * Incline Drag) * Weather * Driver Skill).
 */
export function calculatePerformance(
  truck: Truck,
  payloadTonnes: number,
  driver?: Driver,
  env?: EnvironmentalConditions
): PerformanceMetrics {
  const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
  
  // Trailer Tare Masses (Tonnes)
  const trailerTareMap: Record<string, number> = {
    curtain: 6.5,
    reefer: 7.5,
    tanker: 7.2,
    hazmat: 7.2,
    lowboy: 9.8,
    flatbed: 6.0,
    double_trailer: 13.5,
    tipper: 8.0,
    container: 6.8
  };
  const trailerTare = truck.trailer ? (trailerTareMap[truck.trailer] || 6.5) : 0;
  const grossVehicleMass = Math.max(8.0, model.baseWeight + trailerTare + payloadTonnes);
  
  // 1. Component Health Modifiers
  const engineHealth = Math.max(0.2, (truck.components?.engine?.health || 100) / 100);
  const transHealth = Math.max(0.2, (truck.components?.transmission?.health || 100) / 100);
  const tireHealth = Math.max(0.2, (truck.components?.tires?.health || 100) / 100);
  const brakeHealth = Math.max(0.2, (truck.components?.brakes?.health || 100) / 100);

  // 2. Environmental Physics Modifiers
  let weatherSpeedMod = 1.0;
  let weatherTractionMod = 1.0;
  let weatherBrakeMod = 1.0;
  let weatherFuelMod = 1.0;
  let weatherWearMod = 1.0;

  const weather = env?.weather || 'clear';
  if (weather === 'rain') {
    weatherTractionMod = 0.88;
    weatherBrakeMod = 1.20;
    weatherSpeedMod = 0.93;
  } else if (weather === 'snow') {
    weatherTractionMod = 0.65;
    weatherBrakeMod = 1.50;
    weatherSpeedMod = 0.78;
    weatherWearMod = 1.30;
  } else if (weather === 'fog') {
    weatherSpeedMod = 0.88;
    weatherBrakeMod = 1.12;
  } else if (weather === 'heatwave') {
    weatherFuelMod = 1.10;
    weatherWearMod = 1.20;
  }

  // 3. Elevation & Thin Air Oxygen Density Drop
  const elevation = env?.elevation || 200;
  const altitudeAirDensityMod = elevation > 500
    ? Math.max(0.80, 1 - ((elevation - 500) / 10000))
    : 1.0;

  // 4. Road Grade Incline Gravity Drag
  const grade = Math.max(0, env?.roadGrade || 1.5);
  const gradeInclineDrag = 1 + (grade * 0.045 * (grossVehicleMass / 30));

  // 5. Aerodynamic Drag Coefficient (CdA) by Trailer Body Coupling
  const cdAMap: Record<string, number> = {
    curtain: 1.05,
    reefer: 1.05,
    tanker: 0.98,
    hazmat: 0.98,
    lowboy: 1.20,
    flatbed: 1.10,
    double_trailer: 1.30,
    tipper: 1.12,
    container: 1.10
  };
  const cdA = truck.trailer ? (cdAMap[truck.trailer] || 1.05) : 0.85; // Bobtail has low drag

  // Driver Skill Factor
  const driverSkill = driver ? driver.skill : 1;
  const driverFactor = 0.92 + (driverSkill * 0.02); // Skill ranges 1 to 5

  // 6. Effective Power & Power-to-Weight Ratio
  const effectiveHp = model.engine.hp * engineHealth * altitudeAirDensityMod;
  const powerWeightRatio = effectiveHp / grossVehicleMass; // HP per tonne

  // 7. Physics Highway Cruising Speed
  const rawCruisingSpeed = (powerWeightRatio * 12.8) / Math.sqrt(cdA * gradeInclineDrag);
  let topSpeed = Math.min(110, rawCruisingSpeed) * weatherSpeedMod * driverFactor * transHealth;
  topSpeed = Math.max(30, Math.min(120, topSpeed));

  // 8. Acceleration Factor (0 - 1)
  const acceleration = Math.max(0.1, Math.min(1.0, (powerWeightRatio / 60) * transHealth * weatherTractionMod));

  // 9. Dynamic Fuel Consumption (L/100km)
  let fuelConsumption = ((model.engine.displacement * 1.5) + (grossVehicleMass * 0.45)) * gradeInclineDrag * weatherFuelMod;
  fuelConsumption *= (2 - engineHealth);
  // Powertrain Customizations
  if (truck.upgrades?.gearbox === '16spd_crawler') {
    // 16-speed transmission provides crawler ratio on steep inclines and heavy trailers
    if (grade > 2 || grossVehicleMass > 35) {
      topSpeed = Math.min(115, topSpeed * 1.12);
    }
  }

  if (truck.upgrades?.axleRatio === 'highway_eco') {
    // Tall 2.64:1 highway axle ratio drops engine cruising RPM and fuel burn
    fuelConsumption *= 0.94;
  } else if (truck.upgrades?.axleRatio === 'heavy_diff_lock') {
    // 3.42:1 heavy vocational ratio with inter-axle diff lock boosts wet/snow traction
    weatherTractionMod = Math.min(1.0, weatherTractionMod + 0.15);
  }

  if (truck.upgrades?.tireCompound === 'highway_eco') {
    // Low Rolling Resistance Steer/Drive Tires
    fuelConsumption *= 0.92;
  } else if (truck.upgrades?.tireCompound === 'all_terrain_winter') {
    // Heavy-Duty All-Terrain Winter M+S Treads
    weatherTractionMod = Math.min(1.0, weatherTractionMod + 0.22);
    weatherBrakeMod = Math.max(0.95, weatherBrakeMod * 0.82);
  }

  // 10. Engine Oil Consumption (L/100km)
  let oilConsumption = (model.engine.displacement / 2.5) * (2 - engineHealth);
  if (weather === 'heatwave') oilConsumption *= 1.20;

  // 11. Pneumatic Braking Distance (meters from 80 km/h)
  let brakingDistance = 32 * (grossVehicleMass / 20) * (2 - brakeHealth) * (2 - tireHealth) * weatherBrakeMod;
  brakingDistance *= (1.05 - (driverSkill * 0.02));

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
      adBlue: 100,
      transmissionOil: 100
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
      heavyDutySuspension: false,
      gearbox: '12spd_highway',
      axleRatio: 'highway_eco',
      tireCompound: 'highway_eco'
    }
  };
}
