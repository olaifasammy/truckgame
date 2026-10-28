import { TrailerType, TruckModel } from './trucks.types';

export const TRAILERS: Record<TrailerType, string> = {
  box: 'Box trailer',
  tipper: 'Tipper',
  carrier: 'Car carrier',
  hazmat: 'Hazmat tanker',
  curtain: 'Curtainside',
  reefer: 'Refrigerated',
  flatbed: 'Flatbed',
  tanker: 'Liquid tanker',
  lowboy: 'Lowboy trailer',
  rigid_box: 'Rigid Box (Short Haul)'
};

export const TRAILER_PRICES: Record<TrailerType, number> = {
  box: 14000,
  tipper: 18000,
  carrier: 20000,
  hazmat: 35000,
  curtain: 15000,
  reefer: 24000,
  flatbed: 12000,
  tanker: 22000,
  lowboy: 30000,
  rigid_box: 10000
};

export const TRUCK_MODELS: Record<string, TruckModel> = {
  // ================= SCANIA =================
  'scania_s730': {
    id: 'scania_s730', brand: 'Scania', name: 'S730 V8 Highline', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 107', cylinders: 8, displacement: 16.4, hp: 730, torque: 3500, fuelType: 'Diesel' },
    trans: 'Opticruise 12+2', tankSize: 1200, oilCapacity: 45, baseWeight: 9.5, maxGVW: 60, price: 185000,
    haul: ['curtain', 'reefer', 'lowboy', 'tanker', 'hazmat', 'flatbed']
  },
  'scania_770s': {
    id: 'scania_770s', brand: 'Scania', name: '770S V8 King of the Road', region: 'Europe', axle: '6x4',
    engine: { name: 'DC16 123', cylinders: 8, displacement: 16.4, hp: 770, torque: 3700, fuelType: 'Diesel' },
    trans: 'Opticruise GRSO935R', tankSize: 1300, oilCapacity: 48, baseWeight: 9.8, maxGVW: 65, price: 198000,
    haul: ['curtain', 'reefer', 'lowboy', 'tanker', 'hazmat', 'flatbed']
  },
  'scania_r500': {
    id: 'scania_r500', brand: 'Scania', name: 'R500 Super Highline', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 166', cylinders: 6, displacement: 13.0, hp: 500, torque: 2650, fuelType: 'Diesel' },
    trans: 'Opticruise G33CH', tankSize: 1000, oilCapacity: 40, baseWeight: 8.2, maxGVW: 44, price: 134000,
    haul: ['curtain', 'reefer', 'box', 'tanker']
  },
  'scania_r500_8x4': {
    id: 'scania_r500_8x4', brand: 'Scania', name: 'R500 XT Heavy Tipper', region: 'Europe', axle: '8x4',
    engine: { name: 'DC13 155', cylinders: 6, displacement: 13.0, hp: 500, torque: 2550, fuelType: 'Diesel' },
    trans: 'Opticruise with Crawler', tankSize: 400, oilCapacity: 35, baseWeight: 15.0, maxGVW: 80, price: 168000,
    haul: ['tipper', 'lowboy']
  },
  'scania_g410': {
    id: 'scania_g410', brand: 'Scania', name: 'G410 Distribution Day Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'DC13 141', cylinders: 6, displacement: 13.0, hp: 410, torque: 2150, fuelType: 'Diesel' },
    trans: 'Opticruise 12-spd', tankSize: 700, oilCapacity: 36, baseWeight: 7.8, maxGVW: 40, price: 112000,
    haul: ['curtain', 'box', 'rigid_box']
  },

  // ================= VOLVO =================
  'volvo_fh16': {
    id: 'volvo_fh16', brand: 'Volvo', name: 'FH16 750 Globetrotter XXL', region: 'Europe', axle: '6x4',
    engine: { name: 'D16K750', cylinders: 6, displacement: 16.1, hp: 750, torque: 3550, fuelType: 'Diesel' },
    trans: 'I-Shift Dual Clutch', tankSize: 1100, oilCapacity: 44, baseWeight: 9.8, maxGVW: 65, price: 195000,
    haul: ['curtain', 'reefer', 'lowboy', 'flatbed', 'hazmat', 'tanker']
  },
  'volvo_fh540': {
    id: 'volvo_fh540', brand: 'Volvo', name: 'FH 540 Globetrotter XL', region: 'Europe', axle: '4x2',
    engine: { name: 'D13K540', cylinders: 6, displacement: 12.8, hp: 540, torque: 2600, fuelType: 'Diesel' },
    trans: 'I-Shift 12-spd', tankSize: 950, oilCapacity: 38, baseWeight: 8.3, maxGVW: 44, price: 142000,
    haul: ['curtain', 'reefer', 'box', 'tanker']
  },
  'volvo_vnl860': {
    id: 'volvo_vnl860', brand: 'Volvo', name: 'VNL 860 Premium Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'D13TC Turbo Compound', cylinders: 6, displacement: 12.8, hp: 500, torque: 2500, fuelType: 'Diesel' },
    trans: 'I-Shift Automated', tankSize: 1300, oilCapacity: 40, baseWeight: 9.6, maxGVW: 55, price: 162000,
    haul: ['box', 'reefer', 'curtain', 'flatbed']
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
    haul: ['curtain', 'reefer', 'box', 'tanker']
  },
  'merc_actros_1853': {
    id: 'merc_actros_1853', brand: 'Mercedes-Benz', name: 'Actros 1853 StreamSpace', region: 'Europe', axle: '4x2',
    engine: { name: 'OM 471', cylinders: 6, displacement: 12.8, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'PowerShift 3 G281', tankSize: 850, oilCapacity: 38, baseWeight: 8.1, maxGVW: 42, price: 136000,
    haul: ['curtain', 'reefer', 'box']
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

  // ================= MAN =================
  'man_tgx': {
    id: 'man_tgx', brand: 'MAN', name: 'TGX 18.640 Individual Lion S', region: 'Europe', axle: '4x2',
    engine: { name: 'D3876', cylinders: 6, displacement: 15.2, hp: 640, torque: 3000, fuelType: 'Diesel' },
    trans: 'TipMatic 12', tankSize: 800, oilCapacity: 40, baseWeight: 8.5, maxGVW: 44, price: 145000,
    haul: ['curtain', 'box', 'reefer', 'tanker']
  },
  'man_tgx_510': {
    id: 'man_tgx_510', brand: 'MAN', name: 'TGX 18.510 GX Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 510, torque: 2600, fuelType: 'Diesel' },
    trans: 'TipMatic Pro', tankSize: 760, oilCapacity: 36, baseWeight: 8.0, maxGVW: 40, price: 132000,
    haul: ['curtain', 'box', 'reefer']
  },
  'man_tgs': {
    id: 'man_tgs', brand: 'MAN', name: 'TGS 33.480 Heavy Hauler', region: 'Europe', axle: '6x4',
    engine: { name: 'D2676', cylinders: 6, displacement: 12.4, hp: 480, torque: 2450, fuelType: 'Diesel' },
    trans: 'TipMatic Offroad', tankSize: 550, oilCapacity: 35, baseWeight: 9.8, maxGVW: 50, price: 138000,
    haul: ['tipper', 'lowboy', 'flatbed', 'tanker']
  },

  // ================= DAF =================
  'daf_xf': {
    id: 'daf_xf', brand: 'DAF', name: 'XF 530 FT Super Space Cab', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2600, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 850, oilCapacity: 34, baseWeight: 8.0, maxGVW: 40, price: 125000,
    haul: ['curtain', 'box', 'reefer']
  },
  'daf_xg_plus': {
    id: 'daf_xg_plus', brand: 'DAF', name: 'XG+ 530 Executive Flagship', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 530, torque: 2700, fuelType: 'Diesel' },
    trans: 'TraXon 12 Automated', tankSize: 950, oilCapacity: 36, baseWeight: 8.3, maxGVW: 44, price: 146000,
    haul: ['curtain', 'box', 'reefer', 'tanker']
  },
  'daf_cf': {
    id: 'daf_cf', brand: 'DAF', name: 'CF 450 Space Cab Regional', region: 'Europe', axle: '4x2',
    engine: { name: 'PACCAR MX-11', cylinders: 6, displacement: 10.8, hp: 450, torque: 2300, fuelType: 'Diesel' },
    trans: 'TraXon 12', tankSize: 600, oilCapacity: 30, baseWeight: 7.4, maxGVW: 38, price: 110000,
    haul: ['box', 'curtain', 'tanker']
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
    haul: ['box', 'reefer', 'curtain']
  },
  'kenworth_w990': {
    id: 'kenworth_w990', brand: 'Kenworth', name: 'W990 Long-Hood Heritage', region: 'America', axle: '6x4',
    engine: { name: 'Cummins X15 Performance', cylinders: 6, displacement: 15.0, hp: 565, torque: 2780, fuelType: 'Diesel' },
    trans: 'Eaton Endurant XD', tankSize: 1400, oilCapacity: 46, baseWeight: 10.0, maxGVW: 52, price: 172000,
    haul: ['flatbed', 'lowboy', 'tanker', 'tipper']
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
    haul: ['box', 'reefer', 'curtain']
  },
  'peterbilt_567': {
    id: 'peterbilt_567', brand: 'Peterbilt', name: '567 Heavy Haul Heritage', region: 'America', axle: '6x4',
    engine: { name: 'PACCAR MX-13', cylinders: 6, displacement: 12.9, hp: 510, torque: 2500, fuelType: 'Diesel' },
    trans: 'Eaton UltraShift', tankSize: 1200, oilCapacity: 42, baseWeight: 9.8, maxGVW: 50, price: 148000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },

  // ================= FREIGHTLINER =================
  'freightliner_cascadia': {
    id: 'freightliner_cascadia', brand: 'Freightliner', name: 'Cascadia 126 72" Raised Roof', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD15', cylinders: 6, displacement: 14.8, hp: 505, torque: 2370, fuelType: 'Diesel' },
    trans: 'DT12 AMT', tankSize: 1200, oilCapacity: 40, baseWeight: 9.0, maxGVW: 45, price: 135000,
    haul: ['box', 'reefer', 'curtain']
  },
  'freightliner_cascadia_dd16': {
    id: 'freightliner_cascadia_dd16', brand: 'Freightliner', name: 'Cascadia DD16 Heavy Interstate', region: 'America', axle: '6x4',
    engine: { name: 'Detroit DD16', cylinders: 6, displacement: 15.6, hp: 600, torque: 2780, fuelType: 'Diesel' },
    trans: 'DT12-OV Extreme', tankSize: 1400, oilCapacity: 44, baseWeight: 9.6, maxGVW: 52, price: 158000,
    haul: ['box', 'reefer', 'flatbed', 'tanker']
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
    haul: ['box', 'tipper', 'flatbed']
  },
  'mack_pinnacle': {
    id: 'mack_pinnacle', brand: 'Mack', name: 'Pinnacle 64T Classic Sleeper', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8-TC', cylinders: 6, displacement: 13.0, hp: 505, torque: 2500, fuelType: 'Diesel' },
    trans: 'mDRIVE HD 13-spd', tankSize: 1200, oilCapacity: 38, baseWeight: 9.2, maxGVW: 46, price: 138000,
    haul: ['box', 'flatbed', 'tipper', 'tanker']
  },
  'mack_granite': {
    id: 'mack_granite', brand: 'Mack', name: 'Granite Severe Duty Heavy', region: 'America', axle: '6x4',
    engine: { name: 'Mack MP8', cylinders: 6, displacement: 13.0, hp: 505, torque: 2600, fuelType: 'Diesel' },
    trans: 'mDRIVE HD with Creep', tankSize: 800, oilCapacity: 38, baseWeight: 10.2, maxGVW: 54, price: 142000,
    haul: ['tipper', 'lowboy', 'flatbed']
  },

  // ================= HINO =================
  'hino_700': {
    id: 'hino_700', brand: 'Hino', name: '700 Series Profia Highline', region: 'Asia', axle: '6x4',
    engine: { name: 'E13C-VV', cylinders: 6, displacement: 12.9, hp: 480, torque: 2157, fuelType: 'Diesel' },
    trans: 'Pro Shift 16', tankSize: 600, oilCapacity: 32, baseWeight: 8.5, maxGVW: 40, price: 110000,
    haul: ['box', 'tipper', 'flatbed']
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

  // ================= ISUZU =================
  'isuzu_giga': {
    id: 'isuzu_giga', brand: 'Isuzu', name: 'Giga EXZ Prime Mover', region: 'Asia', axle: '6x4',
    engine: { name: '6WG1-TCS', cylinders: 6, displacement: 15.7, hp: 510, torque: 2255, fuelType: 'Diesel' },
    trans: 'MJX16 AMT', tankSize: 600, oilCapacity: 35, baseWeight: 9.0, maxGVW: 45, price: 115000,
    haul: ['box', 'tipper', 'tanker']
  },
  'isuzu_giga_520': {
    id: 'isuzu_giga_520', brand: 'Isuzu', name: 'Giga 520 High-Roof Heavy', region: 'Asia', axle: '6x4',
    engine: { name: '6WG1-TCC', cylinders: 6, displacement: 15.7, hp: 520, torque: 2350, fuelType: 'Diesel' },
    trans: 'Smoother-Gx 16', tankSize: 700, oilCapacity: 38, baseWeight: 9.3, maxGVW: 50, price: 126000,
    haul: ['box', 'tipper', 'tanker', 'flatbed', 'lowboy']
  },
  'isuzu_forward': {
    id: 'isuzu_forward', brand: 'Isuzu', name: 'Forward FTR Regional Freight', region: 'Asia', axle: '4x2',
    engine: { name: '6HK1', cylinders: 6, displacement: 7.8, hp: 260, torque: 760, fuelType: 'Diesel' },
    trans: '6-speed Manual', tankSize: 200, oilCapacity: 18, baseWeight: 4.8, maxGVW: 16, price: 64000,
    haul: ['rigid_box', 'box']
  },

  // ================= IVECO =================
  'iveco_sway': {
    id: 'iveco_sway', brand: 'Iveco', name: 'S-WAY 570 Aero Space', region: 'Europe', axle: '4x2',
    engine: { name: 'Cursor 13', cylinders: 6, displacement: 12.9, hp: 570, torque: 2500, fuelType: 'Diesel' },
    trans: 'HI-TRONIX 12', tankSize: 900, oilCapacity: 36, baseWeight: 8.1, maxGVW: 44, price: 132000,
    haul: ['curtain', 'reefer', 'box', 'tanker']
  },
  'iveco_daily': {
    id: 'iveco_daily', brand: 'Iveco', name: 'Daily 70C21 City Freight', region: 'Europe', axle: '4x2',
    engine: { name: 'FIC 3.0L', cylinders: 4, displacement: 3.0, hp: 210, torque: 470, fuelType: 'Diesel' },
    trans: 'Hi-Matic 8', tankSize: 100, oilCapacity: 12, baseWeight: 3.2, maxGVW: 7.2, price: 58000,
    haul: ['rigid_box', 'tipper']
  },

  // ================= OTHER HEAVY & ASIA =================
  'howo_t7h': {
    id: 'howo_t7h', brand: 'SINOTRUK', name: 'HOWO T7H 440 Highline', region: 'Asia', axle: '6x4',
    engine: { name: 'MC11.44', cylinders: 6, displacement: 10.5, hp: 440, torque: 2100, fuelType: 'Diesel' },
    trans: 'HW19712', tankSize: 600, oilCapacity: 30, baseWeight: 9.2, maxGVW: 40, price: 85000,
    haul: ['tipper', 'flatbed', 'box']
  },
  'faw_j6p': {
    id: 'faw_j6p', brand: 'FAW', name: 'J6P 420 Heavy Tractor', region: 'Asia', axle: '6x4',
    engine: { name: 'CA6DM2', cylinders: 6, displacement: 11.0, hp: 420, torque: 1900, fuelType: 'Diesel' },
    trans: 'CA12TAX', tankSize: 500, oilCapacity: 28, baseWeight: 8.8, maxGVW: 38, price: 78000,
    haul: ['tipper', 'flatbed', 'curtain']
  },
  'ford_f650': {
    id: 'ford_f650', brand: 'Ford', name: 'F-650 Super Duty V8', region: 'America', axle: '4x2',
    engine: { name: '7.3L V8 Godzilla', cylinders: 8, displacement: 7.3, hp: 350, torque: 635, fuelType: 'Diesel' },
    trans: 'TorqShift 6-spd', tankSize: 180, oilCapacity: 15, baseWeight: 5.5, maxGVW: 12.0, price: 72000,
    haul: ['rigid_box', 'tipper', 'flatbed']
  },
  'fuso_canter': {
    id: 'fuso_canter', brand: 'Mitsubishi Fuso', name: 'Canter FE85 City Express', region: 'Asia', axle: '4x2',
    engine: { name: '4P10', cylinders: 4, displacement: 3.0, hp: 175, torque: 430, fuelType: 'Diesel' },
    trans: 'DUONIC 6-spd', tankSize: 100, oilCapacity: 10, baseWeight: 3.1, maxGVW: 8.5, price: 49500,
    haul: ['rigid_box', 'tipper']
  }
};

export const MODELS = TRUCK_MODELS;
