import { ic } from '../core/icons';
import { action, fmt, toast } from '../core/ui';
import { refresh } from '../core/store';
import { TRUCK_MODELS, TRAILERS, TRAILER_PRICES } from '../domain/trucks/trucks.data';
import { TrailerType, TruckModel } from '../domain/trucks/trucks.types';
import { buyTruckBatch, buyTrailerToYard } from '../systems/fleet';
import { slots } from '../systems/offices';
import { CITIES } from '../data/world';
import { getTruckSilhouetteSvg, getTrailerSilhouetteSvg } from '../domain/trucks/trucks.visuals';
import { getManufacturerLogoSvg } from '../domain/trucks/trucks.logos';

// State for manufacturer showroom, trailer depot and truck configurator
let dealershipSection: 'tractors' | 'trailers' = 'tractors';
let activeShowroomBrand: string | null = null;
let activeChassisFilter: string = 'all';
let selectedModelKey: string | null = null;
let configQuantity = 1;
let configTrailer: TrailerType | 'none' = 'none';
let configDestination = 'LAGOS';

// Mature, Authentic Manufacturer Profile Metadata
export interface ManufacturerInfo {
  name: string;
  region: 'Europe' | 'America' | 'Asia';
  country: string;
  city: string;
  founded: number;
  tagline: string;
  description: string;
}

export const MANUFACTURERS: Record<string, ManufacturerInfo> = {
  'Scania': {
    name: 'Scania',
    region: 'Europe',
    country: 'Sweden',
    city: 'Södertälje',
    founded: 1891,
    tagline: 'King of the Road · Heavy Duty V8 Powertrains',
    description: 'Renowned for supreme driver ergonomics, modular chassis architecture, and the legendary DC16 16.4L V8 engine family producing up to 770 HP.'
  },
  'Volvo': {
    name: 'Volvo',
    region: 'Europe',
    country: 'Sweden',
    city: 'Gothenburg',
    founded: 1928,
    tagline: 'Driven by Quality, Safety & Heavy Commercial Power',
    description: 'Pioneers of the I-Shift Dual Clutch transmission, active safety suites, Globetrotter extended cabs, and high-displacement D16K heavy haulers.'
  },
  'Mercedes-Benz': {
    name: 'Mercedes-Benz',
    region: 'Europe',
    country: 'Germany',
    city: 'Stuttgart',
    founded: 1896,
    tagline: 'The Standard of Commercial Transport Excellence',
    description: 'Precision German transport engineering featuring Predictive Powertrain Control, ergonomic GigaSpace cabs, and fuel-optimized OM 471/473 turbodiesels.'
  },
  'MAN': {
    name: 'MAN',
    region: 'Europe',
    country: 'Germany',
    city: 'Munich',
    founded: 1758,
    tagline: 'Simply My Truck · Built with the Strength of the Lion',
    description: 'Heavy commercial vehicles engineered for maximum uptime, high-cube long-distance transit, and extreme vocational construction tippers.'
  },
  'DAF': {
    name: 'DAF',
    region: 'Europe',
    country: 'Netherlands',
    city: 'Eindhoven',
    founded: 1928,
    tagline: 'Driven by Quality · Executive Long-Haul Living Space',
    description: 'European market benchmark for executive cab volume in the XG+ flagship, powered by high-efficiency PACCAR MX-11 and MX-13 engines.'
  },
  'Kenworth': {
    name: 'Kenworth',
    region: 'America',
    country: 'United States',
    city: 'Kirkland, Washington',
    founded: 1923,
    tagline: 'The World’s Best · American Long-Hood Heritage',
    description: 'Handcrafted conventional class 8 tractors, 86-inch studio sleeper compartments, dual vertical chrome exhaust stacks, and Cummins X15 power.'
  },
  'Peterbilt': {
    name: 'Peterbilt',
    region: 'America',
    country: 'United States',
    city: 'Denton, Texas',
    founded: 1939,
    tagline: 'Class Pays · The Quintessential American Highway Rig',
    description: 'The storied red oval emblem, extended aluminum hoods, custom chrome appointments, and unrivaled durability across interstate corridors.'
  },
  'Freightliner': {
    name: 'Freightliner',
    region: 'America',
    country: 'United States',
    city: 'Portland, Oregon',
    founded: 1942,
    tagline: 'Run Smart · North America’s Interstate Fleet Benchmark',
    description: 'The most ubiquitous heavy commercial tractor on highway lanes, pairing integrated Detroit DD15/DD16 powertrains with automated DT12 gearing.'
  },
  'Mack': {
    name: 'Mack',
    region: 'America',
    country: 'United States',
    city: 'Greensboro, North Carolina',
    founded: 1900,
    tagline: 'Born Ready · Heavy-Duty American Bulldog Muscle',
    description: 'Purpose-built for severe duty and cross-country freight, equipped with high-torque Mack MP8 engines and mDRIVE heavy-duty automated systems.'
  },
  'Hino': {
    name: 'Hino',
    region: 'Asia',
    country: 'Japan',
    city: 'Hino, Tokyo',
    founded: 1942,
    tagline: 'Quality, Durability, Reliability · Precision Commercial Diesels',
    description: 'Commercial vehicle division of Toyota Group, famed for extraordinary powertrain longevity, low operating costs, and Pro Shift transmissions.'
  },
  'Isuzu': {
    name: 'Isuzu',
    region: 'Asia',
    country: 'Japan',
    city: 'Yokohama',
    founded: 1916,
    tagline: 'Trucks for Life · Global Commercial Diesel Authority',
    description: 'Global diesel specialist manufacturing robust heavy-duty Giga prime movers and high-payload forward-control cabover chassis.'
  },
  'Iveco': {
    name: 'Iveco',
    region: 'Europe',
    country: 'Italy',
    city: 'Turin',
    founded: 1975,
    tagline: 'Drive the New Way · European Transport Efficiency',
    description: 'Aerodynamic S-WAY flagship highway tractors and severe-service T-WAY heavy tippers powered by responsive FPT Cursor diesel engines.'
  }
};

action('dealership-section', d => {
  dealershipSection = (d as any).section;
  refresh();
});

action('buy-depot-trailer', d => {
  buyTrailerToYard((d as any).trailer as TrailerType);
  refresh();
});

action('open-showroom', d => {
  activeShowroomBrand = (d as any).brand;
  activeChassisFilter = 'all';
  refresh();
});

action('close-showroom', () => {
  activeShowroomBrand = null;
  selectedModelKey = null;
  refresh();
});

action('filter-chassis', d => {
  activeChassisFilter = (d as any).chassis;
  refresh();
});

action('inspect-truck', d => {
  selectedModelKey = (d as any).model;
  configQuantity = 1;
  const m = selectedModelKey ? TRUCK_MODELS[selectedModelKey] : null;
  configTrailer = m && m.haul.length > 0 ? m.haul[0] : 'none';
  configDestination = 'LAGOS';
  refresh();
});

action('close-truck-modal', () => {
  selectedModelKey = null;
  refresh();
});

action('config-qty-sub', () => {
  if (configQuantity > 1) configQuantity--;
  refresh();
});

action('config-qty-add', () => {
  configQuantity++;
  refresh();
});

action('config-trailer', d => {
  configTrailer = (d as any).trailer;
  refresh();
});

action('config-dest', d => {
  configDestination = (d as any).city;
  refresh();
});

action('execute-batch-buy', () => {
  if (!selectedModelKey) return;
  const tType = configTrailer === 'none' ? null : (configTrailer as TrailerType);
  buyTruckBatch(selectedModelKey, tType, configQuantity, configDestination);
  selectedModelKey = null;
  refresh();
});

// Render a mature, executive manufacturer card for the main directory
function renderManufacturerCard(brandKey: string, info: ManufacturerInfo, models: [string, TruckModel][]) {
  const brandModels = models.filter(([_, m]) => m.brand === brandKey);
  const modelCount = brandModels.length;
  if (modelCount === 0) return '';

  const prices = brandModels.map(([_, m]) => m.price);
  const minPrice = Math.min(...prices);
  const hps = brandModels.map(([_, m]) => m.engine.hp);
  const minHp = Math.min(...hps);
  const maxHp = Math.max(...hps);
  const representativeModel = brandModels[0][1];

  return `
    <div class="card" style="margin-bottom:14px; background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:16px; cursor:pointer; position:relative; overflow:hidden; transition:border-color 0.2s;" data-act="open-showroom" data-brand="${brandKey}">
      
      <!-- Top Section: Authentic Manufacturer Logo & Headquarters Metadata -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <!-- Authentic Vector Logo -->
          <div style="width:72px; height:46px; background:#080c16; border:1px solid #1a2336; border-radius:8px; display:grid; place-items:center; flex-shrink:0; padding:3px;">
            ${getManufacturerLogoSvg(brandKey, 64, 40)}
          </div>
          <div>
            <div style="font-size:9px; color:var(--mu); font-family:monospace; text-transform:uppercase; letter-spacing:0.5px;">
              ${info.city}, ${info.country} · EST. ${info.founded}
            </div>
            <div style="font-size:18px; font-weight:900; color:var(--tx); letter-spacing:0.3px; margin-top:1px;">
              ${info.name}
            </div>
          </div>
        </div>

        <!-- Inventory Count -->
        <div style="text-align:right;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace;">SHOWROOM ASSETS</div>
          <div style="font-size:14px; font-weight:900; color:var(--tx); font-family:monospace;">
            ${modelCount} <span style="font-size:10px; color:var(--mu); font-weight:600;">MODELS</span>
          </div>
        </div>
      </div>

      <!-- Tagline & Engineering Philosophy -->
      <div style="font-size:11px; font-weight:700; color:var(--gold); margin-bottom:4px;">
        ${info.tagline}
      </div>
      <div style="font-size:11px; color:var(--mu); line-height:1.5; margin-bottom:12px;">
        ${info.description}
      </div>

      <!-- Technical Silhouette Graphic Preview -->
      <div style="background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:6px 12px; margin-bottom:12px; display:flex; justify-content:center; align-items:center;">
        ${getTruckSilhouetteSvg(representativeModel, 'var(--gold)', representativeModel.axle)}
      </div>

      <!-- Bottom Specs & Enter Button -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
        <div style="display:flex; gap:16px; font-size:10px; color:var(--mu); font-family:monospace;">
          <div>
            <span style="display:block; font-size:8px; text-transform:uppercase;">POWER RANGE</span>
            <span style="font-weight:800; color:var(--tx);">${minHp} – ${maxHp} HP</span>
          </div>
          <div>
            <span style="display:block; font-size:8px; text-transform:uppercase;">ENTRY PRICING</span>
            <span style="font-weight:800; color:var(--grn);">${fmt(minPrice)}</span>
          </div>
        </div>

        <button class="btn alt" style="padding:6px 14px; font-size:10px; font-weight:800; border-radius:4px; letter-spacing:0.5px; text-transform:uppercase; display:inline-flex; align-items:center; gap:6px;">
          ENTER SHOWROOM ${ic('chev')}
        </button>
      </div>
    </div>
  `;
}

// Render an individual truck card within a manufacturer showroom
function renderShowroomTruckCard(S: any, k: string, m: TruckModel) {
  const engineDesc = m.engine.cylinders === 8 ? `${m.engine.displacement}L V8 Twin-Turbo` : `${m.engine.displacement}L Inline-6 Turbo`;
  const axleLabel = m.axle === '6x4' ? '6x4 Heavy Tandem' : m.axle === '4x2' ? '4x2 Highway Tractor' : m.axle === '8x4' ? '8x4 Severe Construction' : m.axle;

  return `
    <div class="card" style="padding:16px; margin-bottom:14px; background:#0e1320; border:1px solid #1e2638; border-radius:10px; cursor:pointer; transition:all 0.2s;" data-act="inspect-truck" data-model="${k}">
      <!-- Truck Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; font-size:9px; color:var(--mu); font-family:monospace; text-transform:uppercase;">
            <span>${axleLabel}</span>
            <span>·</span>
            <span style="color:var(--gold); font-weight:800;">${m.engine.fuelType}</span>
          </div>
          <div style="font-size:16px; font-weight:900; color:var(--tx); margin-top:2px;">
            ${m.brand} ${m.name}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace;">MSRP INVOICE</div>
          <div style="font-size:16px; font-weight:900; color:var(--grn); font-family:monospace;">
            ${fmt(m.price)}
          </div>
        </div>
      </div>

      <!-- Authentic Technical Blueprint Illustration -->
      <div style="background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:center; align-items:center;">
        ${getTruckSilhouetteSvg(m, 'var(--gold)', m.axle)}
      </div>

      <!-- OEM Engineering Specifications Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; margin-bottom:12px; font-size:11px; background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
        <div>
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">POWERTRAIN & ARCHITECTURE</div>
          <div style="font-weight:800; color:var(--tx); font-family:monospace; margin-top:1px;">${m.engine.name} (${engineDesc})</div>
        </div>
        <div>
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">RATED POWER & TORQUE</div>
          <div style="font-weight:800; color:var(--gold); font-family:monospace; margin-top:1px;">${m.engine.hp} HP @ 1,900 · ${m.engine.torque} Nm</div>
        </div>
        <div>
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">TRANSMISSION & DRIVELINE</div>
          <div style="font-weight:800; color:var(--tx); font-family:monospace; margin-top:1px;">${m.trans} · ${m.axle}</div>
        </div>
        <div>
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-weight:700;">MASS & CAPACITIES</div>
          <div style="font-weight:800; color:var(--tx); font-family:monospace; margin-top:1px;">${m.maxGVW}t GCWR · ${m.tankSize}L Dual Tank</div>
        </div>
      </div>

      <!-- Footer: Haul compatibility & Config CTA -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:10px; color:var(--mu); display:flex; align-items:center; gap:4px; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span style="color:var(--gold); font-weight:800;">HAUL:</span>
          <span>${m.haul.map((h: string) => TRAILERS[h as keyof typeof TRAILERS] || h).join(', ')}</span>
        </div>
        <button class="btn gold" style="padding:6px 14px; font-size:10px; font-weight:900; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
          SPECIFY & ORDER →
        </button>
      </div>
    </div>
  `;
}

export default {
  id: 'dealership',
  icon: 'truck',
  label: 'Dealership',
  desc: 'Commercial OEM Heavy Vehicle Dealerships',
  render: (S: any) => {
    const models = Object.entries(TRUCK_MODELS);
    const inspectedModel = selectedModelKey ? TRUCK_MODELS[selectedModelKey] : null;

    // Calculate totals for configurator modal
    const trailerPrice = configTrailer !== 'none' ? (TRAILER_PRICES[configTrailer as TrailerType] || 15000) : 0;
    const unitPrice = inspectedModel ? inspectedModel.price + trailerPrice : 0;
    const totalPrice = unitPrice * configQuantity;
    const canAfford = S.money >= totalPrice;
    const hasSpace = S.fleet.length + configQuantity <= slots(S);

    // ================= SHOWROOM VIEW (Single Manufacturer) =================
    if (activeShowroomBrand) {
      const info = MANUFACTURERS[activeShowroomBrand] || {
        name: activeShowroomBrand,
        region: 'Europe',
        country: 'Global',
        city: 'HQ',
        founded: 1900,
        tagline: 'Precision Commercial Heavy Vehicles',
        description: 'Commercial class 8 transport and vocational chassis.'
      };

      let brandModels = models.filter(([_, m]) => m.brand === activeShowroomBrand);

      // Chassis filter
      if (activeChassisFilter === '4x2') {
        brandModels = brandModels.filter(([_, m]) => m.axle === '4x2');
      } else if (activeChassisFilter === '6x4') {
        brandModels = brandModels.filter(([_, m]) => m.axle === '6x4');
      } else if (activeChassisFilter === 'heavy') {
        brandModels = brandModels.filter(([_, m]) => m.axle === '8x4' || m.maxGVW >= 55);
      }

      return `
        <!-- Top Back Navigation -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <button class="btn alt" style="padding:6px 12px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:6px;" data-act="close-showroom">
            ${ic('back')} ALL OEM MANUFACTURERS
          </button>
          <div style="font-size:10px; color:var(--mu); font-family:monospace;">
            FLEET BERTHS: <b style="color:var(--tx);">${S.fleet.length} / ${slots(S)}</b>
          </div>
        </div>

        <!-- Executive Showroom Hero Banner -->
        <div style="background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:20px; margin-bottom:16px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:14px;">
            <div style="display:flex; align-items:center; gap:16px;">
              <!-- Large Authentic Manufacturer Logo -->
              <div style="width:84px; height:56px; background:#080c16; border:1px solid #1a2336; border-radius:8px; display:grid; place-items:center; flex-shrink:0; padding:4px;">
                ${getManufacturerLogoSvg(activeShowroomBrand, 76, 48)}
              </div>
              <div>
                <div style="display:flex; align-items:center; gap:6px; font-size:10px; color:var(--gold); font-family:monospace; text-transform:uppercase; letter-spacing:1px; font-weight:800;">
                  <span>OFFICIAL FACTORY SHOWROOM</span>
                  <span>·</span>
                  <span>${info.country.toUpperCase()}</span>
                </div>
                <h2 style="margin:2px 0 1px; font-size:24px; font-weight:900; color:var(--tx); letter-spacing:0.3px;">
                  ${info.name}
                </h2>
                <div style="font-size:11px; color:var(--mu); font-weight:600;">
                  ${info.city}, ${info.country} · Founded ${info.founded}
                </div>
              </div>
            </div>

            <!-- Showroom Lineup Count -->
            <div style="text-align:right;">
              <div style="font-size:9px; color:var(--mu); text-transform:uppercase; font-family:monospace;">LINEUP</div>
              <div style="font-size:18px; font-weight:900; color:var(--gold); font-family:monospace;">
                ${brandModels.length}
              </div>
            </div>
          </div>

          <div style="font-size:12px; font-weight:700; color:var(--gold); margin-bottom:4px;">
            ${info.tagline}
          </div>
          <div style="font-size:11px; color:var(--mu); line-height:1.5; margin-bottom:14px;">
            ${info.description}
          </div>

          <!-- Showroom Statistics Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:8px 12px; font-size:10px; font-family:monospace;">
            <div>
              <span style="color:var(--mu);">WARRANTY</span>
              <div style="font-size:12px; font-weight:800; color:var(--tx);">5-Year / 1,000,000 km</div>
            </div>
            <div>
              <span style="color:var(--mu);">DELIVERY TRANSIT</span>
              <div style="font-size:12px; font-weight:800; color:var(--gold);">Immediate Depot Dispatch</div>
            </div>
            <div>
              <span style="color:var(--mu);">TELEMATICS</span>
              <div style="font-size:12px; font-weight:800; color:var(--grn);">SAE J1939 Gateway</div>
            </div>
          </div>
        </div>

        <!-- Chassis Configuration Filter Tabs -->
        <div style="display:flex; gap:6px; margin-bottom:14px; overflow-x:auto; padding-bottom:4px;">
          <button class="btn ${activeChassisFilter === 'all' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="filter-chassis" data-chassis="all">
            All Chassis Types (${models.filter(([_, m]) => m.brand === activeShowroomBrand).length})
          </button>
          <button class="btn ${activeChassisFilter === '6x4' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="filter-chassis" data-chassis="6x4">
            6x4 Tandem Drive
          </button>
          <button class="btn ${activeChassisFilter === '4x2' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="filter-chassis" data-chassis="4x2">
            4x2 Highway Tractor
          </button>
          <button class="btn ${activeChassisFilter === 'heavy' ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="filter-chassis" data-chassis="heavy">
            Heavy Haul & Severe Duty
          </button>
        </div>

        <!-- Truck Cards in Showroom -->
        ${brandModels.length > 0 ? brandModels.map(([k, m]) => renderShowroomTruckCard(S, k, m)).join('') : `
          <div style="background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:28px; text-align:center; color:var(--mu); font-size:11px; font-family:monospace;">
            NO MODELS CURRENTLY IN THIS CHASSIS FILTER CATEGORY.
          </div>
        `}

        ${renderConfiguratorModal(S, inspectedModel, totalPrice, canAfford, hasSpace)}
        <div style="height:20px;"></div>
      `;
    }

    // ================= MAIN DIRECTORY VIEW (All Manufacturers) =================
    const regions = [
      { name: 'Europe', label: 'European Heavy Commercial Manufacturers', brands: ['Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'DAF', 'Iveco'] },
      { name: 'America', label: 'American Long-Haul Highway Manufacturers', brands: ['Kenworth', 'Peterbilt', 'Freightliner', 'Mack'] },
      { name: 'Asia', label: 'Asian Severe Duty & Regional Manufacturers', brands: ['Hino', 'Isuzu'] }
    ];

    return `
      <!-- Dealership Top Banner & Section Navigation -->
      <div style="background:#0e1320; border:1px solid #1e2638; border-radius:10px; padding:12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
            COMMERCIAL OEM VEHICLE & TRAILER DEALERSHIP
          </div>
          <div style="font-size:14px; font-weight:900; color:var(--tx); margin-top:1px;">
            ${dealershipSection === 'tractors' ? 'Heavy Commercial Tractor Showrooms' : 'Commercial Trailer Equipment Depot'}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:var(--mu); text-transform:uppercase; font-family:monospace;">FLEET / TRAILERS</div>
          <div style="font-size:12px; font-weight:900; color:var(--tx); font-family:monospace;">
            ${S.fleet.length}/${slots(S)} Tractors · <span style="color:var(--gold);">${(S.trailers || []).length} Trailers in Yard</span>
          </div>
        </div>
      </div>

      <!-- Department Toggle Bar -->
      <div style="display:flex; gap:8px; margin-bottom:14px;">
        <button class="btn ${dealershipSection === 'tractors' ? 'gold' : 'alt'}" style="flex:1; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:6px;" data-act="dealership-section" data-section="tractors">
          ${ic('truck')} OEM TRACTOR SHOWROOMS
        </button>
        <button class="btn ${dealershipSection === 'trailers' ? 'gold' : 'alt'}" style="flex:1; padding:8px 12px; font-size:11px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:6px;" data-act="dealership-section" data-section="trailers">
          🏗️ TRAILER EQUIPMENT DEPOT
        </button>
      </div>

      ${dealershipSection === 'trailers' ? renderTrailerDepot(S) : `
        <!-- Manufacturers categorized by Region -->
        ${regions.map(r => `
          <div style="margin:16px 0 8px; font-size:10px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">
            <span>${r.label}</span>
            <span style="flex:1; height:1px; background:rgba(255,255,255,0.08);"></span>
          </div>
          ${r.brands.map(brandKey => {
            const info = MANUFACTURERS[brandKey];
            if (!info) return '';
            return renderManufacturerCard(brandKey, info, models);
          }).join('')}
        `).join('')}
      `}

      ${renderConfiguratorModal(S, inspectedModel, totalPrice, canAfford, hasSpace)}
      <div style="height:20px;"></div>
    `;
  }
};

// Render the Commercial Trailer Depot
function renderTrailerDepot(S: any) {
  const trailerCatalog: { type: TrailerType; name: string; icon: string; price: number; category: string; tare: string; payload: string; suitable: string }[] = [
    { type: 'lowboy', name: 'Multi-Axle Heavy Lowboy', icon: '🏗️', price: 30000, category: 'HEAVY HAUL & INDIVISIBLES', tare: '11.2t', payload: 'Up to 55t', suitable: 'Excavators, Wind Turbine Blades, 45t Transformers, Aerospace Turbofans' },
    { type: 'flatbed', name: 'Heavy Industrial Steel Flatbed', icon: '📦', price: 12000, category: 'STRUCTURAL CARGO', tare: '6.4t', payload: 'Up to 36t', suitable: 'Structural Steel, Heavy Pipes, Machinery, Construction' },
    { type: 'reefer', name: 'Refrigerated Cold-Chain Reefer', icon: '❄️', price: 24000, category: 'TEMPERATURE CONTROLLED (-30°C to +25°C)', tare: '8.5t', payload: 'Up to 32t', suitable: 'Frozen Seafood, Clinical Vaccines, Perishable Produce, Pharma' },
    { type: 'double_trailer', name: 'Double Trailer B-Train LCV', icon: '🚛', price: 36000, category: 'LONG COMBINATION VEHICLE (120 m³)', tare: '14.0t', payload: 'Up to 48t', suitable: 'High-Cube Consumer Goods, FMCG Retail Turnpikes' },
    { type: 'tipper', name: 'Aggregate & Mineral Heavy Tipper', icon: '⛰️', price: 18000, category: 'BULK EARTHWORKS & MINING', tare: '7.8t', payload: 'Up to 40t', suitable: 'Granite Gravel, Bauxite, Raw Mineral Ores, Demolition' },
    { type: 'tanker', name: 'Insulated Foodgrade Liquid Tanker', icon: '💧', price: 20000, category: 'SANITARY LIQUID BULK (34,000L)', tare: '6.8t', payload: 'Up to 34t', suitable: 'Liquid Oxygen, Foodgrade Oils, Milk, Industrial Syrups' },
    { type: 'curtain', name: 'Curtainside Aerodynamic Trailer', icon: '🚚', price: 15000, category: 'GENERAL MERCHANDISE (34 Pallets)', tare: '6.5t', payload: 'Up to 28t', suitable: 'Electronics, Office Furniture, Textiles, Central Bank Bullion' },
    { type: 'container', name: 'Intermodal 40ft Skeletal Chassis', icon: '🚢', price: 16000, category: 'PORT & RAIL INTERMODAL', tare: '4.8t', payload: 'Up to 35t', suitable: 'Standard ISO 40ft Marine Shipping Containers' },
    { type: 'box', name: 'Standard Dry Freight Box Van', icon: '📦', price: 14000, category: 'DRY VAN SECURE CARGO', tare: '7.2t', payload: 'Up to 26t', suitable: 'Packaged Merchandise, Automotive Parts, Dry Goods' },
    { type: 'carrier', name: 'Multi-Deck Auto Car Transporter', icon: '🚗', price: 22000, category: 'AUTOMOTIVE LOGISTICS (8 Vehicles)', tare: '9.8t', payload: 'Up to 22t', suitable: 'Dealership Vehicle Transfers & New European SUVs' }
  ];

  return `
    <!-- Hazmat Consignor Supplied Information Notice -->
    <div style="background:linear-gradient(135deg, #111827 0%, #0c1220 100%); border:1px solid rgba(239,68,68,0.35); border-radius:10px; padding:12px 16px; margin-bottom:14px;">
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <span style="font-size:22px; flex-shrink:0;">☣️</span>
        <div>
          <div style="font-size:11px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:0.5px;">
            ADR HAZMAT & CHEMICAL TANKER LOGISTICS POLICY
          </div>
          <div style="font-size:10px; color:var(--mu); font-family:monospace; line-height:1.4; margin-top:2px;">
            As mandated by international dangerous goods transport protocols, certified <b>Chemical & Petrochemical Tankers</b> are supplied directly by consignor loading terminals at zero capital cost. Carriers only require corporate <b>ADR License Authority</b> and an <b>ADR Certified Driver</b>.
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Facility Status Bar -->
    <div style="background:#070a12; border:1px solid #161e2e; border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:monospace;">
      <div>
        <span style="color:var(--mu);">CENTRAL STORAGE YARD:</span>
        <b style="color:var(--gold); margin-left:4px;">${(S.trailers || []).length} TRAILERS STAGED AT HQ</b>
      </div>
      <div>
        <span style="color:var(--mu);">OPERATING CAPITAL:</span>
        <b style="color:var(--grn); margin-left:4px;">${fmt(S.money)}</b>
      </div>
    </div>

    <!-- Trailer Cards List -->
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${trailerCatalog.map(t => {
        const ownedCount = (S.trailers || []).filter((x: string) => x === t.type).length;
        const canAfford = S.money >= t.price;

        return `
          <div class="card" style="padding:14px; background:#0e1320; border:1px solid #1e2638; border-radius:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                <div style="width:40px; height:40px; background:#080c16; border:1px solid #1a2336; border-radius:8px; display:grid; place-items:center; font-size:20px; flex-shrink:0;">
                  ${t.icon}
                </div>
                <div style="min-width:0;">
                  <div style="font-size:9px; color:var(--gold); font-weight:800; font-family:monospace;">
                    ${t.category}
                  </div>
                  <div style="font-size:14px; font-weight:900; color:var(--tx); margin-top:1px;">
                    ${t.name}
                  </div>
                  <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:2px;">
                    Tare: <b>${t.tare}</b> · Capacity: <b>${t.payload}</b>
                  </div>
                </div>
              </div>

              <div style="text-align:right; flex-shrink:0;">
                <div style="font-size:8px; color:var(--mu); font-family:monospace; text-transform:uppercase;">UNIT PRICE</div>
                <div style="font-size:15px; font-weight:900; color:var(--grn); font-family:monospace;">
                  ${fmt(t.price)}
                </div>
                <div style="font-size:9px; color:${ownedCount > 0 ? 'var(--gold)' : 'var(--mu)'}; font-family:monospace; margin-top:2px;">
                  HQ Yard: <b>${ownedCount} owned</b>
                </div>
              </div>
            </div>

            <!-- Technical Commercial Trailer Blueprint Illustration -->
            <div style="background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:6px 12px; margin-bottom:10px; display:flex; justify-content:center; align-items:center; min-height:60px;">
              ${getTrailerSilhouetteSvg(t.type, 'var(--gold)')}
            </div>

            <div style="font-size:10px; color:var(--mu); background:#070a12; border:1px solid #161e2e; border-radius:6px; padding:6px 10px; margin-bottom:10px; font-family:monospace;">
              <span style="color:var(--tx); font-weight:700;">SUITABLE FOR:</span> ${t.suitable}
            </div>

            <button class="btn gold" style="width:100%; padding:8px; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;" data-act="buy-depot-trailer" data-trailer="${t.type}" ${!canAfford ? 'disabled' : ''}>
              ${canAfford ? `PURCHASE FOR HQ STORAGE YARD (${fmt(t.price)})` : 'INSUFFICIENT FUNDS'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Render the Factory Purchase Order & Configurator Modal
function renderConfiguratorModal(S: any, inspectedModel: TruckModel | null, totalPrice: number, canAfford: boolean, hasSpace: boolean) {
  if (!inspectedModel || !selectedModelKey) return '';

  const trailerPrice = configTrailer !== 'none' ? (TRAILER_PRICES[configTrailer as TrailerType] || 15000) : 0;

  return `
    <div style="position:fixed; inset:0; background:rgba(5,8,18,0.92); backdrop-filter:blur(4px); z-index:1500; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0f172a; border:2px solid var(--gold); border-radius:12px; width:100%; max-width:440px; max-height:92vh; overflow-y:auto; padding:18px; position:relative; box-shadow:0 25px 60px rgba(0,0,0,0.9);">
        <!-- Close Modal -->
        <button style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:var(--mu); font-size:14px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;" data-act="close-truck-modal">✕</button>
        
        <!-- Order Header with Brand Logo -->
        <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:14px; display:flex; align-items:center; gap:12px;">
          <div style="width:60px; height:40px; background:#080c16; border:1px solid #1a2336; border-radius:6px; display:grid; place-items:center; flex-shrink:0; padding:2px;">
            ${getManufacturerLogoSvg(inspectedModel.brand, 54, 34)}
          </div>
          <div>
            <div style="font-size:9px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">FACTORY PURCHASE SPECIFICATION</div>
            <h3 style="margin:2px 0 1px; font-size:16px; font-weight:900; color:var(--tx);">${inspectedModel.brand} ${inspectedModel.name}</h3>
            <div style="font-size:10px; color:var(--mu); font-family:monospace;">${inspectedModel.region} Spec · ${inspectedModel.axle} Chassis · GCWR ${inspectedModel.maxGVW}t</div>
          </div>
        </div>

        <!-- Vehicle Blueprint Graphic (Connected Rig or Bobtail) -->
        <div style="background:#060a14; border:1px solid #1e293b; border-radius:8px; padding:8px 14px; margin-bottom:14px; min-height:68px; display:flex; align-items:center; justify-content:center;">
          ${getTruckSilhouetteSvg(inspectedModel, 'var(--gold)', inspectedModel.axle, configTrailer)}
        </div>

        <!-- 1. Trailer Attachment Specification -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:10px; font-weight:800; color:var(--tx); text-transform:uppercase; letter-spacing:0.5px;">1. Fifth-Wheel Trailer Coupling</span>
            <span style="font-size:10px; color:var(--mu); font-family:monospace;">${configTrailer === 'none' ? 'Tractor Only' : (TRAILERS[configTrailer as keyof typeof TRAILERS] || configTrailer)}</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button class="btn ${configTrailer === 'none' ? 'gold' : 'alt'}" style="padding:6px 10px; font-size:10px; font-weight:800;" data-act="config-trailer" data-trailer="none">
              Bobtail (No Trailer)
            </button>
            ${inspectedModel.haul.map((h: string) => `
              <button class="btn ${configTrailer === h ? 'gold' : 'alt'}" style="padding:6px 10px; font-size:10px; font-weight:800;" data-act="config-trailer" data-trailer="${h}">
                ${TRAILERS[h as keyof typeof TRAILERS] || h} (+${fmt(TRAILER_PRICES[h as TrailerType] || 15000)})
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Delivery Destination Depot -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:10px; font-weight:800; color:var(--tx); text-transform:uppercase; letter-spacing:0.5px;">2. Terminal Depot Delivery</span>
            <span style="font-size:10px; color:var(--gold); font-family:monospace; font-weight:700;">${configDestination} DEPOT</span>
          </div>
          <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;">
            ${Object.keys(CITIES).map(city => `
              <button class="btn ${configDestination === city ? 'gold' : 'alt'}" style="padding:6px 12px; font-size:10px; font-weight:800; white-space:nowrap;" data-act="config-dest" data-city="${city}">
                ${city}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. Fleet Order Batch Quantity Stepper -->
        <div style="background:#141f36; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:11px; font-weight:800; color:var(--tx); text-transform:uppercase;">Procurement Quantity</div>
            <div style="font-size:9px; color:var(--mu); font-family:monospace; margin-top:1px;">
              Berths Available: ${slots(S) - S.fleet.length} units
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn alt" style="width:30px; height:30px; padding:0; font-weight:900;" data-act="config-qty-sub">-</button>
            <span style="font-size:16px; font-weight:900; color:var(--gold); font-family:monospace; min-width:28px; text-align:center;">${configQuantity}</span>
            <button class="btn alt" style="width:30px; height:30px; padding:0; font-weight:900;" data-act="config-qty-add">+</button>
          </div>
        </div>

        <!-- Commercial Invoice Summary -->
        <div style="background:#0a0f1d; border:1px solid var(--line); border-radius:8px; padding:12px; margin-bottom:16px; font-size:11px; line-height:1.6;">
          <div style="font-size:9px; font-weight:800; color:var(--mu); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:4px;">
            COMMERCIAL INVOICE ITEMIZED BREAKDOWN
          </div>
          <div style="display:flex; justify-content:space-between; color:var(--mu);">
            <span>Base Tractor Unit MSRP (${configQuantity}x):</span>
            <span style="font-family:monospace; color:var(--tx);">${fmt(inspectedModel.price * configQuantity)}</span>
          </div>
          ${trailerPrice > 0 ? `
            <div style="display:flex; justify-content:space-between; color:var(--mu);">
              <span>Coupled Trailer Package (${configQuantity}x):</span>
              <span style="font-family:monospace; color:var(--tx);">${fmt(trailerPrice * configQuantity)}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--tx); border-top:1px solid rgba(255,255,255,0.08); margin-top:6px; padding-top:6px; font-size:12px;">
            <span>Total Capital Investment:</span>
            <span style="font-family:monospace; color:var(--grn); font-size:14px;">${fmt(totalPrice)}</span>
          </div>
        </div>

        <!-- Order Confirmation CTA -->
        <button class="btn gold" style="width:100%; padding:12px; font-size:12px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;" data-act="execute-batch-buy" ${!canAfford || !hasSpace ? 'disabled' : ''}>
          ${!hasSpace ? 'TERMINAL BERTH CAPACITY EXCEEDED' : !canAfford ? 'INSUFFICIENT OPERATING CAPITAL' : `EXECUTE COMMERCIAL PURCHASE (${fmt(totalPrice)})`}
        </button>
      </div>
    </div>
  `;
}
