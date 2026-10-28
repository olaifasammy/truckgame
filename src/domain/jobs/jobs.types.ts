import { TrailerType } from '../trucks/trucks.types';

export interface CargoItem {
  icon: string;
  trailer: TrailerType;
}

export interface Job {
  id: number;
  co: string;
  cargo: string;
  km: number;
  from: string;
  to: string;
  vip: boolean;
  pay: number;
  dh?: number;
}

export interface ActiveJob extends Job {
  truck: number;
  start: number;
  end: number;
  kind?: string;
}
