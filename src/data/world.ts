export type RegionName = 'Africa' | 'Europe' | 'America' | 'Asia';

export interface LocationInfo {
  name: string;
  region: RegionName;
  country: string;
  coords: [number, number]; // [x, y] on map canvas
  elevation: number; // meters above sea level
  typicalWeather: 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';
  terrain: 'highway' | 'mountain_pass' | 'wet_pavement' | 'icy_road' | 'desert_corridor';
  avgTemp: number; // Celsius
  roadGrade: number; // percentage incline/decline (e.g. 0 to 8%)
  description: string;
}

export const LOCATIONS: Record<string, LocationInfo> = {
  // ================= AFRICA =================
  LAGOS: {
    name: 'Lagos',
    region: 'Africa',
    country: 'Nigeria',
    coords: [140, 160],
    elevation: 12,
    typicalWeather: 'rain',
    terrain: 'wet_pavement',
    avgTemp: 31,
    roadGrade: 1.2,
    description: 'Atlantic deep-water port, dense humid traffic corridors, coastal rainstorms.'
  },
  IBADAN: {
    name: 'Ibadan',
    region: 'Africa',
    country: 'Nigeria',
    coords: [136, 145],
    elevation: 230,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 29,
    roadGrade: 2.5,
    description: 'Rolling southwestern hills and industrial logistics distribution centers.'
  },
  ENUGU: {
    name: 'Enugu',
    region: 'Africa',
    country: 'Nigeria',
    coords: [165, 162],
    elevation: 260,
    typicalWeather: 'rain',
    terrain: 'mountain_pass',
    avgTemp: 28,
    roadGrade: 4.8,
    description: 'Eastern coal city highland escarpment with sharp bends and steep climbs.'
  },
  ABUJA: {
    name: 'Abuja',
    region: 'Africa',
    country: 'Nigeria',
    coords: [152, 135],
    elevation: 480,
    typicalWeather: 'clear',
    terrain: 'highway',
    avgTemp: 33,
    roadGrade: 2.0,
    description: 'Central Federal Capital Territory expressway network and dry savanna plateau.'
  },
  KANO: {
    name: 'Kano',
    region: 'Africa',
    country: 'Nigeria',
    coords: [156, 110],
    elevation: 488,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 38,
    roadGrade: 1.0,
    description: 'Ancient trans-Saharan trade hub, intense heat waves and dry sandy road surfaces.'
  },
  MAIDUGURI: {
    name: 'Maiduguri',
    region: 'Africa',
    country: 'Nigeria',
    coords: [185, 115],
    elevation: 320,
    typicalWeather: 'heatwave',
    terrain: 'desert_corridor',
    avgTemp: 39,
    roadGrade: 0.8,
    description: 'Northeastern Lake Chad basin transit terminus with desert crosswinds.'
  },

  // ================= EUROPE =================
  ROTTERDAM: {
    name: 'Rotterdam',
    region: 'Europe',
    country: 'Netherlands',
    coords: [150, 52],
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
    elevation: 12,
    typicalWeather: 'snow',
    terrain: 'icy_road',
    avgTemp: 1,
    roadGrade: 2.2,
    description: 'Nordic maritime terminal, sub-zero black ice highways, demanding winter tire traction.'
  },

  // ================= AMERICA =================
  CHICAGO: {
    name: 'Chicago',
    region: 'America',
    country: 'United States',
    coords: [78, 85],
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
  Europe: { name: 'Europe (Alpine & Atlantic)', countryList: 'Germany, Netherlands, Austria, France, Sweden', icon: 'route' },
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
