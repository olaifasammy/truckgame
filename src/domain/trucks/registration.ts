import { TRUCK_MODELS } from './trucks.data';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export interface VehicleRegistrationRecord {
  code: string;
  regNo: string;
  registeredCity: string;
  registeredAt: number;
  taxExpiresAt: number;
  inspectionExpiresAt: number;
  registrationStatus: 'unregistered' | 'active' | 'tax_expired' | 'inspection_expired' | 'suspended';
}

const BRAND_PREFIX_MAP: Record<string, string> = {
  scania: 'SC',
  man: 'MN',
  mercedes: 'MC',
  'mercedes-benz': 'MC',
  volvo: 'VO',
  daf: 'DF',
  iveco: 'IV',
  kenworth: 'KW',
  peterbilt: 'PB',
  freightliner: 'FR',
  mack: 'MK',
  shacman: 'SH',
  faw: 'FW',
  sinotruk: 'SN',
  dongfeng: 'DF'
};

const CITY_PLATE_PREFIXES: Record<string, string> = {
  LAGOS: 'LA',
  IBADAN: 'IB',
  KANO: 'KN',
  ABUJA: 'ABJ',
  BERLIN: 'B',
  PARIS: 'P',
  WARSAW: 'W',
  ROTTERDAM: 'R',
  LONDON: 'L',
  MADRID: 'M',
  HOUSTON: 'TX',
  CHICAGO: 'IL',
  LOS_ANGELES: 'CA',
  NEW_YORK: 'NY',
  SINGAPORE: 'SG',
  DUBAI: 'DXB',
  TOKYO: 'TYO'
};

/**
 * Returns a standardized realistic vehicle identification code (e.g., SC0-573, MN4-794, MC6-68E)
 */
export function getTruckCode(truck: any): string {
  if (truck && truck.code) return truck.code;
  if (!truck) return 'TR0-000';

  const modelId = truck.modelId || 'scania_s730';
  const model = TRUCK_MODELS[modelId];
  const brandKey = (model?.brand || 'truck').toLowerCase().split(' ')[0];
  const prefix = BRAND_PREFIX_MAP[brandKey] || 'TR';

  const numericId = truck.id || 1;
  const modDigit = numericId % 10;
  
  // Deterministic 3-character hex suffix
  const hash = Math.abs((numericId * 2654435761) ^ (modelId.length * 1597334677)) % 4096;
  const hexSuffix = hash.toString(16).padStart(3, '0').toUpperCase();

  return `${prefix}${modDigit}-${hexSuffix}`;
}

/**
 * Generates an authentic city registration license plate number.
 */
export function generateLicensePlate(city: string, customPlate?: string): string {
  if (customPlate && customPlate.trim().length > 0) {
    return customPlate.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
  }

  const cleanCity = (city || 'LAGOS').toUpperCase().replace(/\s+/g, '_');
  const cityCode = CITY_PLATE_PREFIXES[cleanCity] || cleanCity.slice(0, 2);
  const randNum = Math.floor(1000 + Math.random() * 9000);

  if (['BERLIN', 'PARIS', 'WARSAW', 'ROTTERDAM', 'LONDON', 'MADRID'].includes(cleanCity)) {
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${cityCode}-${letters} ${randNum}`;
  }

  if (['HOUSTON', 'CHICAGO', 'LOS_ANGELES', 'NEW_YORK'].includes(cleanCity)) {
    return `${cityCode}-${randNum}-TR`;
  }

  if (['LAGOS', 'IBADAN', 'KANO', 'ABUJA'].includes(cleanCity)) {
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${cityCode}-${randNum}-${suffix}`;
  }

  return `${cityCode}-${randNum}`;
}

/**
 * Gets the current registration compliance status of a truck.
 */
export function getTruckRegistrationStatus(truck: any): {
  status: 'unregistered' | 'active' | 'tax_expired' | 'inspection_expired';
  label: string;
  color: string;
  badgeBg: string;
} {
  if (!truck || !truck.regNo || !truck.registeredCity) {
    return {
      status: 'unregistered',
      label: 'UNREGISTERED',
      color: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)'
    };
  }

  const now = Date.now();

  if (truck.taxExpiresAt && now > truck.taxExpiresAt) {
    return {
      status: 'tax_expired',
      label: 'ROAD TAX EXPIRED',
      color: 'var(--gold)',
      badgeBg: 'rgba(245, 158, 11, 0.15)'
    };
  }

  if (truck.inspectionExpiresAt && now > truck.inspectionExpiresAt) {
    return {
      status: 'inspection_expired',
      label: 'DOT INSPECTION EXPIRED',
      color: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.15)'
    };
  }

  return {
    status: 'active',
    label: 'LICENSED & COMPLIANT',
    color: 'var(--grn)',
    badgeBg: 'rgba(34, 197, 94, 0.15)'
  };
}

/**
 * Registers a truck at a specific city hub with official DOT plate issuance.
 */
export function registerTruckAtCity(S: any, truckId: number, city: string, customPlate?: string): boolean {
  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (!truck) {
    toast('Truck not found', 'err');
    return false;
  }

  const isVanity = !!(customPlate && customPlate.trim().length > 0);
  const regFee = isVanity ? 3500 : 1800;

  if (S.money < regFee) {
    toast(`Insufficient funds! Registration fee is $${regFee.toLocaleString()}`, 'err');
    return false;
  }

  S.money -= regFee;

  const plate = generateLicensePlate(city, customPlate);
  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  truck.regNo = plate;
  truck.registeredCity = city.toUpperCase();
  truck.registeredAt = now;
  truck.taxExpiresAt = now + oneYearMs;
  truck.inspectionExpiresAt = now + oneYearMs;
  truck.registrationStatus = 'active';

  const code = getTruckCode(truck);
  pushNote(S, `🏛️ VEHICLE REGISTRATION ISSUED: Unit ${code} assigned Plate ${plate} in ${city.toUpperCase()} hub.`, {
    title: 'DOT REGISTRATION CERTIFICATE',
    type: 'finance',
    priority: 1,
    body: `Vehicle Code: ${code}\nRegistration Plate: ${plate}\nJurisdiction: ${city.toUpperCase()}\nFee Paid: $${regFee.toLocaleString()}\nRoad Tax Validity: 1 Year\nInspection Certificate: Valid`
  });

  toast(`Unit ${code} Registered! Issued Plate ${plate} in ${city.toUpperCase()}`, 'success');
  return true;
}

/**
 * Renews annual commercial heavy vehicle road tax.
 */
export function renewVehicleRoadTax(S: any, truckId: number): boolean {
  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (!truck || !truck.regNo) {
    toast('Vehicle must be registered before renewing road tax', 'err');
    return false;
  }

  const taxFee = 2400;
  if (S.money < taxFee) {
    toast(`Insufficient funds for Road Tax ($${taxFee.toLocaleString()})`, 'err');
    return false;
  }

  S.money -= taxFee;

  const now = Date.now();
  const currentExpiry = truck.taxExpiresAt && truck.taxExpiresAt > now ? truck.taxExpiresAt : now;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  truck.taxExpiresAt = currentExpiry + oneYearMs;
  truck.registrationStatus = 'active';

  const code = getTruckCode(truck);
  pushNote(S, `💳 ROAD TAX RENEWED: Commercial road permit extended for Unit ${code} (Plate ${truck.regNo}).`, {
    title: 'HVUT ROAD TAX PAID',
    type: 'finance',
    body: `Vehicle Code: ${code}\nPlate: ${truck.regNo}\nTax Fee Paid: $${taxFee.toLocaleString()}\nNew Tax Expiry: ${new Date(truck.taxExpiresAt).toLocaleDateString()}`
  });

  toast(`Road Tax Renewed for Unit ${code} (${truck.regNo})!`, 'success');
  return true;
}

/**
 * Bulk renews annual road tax for all fleet vehicles with expiring or expired tax.
 */
export function bulkRenewFleetRoadTax(S: any): { renewedCount: number; totalCost: number } {
  if (!S.fleet || S.fleet.length === 0) {
    toast('No fleet vehicles available', 'info');
    return { renewedCount: 0, totalCost: 0 };
  }

  const taxFee = 2400;
  const now = Date.now();
  const eligibleTrucks = S.fleet.filter((t: any) => t.regNo && (!t.taxExpiresAt || t.taxExpiresAt - now < 30 * 24 * 60 * 60 * 1000));

  if (eligibleTrucks.length === 0) {
    toast('All registered fleet vehicles have active road tax permits', 'info');
    return { renewedCount: 0, totalCost: 0 };
  }

  const totalCost = eligibleTrucks.length * taxFee;
  if (S.money < totalCost) {
    toast(`Insufficient capital! Bulk road tax for ${eligibleTrucks.length} vehicles requires $${totalCost.toLocaleString()}`, 'err');
    return { renewedCount: 0, totalCost: 0 };
  }

  S.money -= totalCost;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  for (const truck of eligibleTrucks) {
    const currentExpiry = truck.taxExpiresAt && truck.taxExpiresAt > now ? truck.taxExpiresAt : now;
    truck.taxExpiresAt = currentExpiry + oneYearMs;
    truck.registrationStatus = 'active';
  }

  pushNote(S, `🏛️ BULK ROAD TAX RENEWAL: Extended commercial road permits for ${eligibleTrucks.length} fleet vehicles. Total: -$${totalCost.toLocaleString()}`, {
    title: 'BULK HVUT ROAD PERMITS ISSUED',
    type: 'finance',
    priority: 1
  });

  toast(`Bulk Road Tax Paid! ${eligibleTrucks.length} vehicles renewed (-$${totalCost.toLocaleString()})`, 'success');
  return { renewedCount: eligibleTrucks.length, totalCost };
}

/**
 * Performs annual DOT / TÜV commercial vehicle safety & emissions inspection.
 */
export function performVehicleInspection(S: any, truckId: number): { passed: boolean; avgHealth: number } {
  const truck = (S.fleet || []).find((t: any) => t.id === truckId);
  if (!truck) {
    toast('Truck not found', 'err');
    return { passed: false, avgHealth: 0 };
  }

  const inspectionFee = 600;
  if (S.money < inspectionFee) {
    toast(`Insufficient funds for Inspection Test ($${inspectionFee.toLocaleString()})`, 'err');
    return { passed: false, avgHealth: 0 };
  }

  S.money -= inspectionFee;

  // Compute average component health
  const comps = Object.values(truck.components || {}) as any[];
  const totalHealth = comps.reduce((acc, c) => acc + (c?.health ?? 100), 0);
  const avgHealth = comps.length > 0 ? totalHealth / comps.length : 100;

  const code = getTruckCode(truck);
  const passed = avgHealth >= 65;

  if (passed) {
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    truck.inspectionExpiresAt = now + oneYearMs;

    pushNote(S, `✅ DOT SAFETY INSPECTION PASSED: Unit ${code} (${avgHealth.toFixed(1)}% Health) issued 1-Year Compliance Pass.`, {
      title: 'TÜV / DOT SAFETY CERTIFICATE',
      type: 'ops',
      body: `Vehicle Code: ${code}\nPlate: ${truck.regNo || 'N/A'}\nOverall Component Health: ${avgHealth.toFixed(1)}%\nResult: PASSED\nCertificate Valid: 1 Year`
    });

    toast(`Unit ${code} PASSED Inspection (${avgHealth.toFixed(0)}% Health)! Certificate Issued.`, 'success');
  } else {
    pushNote(S, `❌ DOT INSPECTION FAILED: Unit ${code} (${avgHealth.toFixed(1)}% Health) failed component health threshold (Req >= 65%). Service required in workshop.`, {
      title: 'DOT INSPECTION FAILURE NOTICE',
      type: 'ops',
      priority: 2,
      body: `Vehicle Code: ${code}\nOverall Component Health: ${avgHealth.toFixed(1)}%\nRequirement: Minimum 65% Component Health\nAction: Repair degraded engine, brake, or tire components before re-testing.`
    });

    toast(`Unit ${code} FAILED Inspection (${avgHealth.toFixed(0)}% Health)! Workshop repair required.`, 'err');
  }

  return { passed, avgHealth };
}
