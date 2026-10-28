import { CargoItem } from './jobs.types';

export const CARGO: Record<string, CargoItem> = {
  'CARS': { icon: 'truck', trailer: 'carrier' },
  'PUFFED SNACKS': { icon: 'box', trailer: 'box' },
  'MASCARA': { icon: 'box', trailer: 'box' },
  'SERVERS': { icon: 'box', trailer: 'box' },
  'EXPLOSIVES': { icon: 'box', trailer: 'hazmat' },
  'SAND': { icon: 'truck', trailer: 'tipper' },
  'REFRIGERATED GOODS': { icon: 'box', trailer: 'box' },
  'INDUSTRIAL STEEL': { icon: 'truck', trailer: 'flatbed' as any }
};
