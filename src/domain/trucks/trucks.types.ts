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
  haul: TrailerType[];
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
  odometer: number; // Total km
  loc: string;
  status: 'idle' | 'busy' | 'maintenance' | 'repair';
  driverId: number | null;
  trailer: TrailerType | null;
  fluids: TruckFluids;
  components: TruckComponents;
  upgrades: {
    ecoTuning: number; // 0-3
    performanceChip: number; // 0-3
    heavyDutySuspension: boolean;
    gearbox?: '12spd_highway' | '16spd_crawler';
    axleRatio?: 'highway_eco' | 'heavy_diff_lock';
    tireCompound?: 'highway_eco' | 'all_terrain_winter';
  };
}
