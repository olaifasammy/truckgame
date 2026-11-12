export type TrailerType = 'box' | 'tipper' | 'carrier' | 'hazmat' | 'curtain' | 'reefer' | 'flatbed' | 'tanker' | 'lowboy' | 'rigid_box' | 'double_trailer' | 'container';
export type AxleConfig = '4x2' | '6x2' | '6x4' | '8x4';
export type Region = 'Europe' | 'America' | 'Asia';

export interface EngineSpec {
  name: string;
  cylinders: number;
  displacement: number; // Liters
  hp: number;
  torque: number; // Nm
  fuelType: 'Diesel' | 'LNG' | 'Electric';
}

export interface TruckModel {
  id: string;
  brand: string;
  name: string;
  region: Region;
  axle: AxleConfig;
  engine: EngineSpec;
  trans: string;
  tankSize: number; // Liters
  oilCapacity: number; // Liters
  baseWeight: number; // Tonnes (Unladen)
  maxGVW: number; // Tonnes (Gross Vehicle Weight)
  price: number;
  priceUsd?: number;
  hp?: number;
  haul: TrailerType[];
  [key: string]: any;
}

export interface TruckPartState {
  health: number; // 0-100
  wearRate: number; // Modifier
}

export interface TruckFluids {
  fuel: number; // Current Liters
  oil: number; // Current Liters
  coolant: number; // Current %
  adBlue: number; // Current %
  transmissionOil?: number; // Current %
}

export interface TruckComponents {
  engine: TruckPartState;
  transmission: TruckPartState;
  brakes: TruckPartState;
  tires: TruckPartState;
  windshield: TruckPartState;
  oilFilter: TruckPartState;
  fuelFilter: TruckPartState;
  airFilter: TruckPartState;
  suspension: TruckPartState;
}

export interface Truck {
  id: number;
  modelId: string; // References TruckModel.id
  name: string;
  code?: string; // Standard realistic code (e.g. SC0-573, MN4-794, MC6-68E)
  regNo?: string; // License plate number (e.g. B-NX 4892, LA-4892-TR)
  registeredCity?: string; // City of registration hub
  registeredAt?: number;
  taxExpiresAt?: number; // HVUT road tax expiry timestamp
  inspectionExpiresAt?: number; // TÜV / DOT safety inspection expiry timestamp
  registrationStatus?: 'unregistered' | 'active' | 'tax_expired' | 'inspection_expired' | 'suspended';
  odometer: number; // Total km
  loc: string;
  status: 'idle' | 'busy' | 'maintenance' | 'repair' | 'delivering';
  availableAt?: number;
  driverId: number | null;
  trailer: TrailerType | null;
  color?: string; // cab paint hex
  fluids: TruckFluids;
  components: TruckComponents;
  shippingMode?: string;
  shippingOrigin?: string;
  shippingVessel?: string;
  shippingArrival?: number;
  upgrades: {
    ecoTuning: number; // 0-3
    performanceChip: number; // 0-3
    heavyDutySuspension: boolean;
    gearbox?: '12spd_highway' | '16spd_crawler';
    axleRatio?: 'highway_eco' | 'heavy_diff_lock';
    tireCompound?: 'highway_eco' | 'all_terrain_winter';
  };
  [key: string]: any;
}
