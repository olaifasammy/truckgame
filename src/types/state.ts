import { Truck } from '../domain/trucks/trucks.types';
import { Driver } from '../domain/drivers/drivers.types';
import { FreightJob, ActiveJob } from '../domain/jobs/jobs.types';

export interface GameState {
  money: number;
  xp: number;
  companyTier: number;
  garageLevel?: number;
  fleet: Truck[];
  drivers: Driver[];
  active: ActiveJob[];
  licenses: string[];
  unlockedRegions: string[];
  subcontractedTrucks?: number[];
  trailers?: string[];
  repairs?: any[];
  jobs?: any[];
  depots?: string[];
  repairTruckId?: number | null;
  workshopTab?: string;
  tab?: string;
  activeRegionFilter?: string;
  [key: string]: any;
}

