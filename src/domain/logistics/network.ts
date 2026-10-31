export interface RegionalHub {
  id: string;
  name: string;
  city: string;
  region: 'Europe' | 'America' | 'Africa' | 'Asia';
  cost: number;
  berths: number;
  deadheadDiscount: number; // percentage
  desc: string;
  icon: string;
}

export const REGIONAL_HUBS: RegionalHub[] = [
  {
    id: 'hub_rotterdam',
    name: 'Rotterdam Europort Intermodal Hub',
    city: 'ROTTERDAM',
    region: 'Europe',
    cost: 160000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Europe’s premier maritime freight gateway. Connects deep-sea container corridors to Munich, Lyon, and Gothenburg.',
    icon: '🚢'
  },
  {
    id: 'hub_chicago',
    name: 'Chicago Midwest Rail & Road Terminal',
    city: 'CHICAGO',
    region: 'America',
    cost: 195000,
    berths: 5,
    deadheadDiscount: 0.85,
    desc: 'North American crossroads connecting I-80 and I-55 interstate freight corridors to Denver, Dallas, and Los Angeles.',
    icon: '🚂'
  },
  {
    id: 'hub_lagos',
    name: 'Lagos Deep Sea Logistics Terminal',
    city: 'LAGOS',
    region: 'Africa',
    cost: 125000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Atlantic coastal industrial hub powering continental trade corridors to Ibadan, Abuja, and Kano.',
    icon: '⚓'
  },
  {
    id: 'hub_munich',
    name: 'Munich Alpine Cross-Border Depot',
    city: 'MUNICH',
    region: 'Europe',
    cost: 175000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'High-altitude European central transit node optimized for Alpine passes, specialized machinery, and chemical tankers.',
    icon: '⛰️'
  }
];

export interface WarehouseUpgrade {
  id: string;
  name: string;
  cost: number;
  dailyIncome: number;
  bonusDesc: string;
  desc: string;
  icon: string;
}

export const WAREHOUSE_UPGRADES: WarehouseUpgrade[] = [
  {
    id: 'cross_docking',
    name: 'Automated Cross-Docking Sorting Bays',
    cost: 45000,
    dailyIncome: 1200,
    bonusDesc: '+$1,200/day automated logistics throughput revenue',
    desc: 'High-speed automated roller sorters and scan tunnels consolidate freight across regions without storage delays.',
    icon: '📦'
  },
  {
    id: 'cold_vault',
    name: 'Temperature-Controlled Cold Storage Vaults',
    cost: 55000,
    dailyIncome: 800,
    bonusDesc: '+20% revenue bonus on all Refrigerated Reefer contracts',
    desc: 'Multi-zone cryogenic storage chambers safeguard pharmaceutical vaccines and perishable food chains.',
    icon: '❄️'
  },
  {
    id: 'gantry_crane',
    name: 'Heavy Gantry Crane & Industrial Forklift Fleet',
    cost: 48000,
    dailyIncome: 600,
    bonusDesc: '30% faster turnaround time on Lowboys and 40ft Containers',
    desc: 'Heavy-duty 45-tonne overhead gantry cranes load oversized industrial excavators and ISO shipping containers.',
    icon: '🏗️'
  }
];

export interface CorporateTender {
  id: string;
  client: string;
  industry: string;
  durationDays: number;
  ratePerDelivery: number;
  slaTarget: number; // e.g. 95% on-time
  requiredCerts: string[];
  loadsRemaining: number;
  totalLoads: number;
  completedLoads: number;
  bonusPayout: number;
  desc: string;
  icon: string;
}

export const SAMPLE_TENDERS: CorporateTender[] = [
  {
    id: 'tender_auto',
    client: 'Continental Automotive AG',
    industry: 'Automotive & Heavy Industry',
    durationDays: 30,
    ratePerDelivery: 18500,
    slaTarget: 95,
    requiredCerts: [],
    loadsRemaining: 12,
    totalLoads: 12,
    completedLoads: 0,
    bonusPayout: 65000,
    desc: 'Scheduled daily chassis & powertrain linehaul deliveries between European manufacturing plants.',
    icon: '🚗'
  },
  {
    id: 'tender_petro',
    client: 'Global Petroleum & Chemical Corp',
    industry: 'Energy & ADR Petrochemicals',
    durationDays: 30,
    ratePerDelivery: 26000,
    slaTarget: 98,
    requiredCerts: ['ADR Hazmat'],
    loadsRemaining: 8,
    totalLoads: 8,
    completedLoads: 0,
    bonusPayout: 90000,
    desc: 'High-security transport of refined fuels and specialized chemical reagents via dedicated tankers.',
    icon: '☣️'
  },
  {
    id: 'tender_retail',
    client: 'Trans-Atlantic Retail Cold Chain',
    industry: 'Pharmaceuticals & Food Perishables',
    durationDays: 30,
    ratePerDelivery: 21000,
    slaTarget: 96,
    requiredCerts: ['Cold Chain'],
    loadsRemaining: 10,
    totalLoads: 10,
    completedLoads: 0,
    bonusPayout: 75000,
    desc: 'Continuous cold chain distribution across regional retail distribution centers under strict temperature SLAs.',
    icon: '❄️'
  }
];

export const SUBCONTRACT_DAILY_RATE = 1800; // $1,800/day guaranteed passive retainer per sub-contracted rig
