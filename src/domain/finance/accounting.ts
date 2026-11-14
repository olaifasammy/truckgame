/**
 * Corporate Accounting & Asset Valuation Domain Engine
 * Provides dynamic valuation of fleet vehicles, infrastructure, fuel/parts inventory,
 * crypto & bond holdings, liabilities, and Income Statement (P&L) metrics.
 */

import { TRUCK_MODELS, TRAILERS } from '../trucks/trucks.data';
import { REGIONAL_HUBS } from '../logistics/network';
import { getGoldMarketData, INSURANCE_POLICIES } from './banking';
import { getTotalCryptoValue, getCryptoMarketData } from './markets/crypto';

// Valuation constants for trailer types
export const TRAILER_VALUATIONS: Record<string, number> = {
  curtain: 35000,
  flatbed: 28000,
  reefer: 65000,
  lowboy: 85000,
  tanker: 92000,
  tipper: 48000,
  double_trailer: 78000,
  rigid_box: 32000
};

// Replacement values for spare parts inventory
export const PART_VALUATIONS: Record<string, number> = {
  tires: 450,
  brakes: 650,
  oilFilter: 120,
  fuelFilter: 180,
  airFilter: 150,
  oil: 65,
  coolant: 85,
  adBlue: 95,
  suspension: 2400,
  windshield: 1200,
  engine: 18500,
  transmission: 12500
};

export interface BalanceSheetMetrics {
  liquidCash: number;
  bondsCount: number;
  bondsValueUsd: number;
  cryptoValueUsd: number;
  fleetTractorsCount: number;
  fleetTractorsValueUsd: number;
  yardTrailersCount: number;
  yardTrailersValueUsd: number;
  hubTerminalsCount: number;
  hubTerminalsValueUsd: number;
  garageLevel: number;
  garageFacilityValueUsd: number;
  warehouseUpgradesValueUsd: number;
  fuelBunkerFacilityValueUsd: number;
  fuelInventoryValueUsd: number;
  sparePartsInventoryValueUsd: number;
  officesValueUsd: number;
  totalInfrastructureValueUsd: number;
  totalAssetsUsd: number;
  loanDebtUsd: number;
  leaseObligationsUsd: number;
  totalLiabilitiesUsd: number;
  netEnterpriseValueUsd: number;
}

export interface IncomeStatementMetrics {
  freightRevenueUsd: number;
  warehouseInflowUsd: number;
  subcontractInflowUsd?: number;
  expectedFreightInflowUsd: number;
  totalGrossRevenueUsd: number;
  
  driverPayrollUsd: number;
  fuelExpenseUsd: number;
  maintenanceExpenseUsd: number;
  insuranceExpenseUsd: number;
  debtServiceUsd: number;
  leaseExpenseUsd: number;
  totalOpexUsd: number;
  
  netOperatingIncomeUsd: number;
  operatingMarginPct: number;
  netDailyCashflowUsd: number;
  runwayDays: number | null;
}

/**
 * Calculate dynamic market valuation of all tractors in company fleet
 */
export function calculateFleetValuation(S: any): { totalVal: number; count: number } {
  const fleet = S.fleet || [];
  let totalVal = 0;

  for (const t of fleet) {
    const model = TRUCK_MODELS[t.modelId] || TRUCK_MODELS['scania_s730'] || { priceUsd: 145000 };
    const basePrice = model.priceUsd || 145000;

    // Upgrades value
    const upgrades = t.upgrades || {};
    const ecoVal = (upgrades.ecoTuning || 0) * 8500;
    const chipVal = (upgrades.performanceChip || 0) * 12000;
    const suspVal = upgrades.heavyDutySuspension ? 15000 : 0;
    const upgradesTotal = ecoVal + chipVal + suspVal;

    // Health depreciation factor
    const comp = t.components || {};
    const healthValues = Object.values(comp).map((c: any) => typeof c === 'number' ? c : c?.health ?? 100);
    const avgHealth = healthValues.length > 0 ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 100;
    const healthFactor = Math.max(0.35, avgHealth / 100);

    const truckVal = Math.round((basePrice + upgradesTotal) * healthFactor);
    totalVal += truckVal;
  }

  return { totalVal, count: fleet.length };
}

/**
 * Calculate market valuation of all storage yard trailers
 */
export function calculateTrailersValuation(S: any): { totalVal: number; count: number } {
  const trailers = S.trailers || [];
  let totalVal = 0;
  for (const tr of trailers) {
    totalVal += TRAILER_VALUATIONS[tr as string] || 35000;
  }
  return { totalVal, count: trailers.length };
}

/**
 * Calculate market valuation of spare parts inventory
 */
export function calculateSparePartsValuation(S: any): number {
  const inv = S.partsInventory || {};
  let total = 0;
  for (const [partKey, qty] of Object.entries(inv)) {
    const unitVal = PART_VALUATIONS[partKey] || 100;
    total += (qty as number) * unitVal;
  }
  return total;
}

/**
 * Calculate market valuation of all buildings, hubs, garage, and infrastructure
 */
export function calculateInfrastructureValuation(S: any) {
  // 1. Regional Hub Terminals
  const depots = S.depots || ['hub_lagos'];
  let hubTerminalsValueUsd = 0;
  for (const hubId of depots) {
    const hubDef = REGIONAL_HUBS.find(h => h.id === hubId);
    hubTerminalsValueUsd += hubDef ? hubDef.cost : 150000;
  }

  // 2. Garage HQ Facility
  const garageLevel = S.garageLevel || 0;
  const garageFacilityValueUsd = 250000 + (garageLevel * 150000);

  // 3. Warehouse Upgrades
  const wh = S.warehouseUpgrades || {};
  let warehouseUpgradesValueUsd = 0;
  if (wh.cross_docking) warehouseUpgradesValueUsd += 35000;
  if (wh.cold_vault) warehouseUpgradesValueUsd += 65000;
  if (wh.gantry_crane) warehouseUpgradesValueUsd += 48000;

  // 4. Fuel Bunker Facility & Stored Diesel Inventory
  const bunker = S.fuelBunker || { currentLiters: 4500, maxCapacity: 12000, avgCostPerLiter: 0.95 };
  const bunkerLevel = S.fuelBunkerLevel || 0;
  const fuelBunkerFacilityValueUsd = 50000 + (bunkerLevel * 25000);
  const fuelInventoryValueUsd = Math.round((bunker.currentLiters || 0) * (bunker.avgCostPerLiter || 0.95));

  // 5. Offices
  const officesCount = (S.offices || []).length;
  const officesValueUsd = officesCount * 75000;

  const totalInfrastructureValueUsd =
    hubTerminalsValueUsd +
    garageFacilityValueUsd +
    warehouseUpgradesValueUsd +
    fuelBunkerFacilityValueUsd +
    fuelInventoryValueUsd +
    officesValueUsd;

  return {
    hubTerminalsCount: depots.length,
    hubTerminalsValueUsd,
    garageLevel,
    garageFacilityValueUsd,
    warehouseUpgradesValueUsd,
    fuelBunkerFacilityValueUsd,
    fuelInventoryValueUsd,
    officesValueUsd,
    totalInfrastructureValueUsd
  };
}

/**
 * Compute Comprehensive Balance Sheet Metrics
 */
export function calculateBalanceSheet(S: any): BalanceSheetMetrics {
  const liquidCash = S.money || 0;

  // Fleet Bonds (FLB) valuation
  const goldMarket = getGoldMarketData(S);
  const flbData = getCryptoMarketData('flb');
  const flbPrice = flbData?.sellPrice || goldMarket.sellPrice || 25000;
  const bondsCount = (S.coins || 0) + (S.stakedBonds || 0);
  const bondsValueUsd = Math.round(bondsCount * flbPrice);

  // Crypto Portfolio Valuation (excluding FLB to avoid double counting)
  let cryptoValueUsd = 0;
  const holdings = S.cryptoHoldings || {};
  for (const [assetId, qty] of Object.entries(holdings)) {
    if (assetId !== 'flb' && (qty as number) > 0) {
      const data = getCryptoMarketData(assetId);
      cryptoValueUsd += (qty as number) * (data?.sellPrice || 1);
    }
  }
  cryptoValueUsd = Math.round(cryptoValueUsd);

  // Vehicle Fleet Valuation
  const fleetRes = calculateFleetValuation(S);

  // Storage Yard Trailers Valuation
  const trailersRes = calculateTrailersValuation(S);

  // Infrastructure Valuation
  const infraRes = calculateInfrastructureValuation(S);

  // Spare Parts Inventory Valuation
  const sparePartsInventoryValueUsd = calculateSparePartsValuation(S);

  // Total Corporate Assets
  const totalAssetsUsd =
    liquidCash +
    bondsValueUsd +
    cryptoValueUsd +
    fleetRes.totalVal +
    trailersRes.totalVal +
    infraRes.totalInfrastructureValueUsd +
    sparePartsInventoryValueUsd;

  // Total Liabilities
  const loanDebtUsd = (S.loans || []).reduce((sum: number, l: any) => sum + (l.balance || 0), 0);
  const leaseObligationsUsd = (S.leases || []).reduce((sum: number, l: any) => sum + ((l.dailyRate || 0) * (l.daysRemaining || 1)), 0);
  const totalLiabilitiesUsd = loanDebtUsd + leaseObligationsUsd;

  // Net Enterprise Equity Value
  const netEnterpriseValueUsd = totalAssetsUsd - totalLiabilitiesUsd;

  return {
    liquidCash,
    bondsCount,
    bondsValueUsd,
    cryptoValueUsd,
    fleetTractorsCount: fleetRes.count,
    fleetTractorsValueUsd: fleetRes.totalVal,
    yardTrailersCount: trailersRes.count,
    yardTrailersValueUsd: trailersRes.totalVal,
    hubTerminalsCount: infraRes.hubTerminalsCount,
    hubTerminalsValueUsd: infraRes.hubTerminalsValueUsd,
    garageLevel: infraRes.garageLevel,
    garageFacilityValueUsd: infraRes.garageFacilityValueUsd,
    warehouseUpgradesValueUsd: infraRes.warehouseUpgradesValueUsd,
    fuelBunkerFacilityValueUsd: infraRes.fuelBunkerFacilityValueUsd,
    fuelInventoryValueUsd: infraRes.fuelInventoryValueUsd,
    sparePartsInventoryValueUsd,
    officesValueUsd: infraRes.officesValueUsd,
    totalInfrastructureValueUsd: infraRes.totalInfrastructureValueUsd,
    totalAssetsUsd,
    loanDebtUsd,
    leaseObligationsUsd,
    totalLiabilitiesUsd,
    netEnterpriseValueUsd
  };
}

/**
 * Compute Dynamic Income Statement (P&L) Metrics
 */
export function calculateIncomeStatement(S: any): IncomeStatementMetrics {
  const freightRevenueUsd = S.stats?.earned || S.dailyStats?.revenue || 0;

  // Daily recurring inflows
  const wh = S.warehouseUpgrades || {};
  const warehouseInflowUsd = (wh.cross_docking ? 1200 : 0) + (wh.gantry_crane ? 600 : 0);
  
  // Expected daily freight operations revenue based on active fleet size (~$3,500/day per operating rig)
  const activeFleetCount = (S.fleet || []).filter((t: any) => t.status !== 'expired').length;
  const expectedFreightInflowUsd = activeFleetCount * 3500;

  const totalGrossRevenueUsd = freightRevenueUsd + warehouseInflowUsd + expectedFreightInflowUsd;

  // Daily recurring outflows & expenses
  const driverPayrollUsd = (S.drivers || []).reduce((acc: number, d: any) => acc + (d.salary || 250), 0);
  const fuelExpenseUsd = S.dailyStats?.fuel || 0;
  const maintenanceExpenseUsd = S.dailyStats?.maintenance || 0;

  let insuranceExpenseUsd = 0;
  if (S.insurance) {
    if (S.insurance.liability) insuranceExpenseUsd += INSURANCE_POLICIES.liability?.dailyCost || 85;
    if (S.insurance.collision) insuranceExpenseUsd += INSURANCE_POLICIES.collision?.dailyCost || 220;
    if (S.insurance.cargo) insuranceExpenseUsd += INSURANCE_POLICIES.cargo?.dailyCost || 310;
  }

  const debtServiceUsd = (S.loans || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0);
  const leaseExpenseUsd = (S.leases || []).reduce((acc: number, l: any) => acc + (l.dailyRate || 0), 0);

  const totalOpexUsd = driverPayrollUsd + fuelExpenseUsd + maintenanceExpenseUsd + insuranceExpenseUsd + debtServiceUsd + leaseExpenseUsd;
  const netOperatingIncomeUsd = totalGrossRevenueUsd - totalOpexUsd;
  const operatingMarginPct = totalGrossRevenueUsd > 0 ? (netOperatingIncomeUsd / totalGrossRevenueUsd) * 100 : 0;

  // Daily Cashflow Runway
  const dailyInflow = warehouseInflowUsd + expectedFreightInflowUsd;
  const dailyOutflow = driverPayrollUsd + insuranceExpenseUsd + debtServiceUsd + leaseExpenseUsd + fuelExpenseUsd + maintenanceExpenseUsd;
  const netDailyCashflowUsd = dailyInflow - dailyOutflow;
  const runwayDays = netDailyCashflowUsd < 0 ? Math.floor((S.money || 0) / Math.abs(netDailyCashflowUsd)) : null;

  return {
    freightRevenueUsd,
    warehouseInflowUsd,
    expectedFreightInflowUsd,
    totalGrossRevenueUsd,
    driverPayrollUsd,
    fuelExpenseUsd,
    maintenanceExpenseUsd,
    insuranceExpenseUsd,
    debtServiceUsd,
    leaseExpenseUsd,
    totalOpexUsd,
    netOperatingIncomeUsd,
    operatingMarginPct,
    netDailyCashflowUsd,
    runwayDays
  };
}

export interface WeeklyAccountingMetrics {
  grossRevenueUsd: number;
  freightInflowUsd: number;
  warehouseInflowUsd: number;
  tollAndTariffUsd: number;
  driverWagesUsd: number;
  fuelExpenseUsd: number;
  maintenanceExpenseUsd: number;
  insuranceUsd: number;
  debtInterestUsd: number;
  leaseExpenseUsd: number;
  depreciationUsd: number;
  totalOpexUsd: number;
  ebitdaUsd: number;
  netWeeklyProfitUsd: number;
  netMarginPct: number;
}

export interface MonthlyAccountingMetrics {
  grossRevenueUsd: number;
  freightInflowUsd: number;
  warehouseInflowUsd: number;
  tollAndTariffUsd: number;
  driverWagesUsd: number;
  fuelExpenseUsd: number;
  maintenanceExpenseUsd: number;
  insuranceUsd: number;
  debtInterestUsd: number;
  leaseExpenseUsd: number;
  depreciationUsd: number;
  corporateTaxUsd: number;
  totalOpexUsd: number;
  ebitdaUsd: number;
  netMonthlyProfitUsd: number;
  netMarginPct: number;
}

export function calculateWeeklyAccounting(S: any): WeeklyAccountingMetrics {
  const daily = calculateIncomeStatement(S);
  const factor = 7;
  const freightInflowUsd = Math.round(daily.expectedFreightInflowUsd * factor + daily.freightRevenueUsd);
  const warehouseInflowUsd = Math.round(daily.warehouseInflowUsd * factor);
  const tollAndTariffUsd = Math.round((S.dailyStats?.tolls || 450) * factor);
  const grossRevenueUsd = freightInflowUsd + warehouseInflowUsd;

  const driverWagesUsd = Math.round(daily.driverPayrollUsd * factor);
  const fuelExpenseUsd = Math.round((daily.fuelExpenseUsd || 1200) * factor);
  const maintenanceExpenseUsd = Math.round((daily.maintenanceExpenseUsd || 800) * factor);
  const insuranceUsd = Math.round(daily.insuranceExpenseUsd * factor);
  const debtInterestUsd = Math.round(daily.debtServiceUsd * factor);
  const leaseExpenseUsd = Math.round(daily.leaseExpenseUsd * factor);
  const depreciationUsd = 3500;

  const totalOpexUsd = driverWagesUsd + fuelExpenseUsd + maintenanceExpenseUsd + insuranceUsd + debtInterestUsd + leaseExpenseUsd + tollAndTariffUsd + depreciationUsd;
  const ebitdaUsd = grossRevenueUsd - (totalOpexUsd - depreciationUsd - debtInterestUsd);
  const netWeeklyProfitUsd = grossRevenueUsd - totalOpexUsd;
  const netMarginPct = grossRevenueUsd > 0 ? (netWeeklyProfitUsd / grossRevenueUsd) * 100 : 0;

  return {
    grossRevenueUsd,
    freightInflowUsd,
    warehouseInflowUsd,
    tollAndTariffUsd,
    driverWagesUsd,
    fuelExpenseUsd,
    maintenanceExpenseUsd,
    insuranceUsd,
    debtInterestUsd,
    leaseExpenseUsd,
    depreciationUsd,
    totalOpexUsd,
    ebitdaUsd,
    netWeeklyProfitUsd,
    netMarginPct
  };
}

export function calculateMonthlyAccounting(S: any): MonthlyAccountingMetrics {
  const weekly = calculateWeeklyAccounting(S);
  const factor = 4.33;
  const grossRevenueUsd = Math.round(weekly.grossRevenueUsd * factor);
  const freightInflowUsd = Math.round(weekly.freightInflowUsd * factor);
  const warehouseInflowUsd = Math.round(weekly.warehouseInflowUsd * factor);
  const tollAndTariffUsd = Math.round(weekly.tollAndTariffUsd * factor);

  const driverWagesUsd = Math.round(weekly.driverWagesUsd * factor);
  const fuelExpenseUsd = Math.round(weekly.fuelExpenseUsd * factor);
  const maintenanceExpenseUsd = Math.round(weekly.maintenanceExpenseUsd * factor);
  const insuranceUsd = Math.round(weekly.insuranceUsd * factor);
  const debtInterestUsd = Math.round(weekly.debtInterestUsd * factor);
  const leaseExpenseUsd = Math.round(weekly.leaseExpenseUsd * factor);
  const depreciationUsd = Math.round(weekly.depreciationUsd * factor);
  
  const ebitdaBeforeTax = grossRevenueUsd - (driverWagesUsd + fuelExpenseUsd + maintenanceExpenseUsd + insuranceUsd + leaseExpenseUsd + tollAndTariffUsd);
  const corporateTaxUsd = ebitdaBeforeTax > 0 ? Math.round(ebitdaBeforeTax * 0.21) : 0;

  const totalOpexUsd = driverWagesUsd + fuelExpenseUsd + maintenanceExpenseUsd + insuranceUsd + debtInterestUsd + leaseExpenseUsd + tollAndTariffUsd + depreciationUsd + corporateTaxUsd;
  const ebitdaUsd = Math.round(weekly.ebitdaUsd * factor);
  const netMonthlyProfitUsd = grossRevenueUsd - totalOpexUsd;
  const netMarginPct = grossRevenueUsd > 0 ? (netMonthlyProfitUsd / grossRevenueUsd) * 100 : 0;

  return {
    grossRevenueUsd,
    freightInflowUsd,
    warehouseInflowUsd,
    tollAndTariffUsd,
    driverWagesUsd,
    fuelExpenseUsd,
    maintenanceExpenseUsd,
    insuranceUsd,
    debtInterestUsd,
    leaseExpenseUsd,
    depreciationUsd,
    corporateTaxUsd,
    totalOpexUsd,
    ebitdaUsd,
    netMonthlyProfitUsd,
    netMarginPct
  };
}
