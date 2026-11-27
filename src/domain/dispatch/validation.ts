import { Driver } from '../drivers/drivers.types';
import { Truck } from '../trucks/trucks.types';
import { TRUCK_MODELS } from '../trucks/trucks.data';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { getTruckRegistrationStatus, DotViolationRecord } from '../trucks/registration';
import { hasLicense } from '../freight/licenses';
import { FreightJob } from '../freight/types';
import { LOCATIONS } from '../../data/world';

import { isCityUnlockedHub } from '../hubs/hub-facility';
import { isHubDailyLimitReached } from '../hubs/characteristics';

/**
 * Validates if a truck and its assigned driver are eligible for a specific freight job.
 * 
 * Following NexHaul Engineering Constitution Section 6.4 (Logistics and Dispatch),
 * this performs authoritative operational eligibility checks.
 */
export function getDispatchEligibilityError(
  state: { licenses: string[], depots?: string[], trailers?: string[], violations?: DotViolationRecord[] },
  truck: Truck,
  job: FreightJob,
  driver?: Driver
): string | null {
  // 0. FMCSA / DOT Compliance Safety Hold
  const unpaidViolations = (state.violations || []).filter(v => !v.paid);
  const unpaidTotal = unpaidViolations.reduce((acc, v) => acc + (v.fine || 0), 0);
  if (unpaidViolations.length >= 3 || unpaidTotal >= 10000) {
    return `FMCSA Safety Hold: ${unpaidViolations.length} unpaid DOT citations ($${unpaidTotal.toLocaleString()}). Settle fines in Ministry of Transport.`;
  }

  // 1. Basic Truck Availability & DOT Roadworthiness Inspection
  if (truck.status !== 'idle') return 'Truck is busy';

  if ((truck as any).regNo) {
    const regStatus = getTruckRegistrationStatus(truck).status;
    if (regStatus === 'tax_expired') return 'DOT Hold: Annual Road Tax (HVUT) expired. Renew in Ministry of Transport.';
    if (regStatus === 'inspection_expired') return 'DOT Hold: Annual Safety Inspection expired. Inspect in Ministry of Transport.';
  }

  const comp = (truck as any).components || {};
  const criticalParts: Array<[string, string]> = [
    ['engine', 'Engine'],
    ['brakes', 'Brakes'],
    ['tires', 'Tires'],
    ['transmission', 'Transmission']
  ];
  for (const [key, label] of criticalParts) {
    const h = comp[key]?.health;
    if (typeof h === 'number' && h < 15) {
      return `DOT Inspection Failed: ${label} at ${Math.round(h)}% (min 15% required for dispatch)`;
    }
  }
  const fluids = (truck as any).fluids;
  if (fluids && typeof fluids.coolant === 'number' && fluids.coolant < 15) {
    return `DOT Inspection Failed: Coolant critically low (${Math.round(fluids.coolant)}%)`;
  }
  if (typeof (truck as any).oil === 'number' && (truck as any).oil < 15) {
    return `DOT Inspection Failed: Engine oil critically low (${Math.round((truck as any).oil)}%)`;
  }

  // 2. Operational Presence Check (Constitution 6.4)
  // A carrier MUST have an owned hub at the origin OR a truck already stationed there.
  // We allow dispatch from any location where the truck is currently stationed.
  const isOwnedOriginHub = isCityUnlockedHub(state, job.from);
  const isTruckAtOrigin = truck.loc === job.from;

  if (!isOwnedOriginHub && !isTruckAtOrigin) {
    return `No operational presence in ${job.from}. Requires an owned Hub or a truck stationed there.`;
  }

  // 2.1 Hub Capacity Check (Constraint 6.4)
  if (isOwnedOriginHub && isHubDailyLimitReached(state, job.from, job.weightTonnes || 20)) {
     return `Hub ${job.from} has reached its daily freight capacity limit.`;
  }

  // 2.2 Hub-to-Hub Corridor Distance Limit (Strategy: 1500km feeder / 2800km trunk)
  // For round-trip turnarounds, validate the one-way corridor distance rather than doubled total km.
  const isHubToHub = isOwnedOriginHub && isCityUnlockedHub(state, job.to);
  const distanceLimit = isHubToHub ? 2800 : 1500;
  const corridorKm = job.isRoundTrip ? Math.round(job.km / 2) : job.km;
  if (corridorKm > distanceLimit) {
    return `Corridor distance (${corridorKm}km one-way) exceeds ${isHubToHub ? 'Inter-Hub Trunk' : 'Feeder'} limit (${distanceLimit}km).`;
  }

  // 3. Cross-Continental Boundary Check (Constitution 6.4)
  // Trucks cannot deadhead across oceans by highway (e.g. America to Europe/Africa).
  const truckLoc = LOCATIONS[truck.loc];
  const jobLoc = LOCATIONS[job.from];
  if (truckLoc && jobLoc && truckLoc.region !== jobLoc.region) {
    return `Cross-continental transit prohibited: Truck in ${truckLoc.name} (${truckLoc.region}) cannot service freight in ${jobLoc.name} (${jobLoc.region}).`;
  }

  // 4. Driver Assignment & Eligibility
  if (!truck.driverId || !driver) return 'Assign a CDL driver';
  if (driver.id !== truck.driverId) return 'Inconsistent driver assignment';

  const driverRegion = (driver as any).region;
  const driverPermits: string[] = (driver as any).workPermits || [];
  if (jobLoc?.region && driverRegion && driverRegion !== jobLoc.region && !driverPermits.includes(jobLoc.region)) {
    return `Driver ${driver.name} is licensed for ${driverRegion}, not ${jobLoc.region}`;
  }

  // Hours of Service (HOS) & Fatigue Check (Constitution 6.2)
  if ((driver as any).hosRestUntil && (driver as any).hosRestUntil > Date.now()) {
    const sec = Math.ceil(((driver as any).hosRestUntil - Date.now()) / 1000);
    return `Driver on mandatory 10h HOS rest (${sec}s remaining)`;
  }
  if (((driver as any).hosHours || 0) >= 11) {
    return 'Driver exceeded 11h HOS daily limit (Send to Motel in Drivers)';
  }
  if (driver.fatigue > 85) {
    return 'Driver critically fatigued (Send to Motel in Drivers)';
  }
  if ((driver as any).morale !== undefined && (driver as any).morale <= 20) {
    return `Driver ${driver.name} is burned out (Morale ${Math.round((driver as any).morale)}%) — rest or issue performance bonus`;
  }

  // Physical Compatibility & Trailer Certification (Constitution 6.1 & 6.4)
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  const trailerType = cargo?.trailer || (job as any).trailer || 'curtain';
  const truckModel = TRUCK_MODELS[truck.modelId];

  if (!truckModel) return 'Unknown truck model configuration';

  // Tractor Chassis Compatibility Check
  if (truckModel.haul && !truckModel.haul.includes(trailerType)) {
    return `Tractor chassis (${truckModel.name}) cannot haul this trailer type (${trailerType})`;
  }

  // Physical Trailer Availability & Yard Coupling Check (Constitution 6.4)
  const isShipperTanker = Boolean((job as any).isShipperTanker || (cargo?.isHazmat && trailerType === 'hazmat'));
  if (truck.trailer !== trailerType && !isShipperTanker) {
    if (!isCityUnlockedHub(state, truck.loc)) {
      return `Truck in ${truck.loc} cannot swap trailers outside an owned Hub (currently hitched: ${truck.trailer || 'Bobtail'}, needs: ${trailerType})`;
    }
    if (Array.isArray(state.trailers) && !state.trailers.includes(trailerType)) {
      return `No ${trailerType} trailer available in company yard`;
    }
  }

  // Gross Axle Rating Verification (Gross Vehicle Weight)
  const grossTonnes = (truckModel.baseWeight || 8) + (job.weight || 0);
  if (grossTonnes > (truckModel.maxGVW || 44) && !hasLicense(state, 'heavy_haul')) {
    return `Gross mass (${grossTonnes}t) exceeds chassis max GVW (${truckModel.maxGVW}t). Requires Heavy Abnormal Permit`;
  }

  // 4. Regulatory, Company Licensing & Driver Endorsements (Constitution 6.2 & 6.4)
  const driverCerts = driver.certifications || [];
  if (cargo?.isHazmat) {
    if (!hasLicense(state, 'adr_hazmat')) return 'Missing Company License: ADR Hazmat Authority (Buy in HQ)';
    if (!driverCerts.includes('ADR Hazmat')) return `Driver ${driver.name} lacks ADR Hazmat endorsement`;
  }
  if (cargo?.tempControlled) {
    if (!hasLicense(state, 'cold_chain')) return 'Missing Company License: Cold Chain Sanitary Authority (Buy in HQ)';
    if (!driverCerts.includes('Cold Chain')) return `Driver ${driver.name} lacks Cold Chain certification`;
  }
  if (trailerType === 'lowboy') {
    if (!hasLicense(state, 'heavy_haul')) return 'Missing Company Permit: Heavy Abnormal Permit (Buy in HQ)';
    if (!driverCerts.includes('Heavy Haul')) return `Driver ${driver.name} lacks Heavy Haul endorsement`;
  }
  if (trailerType === 'double_trailer') {
    if (!hasLicense(state, 'lcv_double')) return 'Missing Company Permit: LCV Double Trailer Authority (Buy in HQ)';
    if (!driverCerts.includes('Double Trailer LCV')) return `Driver ${driver.name} lacks Double Trailer LCV endorsement`;
  }
  if (trailerType === 'tipper' && !hasLicense(state, 'bulk_tipper')) {
    return 'Missing Company Permit: Bulk Tipper Authority (Buy in HQ)';
  }
  if (trailerType === 'container' && !hasLicense(state, 'intermodal_container')) {
    return 'Missing Company Permit: Intermodal Container Authority (Buy in HQ)';
  }
  if (cargo?.isFragile && (cargo.baseValue || 0) > 30) {
    if (!hasLicense(state, 'high_value')) return 'Missing Company Permit: High-Value Goods Authority (Buy in HQ)';
    if (!driverCerts.includes('High-Value Fragile')) return `Driver ${driver.name} lacks High-Value Fragile certification`;
  }

  return null;
}
