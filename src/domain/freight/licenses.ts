import { set } from '../../core/store';
import { toast } from '../../core/ui';
import { pushNote } from '../../systems/notify';

export interface FreightLicense {
  id: string;
  name: string;
  code: string;
  icon: string;
  price: number;
  description: string;
  requiredFor: string;
  regulatoryBody: string;
}

export const FREIGHT_LICENSES: Record<string, FreightLicense> = {
  standard: {
    id: 'standard',
    name: 'General Commercial Freight Authority',
    code: 'FMCSA-GCF-01',
    icon: '🚚',
    price: 0,
    description: 'Basic carrier authority for non-hazardous palletized, boxed, and dry freight.',
    requiredFor: 'Standard dry vans and curtainside trailers',
    regulatoryBody: 'Federal Motor Carrier Safety Administration'
  },
  adr_hazmat: {
    id: 'adr_hazmat',
    name: 'ADR Hazardous Materials & Petrochem Authority',
    code: 'ADR-CLASS-1-9',
    icon: '☣️',
    price: 45000,
    description: 'Statutory certificate permitting the transit of ADR Classes 1 through 9 (chemicals, fuels, toxic waste, flammable gases). Consignor terminal tankers furnished on dispatch.',
    requiredFor: 'Petrochemicals, industrial acids, toxic waste, liquid oxygen, lithium battery packs',
    regulatoryBody: 'UNECE European Dangerous Goods Agreement'
  },
  cold_chain: {
    id: 'cold_chain',
    name: 'Sanitary Cold-Chain & GDP Pharma Authority',
    code: 'GDP-SAN-22',
    icon: '❄️',
    price: 20000,
    description: 'Sanitary temperature-compliance permit for certified refrigerated transit of pharmaceuticals, vaccines, and deep-freeze perishables.',
    requiredFor: 'Frozen seafood, clinical vaccines, temperature-controlled electronics',
    regulatoryBody: 'Good Distribution Practice (GDP) & FDA Food Safety'
  },
  heavy_haul: {
    id: 'heavy_haul',
    name: 'Overdimensional & Heavy Machinery Permit',
    code: 'OD-PERMIT-SPEC',
    icon: '🏗️',
    price: 30000,
    description: 'Specialized state and international corridor permit allowing gross transport exceeding 44 tonnes on multi-axle lowboys and heavy extendables.',
    requiredFor: 'Excavators, wind turbine blades, 45t electrical transformers, aerospace engines',
    regulatoryBody: 'Department of Transportation Special Permits Division'
  },
  lcv_double: {
    id: 'lcv_double',
    name: 'Long Combination Vehicle (Double Trailer LCV) Permit',
    code: 'LCV-B-TRAIN',
    icon: '🚛',
    price: 35000,
    description: 'Highway freight authority allowing articulated multi-trailer B-Train and A-Double configurations on designated logistics turnpikes.',
    requiredFor: 'High-cube retail logistics, double-trailer FMCG consignments',
    regulatoryBody: 'Interstate Commerce Freight Commission'
  },
  bulk_tipper: {
    id: 'bulk_tipper',
    name: 'Heavy Aggregates & Mineral Tipper License',
    code: 'MIN-BULK-TIP',
    icon: '⛰️',
    price: 15000,
    description: 'Permit for off-highway quarry haulage, industrial dumping, and heavy minerals bulk transport.',
    requiredFor: 'Quarry granite, bauxite, raw mineral ores, demolition aggregate',
    regulatoryBody: 'Bureau of Mining & Environmental Transit'
  },
  high_value: {
    id: 'high_value',
    name: 'Bonded High-Value & Secured Cargo Transit Bond',
    code: 'SEC-BOND-99',
    icon: '💎',
    price: 25000,
    description: 'Underwritten insurance transit bond for high-risk, ultra-fragile, and priceless industrial artifacts.',
    requiredFor: 'Central bank bullion, cryogenic mainframes, aerospace prototypes',
    regulatoryBody: 'Lloyds Underwritten Transit Security'
  }
};

export function hasLicense(S: any, licenseId: string): boolean {
  if (licenseId === 'standard') return true;
  const list = S.licenses || ['standard'];
  return list.includes(licenseId);
}

export function buyLicense(licenseId: string): boolean {
  const lic = FREIGHT_LICENSES[licenseId];
  if (!lic) return false;

  let purchased = false;
  set(S => {
    if (!S.licenses) S.licenses = ['standard'];
    if (S.licenses.includes(licenseId)) {
      toast('Company already owns this license', 'err');
      return;
    }
    if (S.money < lic.price) {
      toast(`Insufficient funds. Needs $${lic.price.toLocaleString()}`, 'err');
      return;
    }

    S.money -= lic.price;
    S.licenses.push(licenseId);
    purchased = true;
    pushNote(S, `${lic.name} (${lic.code}) officially registered to ${S.company}.`, { title: 'LICENSING AUTHORITY', type: 'compliance', priority: 1 });
    toast(`Acquired: ${lic.name}!`, 'success');
  });

  return purchased;
}
