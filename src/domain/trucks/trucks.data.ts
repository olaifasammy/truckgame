import { TrailerType, TruckModel } from './trucks.types';

export const TRAILERS: Record<TrailerType, string> = {
  box: 'Box Dry Van',
  tipper: 'Aggregate Tipper',
  carrier: 'Auto Car Transporter',
  hazmat: 'ADR Hazmat Tanker (Shipper Supplied)',
  curtain: 'Curtainside Trailer',
  reefer: 'Refrigerated Reefer',
  flatbed: 'Heavy Flatbed',
  tanker: 'Foodgrade Liquid Tanker',
  lowboy: 'Heavy Machinery Lowboy',
  double_trailer: 'Double Trailer B-Train LCV',
  container: 'Intermodal 40ft Chassis'
};

export const TRAILER_ICONS: Record<TrailerType, string> = {
  curtain: '🚚',
  reefer: '❄️',
  flatbed: '📦',
  lowboy: '🏗️',
  tipper: '⛰️',
  double_trailer: '🚛',
  box: '📦',
  carrier: '🚗',
  container: '🚢',
  tanker: '💧',
  hazmat: '☣️'
};

export function getTrailerIcon(type: TrailerType | null | 'none'): string {
  if (!type || type === 'none') return '🚜';
  return TRAILER_ICONS[type] || '🚚';
}

export const TRAILER_PRICES: Record<TrailerType, number> = {
  curtain: 15000,
  reefer: 24000,
  flatbed: 12000,
  lowboy: 30000,
  tipper: 18000,
  double_trailer: 36000,
  box: 14000,
  carrier: 22000,
  container: 16000,
  tanker: 20000,
  hazmat: 0 // Supplied by consignor at chemical terminal
};

export const TRUCK_MODELS: Record<string, TruckModel> = {
  // ================= SCANIA =================
  'scania_s730': {
    id: 'scania_s730', brand: 'Scania', name: 'S730 V8 Highline', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 107', cylinders: 8, displacement: 16.4, hp: 730, torque: 3500, fuelType: 'Diesel' },
    trans: 'Opticruise 12+2', tankSize: 1200, oilCapacity: 45, baseWeight: 9.5, maxGVW: 60, price: 185000,
    haul: ['curtain', 'reefer', 'lowboy', 'tanker', 'hazmat', 'flatbed', 'double_trailer', 'container', 'tipper', 'carrier']
  },
  'scania_770s': {
    id: 'scania_770s', brand: 'Scania', name: '770S V8 King of the Road', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 123', cylinders: 8, displacement: 16.4, hp: 770, torque: 3700, fuelType: 'Diesel' },
    trans: 'Opticruise GRSO935R', tankSize: 1300, oilCapacity: 48, baseWeight: 9.8, maxGVW: 65, price: 198000,
    haul: ['curtain', 'reefer', 'lowboy', 'tanker', 'hazmat', 'flatbed', 'double_trailer', 'container', 'carrier']
  },
  'scania_r500': {
    id: 'scania_r500', brand: 'Scania', name: 'R500 Super Highline', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 166', cylinders: 6, displacement: 13.0, hp: 500, torque: 2650, fuelType: 'Diesel' },
    trans: 'Opticruise G33CH', tankSize: 1000, oilCapacity: 40, baseWeight: 8.2, maxGVW: 44, price: 134000,
    haul: ['curtain', 'reefer', 'box', 'tanker', 'container', 'carrier']
  },
  'scania_r500_8x4': {
    id: 'scania_r500_8x4', brand: 'Scania', name: 'R500 XT Heavy Tipper', region: 'Europe', axle: '8x4',
    engine: { name: 'DC13 155', cylinders: 6, displacement: 13.0, hp: 500, torque: 2550, fuelType: 'Diesel' },
    trans: 'Opticruise with Crawler', tankSize: 400, oilCapacity: 35, baseWeight: 15.0, maxGVW: 80, price: 168000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },

  // --- NEW SCANIA ADDITIONS ---
  'scania_143m': {
    id: 'scania_143m', brand: 'Scania', name: '143M 500 V8 Streamline', region: 'Europe', axle: '4x2',
    engine: { name: 'DSC14 V8', cylinders: 8, displacement: 14.2, hp: 500, torque: 2100, fuelType: 'Diesel' },
    trans: 'Manual 10-spd', tankSize: 800, oilCapacity: 35, baseWeight: 9.0, maxGVW: 40, price: 95000,
    haul: ['curtain', 'flatbed', 'tanker', 'container']
  },
  'scania_r450_super': {
    id: 'scania_r450_super', brand: 'Scania', name: 'R450 Super Efficiency', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 174', cylinders: 6, displacement: 12.7, hp: 450, torque: 2350, fuelType: 'Diesel' },
    trans: 'G25CM Opticruise', tankSize: 1100, oilCapacity: 32, baseWeight: 7.5, maxGVW: 44, price: 128000,
    haul: ['curtain', 'box', 'reefer', 'container']
  },
  'scania_r660': {
    id: 'scania_r660', brand: 'Scania', name: 'R660 V8 Workhorse', region: 'Europe', axle: '6x2',
    engine: { name: 'DC16 122', cylinders: 8, displacement: 16.4, hp: 660, torque: 3300, fuelType: 'Diesel' },
    trans: 'G33CM Opticruise', tankSize: 1000, oilCapacity: 42, baseWeight: 9.2, maxGVW: 60, price: 162000,
    haul: ['lowboy', 'double_trailer', 'reefer', 'tanker', 'carrier']
  },
  'scania_164l': {
    id: 'scania_164l', brand: 'Scania', name: '164L 580 V8 Heritage', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 01', cylinders: 8, displacement: 15.6, hp: 580, torque: 2700, fuelType: 'Diesel' },
    trans: 'Manual 12+2', tankSize: 1200, oilCapacity: 40, baseWeight: 10.5, maxGVW: 65, price: 115000,
    haul: ['lowboy', 'flatbed', 'tipper', 'hazmat']
  },
  'scania_s540_super': {
    id: 'scania_s540_super', brand: 'Scania', name: 'S540 Super Luxury', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 176', cylinders: 6, displacement: 12.7, hp: 540, torque: 2700, fuelType: 'Diesel' },
    trans: 'G33CM Opticruise', tankSize: 1250, oilCapacity: 34, baseWeight: 8.2, maxGVW: 48, price: 152000,
    haul: ['curtain', 'reefer', 'box', 'carrier', 'container']
  },
  'scania_g450_xt': {
    id: 'scania_g450_xt', brand: 'Scania', name: 'G450 XT Construction', region: 'Europe', axle: '6x4',
    engine: { name: 'DC13 148', cylinders: 6, displacement: 12.7, hp: 450, torque: 2350, fuelType: 'Diesel' },
    trans: 'GRSO905R Opticruise', tankSize: 600, oilCapacity: 38, baseWeight: 11.0, maxGVW: 70, price: 135000,
    haul: ['tipper', 'flatbed', 'lowboy']
  },
  'scania_r730_amber': {
    id: 'scania_r730_amber', brand: 'Scania', name: 'R730 V8 Black Amber Edition', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 103', cylinders: 8, displacement: 16.4, hp: 730, torque: 3500, fuelType: 'Diesel' },
    trans: 'Opticruise GRSO905', tankSize: 1400, oilCapacity: 45, baseWeight: 9.4, maxGVW: 65, price: 225000,
    haul: ['curtain', 'reefer', 'lowboy', 'carrier', 'double_trailer']
  },

  // ================= VOLVO =================
  'volvo_fh16': {
    id: 'volvo_fh16', brand: 'Volvo', name: 'FH16 750 Globetrotter XXL', region: 'Europe', axle: '6x4',
    engine: { name: 'D16K750', cylinders: 6, displacement: 16.1, hp: 750, torque: 3550, fuelType: 'Diesel' },
    trans: 'I-Shift Dual Clutch', tankSize: 1100, oilCapacity: 44, baseWeight: 9.8, maxGVW: 65, price: 195000,
    haul: ['curtain', 'reefer', 'lowboy', 'flatbed', 'hazmat', 'tanker', 'double_trailer', 'container', 'carrier']
  },
  'volvo_fh540': {
    id: 'volvo_fh540', brand: 'Volvo', name: 'FH 540 Globetrotter XL', region: 'Europe', axle: '4x2',
    engine: { name: 'D13K540', cylinders: 6, displacement: 12.8, hp: 540, torque: 2600, fuelType: 'Diesel' },
    trans: 'I-Shift 12-spd', tankSize: 950, oilCapacity: 38, baseWeight: 8.3, maxGVW: 44, price: 142000,
    haul: ['curtain', 'reefer', 'box', 'tanker', 'carrier']
  },
  'volvo_vnl860': {
    id: 'volvo_vnl860', brand: 'Volvo', name: 'VNL 860 Premium Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'D13TC Turbo Compound', cylinders: 6, displacement: 12.8, hp: 500, torque: 2500, fuelType: 'Diesel' },
    trans: 'I-Shift Automated', tankSize: 1300, oilCapacity: 40, baseWeight: 9.6, maxGVW: 55, price: 162000,
    haul: ['box', 'reefer', 'curtain', 'flatbed', 'carrier']
  },
  'volvo_fmx_8x4': {
    id: 'volvo_fmx_8x4', brand: 'Volvo', name: 'FMX 540 Severe Tipper', region: 'Europe', axle: '8x4',
    engine: { name: 'D13K540', cylinders: 6, displacement: 12.8, hp: 540, torque: 2600, fuelType: 'Diesel' },
    trans: 'I-Shift Crawler', tankSize: 450, oilCapacity: 38, baseWeight: 15.5, maxGVW: 85, price: 172000,
    haul: ['tipper', 'lowboy']
  },

  // ================= MERCEDES-BENZ =================
  'merc_actros': {
    id: 'merc_actros', brand: 'Mercedes-Benz', name: 'Actros L 1863 GigaSpace', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 473', cylinders: 6, displacement: 15.6, hp: 625, torque: 3000, fuelType: 'Diesel' },
    trans: 'PowerShift 3', tankSize: 900, oilCapacity: 42, baseWeight: 8.4, maxGVW: 44, price: 148000,
    haul: ['curtain', 'reefer', 'box', 'tanker', 'carrier']
  },
  'merc_actros_1853': {
    id: 'merc_actros_1853', brand: 'Mercedes-Benz', name: 'Actros 1853 StreamSpace', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 471', cylinders: 6, displacement: 12.8, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'PowerShift 3 G281', tankSize: 850, oilCapacity: 38, baseWeight: 8.1, maxGVW: 42, price: 136000,
    haul: ['curtain', 'reefer', 'box', 'carrier']
  },
  'merc_arocs': {
    id: 'merc_arocs', brand: 'Mercedes-Benz', name: 'Arocs 3351 Grounder Heavy', region: 'Europe', axle: '6x4',
    engine: { name: 'OM 471', cylinders: 6, displacement: 12.8, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'PowerShift Offroad', tankSize: 600, oilCapacity: 39, baseWeight: 10.2, maxGVW: 55, price: 154000,
    haul: ['tipper', 'lowboy', 'flatbed', 'tanker']
  },

  // --- NEW MERCEDES-BENZ ADDITIONS ---
  'merc_sk_1844': {
    id: 'merc_sk_1844', brand: 'Mercedes-Benz', name: 'SK 1844 V8 Classic', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 442 LA V8', cylinders: 8, displacement: 14.6, hp: 440, torque: 1900, fuelType: 'Diesel' },
    trans: 'EPS 16-spd', tankSize: 600, oilCapacity: 38, baseWeight: 8.8, maxGVW: 40, price: 62000,
    haul: ['curtain', 'flatbed', 'tipper', 'tanker']
  },
  'merc_actros_mp3_v8': {
    id: 'merc_actros_mp3_v8', brand: 'Mercedes-Benz', name: 'Actros MP3 1860 V8 Prestige', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 502 LA V8', cylinders: 8, displacement: 15.9, hp: 600, torque: 2800, fuelType: 'Diesel' },
    trans: 'PowerShift 2', tankSize: 900, oilCapacity: 45, baseWeight: 8.2, maxGVW: 44, price: 118000,
    haul: ['curtain', 'reefer', 'box', 'carrier']
  },
  'merc_actros_l_2024': {
    id: 'merc_actros_l_2024', brand: 'Mercedes-Benz', name: 'Actros L 2024 ProCabin', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 471', cylinders: 6, displacement: 12.8, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'PowerShift Advanced', tankSize: 1100, oilCapacity: 38, baseWeight: 8.0, maxGVW: 44, price: 154000,
    haul: ['curtain', 'reefer', 'box', 'container', 'carrier']
  },
  'merc_eactros_600': {
    id: 'merc_eactros_600', brand: 'Mercedes-Benz', name: 'eActros 600 Electric', region: 'Europe', axle: '4x2',
    engine: { name: 'Dual Electric Motors', cylinders: 0, displacement: 1.0, hp: 540, torque: 2400, fuelType: 'Electric' },
    trans: '4-speed eGearbox', tankSize: 600, oilCapacity: 6, baseWeight: 11.8, maxGVW: 44, price: 245000,
    haul: ['curtain', 'box', 'container']
  },
  'merc_arocs_slt': {
    id: 'merc_arocs_slt', brand: 'Mercedes-Benz', name: 'Arocs 4163 SLT Heavy Haul', region: 'Europe', axle: '8x4',
    engine: { name: 'OM 473', cylinders: 6, displacement: 15.6, hp: 625, torque: 3000, fuelType: 'Diesel' },
    trans: 'VIAB Turbo Clutch 16', tankSize: 900, oilCapacity: 48, baseWeight: 14.5, maxGVW: 250, price: 215000,
    haul: ['lowboy', 'flatbed', 'tanker']
  },
  'merc_actros_edition3': {
    id: 'merc_actros_edition3', brand: 'Mercedes-Benz', name: 'Actros L Edition 3 Limited', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 473', cylinders: 6, displacement: 15.6, hp: 625, torque: 3000, fuelType: 'Diesel' },
    trans: 'PowerShift 3 Advanced', tankSize: 1200, oilCapacity: 42, baseWeight: 8.5, maxGVW: 44, price: 210000,
    haul: ['curtain', 'reefer', 'carrier', 'container']
  },
  'merc_zetros': {
    id: 'merc_zetros', brand: 'Mercedes-Benz', name: 'Zetros 2743 Off-Road Power', region: 'Europe', axle: '6x4',
    engine: { name: 'OM 457 LA', cylinders: 6, displacement: 12.0, hp: 430, torque: 2100, fuelType: 'Diesel' },
    trans: 'Manual 9-spd', tankSize: 600, oilCapacity: 35, baseWeight: 11.2, maxGVW: 27, price: 145000,
    haul: ['tipper', 'flatbed', 'lowboy']
  },

  // ================= MAN =================
  'man_tgx': {
    id: 'man_tgx', brand: 'MAN', name: 'TGX 18.640 Individual Lion S', region: 'Europe', axle: '4x2',
    engine: { name: 'D3876', cylinders: 6, displacement: 15.2, hp: 640, torque: 3000, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 800, oilCapacity: 40, baseWeight: 8.5, maxGVW: 44, price: 145000,
    haul: ['curtain', 'box', 'reefer', 'tanker', 'carrier']
  },
  'man_tgx_510': {
    id: 'man_tgx_510', brand: 'MAN', name: 'TGX 18.510 GX Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 510, torque: 2600, fuelType: 'Diesel' },
    trans: 'TipMatic Pro', tankSize: 760, oilCapacity: 36, baseWeight: 8.0, maxGVW: 40, price: 132000,
    haul: ['curtain', 'box', 'reefer', 'carrier']
  },
  'man_tgs': {
    id: 'man_tgs', brand: 'MAN', name: 'TGS 33.480 Heavy Hauler', region: 'Europe', axle: '6x4',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 480, torque: 2450, fuelType: 'Diesel' },
    trans: 'TipMatic Offroad', tankSize: 550, oilCapacity: 35, baseWeight: 9.8, maxGVW: 50, price: 138000,
    haul: ['tipper', 'lowboy', 'flatbed', 'tanker']
  },

  // --- NEW MAN ADDITIONS ---
  'man_f2000': {
    id: 'man_f2000', brand: 'MAN', name: 'F2000 19.463 Evolution', region: 'Europe', axle: '4x2',
    engine: { name: 'D2866', cylinders: 6, displacement: 12.8, hp: 460, torque: 2100, fuelType: 'Diesel' },
    trans: 'ZF 16-spd Manual', tankSize: 700, oilCapacity: 40, baseWeight: 8.8, maxGVW: 40, price: 54000,
    haul: ['curtain', 'flatbed', 'tanker']
  },
  'man_tga': {
    id: 'man_tga', brand: 'MAN', name: 'TGA 18.480 XXL', region: 'Europe', axle: '4x2',
    engine: { name: 'D2876', cylinders: 6, displacement: 12.8, hp: 480, torque: 2300, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 850, oilCapacity: 38, baseWeight: 8.2, maxGVW: 44, price: 78000,
    haul: ['curtain', 'box', 'reefer']
  },
  'man_tgx_eff_3': {
    id: 'man_tgx_eff_3', brand: 'MAN', name: 'TGX 18.470 EfficientLine 3', region: 'Europe', axle: '4x2',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 470, torque: 2400, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 1100, oilCapacity: 34, baseWeight: 7.6, maxGVW: 40, price: 124000,
    haul: ['curtain', 'box', 'reefer', 'container']
  },
  'man_tgs_8x4_tipper': {
    id: 'man_tgs_8x4_tipper', brand: 'MAN', name: 'TGS 41.510 8x4 Mining', region: 'Europe', axle: '8x4',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 510, torque: 2600, fuelType: 'Diesel' },
    trans: 'TipMatic Offroad', tankSize: 400, oilCapacity: 35, baseWeight: 14.8, maxGVW: 80, price: 172000,
    haul: ['tipper']
  },
  'man_tgx_33640': {
    id: 'man_tgx_33640', brand: 'MAN', name: 'TGX 33.640 Heavy 6x4', region: 'Europe', axle: '6x4',
    engine: { name: 'D3876', cylinders: 6, displacement: 15.2, hp: 640, torque: 3000, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 800, oilCapacity: 42, baseWeight: 9.8, maxGVW: 65, price: 168000,
    haul: ['lowboy', 'flatbed', 'double_trailer', 'carrier']
  },
  'man_etgx': {
    id: 'man_etgx', brand: 'MAN', name: 'eTGX Electric Long-Haul', region: 'Europe', axle: '4x2',
    engine: { name: 'Central eMotor', cylinders: 0, displacement: 1.0, hp: 450, torque: 2500, fuelType: 'Electric' },
    trans: '4-speed eGearbox', tankSize: 480, oilCapacity: 5, baseWeight: 11.2, maxGVW: 44, price: 235000,
    haul: ['curtain', 'box', 'reefer', 'container']
  },
  'man_tgx_2024': {
    id: 'man_tgx_2024', brand: 'MAN', name: 'TGX 18.520 Individual Lion', region: 'Europe', axle: '4x2',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 520, torque: 2650, fuelType: 'Diesel' },
    trans: 'TipMatic 12 Pro', tankSize: 1100, oilCapacity: 36, baseWeight: 7.9, maxGVW: 44, price: 158000,
    haul: ['curtain', 'box', 'reefer', 'carrier', 'container']
  },

  // ================= DAF =================
  'daf_xf': {
    id: 'daf_xf', brand: 'DAF', name: 'XF 530 FT Super Space Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 850, oilCapacity: 34, baseWeight: 8.0, maxGVW: 40, price: 125000,
    haul: ['curtain', 'box', 'reefer', 'carrier']
  },
  'daf_xg_plus': {
    id: 'daf_xg_plus', brand: 'DAF', name: 'XG+ 530 Executive Flagship', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2700, fuelType: 'Diesel' },
    trans: 'TraXon 12 Automated', tankSize: 950, oilCapacity: 36, baseWeight: 8.3, maxGVW: 44, price: 146000,
    haul: ['curtain', 'box', 'reefer', 'tanker', 'carrier']
  },

  // --- NEW DAF ADDITIONS ---
  'daf_95ati': {
    id: 'daf_95ati', brand: 'DAF', name: '95 Ati 430 Classic', region: 'Europe', axle: '4x2',
    engine: { name: 'DAF 11.6L', cylinders: 6, displacement: 11.6, hp: 430, torque: 1900, fuelType: 'Diesel' },
    trans: 'ZF 16-spd Manual', tankSize: 700, oilCapacity: 35, baseWeight: 8.5, maxGVW: 40, price: 48000,
    haul: ['curtain', 'flatbed', 'tanker']
  },
  'daf_xf105': {
    id: 'daf_xf105', brand: 'DAF', name: 'XF105 460 Super Space Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 460, torque: 2300, fuelType: 'Diesel' },
    trans: 'AS Tronic 12-spd', tankSize: 850, oilCapacity: 36, baseWeight: 8.0, maxGVW: 44, price: 85000,
    haul: ['curtain', 'box', 'reefer', 'tanker']
  },
  'daf_xg_480': {
    id: 'daf_xg_480', brand: 'DAF', name: 'XG 480 Efficiency Pro', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 480, torque: 2500, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 1200, oilCapacity: 34, baseWeight: 7.8, maxGVW: 40, price: 138000,
    haul: ['curtain', 'box', 'reefer', 'container']
  },
  'daf_cf85_8x4': {
    id: 'daf_cf85_8x4', brand: 'DAF', name: 'CF 85.510 8x4 Tipper', region: 'Europe', axle: '8x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2550, fuelType: 'Diesel' },
    trans: 'ZF 12-spd', tankSize: 450, oilCapacity: 36, baseWeight: 14.5, maxGVW: 80, price: 142000,
    haul: ['tipper']
  },
  'daf_xf_6x2': {
    id: 'daf_xf_6x2', brand: 'DAF', name: 'XF 530 Super 6x2 Taglift', region: 'Europe', axle: '6x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 900, oilCapacity: 38, baseWeight: 8.8, maxGVW: 48, price: 145000,
    haul: ['curtain', 'reefer', 'tanker', 'container']
  },
  'daf_xg_plus_6x4': {
    id: 'daf_xg_plus_6x4', brand: 'DAF', name: 'XG+ 530 Heavy 6x4', region: 'Europe', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2700, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 1100, oilCapacity: 40, baseWeight: 9.5, maxGVW: 60, price: 165000,
    haul: ['lowboy', 'flatbed', 'double_trailer', 'carrier']
  },
  'daf_3300': {
    id: 'daf_3300', brand: 'DAF', name: '3300 DKX Legend', region: 'Europe', axle: '4x2',
    engine: { name: 'DKX 11.6L', cylinders: 6, displacement: 11.6, hp: 330, torque: 1550, fuelType: 'Diesel' },
    trans: '16-spd Manual', tankSize: 600, oilCapacity: 34, baseWeight: 8.2, maxGVW: 38, price: 42000,
    haul: ['curtain', 'flatbed', 'tipper']
  },

  // ================= KENWORTH =================
  'kenworth_w900': {
    id: 'kenworth_w900', brand: 'Kenworth', name: 'W900 Studio Sleeper 86"', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15', cylinders: 6, displacement: 15.0, hp: 605, torque: 2780, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd', tankSize: 1500, oilCapacity: 48, baseWeight: 10.5, maxGVW: 55, price: 165000,
    haul: ['flatbed', 'lowboy', 'tipper', 'tanker']
  },
  'kenworth_t680': {
    id: 'kenworth_t680', brand: 'Kenworth', name: 'T680 Next Gen 76" High-Roof', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'PACCAR 12-spd AMT', tankSize: 1300, oilCapacity: 40, baseWeight: 9.1, maxGVW: 48, price: 156000,
    haul: ['box', 'reefer', 'curtain', 'carrier']
  },
  'kenworth_w990': {
    id: 'kenworth_w990', brand: 'Kenworth', name: 'W990 Long-Hood Heritage', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15 Performance', cylinders: 6, displacement: 15.0, hp: 565, torque: 2780, fuelType: 'Diesel' },
    trans: 'Eaton Endurant XD', tankSize: 1400, oilCapacity: 46, baseWeight: 10.0, maxGVW: 52, price: 172000,
    haul: ['flatbed', 'lowboy', 'tanker', 'tipper', 'carrier']
  },

  // --- NEW KENWORTH ADDITIONS ---
  'kenworth_w900l': {
    id: 'kenworth_w900l', brand: 'Kenworth', name: 'W900L Extended Hood Classic', region: 'America', axle: '6x4',
    engine: { name: 'Caterpillar C15', cylinders: 6, displacement: 15.2, hp: 625, torque: 2780, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd Manual', tankSize: 1600, oilCapacity: 45, baseWeight: 11.0, maxGVW: 55, price: 178000,
    haul: ['flatbed', 'lowboy', 'tipper', 'tanker', 'carrier']
  },
  'kenworth_t600': {
    id: 'kenworth_t600', brand: 'Kenworth', name: 'T600 Anteater Classic', region: 'America', axle: '6x4',
    engine: { name: 'Cummins N14', cylinders: 6, displacement: 14.0, hp: 500, torque: 2300, fuelType: 'Diesel' },
    trans: 'Eaton 13-spd', tankSize: 1200, oilCapacity: 40, baseWeight: 9.2, maxGVW: 44, price: 58000,
    haul: ['box', 'reefer', 'curtain']
  },
  'kenworth_t880': {
    id: 'kenworth_t880', brand: 'Kenworth', name: 'T880 Vocational Heavy', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'Allison 4700 RDS', tankSize: 1000, oilCapacity: 38, baseWeight: 10.5, maxGVW: 60, price: 152000,
    haul: ['tipper', 'lowboy', 'flatbed', 'tanker']
  },
  'kenworth_t2000': {
    id: 'kenworth_t2000', brand: 'Kenworth', name: 'T2000 Aero Elite', region: 'America', axle: '6x4',
    engine: { name: 'Cummins ISX', cylinders: 6, displacement: 15.0, hp: 550, torque: 2500, fuelType: 'Diesel' },
    trans: 'Eaton UltraShift', tankSize: 1400, oilCapacity: 42, baseWeight: 9.5, maxGVW: 48, price: 82000,
    haul: ['box', 'reefer', 'curtain']
  },
  'kenworth_k100e': {
    id: 'kenworth_k100e', brand: 'Kenworth', name: 'K100E Cabover Aerodyne', region: 'America', axle: '6x4',
    engine: { name: 'Cummins Big Cam', cylinders: 6, displacement: 14.0, hp: 475, torque: 2100, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 13-spd', tankSize: 1000, oilCapacity: 38, baseWeight: 8.8, maxGVW: 44, price: 65000,
    haul: ['curtain', 'box', 'flatbed']
  },
  'kenworth_t680e': {
    id: 'kenworth_t680e', brand: 'Kenworth', name: 'T680E Electric Class 8', region: 'America', axle: '6x4',
    engine: { name: 'Electric Powertrain', cylinders: 0, displacement: 1.0, hp: 536, torque: 2200, fuelType: 'Electric' },
    trans: '2-speed eGearbox', tankSize: 400, oilCapacity: 4, baseWeight: 12.5, maxGVW: 44, price: 255000,
    haul: ['box', 'reefer', 'container']
  },
  'kenworth_w990_sleeper': {
    id: 'kenworth_w990_sleeper', brand: 'Kenworth', name: 'W990 Limited Edition Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'PACCAR 12-spd AMT', tankSize: 1500, oilCapacity: 40, baseWeight: 10.2, maxGVW: 52, price: 192000,
    haul: ['flatbed', 'lowboy', 'carrier', 'reefer']
  },
  'kenworth_c500': {
    id: 'kenworth_c500', brand: 'Kenworth', name: 'C500 Extreme Heavy Duty', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15', cylinders: 6, displacement: 15.0, hp: 605, torque: 2800, fuelType: 'Diesel' },
    trans: 'Allison 4700', tankSize: 1200, oilCapacity: 48, baseWeight: 15.5, maxGVW: 200, price: 235000,
    haul: ['lowboy', 'flatbed', 'tipper']
  },
  'kenworth_t680_2024': {
    id: 'kenworth_t680_2024', brand: 'Kenworth', name: 'T680 Next Gen 2024', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2550, fuelType: 'Diesel' },
    trans: 'PACCAR TX-12', tankSize: 1400, oilCapacity: 38, baseWeight: 9.0, maxGVW: 48, price: 168000,
    haul: ['box', 'reefer', 'curtain', 'carrier', 'container']
  },

  // ================= PETERBILT =================
  'peterbilt_389': {
    id: 'peterbilt_389', brand: 'Peterbilt', name: '389 Pride & Class Extended Hood', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15', cylinders: 6, displacement: 15.0, hp: 605, torque: 2780, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd Manual', tankSize: 1400, oilCapacity: 46, baseWeight: 10.2, maxGVW: 52, price: 168000,
    haul: ['flatbed', 'reefer', 'box', 'hazmat', 'lowboy']
  },
  'peterbilt_579': {
    id: 'peterbilt_579', brand: 'Peterbilt', name: '579 UltraLoft Epiq Aero', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'PACCAR 12 AMT', tankSize: 1250, oilCapacity: 40, baseWeight: 9.0, maxGVW: 48, price: 152000,
    haul: ['box', 'reefer', 'curtain', 'carrier']
  },
  'peterbilt_567': {
    id: 'peterbilt_567', brand: 'Peterbilt', name: '567 Heavy Haul Heritage', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'Eaton UltraShift', tankSize: 1200, oilCapacity: 42, baseWeight: 9.8, maxGVW: 50, price: 148000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },

  // --- NEW PETERBILT ADDITIONS ---
  'peterbilt_379': {
    id: 'peterbilt_379', brand: 'Peterbilt', name: '379 Legendary Classic', region: 'America', axle: '6x4',
    engine: { name: 'Caterpillar 3406E', cylinders: 6, displacement: 14.6, hp: 550, torque: 2500, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd', tankSize: 1400, oilCapacity: 42, baseWeight: 10.5, maxGVW: 55, price: 110000,
    haul: ['flatbed', 'lowboy', 'reefer', 'tanker']
  },
  'peterbilt_362': {
    id: 'peterbilt_362', brand: 'Peterbilt', name: '362 Cabover Classic', region: 'America', axle: '6x4',
    engine: { name: 'Cummins Big Cam III', cylinders: 6, displacement: 14.0, hp: 400, torque: 1850, fuelType: 'Diesel' },
    trans: '13-spd Manual', tankSize: 900, oilCapacity: 35, baseWeight: 8.5, maxGVW: 40, price: 52000,
    haul: ['curtain', 'box', 'flatbed']
  },
  'peterbilt_589': {
    id: 'peterbilt_589', brand: 'Peterbilt', name: '589 Heritage Edition', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd Manual', tankSize: 1500, oilCapacity: 40, baseWeight: 10.1, maxGVW: 52, price: 185000,
    haul: ['flatbed', 'lowboy', 'carrier', 'reefer']
  },
  'peterbilt_579_ev': {
    id: 'peterbilt_579_ev', brand: 'Peterbilt', name: '579EV Electric Tractor', region: 'America', axle: '6x4',
    engine: { name: 'Electric Motor', cylinders: 0, displacement: 1.0, hp: 536, torque: 2200, fuelType: 'Electric' },
    trans: 'Direct Drive', tankSize: 400, oilCapacity: 4, baseWeight: 12.8, maxGVW: 44, price: 248000,
    haul: ['box', 'reefer', 'container']
  },
  'peterbilt_359': {
    id: 'peterbilt_359', brand: 'Peterbilt', name: '359 Vintage Pride', region: 'America', axle: '6x4',
    engine: { name: 'Caterpillar 3408 V8', cylinders: 8, displacement: 18.0, hp: 450, torque: 2100, fuelType: 'Diesel' },
    trans: 'Fuller 15-spd', tankSize: 1200, oilCapacity: 48, baseWeight: 10.8, maxGVW: 50, price: 88000,
    haul: ['flatbed', 'tanker', 'lowboy']
  },
  'peterbilt_389_sleeper': {
    id: 'peterbilt_389_sleeper', brand: 'Peterbilt', name: '389 Platinum Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15', cylinders: 6, displacement: 15.0, hp: 605, torque: 2800, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd', tankSize: 1600, oilCapacity: 44, baseWeight: 10.6, maxGVW: 55, price: 182000,
    haul: ['reefer', 'flatbed', 'carrier', 'lowboy']
  },
  'peterbilt_579_2024': {
    id: 'peterbilt_579_2024', brand: 'Peterbilt', name: '579 UltraLoft 2024', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 12.9, displacement: 12.9, hp: 510, torque: 2550, fuelType: 'Diesel' },
    trans: 'PACCAR TX-12', tankSize: 1450, oilCapacity: 38, baseWeight: 9.2, maxGVW: 48, price: 165000,
    haul: ['box', 'reefer', 'curtain', 'carrier', 'container']
  },

  // ================= FREIGHTLINER =================
  'freightliner_cascadia': {
    id: 'freightliner_cascadia', brand: 'Freightliner', name: 'Cascadia 126 72" Raised Roof', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD15', cylinders: 6, displacement: 14.8, hp: 505, torque: 2370, fuelType: 'Diesel' },
    trans: 'DT12 AMT', tankSize: 1200, oilCapacity: 40, baseWeight: 9.0, maxGVW: 45, price: 135000,
    haul: ['box', 'reefer', 'curtain', 'carrier']
  },
  'freightliner_cascadia_dd16': {
    id: 'freightliner_cascadia_dd16', brand: 'Freightliner', name: 'Cascadia DD16 Heavy Interstate', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD16', cylinders: 6, displacement: 15.6, hp: 600, torque: 2780, fuelType: 'Diesel' },
    trans: 'DT12-OV Extreme', tankSize: 1400, oilCapacity: 44, baseWeight: 9.6, maxGVW: 52, price: 158000,
    haul: ['box', 'reefer', 'flatbed', 'tanker', 'carrier']
  },

  // --- NEW FREIGHTLINER ADDITIONS ---
  'fl_classic_xl': {
    id: 'fl_classic_xl', brand: 'Freightliner', name: 'Classic XL 132" Hood', region: 'America', axle: '6x4',
    engine: { name: 'Detroit 12.7L Series 60', cylinders: 6, displacement: 12.7, hp: 500, torque: 2100, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 18-spd Manual', tankSize: 1400, oilCapacity: 42, baseWeight: 10.2, maxGVW: 52, price: 98000,
    haul: ['flatbed', 'reefer', 'lowboy', 'tanker']
  },
  'fl_coronado': {
    id: 'fl_coronado', brand: 'Freightliner', name: 'Coronado 122 SD Chrome', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD15', cylinders: 6, displacement: 14.8, hp: 505, torque: 2300, fuelType: 'Diesel' },
    trans: 'Eaton Fuller 13-spd', tankSize: 1250, oilCapacity: 40, baseWeight: 10.0, maxGVW: 52, price: 124000,
    haul: ['flatbed', 'lowboy', 'tanker', 'tipper']
  },
  'fl_century': {
    id: 'fl_century', brand: 'Freightliner', name: 'Century Class S/T', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD13', cylinders: 6, displacement: 12.8, hp: 450, torque: 1850, fuelType: 'Diesel' },
    trans: 'Eaton UltraShift', tankSize: 1100, oilCapacity: 38, baseWeight: 9.2, maxGVW: 44, price: 52000,
    haul: ['box', 'reefer', 'curtain']
  },
  'fl_columbia': {
    id: 'fl_columbia', brand: 'Freightliner', name: 'Columbia 120 Aero', region: 'America', axle: '6x4',
    engine: { name: 'Detroit Series 60', cylinders: 6, displacement: 14.0, hp: 475, torque: 2100, fuelType: 'Diesel' },
    trans: 'Manual 10-spd', tankSize: 1000, oilCapacity: 40, baseWeight: 9.0, maxGVW: 44, price: 46000,
    haul: ['box', 'curtain', 'tanker']
  },
  'fl_ecascadia': {
    id: 'fl_ecascadia', brand: 'Freightliner', name: 'eCascadia Electric', region: 'America', axle: '6x4',
    engine: { name: 'Detroit ePowertrain', cylinders: 0, displacement: 1.0, hp: 470, torque: 3000, fuelType: 'Electric' },
    trans: 'Direct Drive eAxle', tankSize: 438, oilCapacity: 4, baseWeight: 12.5, maxGVW: 44, price: 238000,
    haul: ['box', 'reefer', 'container']
  },
  'fl_cascadia_day': {
    id: 'fl_cascadia_day', brand: 'Freightliner', name: 'Cascadia 116 Day Cab', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD13', cylinders: 6, displacement: 12.8, hp: 470, torque: 2100, fuelType: 'Diesel' },
    trans: 'DT12 AMT', tankSize: 600, oilCapacity: 38, baseWeight: 8.5, maxGVW: 44, price: 112000,
    haul: ['box', 'flatbed', 'curtain', 'carrier']
  },
  'fl_114sd': {
    id: 'fl_114sd', brand: 'Freightliner', name: '114SD Severe Duty Vocational', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD13', cylinders: 6, displacement: 12.8, hp: 505, torque: 2250, fuelType: 'Diesel' },
    trans: 'Allison 4500 RDS', tankSize: 400, oilCapacity: 42, baseWeight: 11.2, maxGVW: 40, price: 145000,
    haul: ['tipper', 'flatbed', 'lowboy']
  },
  'fl_fld120': {
    id: 'fl_fld120', brand: 'Freightliner', name: 'FLD 120 Heritage', region: 'America', axle: '6x4',
    engine: { name: 'Caterpillar 3406C', cylinders: 6, displacement: 14.6, hp: 425, torque: 1850, fuelType: 'Diesel' },
    trans: 'Eaton 13-spd', tankSize: 1100, oilCapacity: 45, baseWeight: 9.8, maxGVW: 44, price: 54000,
    haul: ['flatbed', 'curtain', 'reefer']
  },
  'freightliner_122sd': {
    id: 'freightliner_122sd', brand: 'Freightliner', name: '122SD Severe Duty Tractor', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD15', cylinders: 6, displacement: 14.8, hp: 505, torque: 2500, fuelType: 'Diesel' },
    trans: 'Allison 4700 RDS', tankSize: 1100, oilCapacity: 42, baseWeight: 10.4, maxGVW: 55, price: 146000,
    haul: ['tipper', 'lowboy', 'flatbed', 'tanker']
  },

  // ================= MACK =================
  'mack_anthem': {
    id: 'mack_anthem', brand: 'Mack', name: 'Anthem 64T 70" Stand-Up', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 505, torque: 2500, fuelType: 'Diesel' },
    trans: 'mDRIVE 12-spd', tankSize: 1100, oilCapacity: 36, baseWeight: 8.8, maxGVW: 42, price: 128000,
    haul: ['box', 'tipper', 'flatbed', 'carrier']
  },
  'mack_pinnacle': {
    id: 'mack_pinnacle', brand: 'Mack', name: 'Pinnacle 64T Classic Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8-TC', cylinders: 6, displacement: 13.0, hp: 505, torque: 2500, fuelType: 'Diesel' },
    trans: 'mDRIVE HD 13-spd', tankSize: 1200, oilCapacity: 38, baseWeight: 9.2, maxGVW: 46, price: 138000,
    haul: ['box', 'flatbed', 'tipper', 'tanker', 'carrier']
  },
  'mack_granite': {
    id: 'mack_granite', brand: 'Mack', name: 'Granite Severe Duty Heavy', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 505, torque: 2600, fuelType: 'Diesel' },
    trans: 'mDRIVE HD with Creep', tankSize: 800, oilCapacity: 38, baseWeight: 10.2, maxGVW: 54, price: 142000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },

  // --- NEW MACK ADDITIONS ---
  'mack_r_series': {
    id: 'mack_r_series', brand: 'Mack', name: 'R-Series Legendary Classic', region: 'America', axle: '6x4',
    engine: { name: 'Mack ENDT 676', cylinders: 6, displacement: 11.0, hp: 285, torque: 1100, fuelType: 'Diesel' },
    trans: 'Mack Maxitorque 10-spd', tankSize: 600, oilCapacity: 30, baseWeight: 8.5, maxGVW: 35, price: 38000,
    haul: ['flatbed', 'tipper', 'curtain']
  },
  'mack_superliner': {
    id: 'mack_superliner', brand: 'Mack', name: 'Super-Liner V8 Custom', region: 'America', axle: '6x4',
    engine: { name: 'Mack E9 V8', cylinders: 8, displacement: 16.4, hp: 500, torque: 2250, fuelType: 'Diesel' },
    trans: 'Mack 12-spd Manual', tankSize: 1200, oilCapacity: 45, baseWeight: 10.2, maxGVW: 55, price: 92000,
    haul: ['lowboy', 'flatbed', 'tipper', 'tanker']
  },
  'mack_chu613': {
    id: 'mack_chu613', brand: 'Mack', name: 'Pinnacle CHU613 Highway', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 445, torque: 1850, fuelType: 'Diesel' },
    trans: 'mDRIVE 12-spd', tankSize: 1000, oilCapacity: 36, baseWeight: 8.8, maxGVW: 44, price: 115000,
    haul: ['box', 'reefer', 'curtain']
  },
  'mack_pinnacle_day': {
    id: 'mack_pinnacle_day', brand: 'Mack', name: 'Pinnacle Day Cab', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 505, torque: 2100, fuelType: 'Diesel' },
    trans: 'mDRIVE 12-spd', tankSize: 600, oilCapacity: 36, baseWeight: 8.2, maxGVW: 46, price: 122000,
    haul: ['box', 'flatbed', 'curtain']
  },
  'mack_granite_8x4': {
    id: 'mack_granite_8x4', brand: 'Mack', name: 'Granite 8x4 Bridge Formula', region: 'America', axle: '8x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 505, torque: 2350, fuelType: 'Diesel' },
    trans: 'mDRIVE HD 14-spd', tankSize: 450, oilCapacity: 38, baseWeight: 14.2, maxGVW: 85, price: 158000,
    haul: ['tipper']
  },
  'mack_anthem_black': {
    id: 'mack_anthem_black', brand: 'Mack', name: 'Anthem 2024 Black Edition', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8-HE', cylinders: 6, displacement: 13.0, hp: 505, torque: 2500, fuelType: 'Diesel' },
    trans: 'mDRIVE 12-spd', tankSize: 1150, oilCapacity: 36, baseWeight: 8.9, maxGVW: 44, price: 172000,
    haul: ['box', 'reefer', 'carrier', 'container']
  },
  'mack_b_model': {
    id: 'mack_b_model', brand: 'Mack', name: 'B-Model 61T Antique', region: 'America', axle: '4x2',
    engine: { name: 'Mack Thermodyne', cylinders: 6, displacement: 11.0, hp: 210, torque: 800, fuelType: 'Diesel' },
    trans: 'Quadruplex 15-spd', tankSize: 400, oilCapacity: 28, baseWeight: 7.5, maxGVW: 24, price: 45000,
    haul: ['flatbed', 'curtain']
  }
};
