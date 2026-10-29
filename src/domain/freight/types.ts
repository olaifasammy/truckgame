export type Region = 'NA' | 'EU' | 'AS' | 'AF';

export interface Company {
  id: string;
  name: string;
  region: Region;
  industry: 'Food' | 'Tech' | 'Industrial' | 'Chemical' | 'Retail' | 'Construction' | 'Energy';
  reputationReq: number; // For later scaling
}

export interface CargoType {
  id: string;
  name: string;
  icon?: string;
  trailer: 'curtain' | 'reefer' | 'flatbed' | 'tanker' | 'hazmat' | 'lowboy' | 'tipper' | 'double_trailer' | 'container' | 'carrier' | 'box';
  baseValue: number; // per km
  density: number; // kg per m3
  isHazmat?: boolean;
  isFragile?: boolean;
  tempControlled?: boolean;
  adrClass?: number;
}

export type JobKind = 'Spot' | 'Contract' | 'Emergency' | 'Specialized';

export interface FreightJob {
  id: number;
  companyId: string;
  cargoId: string;
  kind: JobKind;
  weight: number; // in Tonnes
  from: string;
  to: string;
  km: number;
  pay: number;
  deadline: number; // timestamp
  requirements: {
    requiredSkills?: string[]; // e.g., ['Long Distance', 'Fragile Goods']
    minLevel?: number;
    adrClass?: number;
    reefer?: boolean;
  };
  vip?: boolean;
}
