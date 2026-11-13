import { AFRICA_REGIONAL_HUBS } from './africa-hubs';
import { EUROPE_REGIONAL_HUBS } from './europe-hubs';

export type RegionName = 'Europe' | 'America' | 'Africa' | 'Asia';

export interface RegionalHub {
  id: string;
  name: string;
  city: string;
  region: RegionName;
  cost: number;
  berths: number;
  deadheadDiscount: number; // percentage
  desc: string;
  icon: string;
}

export interface RegionAuthority {
  id: RegionName;
  name: string;
  code: string;
  cost: number;
  minTier: number;
  description: string;
  flag: string;
}

export const REGION_AUTHORITIES: Record<RegionName, RegionAuthority> = {
  Africa: {
    id: 'Africa',
    name: 'ECOWAS Trans-Sahel Commercial Authority',
    code: 'AF-DOT-01',
    cost: 0,
    minTier: 0,
    description: 'Commercial interstate trucking rights throughout West Africa and the Lake Chad Basin corridor.',
    flag: '🌍'
  },
  Europe: {
    id: 'Europe',
    name: 'EU Community International Haulage License (Cabotage)',
    code: 'EU-COMM-92',
    cost: 85000,
    minTier: 1,
    description: 'Full international bilateral road freight authorization across Schengen Alpine and Atlantic corridors.',
    flag: '🇪🇺'
  },
  America: {
    id: 'America',
    name: 'US-DOT / FMCSA Interstate Operating Authority (MC Permit)',
    code: 'US-FMCSA-49',
    cost: 110000,
    minTier: 2,
    description: 'Federal motor carrier cross-border and nationwide interstate freight linehaul operating authority.',
    flag: '🇺🇸'
  },
  Asia: {
    id: 'Asia',
    name: 'Trans-Asian TIR & Pacific Bilateral Logistics Authority',
    code: 'ASIA-TIR-08',
    cost: 140000,
    minTier: 2,
    description: 'United Nations TIR convention customs transit Carnet across East Asia and Eurasian Silk Road trade lanes.',
    flag: '🌏'
  }
};

export const REGIONAL_HUBS: RegionalHub[] = [
  // ================= AFRICA (All 54 Countries) =================
  ...AFRICA_REGIONAL_HUBS,

  // ================= EUROPE (All Countries) =================
  ...EUROPE_REGIONAL_HUBS,

  // ================= EUROPE =================
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
    id: 'hub_munich',
    name: 'Munich Alpine Cross-Border Depot',
    city: 'MUNICH',
    region: 'Europe',
    cost: 175000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'High-altitude European central transit node optimized for Alpine passes, specialized machinery, and chemical tankers.',
    icon: '⛰️'
  },
  {
    id: 'hub_lyon',
    name: 'Lyon Rhône-Alps Distribution Terminal',
    city: 'LYON',
    region: 'Europe',
    cost: 150000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Southern European logistics crossroads linking Atlantic sea freight to the Mediterranean basin.',
    icon: '📦'
  },

  // ================= AMERICA =================
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
    id: 'hub_dallas',
    name: 'Dallas Southwestern Cross-Docking Terminal',
    city: 'DALLAS',
    region: 'America',
    cost: 180000,
    berths: 5,
    deadheadDiscount: 0.85,
    desc: 'Major logistics interchange linking Gulf Coast energy corridors, Mexico cross-border trade, and Midwest retail.',
    icon: '🤠'
  },
  {
    id: 'hub_los_angeles',
    name: 'Los Angeles Long Beach Maritime Gateway',
    city: 'LOS_ANGELES',
    region: 'America',
    cost: 220000,
    berths: 5,
    deadheadDiscount: 0.85,
    desc: 'Pacific container gateway handling import transshipments, cold storage drayage, and transcontinental haulage.',
    icon: '🌴'
  },

  // ================= ASIA =================
  {
    id: 'hub_tokyo',
    name: 'Tokyo Kanto Pacific Freight Hub',
    city: 'TOKYO',
    region: 'Asia',
    cost: 210000,
    berths: 5,
    deadheadDiscount: 0.85,
    desc: 'Automated high-density terminal handling high-tech electronics, express parcel linehaul, and refrigerated foods.',
    icon: '🗼'
  },
  {
    id: 'hub_shanghai',
    name: 'Shanghai Yangtze Deepwater Logistics Center',
    city: 'SHANGHAI',
    region: 'Asia',
    cost: 230000,
    berths: 5,
    deadheadDiscount: 0.85,
    desc: 'World’s highest volume maritime freight terminal with automated container stackers and heavy equipment bays.',
    icon: '🏙️'
  },
  {
    id: 'hub_almaty',
    name: 'Almaty Trans-Eurasian Silk Road Dry Port',
    city: 'ALMATY',
    region: 'Asia',
    cost: 170000,
    berths: 4,
    deadheadDiscount: 0.85,
    desc: 'Central Asian overland rail-to-truck gateway powering trans-Eurasian mineral, chemical, and bulk cargo linehauls.',
    icon: '🏔️'
  }
];

export function isRegionUnlocked(S: any, region: RegionName): boolean {
  if (!S || !S.unlockedRegions) return false;
  const unlocked: RegionName[] = S.unlockedRegions;
  return unlocked.includes(region);
}

export function getOwnedHubs(S: any): RegionalHub[] {
  if (!S || !S.depots) return [];
  return REGIONAL_HUBS.filter(h => S.depots.includes(h.id));
}

export function getOwnedHubsInRegion(S: any, region: RegionName): RegionalHub[] {
  if (!S || !S.depots) return [];
  return REGIONAL_HUBS.filter(h => h.region === region && S.depots.includes(h.id));
}

export function getHubByCity(city: string): RegionalHub | undefined {
  return REGIONAL_HUBS.find(h => h.city === city);
}

export function getHubById(id: string): RegionalHub | undefined {
  return REGIONAL_HUBS.find(h => h.id === id);
}

export function hasHubInRegion(S: any, region: RegionName): boolean {
  if (!S || !S.depots) return false;
  return REGIONAL_HUBS.some(h => h.region === region && S.depots.includes(h.id));
}

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
  },
  {
    id: 'tender_tech',
    client: 'Apex Semiconductor & Microelectronics',
    industry: 'High-Tech & Precision Electronics',
    durationDays: 30,
    ratePerDelivery: 24000,
    slaTarget: 99,
    requiredCerts: [],
    loadsRemaining: 10,
    totalLoads: 10,
    completedLoads: 0,
    bonusPayout: 85000,
    desc: 'High-security air-ride transport of delicate silicon wafers and server blade arrays between fab facilities.',
    icon: '🖥️'
  },
  {
    id: 'tender_mining',
    client: 'Sahara Heavy Mining & Ore Ltd',
    industry: 'Mining & Heavy Machinery',
    durationDays: 30,
    ratePerDelivery: 29000,
    slaTarget: 94,
    requiredCerts: [],
    loadsRemaining: 8,
    totalLoads: 8,
    completedLoads: 0,
    bonusPayout: 95000,
    desc: 'Lowboy and flatbed heavy haulage transporting drilling rigs, steel assemblies, and mineral aggregates.',
    icon: '⛏️'
  },
  {
    id: 'tender_aerospace',
    client: 'Pacific Aerospace & Defense Logistics',
    industry: 'Aerospace & Specialized Cargo',
    durationDays: 30,
    ratePerDelivery: 34000,
    slaTarget: 99,
    requiredCerts: [],
    loadsRemaining: 6,
    totalLoads: 6,
    completedLoads: 0,
    bonusPayout: 120000,
    desc: 'Classified transport of turbine components and avionics modules across strategic defense hubs.',
    icon: '🛰️'
  }
];

