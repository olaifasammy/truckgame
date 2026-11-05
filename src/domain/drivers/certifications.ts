import { Driver } from './drivers.types';
import { GameState } from '../../types/state';

export interface DriverCertification {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export const DRIVER_CERTIFICATIONS: DriverCertification[] = [
  { id: 'ADR Hazmat', name: 'ADR Hazmat & Chemical Endorsement', icon: '☣️', cost: 6500, desc: 'Authorizes transport of flammable, chemical, and hazardous industrial cargo.' },
  { id: 'Cold Chain', name: 'Cold Chain & Perishables Certification', icon: '❄️', cost: 3500, desc: 'Certified in reefer temperature maintenance, pharmaceuticals, and fresh produce.' },
  { id: 'Heavy Haul', name: 'Heavy Machinery & Lowboy Endorsement', icon: '🏗️', cost: 5000, desc: 'Specialized in multi-axle oversized machinery, ballast, and indvisibles > 25t.' },
  { id: 'Double Trailer LCV', name: 'Long Combination Vehicle (Double Trailer LCV) Endorsement', icon: '🚛', cost: 4500, desc: 'Mastery in multi-articulated B-train and A-double combination highway tractors.' },
  { id: 'High-Value Fragile', name: 'Secured High-Value & Fragile Handling', icon: '💎', cost: 3000, desc: 'Trained in delicate air-ride freight, high-precision electronics, and luxury goods.' }
];

/**
 * Authoritative driver certification logic.
 */
export const DriverCertifications = {
  addCertification(state: GameState, driverId: number, certId: string): string | null {
    const d = state.drivers.find(x => x.id === driverId);
    if (!d) return 'Driver not found';

    const cert = DRIVER_CERTIFICATIONS.find(c => c.id === certId);
    if (!cert) return 'Invalid certification';

    if (d.certifications?.includes(certId)) return 'Driver already holds this endorsement';

    if (state.money < cert.cost) return `Insufficient funds ($${cert.cost.toLocaleString()})`;

    state.money -= cert.cost;
    if (!d.certifications) d.certifications = [];
    d.certifications.push(certId);
    
    return null;
  }
};
