import { Driver } from '../drivers/drivers.types';
import { Truck } from '../trucks/trucks.types';
import { TRUCK_MODELS } from '../trucks/trucks.data';
import { CARGO_TYPES } from '../freight/cargo/registry';
import { hasLicense } from '../freight/licenses';
import { FreightJob } from '../freight/types';

/**
 * Validates if a truck and its assigned driver are eligible for a specific freight job.
 * 
 * Following NexHaul Engineering Constitution Section 6.4 (Logistics and Dispatch),
 * this performs authoritative operational eligibility checks.
 */
export function getDispatchEligibilityError(
  state: { licenses: string[], subcontractedTrucks?: number[] },
  truck: Truck,
  job: FreightJob,
  driver?: Driver
): string | null {
  // 1. Basic Truck Availability
  if (truck.status !== 'idle') return 'Truck is busy';
  if ((state.subcontractedTrucks || []).includes(truck.id)) {
    return 'Truck is currently leased out on charter sub-contract';
  }

  // 2. Driver Assignment & Eligibility
  if (!truck.driverId || !driver) return 'Assign a CDL driver';
  if (driver.id !== truck.driverId) return 'Inconsistent driver assignment';

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

  // 3. Physical Compatibility (Constitution 6.1)
  const cargo = CARGO_TYPES.find(c => c.id === job.cargoId);
  const trailerType = cargo?.trailer || (job as any).trailer || 'curtain';
  const truckModel = TRUCK_MODELS[truck.modelId];

  if (!truckModel) return 'Unknown truck model configuration';

  // Gross Axle Rating Verification (Gross Vehicle Weight)
  const grossTonnes = (truckModel.baseWeight || 8) + (job.weight || 0);
  if (grossTonnes > (truckModel.maxGVW || 44) && !hasLicense(state, 'heavy_haul')) {
    return `Gross mass (${grossTonnes}t) exceeds chassis max GVW (${truckModel.maxGVW}t). Requires Heavy Abnormal Permit`;
  }

  // 4. Regulatory & Licensing (Constitution 6.4)
  if (cargo?.isHazmat && !hasLicense(state, 'adr_hazmat')) {
    return 'Missing Company License: ADR Hazmat Authority (Buy in HQ)';
  }
  if (cargo?.tempControlled && !hasLicense(state, 'cold_chain')) {
    return 'Missing Company License: Cold Chain Sanitary Authority (Buy in HQ)';
  }
  if (trailerType === 'lowboy' && !hasLicense(state, 'heavy_haul')) {
    return 'Missing Company Permit: Heavy Abnormal Permit (Buy in HQ)';
  }
  if (trailerType === 'double_trailer' && !hasLicense(state, 'lcv_double')) {
    return 'Missing Company Permit: LCV Double Trailer Authority (Buy in HQ)';
  }

  return null;
}
