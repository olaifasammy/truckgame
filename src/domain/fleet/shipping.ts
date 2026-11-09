import { LOCATIONS, RegionName } from '../../data/world';
import { isRegionUnlocked } from '../logistics/network';
import { pushNote } from '../../systems/notify';
import { toast } from '../../core/ui';

export interface MaritimePort {
  cityKey: string;
  portName: string;
  terminal: string;
  region: RegionName;
  harborDepthM: number;
}

export const DEEPWATER_PORTS: Record<string, MaritimePort> = {
  LAGOS: {
    cityKey: 'LAGOS',
    portName: 'Port of Lagos',
    terminal: 'Apapa Container & Ro-Ro Pier',
    region: 'Africa',
    harborDepthM: 14.5
  },
  ROTTERDAM: {
    cityKey: 'ROTTERDAM',
    portName: 'Port of Rotterdam',
    terminal: 'Maasvlakte Europort Ro-Ro Terminal',
    region: 'Europe',
    harborDepthM: 20.0
  },
  LOS_ANGELES: {
    cityKey: 'LOS_ANGELES',
    portName: 'Port of Los Angeles',
    terminal: 'San Pedro Bay Vehicle Distribution Pier',
    region: 'America',
    harborDepthM: 16.0
  },
  DALLAS: {
    cityKey: 'DALLAS',
    portName: 'Houston Ship Channel / Dallas Intermodal',
    terminal: 'Gulf Coast Marine Gate Intermodal',
    region: 'America',
    harborDepthM: 15.0
  },
  TOKYO: {
    cityKey: 'TOKYO',
    portName: 'Port of Tokyo',
    terminal: 'Oi Container & Auto-Carrier Pier',
    region: 'Asia',
    harborDepthM: 15.5
  },
  SHANGHAI: {
    cityKey: 'SHANGHAI',
    portName: 'Port of Shanghai',
    terminal: 'Yangshan Deep-Water Ro-Ro Wharf',
    region: 'Asia',
    harborDepthM: 17.0
  }
};

export interface ShippingQuote {
  originPort: MaritimePort;
  destPort: MaritimePort;
  vesselName: string;
  seaMiles: number;
  oceanFreightCost: number;
  customsFee: number;
  totalCost: number;
  transitDurationMs: number;
}

const CAR_CARRIER_VESSELS = [
  'MV Atlantic Pioneer (Ro-Ro Carrier)',
  'MV Pacific Horizon (Heavy Auto-Hauler)',
  'MV Euro-Afric Trader (Vehicle Transport)',
  'MV Orient Transporter (Deepwater Ro-Ro)'
];

export function getMaritimeShippingQuote(fromCity: string, toPortCity: string): ShippingQuote | null {
  const originPort = DEEPWATER_PORTS[fromCity];
  const destPort = DEEPWATER_PORTS[toPortCity];

  if (!originPort || !destPort) return null;
  if (originPort.region === destPort.region) return null; // Maritime Ro-Ro is exclusively inter-continental

  const key = `${originPort.region}_${destPort.region}`;
  const seaDistances: Record<string, number> = {
    'Africa_Europe': 3800,
    'Europe_Africa': 3800,
    'Africa_America': 5200,
    'America_Africa': 5200,
    'Europe_America': 4100,
    'America_Europe': 4100,
    'Europe_Asia': 8200,
    'Asia_Europe': 8200,
    'America_Asia': 5800,
    'Asia_America': 5800,
    'Africa_Asia': 6400,
    'Asia_Africa': 6400
  };

  const seaMiles = seaDistances[key] || 4500;
  const oceanFreightCost = Math.round(seaMiles * 0.95);
  const customsFee = 650;
  const totalCost = oceanFreightCost + customsFee;
  // 3 minutes (180s) real-time transit
  const transitDurationMs = 180000;

  const vesselIndex = Math.abs((fromCity.charCodeAt(0) + toPortCity.charCodeAt(0)) % CAR_CARRIER_VESSELS.length);
  const vesselName = CAR_CARRIER_VESSELS[vesselIndex];

  return {
    originPort,
    destPort,
    vesselName,
    seaMiles,
    oceanFreightCost,
    customsFee,
    totalCost,
    transitDurationMs
  };
}

export function bookMaritimeShipping(S: any, truckId: number, toPortCity: string): { success: boolean; reason?: string } {
  const t = (S.fleet || []).find((x: any) => x.id === truckId);
  if (!t) return { success: false, reason: 'Tractor not found' };
  if (t.status !== 'idle') return { success: false, reason: 'Tractor is currently busy or in transit' };

  const destPort = DEEPWATER_PORTS[toPortCity];
  if (!destPort) return { success: false, reason: 'Destination is not an international deepwater port' };

  if (!isRegionUnlocked(S, destPort.region)) {
    return { success: false, reason: `Destination continent (${destPort.region}) is not unlocked. Acquire operating authority first.` };
  }

  // Check if truck is at a deepwater port
  const originPort = DEEPWATER_PORTS[t.loc];
  if (!originPort) {
    return { success: false, reason: `Tractor is stationed in ${t.loc}, which is inland. Relocate to an ocean port (e.g. Lagos, Rotterdam, Los Angeles, Tokyo) first.` };
  }

  if (originPort.region === destPort.region) {
    return { success: false, reason: 'Maritime Ro-Ro shipping is exclusively for inter-continental ocean transit.' };
  }

  const quote = getMaritimeShippingQuote(t.loc, toPortCity);
  if (!quote) return { success: false, reason: 'No vessel sailing route available between these ports' };

  if (S.money < quote.totalCost) {
    return { success: false, reason: `Insufficient funds. Maritime ocean freight requires $${quote.totalCost.toLocaleString()}.` };
  }

  // Deduct ocean freight
  S.money -= quote.totalCost;
  const now = Date.now();

  t.status = 'delivering';
  t.loc = toPortCity;
  t.shippingMode = 'maritime_roro';
  t.shippingVessel = quote.vesselName;
  t.shippingOrigin = originPort.portName;
  t.availableAt = now + quote.transitDurationMs;

  pushNote(S, `Booked ${quote.vesselName}: ${t.name} loaded aboard Ro-Ro vessel for ocean voyage from ${originPort.portName} to ${destPort.portName}. Cost: -$${quote.totalCost.toLocaleString()}`, {
    title: 'MARITIME RO-RO BOOKED',
    type: 'ops'
  });

  toast(`🚢 ${t.name} loaded on Ro-Ro Vessel: Sailing to ${destPort.portName}!`, 'success');
  return { success: true };
}
