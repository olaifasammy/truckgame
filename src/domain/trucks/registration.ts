import { TRUCK_MODELS } from './trucks.data';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';
import { getHubByCity } from '../logistics/network';

export interface VehicleRegistrationRecord {
  code: string;
  regNo: string;
  registeredCity: string;
  registeredAt: number;
  taxExpiresAt: number;
  inspectionExpiresAt: number;
  registrationStatus: 'unregistered' | 'active' | 'tax_expired' | 'inspection_expired' | 'suspended';
}

export interface DotViolationRecord {
  id: number;
  type: 'unregistered' | 'tax_expired' | 'inspection_expired' | 'speeding' | 'hos' | 'overweight';
  truckId?: number;
  truckCode?: string;
  driverName?: string;
  fine: number;
  reason: string;
  at: number;
  paid: boolean;
}

export const GOV_FEES = {
  REGISTRATION: 4500,
  REGISTRATION_VANITY: 8500,
  ROAD_TAX: 5800,
  INSPECTION: 1850,
  EZ_PASS_ANNUAL: 3600,
  CUSTOMS_BOND: 12000,
  UNREGISTERED_FINE: 3500,
  EXPIRED_DOC_FINE: 2500
} as const;

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
 * Generates an authentic city registration license plate number based on the hub city and region.
 */
export function generateLicensePlate(city: string, customPlate?: string): string {
  if (customPlate && customPlate.trim().length > 0) {
    return customPlate.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
  }

  const cleanCity = (city || '').toUpperCase().replace(/\s+/g, '_');
  const cityCode = CITY_PLATE_PREFIXES[cleanCity] || (cleanCity ? cleanCity.slice(0, 2) : 'TR');
  const randNum = Math.floor(1000 + Math.random() * 9000);

  const hub = getHubByCity(city);
  const region = hub ? hub.region : 'Africa';

  if (region === 'Europe') {
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${cityCode}-${letters} ${randNum}`;
  }

  if (region === 'America') {
    return `${cityCode}-${randNum}-TR`;
  }

  if (region === 'Asia') {
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${cityCode}-${randNum}-${letters}`;
  }

  // Africa / Default
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${cityCode}-${randNum}-${suffix}`;
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
  const regFee = isVanity ? GOV_FEES.REGISTRATION_VANITY : GOV_FEES.REGISTRATION;

  if (S.money < regFee) {
    toast(`Insufficient funds! Registration fee is $${regFee.toLocaleString()}`, 'err');
    return false;
  }

  // Deduct the money from the state
  if (S.money !== undefined) {
    S.money -= regFee;
  }

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

  const taxFee = GOV_FEES.ROAD_TAX;
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

  const taxFee = GOV_FEES.ROAD_TAX;
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

  const inspectionFee = GOV_FEES.INSPECTION;
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

/**
 * Records a DOT / Ministry of Transport regulatory violation.
 */
export function recordViolation(
  S: any,
  opts: {
    type: DotViolationRecord['type'];
    truckId?: number;
    truckCode?: string;
    driverName?: string;
    fine: number;
    reason: string;
    paid?: boolean;
  }
): DotViolationRecord {
  if (!Array.isArray(S.violations)) S.violations = [];
  const rec: DotViolationRecord = {
    id: S.nextId ? S.nextId++ : Date.now() + Math.floor(Math.random() * 1000),
    type: opts.type,
    truckId: opts.truckId,
    truckCode: opts.truckCode,
    driverName: opts.driverName,
    fine: Math.max(0, Math.round(opts.fine)),
    reason: opts.reason,
    at: Date.now(),
    paid: Boolean(opts.paid)
  };
  S.violations.unshift(rec);
  if (S.violations.length > 100) S.violations.length = 100;
  return rec;
}

/**
 * Settles a single unpaid DOT violation fine.
 */
export function payViolation(S: any, violationId: number): boolean {
  const v = (S.violations || []).find((x: DotViolationRecord) => x.id === violationId);
  if (!v || v.paid) return false;
  if ((S.money || 0) < v.fine) {
    toast(`Insufficient funds to pay $${v.fine.toLocaleString()} DOT fine`, 'err');
    return false;
  }
  S.money -= v.fine;
  S.violations = (S.violations || []).filter((x: DotViolationRecord) => x.id !== violationId && !x.paid);
  pushNote(S, `⚖️ DOT CITATION SETTLED: Paid $${v.fine.toLocaleString()} for ${v.reason}.`, {
    title: 'DOT FINE PAID',
    type: 'compliance'
  });
  toast(`Paid DOT fine ($${v.fine.toLocaleString()})`, 'success');
  return true;
}

/**
 * Settles all unpaid DOT violation fines.
 */
export function payAllViolations(S: any): boolean {
  const unpaid = (S.violations || []).filter((x: DotViolationRecord) => !x.paid);
  if (unpaid.length === 0) {
    if (Array.isArray(S.violations) && S.violations.length > 0) {
      S.violations = [];
    }
    toast('No outstanding DOT fines to settle', 'info');
    return false;
  }
  const total = unpaid.reduce((acc: number, x: DotViolationRecord) => acc + x.fine, 0);
  if ((S.money || 0) < total) {
    toast(`Insufficient funds! Total unpaid fines: $${total.toLocaleString()}`, 'err');
    return false;
  }
  S.money -= total;
  S.violations = [];
  pushNote(S, `⚖️ ALL DOT VIOLATIONS SETTLED: Paid ${unpaid.length} citations (-$${total.toLocaleString()}). Safety standing restored.`, {
    title: 'DOT COMPLIANCE RESTORED',
    type: 'compliance',
    priority: 1
  });
  toast(`Settled ${unpaid.length} DOT fines (-$${total.toLocaleString()})`, 'success');
  return true;
}

/**
 * Computes real operator safety rating and unpaid violation metrics.
 */
export function getCompanySafetyRating(S: any): {
  grade: 'GRADE A' | 'CONDITIONAL' | 'UNSATISFACTORY';
  label: string;
  color: string;
  unpaidCount: number;
  unpaidTotal: number;
  totalViolations: number;
} {
  const violations: DotViolationRecord[] = S.violations || [];
  const unpaid = violations.filter(v => !v.paid);
  const unpaidCount = unpaid.length;
  const unpaidTotal = unpaid.reduce((acc, v) => acc + v.fine, 0);

  const fleet = S.fleet || [];
  const now = Date.now();
  let nonCompliantUnits = 0;
  for (const t of fleet) {
    const st = getTruckRegistrationStatus(t).status;
    if (st !== 'active' && (!t.taxExpiresAt || now > t.taxExpiresAt || !t.regNo)) {
      nonCompliantUnits++;
    }
  }

  if (unpaidCount >= 3 || unpaidTotal >= 10000) {
    return {
      grade: 'UNSATISFACTORY',
      label: 'UNSATISFACTORY (DISPATCH HOLD)',
      color: '#ef4444',
      unpaidCount,
      unpaidTotal,
      totalViolations: violations.length
    };
  }
  if (unpaidCount > 0 || nonCompliantUnits > 0) {
    return {
      grade: 'CONDITIONAL',
      label: 'CONDITIONAL (AUDIT WARNING)',
      color: 'var(--gold)',
      unpaidCount,
      unpaidTotal,
      totalViolations: violations.length
    };
  }
  return {
    grade: 'GRADE A',
    label: 'SATISFACTORY (GRADE A)',
    color: 'var(--grn)',
    unpaidCount,
    unpaidTotal,
    totalViolations: violations.length
  };
}

/**
 * Purchases or renews annual Global EZ-Pass Toll Subscription.
 */
export function buyEzPass(S: any): boolean {
  const now = Date.now();
  if (S.ezPass && S.ezPassExpiresAt && S.ezPassExpiresAt > now + 30 * 24 * 60 * 60 * 1000) {
    toast('EZ-Pass subscription is already active', 'info');
    return false;
  }
  if ((S.money || 0) < GOV_FEES.EZ_PASS_ANNUAL) {
    toast(`Insufficient funds for EZ-Pass ($${GOV_FEES.EZ_PASS_ANNUAL.toLocaleString()})`, 'err');
    return false;
  }
  S.money -= GOV_FEES.EZ_PASS_ANNUAL;
  S.ezPass = true;
  S.ezPassExpiresAt = now + 365 * 24 * 60 * 60 * 1000;
  pushNote(S, `🛣️ GLOBAL EZ-PASS ACTIVATED: 30% toll discount active across all corridors for 1 year (-$${GOV_FEES.EZ_PASS_ANNUAL.toLocaleString()}).`, {
    title: 'EZ-PASS SUBSCRIPTION',
    type: 'finance'
  });
  toast('Global EZ-Pass Toll Subscription Activated!', 'success');
  return true;
}

/**
 * Purchases Cross-Border Customs Clearance Bond.
 */
export function buyCustomsBond(S: any): boolean {
  if (S.customsBond) {
    toast('Cross-Border Customs Bond is already active', 'info');
    return false;
  }
  if ((S.money || 0) < GOV_FEES.CUSTOMS_BOND) {
    toast(`Insufficient funds for Customs Bond ($${GOV_FEES.CUSTOMS_BOND.toLocaleString()})`, 'err');
    return false;
  }
  S.money -= GOV_FEES.CUSTOMS_BOND;
  S.customsBond = true;
  pushNote(S, `🛂 CROSS-BORDER CUSTOMS BOND ISSUED: Pre-cleared for international freight corridors (-$${GOV_FEES.CUSTOMS_BOND.toLocaleString()}).`, {
    title: 'CUSTOMS CLEARANCE BOND',
    type: 'compliance'
  });
  toast('Cross-Border Customs Bond Issued!', 'success');
  return true;
}
