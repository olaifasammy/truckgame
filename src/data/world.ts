import { REGIONAL_HUBS } from '../domain/logistics/network';
import { AFRICA_PART_1_LOCATIONS } from './regions/africa-part1';
import { AFRICA_PART_2_LOCATIONS } from './regions/africa-part2';
import { EUROPE_PART_1_LOCATIONS } from './regions/europe-part1';
import { EUROPE_PART_2_LOCATIONS } from './regions/europe-part2';

export type RegionName = 'Africa' | 'Europe' | 'America' | 'Asia';

export interface LocationInfo {
  name: string;
  region: RegionName;
  country: string;
  coords: [number, number]; // [x, y] on map canvas
  latLng: [number, number]; // [latitude, longitude]
  elevation: number; // meters above sea level
  typicalWeather: 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';
  terrain: 'highway' | 'mountain_pass' | 'wet_pavement' | 'icy_road' | 'desert_corridor';
  avgTemp: number; // Celsius
  roadGrade: number; // percentage incline/decline (e.g. 0 to 8%)
  description: string;
}

export const LOCATIONS: Record<string, LocationInfo> = {
  // ================= AFRICA (All 54 Countries - 2+ locations each) =================
  ...AFRICA_PART_1_LOCATIONS,
  ...AFRICA_PART_2_LOCATIONS,

  // ================= EUROPE (All Countries - 2+ locations each) =================
  ...EUROPE_PART_1_LOCATIONS,
  ...EUROPE_PART_2_LOCATIONS,

  // ================= EUROPE =================
  ROTTERDAM: {
    name: 'Rotterdam',
    region: 'Europe',
    country: 'Netherlands',
    coords: [150, 52],
    latLng: [51.9244, 4.4777],
    elevation: -2,
    typicalWeather: 'fog',
    terrain: 'wet_pavement',
    avgTemp: 13,
    roadGrade: 0.5,
    description: 'Europe’s largest deep-water seaport, sea mist, continuous freight container flow.'
  },
  MUNICH: {
    name: 'Munich',
    region: 'Europe',
    country: 'Germany',
    coords: [170, 66],
    latLng: [48.1351, 11.5820],
    elevation: 520,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 14,
    roadGrade: 3.0,
    description: 'Bavarian industrial corridor, unrestricted high-speed Autobahn freight lines.'
  },
  INNSBRUCK: {
    name: 'Innsbruck',
    region: 'Europe',
    country: 'Austria',
    coords: [174, 78],
    latLng: [47.2692, 11.4041],
    elevation: 980,
    typicalWeather: 'snow',
    terrain: 'mountain_pass',
    avgTemp: 3,
    roadGrade: 7.8,
    description: 'Brenner Alpine pass, severe 8% grade switchbacks, heavy snow, intense engine retarder load.'
  },
  LYON: {
    name: 'Lyon',
    region: 'Europe',
    country: 'France',
    coords: [144, 74],
    latLng: [45.7640, 4.8357],
    elevation: 175,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 16,
    roadGrade: 2.8,
    description: 'Rhône Valley logistics crossroads connecting Northern Europe to the Mediterranean.'
  },
  GOTHENBURG: {
    name: 'Gothenburg',
    region: 'Europe',
    country: 'Sweden',
    coords: [168, 28],
    latLng: [57.7088, 11.9746],
    elevation: 12,
    typicalWeather: 'snow',
    terrain: 'icy_road',
    avgTemp: 1,
    roadGrade: 2.2,
    description: 'Nordic maritime terminal, sub-zero black ice highways, demanding winter tire traction.'
  },
  LONDON: {
    name: 'London',
    region: 'Europe',
    country: 'United Kingdom',
    coords: [142, 48],
    latLng: [51.5074, -0.1278],
    elevation: 25,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 12,
    roadGrade: 1.0,
    description: 'Capital of the UK, Thames gateway, major British container and logistics distribution hub.'
  },
  BERLIN: {
    name: 'Berlin',
    region: 'Europe',
    country: 'Germany',
    coords: [165, 50],
    latLng: [52.5200, 13.4050],
    elevation: 34,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 13,
    roadGrade: 1.2,
    description: 'Central-Eastern European freight junction connecting Baltic and Alpine corridors.'
  },
  PARIS: {
    name: 'Paris',
    region: 'Europe',
    country: 'France',
    coords: [145, 60],
    latLng: [48.8566, 2.3522],
    elevation: 35,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 15,
    roadGrade: 1.5,
    description: 'Ile-de-France economic powerhouse, high-volume logistics ring and distribution depot.'
  },

  // ================= AMERICA =================
  CHICAGO: {
    name: 'Chicago',
    region: 'America',
    country: 'United States',
    coords: [78, 85],
    latLng: [41.8781, -87.6298],
    elevation: 181,
    typicalWeather: 'snow',
    terrain: 'highway',
    avgTemp: 8,
    roadGrade: 1.5,
    description: 'Midwest rail-to-truck intermodal hub, fierce lake-effect winter blizzards and crosswinds.'
  },
  DENVER: {
    name: 'Denver',
    region: 'America',
    country: 'United States',
    coords: [50, 95],
    latLng: [39.7392, -104.9903],
    elevation: 1609,
    typicalWeather: 'snow',
    terrain: 'mountain_pass',
    avgTemp: 10,
    roadGrade: 6.5,
    description: 'The Mile High City, thin atmospheric air, steep Rocky Mountain continental divide climbs.'
  },
  DALLAS: {
    name: 'Dallas',
    region: 'America',
    country: 'United States',
    coords: [62, 135],
    latLng: [32.7767, -96.7970],
    elevation: 131,
    typicalWeather: 'heatwave',
    terrain: 'highway',
    avgTemp: 38,
    roadGrade: 0.9,
    description: 'Southwestern freight crossroads, asphalt surface heat above 55°C, high tire blowout strain.'
  },
  LOS_ANGELES: {
    name: 'Los Angeles',
    region: 'America',
    country: 'United States',
    coords: [25, 115],
    latLng: [34.0522, -118.2437],
    elevation: 75,
    typicalWeather: 'fog',
    terrain: 'mountain_pass',
    avgTemp: 24,
    roadGrade: 5.5,
    description: 'Port of Long Beach gateway, Cajon Pass incline, steep mountain grade descent into the basin.'
  },
  SALT_LAKE_CITY: {
    name: 'Salt Lake City',
    region: 'America',
    country: 'United States',
    coords: [38, 80],
    latLng: [40.7608, -111.8910],
    elevation: 1288,
    typicalWeather: 'clear',
    terrain: 'desert_corridor',
    avgTemp: 12,
    roadGrade: 3.5,
    description: 'Great Basin mountain corridor, high altitude desert plateaus, heavy winter mountain snow.'
  },

  // ================= ASIA =================
  TOKYO: {
    name: 'Tokyo',
    region: 'Asia',
    country: 'Japan',
    coords: [350, 75],
    latLng: [35.6762, 139.6503],
    elevation: 40,
    typicalWeather: 'rain',
    terrain: 'highway',
    avgTemp: 18,
    roadGrade: 2.0,
    description: 'Kanto megalopolis, complex elevated Shuto expressways, Pacific monsoon downpours.'
  },
  NAGOYA: {
    name: 'Nagoya',
    region: 'Asia',
    country: 'Japan',
    coords: [330, 85],
    latLng: [35.1815, 136.9066],
    elevation: 20,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 19,
    roadGrade: 1.5,
    description: 'Automotive manufacturing capital of Japan, coastal industrial logistics routes.'
  },
  NAGANO: {
    name: 'Nagano',
    region: 'Asia',
    country: 'Japan',
    coords: [342, 60],
    latLng: [36.6485, 138.1942],
    elevation: 650,
    typicalWeather: 'snow',
    terrain: 'mountain_pass',
    avgTemp: 5,
    roadGrade: 7.2,
    description: 'Japanese Alps mountain gateway, steep winding hairpin turns and heavy alpine snow.'
  },
  SHANGHAI: {
    name: 'Shanghai',
    region: 'Asia',
    country: 'China',
    coords: [295, 95],
    latLng: [31.2304, 121.4737],
    elevation: 4,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 21,
    roadGrade: 0.8,
    description: 'World’s busiest container terminal, Yangtze River Delta multi-lane heavy transport corridors.'
  },
  ALMATY: {
    name: 'Almaty',
    region: 'Asia',
    country: 'Kazakhstan',
    coords: [240, 65],
    latLng: [43.2220, 76.8512],
    elevation: 850,
    typicalWeather: 'snow',
    terrain: 'mountain_pass',
    avgTemp: 7,
    roadGrade: 6.0,
    description: 'Tian Shan mountain foothills, Silk Road trans-Eurasian heavy transit corridors.'
  }
};

// Backwards-compatible CITIES coordinate mapping
export const CITIES: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(LOCATIONS).map(([key, loc]) => [key, loc.coords])
);

export const REGIONS: Record<RegionName, { name: string; countryList: string; icon: string }> = {
  Africa: { name: 'Africa (West & Sahel)', countryList: 'Nigeria, Ghana, Niger', icon: 'route' },
  Europe: { name: 'Europe (Alpine & Atlantic)', countryList: 'United Kingdom, Germany, Netherlands, Austria, France, Sweden', icon: 'route' },
  America: { name: 'North America (Interstate)', countryList: 'United States', icon: 'route' },
  Asia: { name: 'Asia (Pacific & Silk Road)', countryList: 'Japan, China, Kazakhstan', icon: 'route' }
};

export const COMPANIES = ['ROLLAND', 'KESTLE', 'TLRP', 'PSTL', 'VANGUARD', 'NEXLOG', 'GLOBAL_HAUL'];

export const CARGO: Record<string, { icon: string; trailer: string }> = {
  CARS: { icon: 'truck', trailer: 'carrier' },
  'PUFFED SNACKS': { icon: 'box', trailer: 'box' },
  MASCARA: { icon: 'box', trailer: 'box' },
  SERVERS: { icon: 'box', trailer: 'box' },
  EXPLOSIVES: { icon: 'box', trailer: 'hazmat' },
  SAND: { icon: 'truck', trailer: 'tipper' },
  'INDUSTRIAL TRANSFORMERS': { icon: 'truck', trailer: 'lowboy' },
  'PHARMACEUTICAL VACCINES': { icon: 'snowflake', trailer: 'reefer' },
  'CRUDE OIL': { icon: 'fuel', trailer: 'tanker' }
};

/**
 * Authoritative location-to-region resolver.
 * Accurately maps any truck object or city/location string to its continent region.
 */
export function resolveTruckRegion(target: string | { loc?: string } | null | undefined): RegionName {
  if (!target) return 'Africa';
  const locKey = typeof target === 'string' ? target : target.loc || '';
  if (!locKey) return 'Africa';
  const upper = String(locKey).toUpperCase().trim();
  
  // 1. Direct key match in authoritative LOCATIONS
  if (LOCATIONS[upper]?.region) {
    return LOCATIONS[upper].region;
  }

  // 1b. Check for Hub ID matches (Normalize underscores)
  const normUpper = upper.replace(/\s+/g, '_');
  const hubMatch = (REGIONAL_HUBS || []).find(h => 
    h.id.toUpperCase() === normUpper || 
    h.city.toUpperCase().replace(/\s+/g, '_') === normUpper
  );
  if (hubMatch) return hubMatch.region;

  // 2. Exact match against location name
  for (const k of Object.keys(LOCATIONS)) {
    if (k.toUpperCase() === upper || LOCATIONS[k].name.toUpperCase() === upper) {
      return LOCATIONS[k].region;
    }
  }

  // 3. European cities and regional identifiers
  const euroPatterns = [
    'LONDON', 'ROTTERDAM', 'MUNICH', 'INNSBRUCK', 'LYON', 'GOTHENBURG',
    'BERLIN', 'PARIS', 'MADRID', 'ROME', 'AMSTERDAM', 'FRANKFURT', 'VIENNA',
    'WARSAW', 'BRUSSELS', 'MANCHESTER', 'BIRMINGHAM', 'GLASGOW', 'DUBLIN', 'ZURICH',
    'EUROPE', 'UK', 'ENGLAND', 'BRITAIN', 'GERMANY', 'FRANCE', 'NETHERLANDS', 'AUSTRIA', 'SWEDEN', 'SPAIN', 'ITALY'
  ];
  if (euroPatterns.some(p => upper.includes(p))) {
    return 'Europe';
  }

  // 4. North American cities and regional identifiers
  const usPatterns = [
    'CHICAGO', 'DENVER', 'DALLAS', 'LOS_ANGELES', 'LOS ANGELES', 'SALT_LAKE_CITY',
    'SALT LAKE CITY', 'NEW_YORK', 'NEW YORK', 'HOUSTON', 'MIAMI', 'SEATTLE', 'ATLANTA',
    'PHOENIX', 'DETROIT', 'AMERICA', 'USA', 'UNITED STATES', 'CANADA', 'TEXAS', 'CALIFORNIA'
  ];
  if (usPatterns.some(p => upper.includes(p))) {
    return 'America';
  }

  // 5. Asian cities and regional identifiers
  const asiaPatterns = [
    'TOKYO', 'NAGOYA', 'NAGANO', 'SHANGHAI', 'ALMATY', 'BEIJING', 'SINGAPORE', 'SEOUL',
    'BANGKOK', 'DUBAI', 'HONG KONG', 'ASIA', 'JAPAN', 'CHINA', 'KAZAKHSTAN', 'SHIYAN', 'XI_AN'
  ];
  if (asiaPatterns.some(p => upper.includes(p))) {
    return 'Asia';
  }

  // 6. African cities and regional identifiers
  const africaPatterns = [
    'LAGOS', 'IBADAN', 'ENUGU', 'ABUJA', 'KANO', 'MAIDUGURI', 'PORT_HARCOURT', 'PORT HARCOURT',
    'SOKOTO', 'JOS', 'BENIN_CITY', 'BENIN CITY', 'ACCRA', 'KADUNA', 'ILORIN', 'MAKURDI',
    'BAUCHI', 'LOKOJA', 'COTONOU', 'LOME', 'CALABAR', 'UYO', 'KATSINA', 'YOLA', 'MINNA',
    'AFRICA', 'NIGERIA', 'GHANA', 'BENIN', 'TOGO', 'LAG_HUB', 'ABJ_HUB', 'KAN_HUB'
  ];
  if (africaPatterns.some(p => upper.includes(p))) {
    return 'Africa';
  }

  return 'Africa';
}

