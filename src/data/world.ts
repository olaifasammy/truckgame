import { REGIONAL_HUBS } from '../domain/logistics/network';
import { LocationInfo, RegionName, loc } from './types';
import { AFRICA_PART_1_LOCATIONS } from './regions/africa-part1';
import { AFRICA_PART_2_LOCATIONS } from './regions/africa-part2';
import { EUROPE_PART_1_LOCATIONS } from './regions/europe-part1';
import { EUROPE_PART_2_LOCATIONS } from './regions/europe-part2';

export { loc };
export type { LocationInfo, RegionName };

export const LOCATIONS: Record<string, LocationInfo> = {
  // ================= AFRICA (All 54 Countries - 2+ locations each) =================
  ...AFRICA_PART_1_LOCATIONS,
  ...AFRICA_PART_2_LOCATIONS,

  // ================= EUROPE (All Countries - 2+ locations each) =================
  ...EUROPE_PART_1_LOCATIONS,
  ...EUROPE_PART_2_LOCATIONS,

  // ================= EUROPE =================
  ROTTERDAM: loc('Rotterdam', 'Netherlands', 51.9244, 4.4777, 'Europe', {"elevation":-2,"typicalWeather":"fog","terrain":"wet_pavement","avgTemp":13,"roadGrade":0.5,"description":"Europe’s largest deep-water seaport, sea mist, continuous freight container flow."}),
  MUNICH: loc('Munich', 'Germany', 48.1351, 11.582, 'Europe', {"elevation":520,"avgTemp":14,"roadGrade":3,"description":"Bavarian industrial corridor, unrestricted high-speed Autobahn freight lines."}),
  INNSBRUCK: loc('Innsbruck', 'Austria', 47.2692, 11.4041, 'Europe', {"elevation":980,"typicalWeather":"snow","terrain":"mountain_pass","avgTemp":3,"roadGrade":7.8,"description":"Brenner Alpine pass, severe 8% grade switchbacks, heavy snow, intense engine retarder load."}),
  LYON: loc('Lyon', 'France', 45.764, 4.8357, 'Europe', {"elevation":175,"typicalWeather":"rain","avgTemp":16,"roadGrade":2.8,"description":"Rhône Valley logistics crossroads connecting Northern Europe to the Mediterranean."}),
  GOTHENBURG: loc('Gothenburg', 'Sweden', 57.7088, 11.9746, 'Europe', {"elevation":12,"typicalWeather":"snow","terrain":"icy_road","avgTemp":1,"roadGrade":2.2,"description":"Nordic maritime terminal, sub-zero black ice highways, demanding winter tire traction."}),
  LONDON: loc('London', 'United Kingdom', 51.5074, -0.1278, 'Europe', {"elevation":25,"typicalWeather":"rain","avgTemp":12,"roadGrade":1,"description":"Capital of the UK, Thames gateway, major British container and logistics distribution hub."}),
  BERLIN: loc('Berlin', 'Germany', 52.52, 13.405, 'Europe', {"elevation":34,"avgTemp":13,"roadGrade":1.2,"description":"Central-Eastern European freight junction connecting Baltic and Alpine corridors."}),
  PARIS: loc('Paris', 'France', 48.8566, 2.3522, 'Europe', {"elevation":35,"typicalWeather":"rain","avgTemp":15,"description":"Ile-de-France economic powerhouse, high-volume logistics ring and distribution depot."}),

  // ================= AMERICA =================
  CHICAGO: loc('Chicago', 'United States', 41.8781, -87.6298, 'America', {"elevation":181,"typicalWeather":"snow","avgTemp":8,"description":"Midwest rail-to-truck intermodal hub, fierce lake-effect winter blizzards and crosswinds."}),
  DENVER: loc('Denver', 'United States', 39.7392, -104.9903, 'America', {"elevation":1609,"typicalWeather":"snow","terrain":"mountain_pass","avgTemp":10,"roadGrade":6.5,"description":"The Mile High City, thin atmospheric air, steep Rocky Mountain continental divide climbs."}),
  DALLAS: loc('Dallas', 'United States', 32.7767, -96.797, 'America', {"elevation":131,"typicalWeather":"heatwave","avgTemp":38,"roadGrade":0.9,"description":"Southwestern freight crossroads, asphalt surface heat above 55°C, high tire blowout strain."}),
  LOS_ANGELES: loc('Los Angeles', 'United States', 34.0522, -118.2437, 'America', {"elevation":75,"typicalWeather":"fog","terrain":"mountain_pass","avgTemp":24,"roadGrade":5.5,"description":"Port of Long Beach gateway, Cajon Pass incline, steep mountain grade descent into the basin."}),
  SALT_LAKE_CITY: loc('Salt Lake City', 'United States', 40.7608, -111.891, 'America', {"elevation":1288,"terrain":"desert_corridor","avgTemp":12,"roadGrade":3.5,"description":"Great Basin mountain corridor, high altitude desert plateaus, heavy winter mountain snow."}),

  // ================= ASIA =================
  TOKYO: loc('Tokyo', 'Japan', 35.6762, 139.6503, 'Asia', {"elevation":40,"typicalWeather":"rain","avgTemp":18,"roadGrade":2,"description":"Kanto megalopolis, complex elevated Shuto expressways, Pacific monsoon downpours."}),
  NAGOYA: loc('Nagoya', 'Japan', 35.1815, 136.9066, 'Asia', {"elevation":20,"avgTemp":19,"description":"Automotive manufacturing capital of Japan, coastal industrial logistics routes."}),
  NAGANO: loc('Nagano', 'Japan', 36.6485, 138.1942, 'Asia', {"elevation":650,"typicalWeather":"snow","terrain":"mountain_pass","avgTemp":5,"roadGrade":7.2,"description":"Japanese Alps mountain gateway, steep winding hairpin turns and heavy alpine snow."}),
  SHANGHAI: loc('Shanghai', 'China', 31.2304, 121.4737, 'Asia', {"elevation":4,"typicalWeather":"rain","terrain":"wet_pavement","avgTemp":21,"roadGrade":0.8,"description":"World’s busiest container terminal, Yangtze River Delta multi-lane heavy transport corridors."}),
};

// Backwards-compatible CITIES mapping (using first item of latLng as pseudo-x for any old code)
export const CITIES: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(LOCATIONS).map(([key, loc]) => [key, [loc.latLng[1], loc.latLng[0]]])
);

export const REGIONS: Record<RegionName, { name: string; countryList: string; icon: string }> = {
  Africa: { name: 'Africa (West & Sahel)', countryList: 'Nigeria, Ghana, Niger', icon: 'route' },
  Europe: { name: 'Europe (Alpine & Atlantic)', countryList: 'United Kingdom, Germany, Netherlands, Austria, France, Sweden', icon: 'route' },
  America: { name: 'North America (Interstate)', countryList: 'United States', icon: 'route' },
  Asia: { name: 'Asia (Pacific & Silk Road)', countryList: 'Japan, China, Kazakhstan', icon: 'route' }
};

export const resolveTruckRegion = (input: any): RegionName => {
  if (!input) return 'Europe';

  // 1. If input is an object (e.g. truck object)
  if (typeof input === 'object') {
    if (input.region && REGIONS[input.region as RegionName]) {
      return input.region as RegionName;
    }
    const locVal = input.loc || input.location || input.currentCity || input.depot || input.from || input.to;
    if (locVal) {
      return resolveTruckRegion(locVal);
    }
    return 'Europe';
  }

  // 2. Normalize string input
  const str = String(input).trim();
  if (!str) return 'Europe';

  const upper = str.toUpperCase();
  const lower = str.toLowerCase();

  // Direct match in LOCATIONS
  if (LOCATIONS[upper]?.region) return LOCATIONS[upper].region;
  if (LOCATIONS[str]?.region) return LOCATIONS[str].region;

  // Direct match in REGIONAL_HUBS
  const matchingHub = REGIONAL_HUBS.find(h => h.id.toLowerCase() === lower || h.city.toUpperCase() === upper);
  if (matchingHub) return matchingHub.region;

  // Handle hub prefix (e.g. "hub_lagos" or "HUB_LAGOS")
  if (upper.startsWith('HUB_')) {
    const hubCity = upper.replace('HUB_', '').trim();
    if (LOCATIONS[hubCity]?.region) return LOCATIONS[hubCity].region;
  }

  // Handle route corridors (e.g. "LAGOS-ABUJA")
  if (upper.includes('-')) {
    const firstCity = upper.split('-')[0].trim();
    if (LOCATIONS[firstCity]?.region) return LOCATIONS[firstCity].region;
  }

  // Handle city strings with country (e.g. "Lagos, Nigeria")
  if (upper.includes(',')) {
    const firstCity = upper.split(',')[0].trim();
    if (LOCATIONS[firstCity]?.region) return LOCATIONS[firstCity].region;
  }

  // Search LOCATIONS by key or name (case insensitive)
  for (const [key, loc] of Object.entries(LOCATIONS)) {
    if (key.toUpperCase() === upper || loc.name.toUpperCase() === upper) {
      return loc.region;
    }
  }

  return 'Europe';
};

export const COMPANIES = ['ROLLAND', 'KESTLE', 'TLRP', 'PSTL', 'VANGUARD', 'NEXLOG', 'GLOBAL_HAUL'];

export const CARGO: Record<string, { icon: string; trailer: string }> = {
  CARS: { icon: 'truck', trailer: 'carrier' },
  'PUFFED SNACKS': { icon: 'box', trailer: 'box' },
  MASCARA: { icon: 'box', trailer: 'box' },
  SERVERS: { icon: 'box', trailer: 'box' },
  EXPLOSIVES: { icon: 'box', trailer: 'hazmat' },
  SAND: { icon: 'truck', trailer: 'tipper' },
  CONCRETE: { icon: 'truck', trailer: 'mixer' },
  FUEL: { icon: 'droplet', trailer: 'tanker' },
  CHEMICALS: { icon: 'droplet', trailer: 'tanker' },
  MILK: { icon: 'droplet', trailer: 'tanker' },
  ELECTRONICS: { icon: 'cpu', trailer: 'box' },
  FROZEN_MEAT: { icon: 'thermometer', trailer: 'reefer' },
  PHARMA: { icon: 'flask', trailer: 'reefer' },
  PRODUCE: { icon: 'carrot', trailer: 'reefer' },
  GRAIN: { icon: 'wheat', trailer: 'hopper' },
  LIVESTOCK: { icon: 'cow', trailer: 'livestock' },
  HEAVY_MACHINERY: { icon: 'anchor', trailer: 'flatbed' },
  LOGS: { icon: 'tree', trailer: 'logging' },
  COAL: { icon: 'mountain', trailer: 'tipper' },
  STEEL_COILS: { icon: 'scroll', trailer: 'flatbed' },
  WINE: { icon: 'glass', trailer: 'box' },
  TOYS: { icon: 'gamepad', trailer: 'box' },
  TIRES: { icon: 'circle', trailer: 'box' },
  FURNITURE: { icon: 'home', trailer: 'box' }
};

export const TRAILERS: Record<string, { name: string; capacity: number; weight: number; cost: number; tier: number }> = {
  box: { name: 'Dry Van Box', capacity: 45000, weight: 7500, cost: 35000, tier: 1 },
  reefer: { name: 'Refrigerated Reefer', capacity: 42000, weight: 8800, cost: 65000, tier: 2 },
  flatbed: { name: 'Flatbed Platform', capacity: 48000, weight: 6200, cost: 28000, tier: 1 },
  tanker: { name: 'Liquid Tanker', capacity: 40000, weight: 9200, cost: 72000, tier: 2 },
  tipper: { name: 'End Tipper / Dump', capacity: 44000, weight: 8200, cost: 42000, tier: 2 },
  hazmat: { name: 'Hazmat Containment', capacity: 38000, weight: 10500, cost: 95000, tier: 3 },
  logging: { name: 'Log Trailer', capacity: 46000, weight: 7800, cost: 32000, tier: 1 },
  livestock: { name: 'Livestock Carrier', capacity: 35000, weight: 9500, cost: 58000, tier: 2 },
  hopper: { name: 'Grain Hopper', capacity: 45000, weight: 7500, cost: 48000, tier: 2 },
  mixer: { name: 'Cement Mixer', capacity: 32000, weight: 12000, cost: 85000, tier: 3 },
  carrier: { name: 'Car Transporter', capacity: 25000, weight: 11000, cost: 78000, tier: 3 }
};
