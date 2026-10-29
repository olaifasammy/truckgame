import { CargoType } from '../types';

export const CARGO_TYPES: CargoType[] = [
  // General / Curtainside
  { id: 'electronics', name: 'High-End Electronics', icon: 'cpu', trailer: 'curtain', baseValue: 8.5, density: 250, isFragile: true },
  { id: 'furniture', name: 'Office Furniture', icon: 'home', trailer: 'curtain', baseValue: 4.2, density: 180 },
  { id: 'clothing', name: 'Apparel & Textiles', icon: 'layers', trailer: 'curtain', baseValue: 3.8, density: 150 },
  
  // Temperature Controlled
  { id: 'frozen_fish', name: 'Frozen Seafood', icon: 'snowflake', trailer: 'reefer', baseValue: 9.2, density: 600, tempControlled: true },
  { id: 'vaccines', name: 'Medical Supplies', icon: 'shield', trailer: 'reefer', baseValue: 25.0, density: 200, tempControlled: true, isFragile: true },
  { id: 'produce', name: 'Fresh Vegetables', icon: 'droplet', trailer: 'reefer', baseValue: 5.5, density: 400, tempControlled: true },

  // Industrial / Flatbed / Lowboy
  { id: 'excavator', name: 'Caterpillar 320', icon: 'anchor', trailer: 'lowboy', baseValue: 12.0, density: 2000 },
  { id: 'steel_pipes', name: 'Structural Steel', icon: 'layers', trailer: 'flatbed', baseValue: 7.0, density: 7800 },
  { id: 'wind_blade', name: 'Turbine Blade', icon: 'wind', trailer: 'lowboy', baseValue: 28.0, density: 500, isFragile: true },

  // Hazardous / Tanker
  { id: 'gasoline', name: 'Premium Gasoline', icon: 'fuel', trailer: 'tanker', baseValue: 11.5, density: 750, isHazmat: true, adrClass: 3 },
  { id: 'liquid_oxy', name: 'Liquid Oxygen', icon: 'droplet', trailer: 'tanker', baseValue: 18.0, density: 1140, isHazmat: true, adrClass: 2 },
  { id: 'toxic_waste', name: 'Chemical Waste', icon: 'shield', trailer: 'hazmat', baseValue: 22.0, density: 1200, isHazmat: true, adrClass: 6 },

  // Specialized Ultra-High-Value Contracts (For High VIP Bidding)
  { id: 'aerospace_turbine', name: 'Aerospace Turbofan Engines', icon: 'wind', trailer: 'lowboy', baseValue: 38.0, density: 400, isFragile: true },
  { id: 'lithium_packs', name: 'Solid-State Battery Modules', icon: 'fuel', trailer: 'hazmat', baseValue: 42.0, density: 850, isHazmat: true, adrClass: 9 },
  { id: 'bullion_vault', name: 'Central Bank Gold Bullion', icon: 'shield', trailer: 'curtain', baseValue: 50.0, density: 19300, isFragile: true },
  { id: 'quantum_mainframe', name: 'Cryogenic Quantum Mainframe', icon: 'cpu', trailer: 'reefer', baseValue: 58.0, density: 300, isFragile: true, tempControlled: true },
  { id: 'nuclear_isotopes', name: 'Radiopharmaceutical Isotopes', icon: 'shield', trailer: 'hazmat', baseValue: 65.0, density: 1200, isHazmat: true, adrClass: 7 }
];
