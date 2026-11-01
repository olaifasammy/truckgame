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
  rigid_box: 'Rigid Distribution Box',
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
  hazmat: '☣️',
  rigid_box: '📦'
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
  hazmat: 0, // Supplied by consignor at chemical terminal
  rigid_box: 10000
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
  'scania_g410': {
    id: 'scania_g410', brand: 'Scania', name: 'G410 Distribution Day Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 141', cylinders: 6, displacement: 13.0, hp: 410, torque: 2150, fuelType: 'Diesel' },
    trans: 'Opticruise 12-spd', tankSize: 700, oilCapacity: 36, baseWeight: 7.8, maxGVW: 40, price: 112000,
    haul: ['curtain', 'box', 'rigid_box', 'carrier']
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
  'scania_p250': {
    id: 'scania_p250', brand: 'Scania', name: 'P250 Urban Distribution', region: 'Europe', axle: '4x2',
    engine: { name: 'DC07 111', cylinders: 6, displacement: 6.7, hp: 250, torque: 1100, fuelType: 'Diesel' },
    trans: 'Opticruise 8-spd', tankSize: 400, oilCapacity: 22, baseWeight: 5.8, maxGVW: 19, price: 68000,
    haul: ['rigid_box']
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
  'scania_l320': {
    id: 'scania_l320', brand: 'Scania', name: 'L320 Low-Entry City', region: 'Europe', axle: '4x2',
    engine: { name: 'DC09 126', cylinders: 5, displacement: 9.3, hp: 320, torque: 1600, fuelType: 'Diesel' },
    trans: 'Opticruise 12-spd', tankSize: 300, oilCapacity: 28, baseWeight: 7.2, maxGVW: 26, price: 82000,
    haul: ['rigid_box', 'carrier']
  },
  'scania_25p_bev': {
    id: 'scania_25p_bev', brand: 'Scania', name: '25 P Electric Regional', region: 'Europe', axle: '4x2',
    engine: { name: 'Electric Motor', cylinders: 0, displacement: 1.0, hp: 310, torque: 2200, fuelType: 'Electric' },
    trans: '2-speed EV Gearbox', tankSize: 200, oilCapacity: 5, baseWeight: 11.5, maxGVW: 29, price: 210000,
    haul: ['box', 'curtain', 'container']
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
  'merc_sprinter': {
    id: 'merc_sprinter', brand: 'Mercedes-Benz', name: 'Sprinter 519 CDI Box', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 654', cylinders: 4, displacement: 2.0, hp: 190, torque: 450, fuelType: 'Diesel' },
    trans: '9G-TRONIC', tankSize: 93, oilCapacity: 11, baseWeight: 2.8, maxGVW: 5.5, price: 55000,
    haul: ['rigid_box']
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
  'merc_antos': {
    id: 'merc_antos', brand: 'Mercedes-Benz', name: 'Antos 2532 Regional', region: 'Europe', axle: '6x2',
    engine: { name: 'OM 936', cylinders: 6, displacement: 7.7, hp: 320, torque: 1300, fuelType: 'Diesel' },
    trans: 'PowerShift 3 12-spd', tankSize: 500, oilCapacity: 28, baseWeight: 9.2, maxGVW: 26, price: 89000,
    haul: ['rigid_box', 'box', 'curtain']
  },
  'merc_econic': {
    id: 'merc_econic', brand: 'Mercedes-Benz', name: 'Econic 2635 Urban Safety', region: 'Europe', axle: '6x2',
    engine: { name: 'OM 936', cylinders: 6, displacement: 7.7, hp: 350, torque: 1400, fuelType: 'Diesel' },
    trans: 'Allison 3000 Automatic', tankSize: 300, oilCapacity: 28, baseWeight: 9.5, maxGVW: 26, price: 92000,
    haul: ['rigid_box', 'carrier']
  },
  'merc_actros_edition3': {
    id: 'merc_actros_edition3', brand: 'Mercedes-Benz', name: 'Actros L Edition 3 Limited', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 473', cylinders: 6, displacement: 15.6, hp: 625, torque: 3000, fuelType: 'Diesel' },
    trans: 'PowerShift 3 Advanced', tankSize: 1200, oilCapacity: 42, baseWeight: 8.5, maxGVW: 44, price: 210000,
    haul: ['curtain', 'reefer', 'carrier', 'container']
  },
  'merc_atego': {
    id: 'merc_atego', brand: 'Mercedes-Benz', name: 'Atego 1224 Distribution', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 934', cylinders: 4, displacement: 5.1, hp: 240, torque: 900, fuelType: 'Diesel' },
    trans: 'PowerShift 3 6-spd', tankSize: 180, oilCapacity: 16, baseWeight: 5.2, maxGVW: 12, price: 58000,
    haul: ['rigid_box']
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
  'man_tgl': {
    id: 'man_tgl', brand: 'MAN', name: 'TGL 8.220 Distribution', region: 'Europe', axle: '4x2',
    engine: { name: 'D0834', cylinders: 4, displacement: 4.6, hp: 220, torque: 850, fuelType: 'Diesel' },
    trans: 'TipMatic 6', tankSize: 150, oilCapacity: 15, baseWeight: 4.8, maxGVW: 8.8, price: 62000,
    haul: ['rigid_box']
  },
  'man_tgm': {
    id: 'man_tgm', brand: 'MAN', name: 'TGM 18.290 Medium Rigid', region: 'Europe', axle: '4x2',
    engine: { name: 'D0836', cylinders: 6, displacement: 6.9, hp: 290, torque: 1150, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 300, oilCapacity: 24, baseWeight: 6.5, maxGVW: 18, price: 82000,
    haul: ['rigid_box', 'curtain']
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
  'man_tgs_regional': {
    id: 'man_tgs_regional', brand: 'MAN', name: 'TGS 18.400 Regional', region: 'Europe', axle: '4x2',
    engine: { name: 'D1556', cylinders: 6, displacement: 9.0, hp: 400, torque: 1800, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 600, oilCapacity: 30, baseWeight: 7.2, maxGVW: 40, price: 112000,
    haul: ['curtain', 'box', 'tanker']
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
  'daf_cf': {
    id: 'daf_cf', brand: 'DAF', name: 'CF 450 Space Cab Regional', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-11', cylinders: 6, displacement: 10.8, hp: 450, torque: 2300, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 600, oilCapacity: 30, baseWeight: 7.4, maxGVW: 38, price: 110000,
    haul: ['box', 'curtain', 'tanker', 'carrier']
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
  'daf_xd_450': {
    id: 'daf_xd_450', brand: 'DAF', name: 'XD 450 Regional Power', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-11', cylinders: 6, displacement: 10.8, hp: 450, torque: 2300, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 800, oilCapacity: 32, baseWeight: 7.5, maxGVW: 40, price: 122000,
    haul: ['curtain', 'box', 'container', 'tanker']
  },
  'daf_lf_210': {
    id: 'daf_lf_210', brand: 'DAF', name: 'LF 210 City Distribution', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR PX-5', cylinders: 4, displacement: 4.5, hp: 210, torque: 800, fuelType: 'Diesel' },
    trans: 'PowerLine 8-spd', tankSize: 180, oilCapacity: 14, baseWeight: 4.5, maxGVW: 12, price: 59000,
    haul: ['rigid_box']
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
  'daf_xb_electric': {
    id: 'daf_xb_electric', brand: 'DAF', name: 'XB Electric 19t', region: 'Europe', axle: '4x2',
    engine: { name: 'e-Motor 190', cylinders: 0, displacement: 1.0, hp: 260, torque: 1850, fuelType: 'Electric' },
    trans: 'e-Gearbox', tankSize: 210, oilCapacity: 4, baseWeight: 10.5, maxGVW: 19, price: 185000,
    haul: ['rigid_box', 'box']
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
  'kenworth_t480': {
    id: 'kenworth_t480', brand: 'Kenworth', name: 'T480 Medium Duty Rigid', region: 'America', axle: '4x2',
    engine: { name: 'PACCAR PX-7', cylinders: 6, displacement: 6.7, hp: 325, torque: 1100, fuelType: 'Diesel' },
    trans: 'PACCAR TX-8', tankSize: 300, oilCapacity: 20, baseWeight: 6.2, maxGVW: 15, price: 88000,
    haul: ['rigid_box']
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
  'peterbilt_520': {
    id: 'peterbilt_520', brand: 'Peterbilt', name: '520 Low-Entry Vocational', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-11', cylinders: 6, displacement: 10.8, hp: 430, torque: 2200, fuelType: 'Diesel' },
    trans: 'Allison 4500 RDS', tankSize: 400, oilCapacity: 30, baseWeight: 11.2, maxGVW: 35, price: 145000,
    haul: ['rigid_box', 'tipper']
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
  'peterbilt_220': {
    id: 'peterbilt_220', brand: 'Peterbilt', name: '220 Regional Distribution', region: 'America', axle: '4x2',
    engine: { name: 'PACCAR PX-7', cylinders: 6, displacement: 6.7, hp: 280, torque: 1000, fuelType: 'Diesel' },
    trans: 'Allison 2500', tankSize: 200, oilCapacity: 18, baseWeight: 5.5, maxGVW: 14, price: 79000,
    haul: ['rigid_box']
  },
  'peterbilt_359': {
    id: 'peterbilt_359', brand: 'Peterbilt', name: '359 Vintage Pride', region: 'America', axle: '6x4',
    engine: { name: 'Caterpillar 3408 V8', cylinders: 8, displacement: 18.0, hp: 450, torque: 2100, fuelType: 'Diesel' },
    trans: 'Fuller 15-spd', tankSize: 1200, oilCapacity: 48, baseWeight: 10.8, maxGVW: 50, price: 88000,
    haul: ['flatbed', 'tanker', 'lowboy']
  },
  'peterbilt_536': {
    id: 'peterbilt_536', brand: 'Peterbilt', name: '536 Medium Duty', region: 'America', axle: '4x2',
    engine: { name: 'PACCAR PX-7', cylinders: 6, displacement: 6.7, hp: 325, torque: 1100, fuelType: 'Diesel' },
    trans: 'PACCAR TX-8', tankSize: 250, oilCapacity: 20, baseWeight: 6.0, maxGVW: 16, price: 92000,
    haul: ['rigid_box', 'box']
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
  'fl_m2': {
    id: 'fl_m2', brand: 'Freightliner', name: 'Business Class M2 106', region: 'America', axle: '4x2',
    engine: { name: 'Cummins B6.7', cylinders: 6, displacement: 6.7, hp: 300, torque: 660, fuelType: 'Diesel' },
    trans: 'Allison 2500', tankSize: 150, oilCapacity: 18, baseWeight: 5.5, maxGVW: 14, price: 68000,
    haul: ['rigid_box']
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
  'fl_econicsd': {
    id: 'fl_econicsd', brand: 'Freightliner', name: 'EconicSD Waste Management', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD8', cylinders: 6, displacement: 7.7, hp: 350, torque: 1200, fuelType: 'Diesel' },
    trans: 'Allison 3000', tankSize: 300, oilCapacity: 28, baseWeight: 13.5, maxGVW: 32, price: 168000,
    haul: ['rigid_box']
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
  'mack_terrapro': {
    id: 'mack_terrapro', brand: 'Mack', name: 'TerraPro Low-Entry Cab', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP7', cylinders: 6, displacement: 11.0, hp: 405, torque: 1560, fuelType: 'Diesel' },
    trans: 'Allison 4500', tankSize: 400, oilCapacity: 30, baseWeight: 11.5, maxGVW: 35, price: 138000,
    haul: ['rigid_box', 'tipper']
  },
  'mack_md7': {
    id: 'mack_md7', brand: 'Mack', name: 'Mack MD7 Rigid', region: 'America', axle: '4x2',
    engine: { name: 'Cummins B6.7', cylinders: 6, displacement: 6.7, hp: 300, torque: 660, fuelType: 'Diesel' },
    trans: 'Allison 2500', tankSize: 180, oilCapacity: 18, baseWeight: 5.8, maxGVW: 15, price: 72000,
    haul: ['rigid_box']
  },
  'mack_lr_electric': {
    id: 'mack_lr_electric', brand: 'Mack', name: 'LR Electric Refuse', region: 'America', axle: '6x4',
    engine: { name: 'Integrated Electric', cylinders: 0, displacement: 1.0, hp: 448, torque: 4000, fuelType: 'Electric' },
    trans: '2-speed EV', tankSize: 376, oilCapacity: 5, baseWeight: 14.5, maxGVW: 32, price: 215000,
    haul: ['rigid_box']
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
  },

  // ================= HINO =================
  'hino_700': {
    id: 'hino_700', brand: 'Hino', name: '700 Series Profia Highline', region: 'Asia', axle: '6x4',
    engine: { name: 'E13C-VV', cylinders: 6, displacement: 12.9, hp: 480, torque: 2157, fuelType: 'Diesel' },
    trans: 'Pro Shift 16', tankSize: 600, oilCapacity: 32, baseWeight: 8.5, maxGVW: 40, price: 110000,
    haul: ['box', 'tipper', 'flatbed', 'carrier']
  },
  'hino_700_heavy': {
    id: 'hino_700_heavy', brand: 'Hino', name: '700 Series Heavy Dump', region: 'Asia', axle: '6x4',
    engine: { name: 'E13C-BK', cylinders: 6, displacement: 12.9, hp: 480, torque: 2200, fuelType: 'Diesel' },
    trans: 'Pro Shift 16 Heavy', tankSize: 550, oilCapacity: 34, baseWeight: 9.6, maxGVW: 48, price: 119000,
    haul: ['tipper', 'lowboy']
  },
  'hino_500': {
    id: 'hino_500', brand: 'Hino', name: '500 Series Wide Cab Logistics', region: 'Asia', axle: '4x2',
    engine: { name: 'A09C', cylinders: 6, displacement: 8.9, hp: 360, torque: 1570, fuelType: 'Diesel' },
    trans: '9-speed Manual', tankSize: 350, oilCapacity: 24, baseWeight: 5.8, maxGVW: 26, price: 78000,
    haul: ['rigid_box', 'box', 'curtain']
  },
  'hino_300': {
    id: 'hino_300', brand: 'Hino', name: '300 Series 917 Distribution', region: 'Asia', axle: '4x2',
    engine: { name: 'N04C', cylinders: 4, displacement: 4.0, hp: 165, torque: 464, fuelType: 'Diesel' },
    trans: '6-speed Manual', tankSize: 100, oilCapacity: 10, baseWeight: 3.0, maxGVW: 8.5, price: 48000,
    haul: ['rigid_box', 'tipper']
  },

  // --- NEW HINO ADDITIONS ---
  'hino_xl8': {
    id: 'hino_xl8', brand: 'Hino', name: 'XL8 Series Class 8', region: 'America', axle: '6x4',
    engine: { name: 'A09C', cylinders: 6, displacement: 8.9, hp: 360, torque: 1150, fuelType: 'Diesel' },
    trans: 'Allison 3000', tankSize: 600, oilCapacity: 24, baseWeight: 8.2, maxGVW: 26, price: 115000,
    haul: ['box', 'flatbed', 'curtain']
  },
  'hino_l6': {
    id: 'hino_l6', brand: 'Hino', name: 'L Series L6 Medium', region: 'America', axle: '4x2',
    engine: { name: 'Cummins B6.7', cylinders: 6, displacement: 6.7, hp: 260, torque: 660, fuelType: 'Diesel' },
    trans: 'Allison 2200', tankSize: 200, oilCapacity: 18, baseWeight: 5.5, maxGVW: 11, price: 74000,
    haul: ['rigid_box']
  },
  'hino_300_hybrid': {
    id: 'hino_300_hybrid', brand: 'Hino', name: '300 Series Hybrid City', region: 'Asia', axle: '4x2',
    engine: { name: 'Hybrid Diesel-Electric', cylinders: 4, displacement: 4.0, hp: 150, torque: 440, fuelType: 'Diesel' },
    trans: '6-speed AMT', tankSize: 100, oilCapacity: 10, baseWeight: 3.5, maxGVW: 7.5, price: 68000,
    haul: ['rigid_box']
  },
  'hino_500_wide': {
    id: 'hino_500_wide', brand: 'Hino', name: '500 Series Wide Cab 6x4', region: 'Asia', axle: '6x4',
    engine: { name: 'A09C-VH', cylinders: 6, displacement: 8.9, hp: 350, torque: 1422, fuelType: 'Diesel' },
    trans: '9-speed Manual', tankSize: 400, oilCapacity: 24, baseWeight: 7.8, maxGVW: 28, price: 92000,
    haul: ['box', 'flatbed', 'tipper']
  },
  'hino_profia_fw': {
    id: 'hino_profia_fw', brand: 'Hino', name: 'Profia FW 8x4 Heavy Rigid', region: 'Asia', axle: '8x4',
    engine: { name: 'E13C-BK', cylinders: 6, displacement: 12.9, hp: 380, torque: 1900, fuelType: 'Diesel' },
    trans: 'Pro Shift 12', tankSize: 400, oilCapacity: 34, baseWeight: 11.5, maxGVW: 25, price: 125000,
    haul: ['rigid_box']
  },
  'hino_dutro': {
    id: 'hino_dutro', brand: 'Hino', name: 'Dutro Urban Express', region: 'Asia', axle: '4x2',
    engine: { name: 'N04C-VT', cylinders: 4, displacement: 4.0, hp: 150, torque: 420, fuelType: 'Diesel' },
    trans: '5-speed Manual', tankSize: 80, oilCapacity: 10, baseWeight: 2.8, maxGVW: 5.5, price: 42000,
    haul: ['rigid_box']
  },
  'hino_700_heavy_tipper': {
    id: 'hino_700_heavy_tipper', brand: 'Hino', name: '700 Heavy Mining 8x4', region: 'Asia', axle: '8x4',
    engine: { name: 'E13C-VV', cylinders: 6, displacement: 12.9, hp: 480, torque: 2157, fuelType: 'Diesel' },
    trans: 'Pro Shift 16 Heavy', tankSize: 400, oilCapacity: 36, baseWeight: 15.2, maxGVW: 80, price: 148000,
    haul: ['tipper']
  },
  'hino_zev': {
    id: 'hino_zev', brand: 'Hino', name: 'ZEV Electric Distribution', region: 'America', axle: '4x2',
    engine: { name: 'SEA-Drive 120', cylinders: 0, displacement: 1.0, hp: 250, torque: 1800, fuelType: 'Electric' },
    trans: 'Direct Drive', tankSize: 200, oilCapacity: 4, baseWeight: 6.5, maxGVW: 15, price: 165000,
    haul: ['rigid_box']
  },
  'hino_ranger': {
    id: 'hino_ranger', brand: 'Hino', name: 'Ranger Classic Medium', region: 'Asia', axle: '4x2',
    engine: { name: 'J08E', cylinders: 6, displacement: 7.7, hp: 280, torque: 850, fuelType: 'Diesel' },
    trans: '6-speed Manual', tankSize: 200, oilCapacity: 18, baseWeight: 5.2, maxGVW: 14, price: 55000,
    haul: ['rigid_box', 'curtain']
  },
  'hino_500_fg': {
    id: 'hino_500_fg', brand: 'Hino', name: '500 Series FG Regional', region: 'Asia', axle: '4x2',
    engine: { name: 'J08E-WD', cylinders: 6, displacement: 7.7, hp: 280, torque: 883, fuelType: 'Diesel' },
    trans: '6-speed Manual', tankSize: 200, oilCapacity: 18, baseWeight: 5.5, maxGVW: 16, price: 72000,
    haul: ['rigid_box', 'box']
  },

  // ================= ISUZU =================
  'isuzu_giga': {
    id: 'isuzu_giga', brand: 'Isuzu', name: 'Giga EXZ Prime Mover', region: 'Asia', axle: '6x4',
    engine: { name: '6WG1-TCS', cylinders: 6, displacement: 15.7, hp: 510, torque: 2255, fuelType: 'Diesel' },
    trans: 'MJX16 AMT', tankSize: 600, oilCapacity: 35, baseWeight: 9.0, maxGVW: 45, price: 115000,
    haul: ['box', 'tipper', 'tanker', 'carrier']
  },
  'isuzu_giga_520': {
    id: 'isuzu_giga_520', brand: 'Isuzu', name: 'Giga 520 High-Roof Heavy', region: 'Asia', axle: '6x4',
    engine: { name: '6WG1-TCC', cylinders: 6, displacement: 15.7, hp: 520, torque: 2350, fuelType: 'Diesel' },
    trans: 'Smoother-Gx 16', tankSize: 700, oilCapacity: 38, baseWeight: 9.3, maxGVW: 50, price: 126000,
    haul: ['box', 'tipper', 'tanker', 'flatbed', 'lowboy', 'carrier']
  },
  'isuzu_forward': {
    id: 'isuzu_forward', brand: 'Isuzu', name: 'Forward FTR Regional Freight', region: 'Asia', axle: '4x2',
    engine: { name: '6HK1', cylinders: 6, displacement: 7.8, hp: 260, torque: 760, fuelType: 'Diesel' },
    trans: '6-speed Manual', tankSize: 200, oilCapacity: 18, baseWeight: 4.8, maxGVW: 16, price: 64000,
    haul: ['rigid_box', 'box']
  },

  // --- NEW ISUZU ADDITIONS ---
  'isuzu_ftr': {
    id: 'isuzu_ftr', brand: 'Isuzu', name: 'FTR Class 6 Regional', region: 'America', axle: '4x2',
    engine: { name: 'Isuzu 5.2L 4HK1-TC', cylinders: 4, displacement: 5.2, hp: 215, torque: 520, fuelType: 'Diesel' },
    trans: 'Allison 2550 RDS', tankSize: 150, oilCapacity: 15, baseWeight: 5.2, maxGVW: 12, price: 68000,
    haul: ['rigid_box']
  },
  'isuzu_npr': {
    id: 'isuzu_npr', brand: 'Isuzu', name: 'NPR-HD Box Truck', region: 'America', axle: '4x2',
    engine: { name: 'Isuzu 4HK1-TC', cylinders: 4, displacement: 5.2, hp: 215, torque: 452, fuelType: 'Diesel' },
    trans: '6-speed Automatic', tankSize: 110, oilCapacity: 12, baseWeight: 3.5, maxGVW: 6.5, price: 49000,
    haul: ['rigid_box']
  },
  'isuzu_giga_tipper': {
    id: 'isuzu_giga_tipper', brand: 'Isuzu', name: 'Giga 8x4 Heavy Tipper', region: 'Asia', axle: '8x4',
    engine: { name: '6WG1-TCC', cylinders: 6, displacement: 15.7, hp: 520, torque: 2300, fuelType: 'Diesel' },
    trans: 'MJX12 Manual', tankSize: 400, oilCapacity: 35, baseWeight: 14.5, maxGVW: 80, price: 135000,
    haul: ['tipper']
  },
  'isuzu_giga_v8': {
    id: 'isuzu_giga_v8', brand: 'Isuzu', name: 'Giga Max V8 Classic', region: 'Asia', axle: '6x4',
    engine: { name: '8TD1 V8', cylinders: 8, displacement: 24.3, hp: 480, torque: 2000, fuelType: 'Diesel' },
    trans: 'Manual 12-spd', tankSize: 600, oilCapacity: 55, baseWeight: 9.8, maxGVW: 40, price: 58000,
    haul: ['curtain', 'flatbed', 'tanker']
  },
  'isuzu_nrr_ev': {
    id: 'isuzu_nrr_ev', brand: 'Isuzu', name: 'NRR-EV Electric Truck', region: 'America', axle: '4x2',
    engine: { name: 'Electric Integrated', cylinders: 0, displacement: 1.0, hp: 201, torque: 1500, fuelType: 'Electric' },
    trans: 'Direct Drive', tankSize: 195, oilCapacity: 4, baseWeight: 6.0, maxGVW: 9.0, price: 155000,
    haul: ['rigid_box']
  },
  'isuzu_c_series': {
    id: 'isuzu_c_series', brand: 'Isuzu', name: 'C-Series Heavy Duty', region: 'Asia', axle: '6x4',
    engine: { name: '6UZ1-TCC', cylinders: 6, displacement: 9.8, hp: 380, torque: 1765, fuelType: 'Diesel' },
    trans: 'MJX12 AMT', tankSize: 500, oilCapacity: 28, baseWeight: 8.5, maxGVW: 35, price: 108000,
    haul: ['box', 'flatbed', 'curtain']
  },
  'isuzu_elf': {
    id: 'isuzu_elf', brand: 'Isuzu', name: 'Elf Urban Specialist', region: 'Asia', axle: '4x2',
    engine: { name: '4JZ1-TCS', cylinders: 4, displacement: 3.0, hp: 150, torque: 375, fuelType: 'Diesel' },
    trans: 'Smoother-Ex 6-spd', tankSize: 100, oilCapacity: 10, baseWeight: 2.8, maxGVW: 5.5, price: 44000,
    haul: ['rigid_box']
  },
  'isuzu_810': {
    id: 'isuzu_810', brand: 'Isuzu', name: '810 Super Classic', region: 'Asia', axle: '6x4',
    engine: { name: '10PC1 V10', cylinders: 10, displacement: 15.0, hp: 350, torque: 1400, fuelType: 'Diesel' },
    trans: 'Manual 10-spd', tankSize: 400, oilCapacity: 40, baseWeight: 9.0, maxGVW: 30, price: 35000,
    haul: ['flatbed', 'tipper']
  },
  'isuzu_f_series': {
    id: 'isuzu_f_series', brand: 'Isuzu', name: 'F-Series 6x4 Distribution', region: 'Asia', axle: '6x4',
    engine: { name: '6HK1-TCS', cylinders: 6, displacement: 7.8, hp: 300, torque: 980, fuelType: 'Diesel' },
    trans: 'Manual 9-spd', tankSize: 400, oilCapacity: 18, baseWeight: 7.2, maxGVW: 24, price: 82000,
    haul: ['box', 'curtain', 'rigid_box']
  },
  'isuzu_giga_2024': {
    id: 'isuzu_giga_2024', brand: 'Isuzu', name: 'Giga 2024 High-Roof', region: 'Asia', axle: '6x4',
    engine: { name: '6WG1-TCS', cylinders: 6, displacement: 15.7, hp: 520, torque: 2350, fuelType: 'Diesel' },
    trans: 'Smoother-Gx 16', tankSize: 800, oilCapacity: 38, baseWeight: 9.1, maxGVW: 50, price: 142000,
    haul: ['box', 'reefer', 'curtain', 'carrier', 'container']
  },

  // ================= IVECO =================
  'iveco_sway': {
    id: 'iveco_sway', brand: 'Iveco', name: 'S-WAY 570 Aero Space', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 13', cylinders: 6, displacement: 12.9, hp: 570, torque: 2500, fuelType: 'Diesel' },
    trans: 'HI-TRONIX 12', tankSize: 900, oilCapacity: 36, baseWeight: 8.1, maxGVW: 44, price: 132000,
    haul: ['curtain', 'reefer', 'box', 'tanker', 'carrier']
  },
  'iveco_daily': {
    id: 'iveco_daily', brand: 'Iveco', name: 'Daily 70C21 City Freight', region: 'Europe', axle: '4x2',
    engine: { name: 'FIC 3.0L', cylinders: 4, displacement: 3.0, hp: 210, torque: 470, fuelType: 'Diesel' },
    trans: 'Hi-Matic 8', tankSize: 100, oilCapacity: 12, baseWeight: 3.2, maxGVW: 7.2, price: 58000,
    haul: ['rigid_box', 'tipper']
  },

  // --- NEW IVECO ADDITIONS ---
  'iveco_eurostar': {
    id: 'iveco_eurostar', brand: 'Iveco', name: 'EuroStar 520 Classic', region: 'Europe', axle: '4x2',
    engine: { name: 'Iveco 8210', cylinders: 6, displacement: 13.8, hp: 520, torque: 2200, fuelType: 'Diesel' },
    trans: 'ZF 16-spd Manual', tankSize: 700, oilCapacity: 35, baseWeight: 8.5, maxGVW: 40, price: 42000,
    haul: ['curtain', 'flatbed']
  },
  'iveco_stralis': {
    id: 'iveco_stralis', brand: 'Iveco', name: 'Stralis Hi-Way 480', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 11', cylinders: 6, displacement: 11.1, hp: 480, torque: 2250, fuelType: 'Diesel' },
    trans: 'Eurotronic 12-spd', tankSize: 850, oilCapacity: 32, baseWeight: 7.8, maxGVW: 44, price: 82000,
    haul: ['curtain', 'box', 'reefer']
  },
  'iveco_trakker': {
    id: 'iveco_trakker', brand: 'Iveco', name: 'Trakker 450 8x4 Heavy', region: 'Europe', axle: '8x4',
    engine: { name: 'Cursor 13', cylinders: 6, displacement: 12.9, hp: 450, torque: 2200, fuelType: 'Diesel' },
    trans: 'Eurotronic Offroad', tankSize: 400, oilCapacity: 38, baseWeight: 15.0, maxGVW: 80, price: 138000,
    haul: ['tipper', 'lowboy']
  },
  'iveco_eway': {
    id: 'iveco_eway', brand: 'Iveco', name: 'e-Way Electric Tractor', region: 'Europe', axle: '4x2',
    engine: { name: 'Electric Motor', cylinders: 0, displacement: 1.0, hp: 400, torque: 2100, fuelType: 'Electric' },
    trans: 'Single Speed', tankSize: 350, oilCapacity: 4, baseWeight: 11.0, maxGVW: 40, price: 195000,
    haul: ['box', 'curtain', 'container']
  },
  'iveco_eurocargo': {
    id: 'iveco_eurocargo', brand: 'Iveco', name: 'Eurocargo 120-250', region: 'Europe', axle: '4x2',
    engine: { name: 'Tector 7', cylinders: 6, displacement: 6.7, hp: 250, torque: 850, fuelType: 'Diesel' },
    trans: 'ZF 9-spd Manual', tankSize: 200, oilCapacity: 20, baseWeight: 5.5, maxGVW: 12, price: 65000,
    haul: ['rigid_box']
  },
  'iveco_sway_2024': {
    id: 'iveco_sway_2024', brand: 'Iveco', name: 'S-WAY 2024 Fuel Hero', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 13 eXCursor', cylinders: 6, displacement: 12.9, hp: 580, torque: 2800, fuelType: 'Diesel' },
    trans: 'HI-TRONIX 12 Pro', tankSize: 1200, oilCapacity: 34, baseWeight: 7.9, maxGVW: 44, price: 148000,
    haul: ['curtain', 'reefer', 'box', 'carrier', 'container']
  },
  'iveco_turbostar': {
    id: 'iveco_turbostar', brand: 'Iveco', name: 'TurboStar 190.48 V8', region: 'Europe', axle: '4x2',
    engine: { name: 'Iveco V8 Turbo', cylinders: 8, displacement: 17.2, hp: 480, torque: 1900, fuelType: 'Diesel' },
    trans: 'Fuller 13-spd', tankSize: 600, oilCapacity: 48, baseWeight: 9.2, maxGVW: 38, price: 55000,
    haul: ['curtain', 'flatbed', 'tanker']
  },
  'iveco_magirus': {
    id: 'iveco_magirus', brand: 'Iveco', name: 'Magirus 330-30 Vocational', region: 'Europe', axle: '6x4',
    engine: { name: 'Deutz Air-Cooled V8', cylinders: 8, displacement: 12.8, hp: 300, torque: 1100, fuelType: 'Diesel' },
    trans: 'Manual 9-spd', tankSize: 400, oilCapacity: 30, baseWeight: 10.8, maxGVW: 33, price: 48000,
    haul: ['tipper', 'flatbed']
  },
  'iveco_eurotech': {
    id: 'iveco_eurotech', brand: 'Iveco', name: 'EuroTech 440 Regional', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 8', cylinders: 6, displacement: 7.8, hp: 350, torque: 1280, fuelType: 'Diesel' },
    trans: 'Eurotronic 12', tankSize: 500, oilCapacity: 25, baseWeight: 7.2, maxGVW: 40, price: 59000,
    haul: ['curtain', 'box', 'tanker']
  },
  'iveco_stralis_xp': {
    id: 'iveco_stralis_xp', brand: 'Iveco', name: 'Stralis XP TCO2 Champion', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 11', cylinders: 6, displacement: 11.1, hp: 460, torque: 2300, fuelType: 'Diesel' },
    trans: 'HI-TRONIX 12', tankSize: 1000, oilCapacity: 32, baseWeight: 7.6, maxGVW: 44, price: 98000,
    haul: ['curtain', 'box', 'container']
  },

  // ================= OTHER HEAVY & ASIA =================
  'howo_t7h': {
    id: 'howo_t7h', brand: 'SINOTRUK', name: 'HOWO T7H 440 Highline', region: 'Asia', axle: '6x4',
    engine: { name: 'MC11.44', cylinders: 6, displacement: 10.5, hp: 440, torque: 2100, fuelType: 'Diesel' },
    trans: 'HW19712', tankSize: 600, oilCapacity: 30, baseWeight: 9.2, maxGVW: 40, price: 85000,
    haul: ['tipper', 'flatbed', 'box', 'carrier']
  },
  'faw_j6p': {
    id: 'faw_j6p', brand: 'FAW', name: 'J6P 420 Heavy Tractor', region: 'Asia', axle: '6x4',
    engine: { name: 'CA6DM2', cylinders: 6, displacement: 11.0, hp: 420, torque: 1900, fuelType: 'Diesel' },
    trans: 'CA12TAX', tankSize: 500, oilCapacity: 28, baseWeight: 8.8, maxGVW: 38, price: 78000,
    haul: ['tipper', 'flatbed', 'curtain', 'carrier']
  },
  'ford_f650': {
    id: 'ford_f650', brand: 'Ford', name: 'F-650 Super Duty V8', region: 'America', axle: '4x2',
    engine: { name: '7.3L V8 Godzilla', cylinders: 8, displacement: 7.3, hp: 350, torque: 635, fuelType: 'Diesel' },
    trans: 'TorqShift 6-spd', tankSize: 180, oilCapacity: 15, baseWeight: 5.5, maxGVW: 12.0, price: 72000,
    haul: ['rigid_box', 'tipper', 'flatbed']
  },

  // --- NEW OTHER MANUFACTURER ADDITIONS ---
  'renault_t_high': {
    id: 'renault_t_high', brand: 'Renault', name: 'T-High 520 Evolution', region: 'Europe', axle: '4x2',
    engine: { name: 'DE13', cylinders: 6, displacement: 12.8, hp: 520, torque: 2550, fuelType: 'Diesel' },
    trans: 'Optidriver 12', tankSize: 1100, oilCapacity: 36, baseWeight: 8.0, maxGVW: 44, price: 132000,
    haul: ['curtain', 'reefer', 'box', 'container']
  },
  'renault_premium': {
    id: 'renault_premium', brand: 'Renault', name: 'Premium 460 DXi', region: 'Europe', axle: '4x2',
    engine: { name: 'DXi 11', cylinders: 6, displacement: 10.8, hp: 460, torque: 2200, fuelType: 'Diesel' },
    trans: 'Optidriver', tankSize: 800, oilCapacity: 30, baseWeight: 7.2, maxGVW: 40, price: 55000,
    haul: ['curtain', 'box', 'tanker']
  },
  'fuso_super_great': {
    id: 'fuso_super_great', brand: 'Mitsubishi Fuso', name: 'Super Great Flagship', region: 'Asia', axle: '6x4',
    engine: { name: '6R20', cylinders: 6, displacement: 10.7, hp: 460, torque: 2500, fuelType: 'Diesel' },
    trans: 'ShiftPilot 12', tankSize: 600, oilCapacity: 32, baseWeight: 9.0, maxGVW: 45, price: 128000,
    haul: ['box', 'flatbed', 'curtain', 'carrier']
  },
  'ford_fmax': {
    id: 'ford_fmax', brand: 'Ford', name: 'F-MAX 500 Global', region: 'Europe', axle: '4x2',
    engine: { name: 'Ecotorq', cylinders: 6, displacement: 12.7, hp: 500, torque: 2500, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 1050, oilCapacity: 38, baseWeight: 7.9, maxGVW: 44, price: 118000,
    haul: ['curtain', 'reefer', 'box', 'carrier']
  },
  'howo_t5g': {
    id: 'howo_t5g', brand: 'SINOTRUK', name: 'HOWO T5G Regional', region: 'Asia', axle: '4x2',
    engine: { name: 'MC07', cylinders: 6, displacement: 6.9, hp: 340, torque: 1250, fuelType: 'Diesel' },
    trans: 'HW13710', tankSize: 300, oilCapacity: 22, baseWeight: 6.8, maxGVW: 18, price: 62000,
    haul: ['rigid_box', 'curtain']
  },
  'faw_j7': {
    id: 'faw_j7', brand: 'FAW', name: 'J7 Eagle Flagship', region: 'Asia', axle: '6x4',
    engine: { name: 'CA6DM3', cylinders: 6, displacement: 13.0, hp: 560, torque: 2600, fuelType: 'Diesel' },
    trans: 'ZF 12-spd AMT', tankSize: 1000, oilCapacity: 36, baseWeight: 9.2, maxGVW: 44, price: 135000,
    haul: ['curtain', 'reefer', 'container', 'lowboy']
  },
  'fuso_ecanter': {
    id: 'fuso_ecanter', brand: 'Mitsubishi Fuso', name: 'eCanter Electric 9t', region: 'Asia', axle: '4x2',
    engine: { name: 'Electric eAxle', cylinders: 0, displacement: 1.0, hp: 175, torque: 1200, fuelType: 'Electric' },
    trans: 'Single Speed', tankSize: 124, oilCapacity: 3, baseWeight: 5.5, maxGVW: 9.0, price: 125000,
    haul: ['rigid_box']
  },
  'ford_ltl9000': {
    id: 'ford_ltl9000', brand: 'Ford', name: 'LTL-9000 Classic Hood', region: 'America', axle: '6x4',
    engine: { name: 'Cummins N14', cylinders: 6, displacement: 14.0, hp: 435, torque: 1850, fuelType: 'Diesel' },
    trans: 'Eaton 13-spd Manual', tankSize: 1200, oilCapacity: 42, baseWeight: 10.5, maxGVW: 50, price: 48000,
    haul: ['flatbed', 'tanker', 'tipper']
  },
  'howo_v7': {
    id: 'howo_v7', brand: 'SINOTRUK', name: 'HOWO V7 Performance', region: 'Asia', axle: '6x4',
    engine: { name: 'MC13', cylinders: 6, displacement: 12.4, hp: 540, torque: 2500, fuelType: 'Diesel' },
    trans: 'HW25716XST', tankSize: 800, oilCapacity: 38, baseWeight: 9.0, maxGVW: 44, price: 92000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },
  'faw_j6p_tipper': {
    id: 'faw_j6p_tipper', brand: 'FAW', name: 'J6P 8x4 Heavy Tipper', region: 'Asia', axle: '8x4',
    engine: { name: 'CA6DM2', cylinders: 6, displacement: 11.0, hp: 420, torque: 1900, fuelType: 'Diesel' },
    trans: 'Manual 12-spd', tankSize: 400, oilCapacity: 32, baseWeight: 14.8, maxGVW: 80, price: 118000,
    haul: ['tipper']
  },
  'fuso_canter': {
    id: 'fuso_canter', brand: 'Mitsubishi Fuso', name: 'Canter FE85 City Express', region: 'Asia', axle: '4x2',
    engine: { name: '4P10', cylinders: 4, displacement: 3.0, hp: 175, torque: 430, fuelType: 'Diesel' },
    trans: 'DUONIC 6-spd', tankSize: 100, oilCapacity: 10, baseWeight: 3.1, maxGVW: 8.5, price: 49500,
    haul: ['rigid_box', 'tipper']
  }
};

export const MODELS = TRUCK_MODELS;
