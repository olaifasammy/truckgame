export type RegionName = 'Africa' | 'Europe' | 'America' | 'Asia';

export interface LocationInfo {
  name: string;
  region: RegionName;
  country: string;
  latLng: [number, number]; // [latitude, longitude]
  elevation: number; // meters above sea level
  typicalWeather: 'clear' | 'rain' | 'snow' | 'fog' | 'heatwave';
  terrain: 'highway' | 'mountain_pass' | 'wet_pavement' | 'icy_road' | 'desert_corridor';
  avgTemp: number; // Celsius
  roadGrade: number; // percentage incline/decline (e.g. 0 to 8%)
  description: string;
}

/**
 * Factory for creating location definitions with sensible regional defaults.
 * Reduces boilerplate and "re-writing" common properties.
 */
export const loc = (
  name: string, 
  country: string, 
  lat: number, 
  lng: number, 
  region: RegionName = 'Africa', 
  extra: Partial<LocationInfo> = {}
): LocationInfo => ({
  name,
  region,
  country,
  latLng: [lat, lng],
  elevation: extra.elevation ?? 200,
  typicalWeather: extra.typicalWeather ?? 'clear',
  terrain: extra.terrain ?? 'highway',
  avgTemp: extra.avgTemp ?? 25,
  roadGrade: extra.roadGrade ?? 1.5,
  description: extra.description ?? `${name} terminal hub and regional logistics center in ${country}.`,
  ...extra
});
