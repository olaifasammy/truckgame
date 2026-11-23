import { TRUCK_MODELS } from './trucks.data';
import { Truck, TruckModel, TrailerType } from './trucks.types';
import { Driver } from '../drivers/drivers.types';
import { TRAIT_REGISTRY } from '../drivers/drivers.names';
import { getTruckCode } from './registration';

export const PART_WEAR_COEFFICIENTS: Record<string, number> = {
  engine: 0.0005,
  transmission: 0.0004,
  brakes: 0.0008,
  tires: 0.0012,
  windshield: 0.0001,
  oilFilter: 0.0025,
  fuelFilter: 0.0020,
  airFilter: 0.0015,
  suspension: 0.0006
};

export interface EnvironmentalConditions {
  weather?: 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';
  elevation?: number; // meters
  roadGrade?: number; // percentage incline
  temp?: number; // Celsius
  terrain?: string;
  region?: string;
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
 * SAE J1321 & Thermodynamic Vehicle Dynamics Engine:
 * - Gross Combination Mass M_gross = Tractor Base Mass + Trailer Tare Mass + Cargo Mass.
 * - Rolling Resistance Force F_rr = M_gross * g * Crr * SurfaceFriction * TireHealthPenalty.
 * - Aerodynamic Drag Force F_aero = 0.5 * rho_air * CdA * v^2. Air density rho_air is altitude & temperature dependent.
 * - Gravitational Incline Force F_gravity = M_gross * g * sin(roadGrade).
 * - Mechanical Engine Shaft Power P_shaft = (F_total * v) / DrivetrainEff + P_friction + P_aux.
 * - Hourly Fuel Rate (kg/h) = P_engine_kW * BSFC (g/kWh).
 * - Distance Fuel Consumption L/100km = (FuelRate_L_h / Speed_kmh) * 100.
 * - BSFC efficiency dynamically degraded by dirty air/fuel filters, worn piston rings, and unoptimized tuning.
 */
export function calculatePerformance(
  truck: Truck,
  payloadTonnes: number,
  driver?: Driver,
  env?: EnvironmentalConditions
): PerformanceMetrics {
  const model = TRUCK_MODELS[truck.modelId] || TRUCK_MODELS['scania_s730'];
  
  // 1. Trailer Tare Mass (Tonnes)
  const trailerTareMap: Record<string, number> = {
    curtain: 6.5,
    reefer: 7.5,
    tanker: 7.2,
    hazmat: 7.2,
    lowboy: 9.8,
    flatbed: 6.0,
    double_trailer: 13.5,
    tipper: 8.0,
    carrier: 7.6,
    container: 6.8
  };
  const trailerTare = truck.trailer ? (trailerTareMap[truck.trailer] || 6.5) : 0;
  
  // Gross Mass in Kilograms
  const grossMassKg = Math.max(8000, (model.baseWeight + trailerTare + payloadTonnes) * 1000);
  
  // 2. Component Health Modifiers
  const engineHealth = Math.max(0.2, (truck.components?.engine?.health ?? 100) / 100);
  const transHealth = Math.max(0.2, (truck.components?.transmission?.health ?? 100) / 100);
  const tireHealth = Math.max(0.2, (truck.components?.tires?.health ?? 100) / 100);
  const brakeHealth = Math.max(0.2, (truck.components?.brakes?.health ?? 100) / 100);
  const airFilterHealth = Math.max(0.2, (truck.components?.airFilter?.health ?? 100) / 100);
  const fuelFilterHealth = Math.max(0.2, (truck.components?.fuelFilter?.health ?? 100) / 100);

  // 3. Environmental Physics & Altitude Air Density
  const weather = env?.weather || 'clear';
  const tempC = env?.temp ?? 20;
  const elevationM = env?.elevation ?? 200;
  const roadGrade = env?.roadGrade ?? 1.5; // Incline percentage

  // Atmospheric Air Density rho_air (kg/m3) accounting for elevation & temperature
  const rhoAir = 1.225 * Math.exp(-elevationM / 8400) * (288.15 / (273.15 + tempC));

  // 4. Tire Rolling Resistance Coefficient Crr
  let baseCrr = 0.0068; // Standard radial commercial tire
  if (truck.upgrades?.tireCompound === 'highway_eco') {
    baseCrr = 0.0055; // Low Rolling Resistance (LRR)
  } else if (truck.upgrades?.tireCompound === 'all_terrain_winter') {
    baseCrr = 0.0085;
  }
  // Low tire pressure/tread wear increases rolling resistance
  const Crr = baseCrr * (1.0 + 0.35 * (1.0 - tireHealth));
  
  // Surface Friction Multiplier
  let surfaceMult = 1.0;
  if (weather === 'rain') surfaceMult = 1.15;
  if (weather === 'snow') surfaceMult = 1.45;
  
  const g = 9.81; // Gravity acceleration m/s^2
  const rollingResistanceN = grossMassKg * g * Crr * surfaceMult;

  // 5. Aerodynamic Drag Area CdA (m^2)
  const cdAMap: Record<string, number> = {
    curtain: 6.8,
    reefer: 7.0,
    tanker: 5.8,
    hazmat: 5.8,
    lowboy: 6.2,
    flatbed: 5.6,
    double_trailer: 8.5,
    tipper: 6.5,
    carrier: 7.6,
    container: 6.8
  };
  const cdA = truck.trailer ? (cdAMap[truck.trailer] || 6.8) : 4.2; // 4.2 for Bobtail (no trailer)

  // 6. Operating Velocity v (m/s)
  let speedKmH = 85; // Target highway cruising speed
  if (weather === 'rain') speedKmH = 78;
  if (weather === 'snow') speedKmH = 65;
  if (roadGrade > 4) speedKmH *= 0.82; // Steep incline grade speed reduction

  const vMs = speedKmH / 3.6; // Convert km/h to m/s

  // Aerodynamic Drag Force
  const aeroDragN = 0.5 * rhoAir * cdA * Math.pow(vMs, 2);

  // Gravitational Incline Force
  const gravityDragN = grossMassKg * g * Math.sin(Math.atan(roadGrade / 100));

  // Total Resisting Force
  const totalDragN = Math.max(0, rollingResistanceN + aeroDragN + gravityDragN);

  // 7. Mechanical Wheel Power & Drivetrain Shaft Power
  const wheelPowerKw = (totalDragN * vMs) / 1000;

  // Drivetrain Efficiency (transmission & axle friction)
  const drivetrainEff = 0.92 * transHealth;
  const shaftPowerKw = wheelPowerKw / drivetrainEff;

  // Internal Engine Friction & Parasitics
  const displacement = model.engine.displacement || 13.0; // Liters
  const axleRatioMult = truck.upgrades?.axleRatio === 'highway_eco' ? 0.92 : 1.0;
  const engineRpm = 1350 * axleRatioMult * (speedKmH / 85);
  const frictionPowerKw = 0.85 * displacement * Math.pow(engineRpm / 1000, 1.3);

  // Auxiliary loads (AC, cooling fan, alternator, reefer trailer compressor)
  let auxPowerKw = 12.0; // Base auxiliaries
  if (weather === 'heatwave') auxPowerKw += 8.0; // Extra AC & cooling fan load
  if (truck.trailer === 'reefer') auxPowerKw += 18.0; // Refrigerated trailer diesel compressor

  const totalEnginePowerKw = shaftPowerKw + frictionPowerKw + auxPowerKw;

  // 8. Brake Specific Fuel Consumption (BSFC) (g/kWh)
  let baseBsfc = 192; // Modern Euro 6 Common Rail baseline (44% thermal efficiency)
  if (model.fuelType === 'Electric') {
    // Electric powertrain battery drain (kWh / 100 km)
    const elecKwhPer100Km = ((totalEnginePowerKw / 0.92) / speedKmH) * 100;
    const equivLitersPer100Km = parseFloat((elecKwhPer100Km * 0.12).toFixed(1));

    return {
      topSpeed: Math.round(speedKmH),
      acceleration: 0.85,
      fuelConsumption: equivLitersPer100Km,
      oilConsumption: 0.05,
      brakingDistance: 32,
      tractionFactor: 0.95,
      environmentalLoad: 1.0
    };
  }

  // Component Health Penalties on Fuel BSFC Efficiency
  const airFilterPen = 1.0 + 0.18 * (1.0 - airFilterHealth);
  const fuelFilterPen = 1.0 + 0.22 * (1.0 - fuelFilterHealth);
  const engineWearPen = 1.0 + 0.30 * (1.0 - engineHealth);

  // ECU Tuning
  let ecuMod = 1.0;
  if (truck.upgrades?.ecoTuning) ecuMod -= 0.05;
  if (truck.upgrades?.performanceChip) ecuMod += 0.04;

  // Driver Eco-Driving Skill
  let driverEcoMod = 1.0;
  if (driver) {
    const ecoSkill = driver.skills?.efficiency || 1;
    driverEcoMod -= (ecoSkill - 1) * 0.025; // Up to -10% for Skill 5 driver
    if (driver.trait) {
      const traitDef = TRAIT_REGISTRY[driver.trait];
      if (traitDef?.effect?.fuelMod) {
        driverEcoMod += traitDef.effect.fuelMod;
      }
    }
  }

  const effectiveBsfc = baseBsfc * airFilterPen * fuelFilterPen * engineWearPen * ecuMod * driverEcoMod;

  // Hourly Mass Fuel Burn Rate (kg/hour)
  const fuelRateKgH = (totalEnginePowerKw * effectiveBsfc) / 1000;

  // Convert kg/h to Liters/hour (Diesel density = 0.835 kg/L)
  const fuelRateLitersH = fuelRateKgH / 0.835;

  // Convert L/h to Liters / 100 km at cruising velocity speedKmH
  let fuelConsumptionL100Km = (fuelRateLitersH / speedKmH) * 100;

  // Axle ratio modifier
  if (truck.upgrades?.axleRatio === 'highway_eco') {
    fuelConsumptionL100Km *= 0.94;
  }

  // Oil Consumption (L / 100km)
  const oilConsumption = 0.12 * (1.0 + 1.5 * (1.0 - engineHealth));

  // Braking Distance
  const brakingDistance = Math.round(38 * (grossMassKg / 28000) * (1.0 + 0.5 * (1.0 - brakeHealth)));

  return {
    topSpeed: Math.round(speedKmH),
    acceleration: parseFloat(Math.max(0.15, 0.85 - (grossMassKg / 100000)).toFixed(2)),
    fuelConsumption: parseFloat(Math.max(18.0, fuelConsumptionL100Km).toFixed(1)),
    oilConsumption: parseFloat(oilConsumption.toFixed(2)),
    brakingDistance,
    tractionFactor: parseFloat((surfaceMult > 1 ? 0.75 : 0.95).toFixed(2)),
    environmentalLoad: parseFloat((rollingResistanceN / 2000).toFixed(2))
  };
}

/**
 * Applies wear to all components based on distance traveled and regional environment.
 */
export function applyTripWear(
  truck: Truck,
  distanceKm: number,
  payloadTonnes: number,
  env?: EnvironmentalConditions,
  driver?: Driver
) {
  const loadFactor = 1 + (payloadTonnes / 20);
  const envFactor = env?.weather === 'snow' ? 1.35 : env?.weather === 'heatwave' ? 1.25 : 1.0;
  const gradeFactor = 1 + ((env?.roadGrade || 1.5) * 0.03);
  
  // Driver Trait Wear Modifier
  let driverWearMod = 1.0;
  if (driver?.trait) {
    const traitDef = TRAIT_REGISTRY[driver.trait];
    if (traitDef?.effect?.wearMod) {
      driverWearMod += traitDef.effect.wearMod;
    }
  }

  const oilCap = TRUCK_MODELS[truck.modelId]?.oilCapacity || 40;
  const oilStarved = (truck.fluids?.oil ?? oilCap) < (oilCap * 0.40);

  Object.keys(truck.components).forEach(key => {
    const component = (truck.components as any)[key];
    const coefficient = PART_WEAR_COEFFICIENTS[key] || 0.0001;
    
    // Calculate wear amount (oil starvation accelerates engine & transmission wear by 50%)
    const oilMod = (oilStarved && (key === 'engine' || key === 'transmission')) ? 1.5 : 1.0;
    let wear = distanceKm * coefficient * loadFactor * envFactor * gradeFactor * driverWearMod * oilMod;
    
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
 * Calculates fuel consumption (in liters) for a trip.
 * @param km Distance in kilometers.
 * @param truck Truck instance.
 * @param payload Cargo weight in tonnes.
 * @param env Environmental conditions.
 * @returns Liters of fuel consumed.
 */
export function fuelCostForTrip(km: number, truck: Truck, payload = 0, env?: EnvironmentalConditions): number {
  const metrics = calculatePerformance(truck, payload, undefined, env);
  return (km / 100) * metrics.fuelConsumption;
}

/**
 * Initializes a new truck based on a model.
 */
export function createTruck(id: number, modelId: string, name: string, loc: string, trailer: TrailerType | null = null): Truck {
  const model = TRUCK_MODELS[modelId] || TRUCK_MODELS['scania_s730'];
  
  const truck: Truck = {
    id,
    modelId,
    name,
    code: '',
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

  truck.code = getTruckCode(truck);
  return truck;
}
