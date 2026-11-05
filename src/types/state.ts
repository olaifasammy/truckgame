import { Truck } from '../domain/trucks/trucks.types';
import { Driver } from '../domain/drivers/drivers.types';
import { FreightJob, ActiveJob } from '../domain/jobs/jobs.types';

export interface GameState {
  money: number;
  xp: number;
  companyTier: number;
  fleet: Truck[];
  drivers: Driver[];
  active: ActiveJob[];
  licenses: string[];
  unlockedRegions: string[];
  subcontractedTrucks?: number[];
  // ... add more as needed
}
