import { LOCATIONS, RegionName, LocationInfo } from '../../data/world';
import { REGIONAL_HUBS } from '../../domain/logistics/network';
import { refresh } from '../../core/store';
import { openTelematicsModal } from '../telematics-modal';
import { homeState } from './state';
import { ic } from '../../core/icons';

if (typeof window !== 'undefined') {
  (window as any).__openTelem = openTelematicsModal;
}
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ROAD_GEOMETRIES: Record<string, [number, number][]> = {
  // Africa Corridors
  'LAGOS-IBADAN': [[6.5244, 3.3792], [6.6500, 3.4200], [6.8500, 3.6500], [7.1500, 3.8500], [7.3775, 3.9470]],
  'LAGOS-ABUJA': [[6.5244, 3.3792], [6.9000, 3.8000], [7.5000, 4.8000], [8.1000, 5.9000], [8.6000, 6.8000], [9.0765, 7.3986]],
  'ABUJA-KANO': [[9.0765, 7.3986], [9.8000, 7.7000], [10.5000, 7.4500], [11.2000, 7.8000], [12.0022, 8.5919]],
  'KANO-MAIDUGURI': [[12.0022, 8.5919], [11.8000, 9.8000], [11.7500, 11.0000], [11.8500, 12.2000], [11.8333, 13.1500]],
  'LAGOS-ENUGU': [[6.5244, 3.3792], [6.6000, 4.5000], [6.3500, 5.6000], [6.2000, 6.7000], [6.4584, 7.5464]],
  'ENUGU-ABUJA': [[6.4584, 7.5464], [7.3000, 7.5000], [8.2000, 7.6000], [9.0765, 7.3986]],

  // Europe Corridors
  'ROTTERDAM-MUNICH': [[51.9244, 4.4777], [51.4300, 6.8800], [50.1100, 8.6800], [49.4500, 11.0700], [48.1351, 11.5820]],
  'MUNICH-INNSBRUCK': [[48.1351, 11.5820], [47.8500, 11.6000], [47.5000, 11.8000], [47.2692, 11.4041]],
  'ROTTERDAM-LYON': [[51.9244, 4.4777], [50.8500, 4.3500], [49.0000, 2.5000], [47.3000, 5.0000], [45.7640, 4.8357]],
  'MUNICH-GOTHENBURG': [[48.1351, 11.5820], [52.5200, 13.4000], [54.1500, 12.1000], [55.6000, 13.0000], [57.7088, 11.9746]],

  // America Corridors
  'CHICAGO-DENVER': [[41.8781, -87.6298], [41.6000, -93.6000], [41.2500, -95.9300], [40.8000, -99.8000], [41.1400, -104.8000], [39.7392, -104.9903]],
  'CHICAGO-DALLAS': [[41.8781, -87.6298], [38.6200, -90.1900], [34.7400, -92.2800], [33.4200, -94.0400], [32.7767, -96.7970]],
  'DALLAS-LOS_ANGELES': [[32.7767, -96.7970], [31.7600, -106.4800], [32.2200, -110.9700], [33.4400, -112.0700], [33.7200, -116.2000], [34.0522, -118.2437]],
  'DENVER-SALT_LAKE_CITY': [[39.7392, -104.9903], [39.6300, -106.0000], [39.0600, -108.5500], [40.7608, -111.8910]],
  'SALT_LAKE_CITY-LOS_ANGELES': [[40.7608, -111.8910], [37.1000, -113.5800], [36.1700, -115.1300], [34.8900, -117.0100], [34.0522, -118.2437]],

  // Asia Corridors
  'TOKYO-NAGOYA': [[35.6762, 139.6503], [35.4400, 139.6300], [35.1500, 138.6800], [34.7000, 137.7300], [35.1815, 136.9066]],
  'TOKYO-NAGANO': [[35.6762, 139.6503], [35.8600, 139.6400], [36.3200, 139.0000], [36.6485, 138.1942]],
  'SHANGHAI-ALMATY': [[31.2304, 121.4737], [34.2600, 108.9400], [36.0600, 103.8300], [43.8200, 87.6100], [43.2220, 76.8512]],
  'NAGOYA-SHANGHAI': [[35.1815, 136.9066], [33.5900, 130.4000], [31.2304, 121.4737]]
};

/**
 * Get natural curved road route waypoints between any two city keys synchronously
 */
function getRouteWaypoints(fromKey: string, toKey: string): [number, number][] {
  const pairKey = `${fromKey}-${toKey}`;
  const revKey = `${toKey}-${fromKey}`;
  if (ROAD_GEOMETRIES[pairKey]) return ROAD_GEOMETRIES[pairKey];
  if (ROAD_GEOMETRIES[revKey]) return [...ROAD_GEOMETRIES[revKey]].reverse();

  const f = LOCATIONS[fromKey], t = LOCATIONS[toKey];
  if (!f || !t) return [];

  const pts: [number, number][] = [];
  const steps = 12;
  const lat1 = f.latLng[0], lng1 = f.latLng[1];
  const lat2 = t.latLng[0], lng2 = t.latLng[1];

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1, dLng = lng2 - lng1;

  const perpLat = -dLng * 0.12;
  const perpLng = dLat * 0.12;

  const ctrlLat = midLat + perpLat;
  const ctrlLng = midLng + perpLng;

  for (let i = 0; i <= steps; i++) {
    const tVal = i / steps;
    const lat = (1 - tVal) * (1 - tVal) * lat1 + 2 * (1 - tVal) * tVal * ctrlLat + tVal * tVal * lat2;
    const lng = (1 - tVal) * (1 - tVal) * lng1 + 2 * (1 - tVal) * tVal * ctrlLng + tVal * tVal * lng2;
    pts.push([+lat.toFixed(5), +lng.toFixed(5)]);
  }

  ROAD_GEOMETRIES[pairKey] = pts;
  return pts;
}

let leafletMapInstance: any = null;
let leafletMarkersGroup: any = null;
let leafletLinesGroup: any = null;
let lastContainer: HTMLElement | null = null;
let lastRegion = '';

let lastTileUrl = '';

/**
 * Sync Leaflet Map state with Game Store synchronously and reliably
 */
export function syncLeafletMap(S: any) {
  const container = document.getElementById('leaflet-map-container');
  if (!container || typeof L === 'undefined') return;

  if (lastContainer !== container) {
    if (leafletMapInstance) {
      console.log('Map: Container changed, cleaning up');
      try {
        leafletMapInstance.off();
        leafletMapInstance.remove();
      } catch (e) {
        console.warn('Map: Cleanup error', e);
      }
      leafletMapInstance = null;
      leafletMarkersGroup = null;
      leafletLinesGroup = null;
      lastTileUrl = '';
    }
    lastContainer = container;
    lastRegion = '';
  }

  const currentRegion = homeState.selectedRegion;
  const activeLayer = homeState.mapLayer || 'all';
  const openId = homeState.openJobId;
  const oj = (S.jobs || []).find((j: any) => j.id === openId);
  const ends = oj ? [oj.from, oj.to] : [];
  const ownedHubIds = S.depots || ['hub_lagos'];

  const targetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (!leafletMapInstance) {
    console.log('Map: Initializing Leaflet');
    leafletMapInstance = L.map(container, {
      center: [25.0, 15.0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      trackResize: true,
      preferCanvas: true
    });

    L.control.zoom({ position: 'topright' }).addTo(leafletMapInstance);
    leafletLinesGroup = L.layerGroup().addTo(leafletMapInstance);
    leafletMarkersGroup = L.layerGroup().addTo(leafletMapInstance);
    
    // Safety size invalidation
    setTimeout(() => {
      if (leafletMapInstance) {
        try {
          leafletMapInstance.invalidateSize();
        } catch (e) {}
      }
    }, 100);
  }

  if (lastTileUrl !== targetTileUrl) {
    // Remove old tile layers
    leafletMapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        leafletMapInstance.removeLayer(layer);
      }
    });

    L.tileLayer(targetTileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abc',
      maxZoom: 14,
      className: 'dark-map-tiles' // Allows CSS filtering for Dark Theme without API keys
    }).addTo(leafletMapInstance);
    lastTileUrl = targetTileUrl;
  }

  if (currentRegion !== lastRegion && currentRegion !== 'All') {
    if (currentRegion === 'Africa') leafletMapInstance.flyTo([9.0, 8.0], 5, { animate: true });
    else if (currentRegion === 'Europe') leafletMapInstance.flyTo([51.0, 10.0], 5, { animate: true });
    else if (currentRegion === 'America') leafletMapInstance.flyTo([38.0, -96.0], 4, { animate: true });
    else if (currentRegion === 'Asia') leafletMapInstance.flyTo([35.0, 105.0], 4, { animate: true });
    lastRegion = currentRegion;
  } else if (currentRegion !== lastRegion && currentRegion === 'All' && !homeState.inspectCity) {
    leafletMapInstance.flyTo([25.0, 15.0], 2, { animate: true });
    lastRegion = currentRegion;
  } else if (leafletMapInstance) {
    // Normal update: refresh size to keep internal positioning accurate
    try {
      leafletMapInstance.invalidateSize();
    } catch (e) {}
  }

  const visibleEntries = Object.entries(LOCATIONS).filter(([_, loc]) => {
    if (currentRegion === 'All') return true;
    return loc.region === currentRegion;
  });
  const cityKeys = visibleEntries.map(([k]) => k);

  // Predefined Regional Highway Corridors
  const CORRIDORS: { from: string; to: string; region: RegionName }[] = [
    // --- AFRICA REGION ---
    { from: 'LAGOS', to: 'IBADAN', region: 'Africa' },
    { from: 'IBADAN', to: 'ILORIN', region: 'Africa' },
    { from: 'ILORIN', to: 'KADUNA', region: 'Africa' },
    { from: 'KADUNA', to: 'KANO', region: 'Africa' },
    { from: 'KADUNA', to: 'SOKOTO', region: 'Africa' },
    { from: 'KADUNA', to: 'JOS', region: 'Africa' },
    { from: 'JOS', to: 'BAUCHI', region: 'Africa' },
    { from: 'BAUCHI', to: 'MAIDUGURI', region: 'Africa' },
    { from: 'LAGOS', to: 'BENIN_CITY', region: 'Africa' },
    { from: 'BENIN_CITY', to: 'LOKOJA', region: 'Africa' },
    { from: 'LOKOJA', to: 'ABUJA', region: 'Africa' },
    { from: 'LOKOJA', to: 'MAKURDI', region: 'Africa' },
    { from: 'MAKURDI', to: 'ENUGU', region: 'Africa' },
    { from: 'ENUGU', to: 'PORT_HARCOURT', region: 'Africa' },
    { from: 'PORT_HARCOURT', to: 'UYO', region: 'Africa' },
    { from: 'UYO', to: 'CALABAR', region: 'Africa' },
    { from: 'CALABAR', to: 'ENUGU', region: 'Africa' },
    { from: 'PORT_HARCOURT', to: 'BENIN_CITY', region: 'Africa' },
    { from: 'KANO', to: 'KATSINA', region: 'Africa' },
    { from: 'BAUCHI', to: 'YOLA', region: 'Africa' },
    { from: 'ABUJA', to: 'MINNA', region: 'Africa' },
    { from: 'MINNA', to: 'KADUNA', region: 'Africa' },
    { from: 'MINNA', to: 'ILORIN', region: 'Africa' },
    { from: 'LAGOS', to: 'COTONOU', region: 'Africa' },
    { from: 'COTONOU', to: 'LOME', region: 'Africa' },
    { from: 'LOME', to: 'ACCRA', region: 'Africa' },
    { from: 'LAGOS', to: 'ABUJA', region: 'Africa' },
    { from: 'ENUGU', to: 'ABUJA', region: 'Africa' },

    // --- EUROPE REGION ---
    { from: 'ROTTERDAM', to: 'MUNICH', region: 'Europe' },
    { from: 'MUNICH', to: 'INNSBRUCK', region: 'Europe' },
    { from: 'ROTTERDAM', to: 'LYON', region: 'Europe' },
    { from: 'MUNICH', to: 'GOTHENBURG', region: 'Europe' },
    { from: 'LYON', to: 'MUNICH', region: 'Europe' },

    // --- AMERICA REGION ---
    { from: 'CHICAGO', to: 'DENVER', region: 'America' },
    { from: 'CHICAGO', to: 'DALLAS', region: 'America' },
    { from: 'DALLAS', to: 'LOS_ANGELES', region: 'America' },
    { from: 'DENVER', to: 'SALT_LAKE_CITY', region: 'America' },
    { from: 'SALT_LAKE_CITY', to: 'LOS_ANGELES', region: 'America' },
    { from: 'CHICAGO', to: 'SALT_LAKE_CITY', region: 'America' },

    // --- ASIA REGION ---
    { from: 'TOKYO', to: 'NAGOYA', region: 'Asia' },
    { from: 'TOKYO', to: 'NAGANO', region: 'Asia' },
    { from: 'SHANGHAI', to: 'ALMATY', region: 'Asia' },
    { from: 'NAGOYA', to: 'SHANGHAI', region: 'Asia' }
  ];

  const visibleCorridors = CORRIDORS.filter(c => currentRegion === 'All' || c.region === currentRegion);

  const drawJobs = (activeLayer === 'all' || activeLayer === 'hubs') 
    ? S.jobs.filter((j: any) => currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to))
    : [];
  
  const drawActive = (activeLayer === 'all' || activeLayer === 'active')
    ? (S.active || []).filter((j: any) => currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to))
    : [];

  // Clear map layers before rendering new state
  leafletLinesGroup.clearLayers();
  leafletMarkersGroup.clearLayers();

  // 1. Draw Network Freight Highway Corridors (Base Network Lines)
  visibleCorridors.forEach(c => {
    const pts = getRouteWaypoints(c.from, c.to);
    if (pts.length < 2) return;
    
    // Background "Halo" for visibility
    L.polyline(pts, {
      color: '#1e293b',
      weight: 6,
      opacity: 0.4
    }).addTo(leafletLinesGroup);

    // Main Network Line
    L.polyline(pts, {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.8,
      dashArray: '10, 10',
      className: 'map-dash-flow'
    }).addTo(leafletLinesGroup);
  });

  // 2. Render Open/Selected Job Offer Route Highlight
  drawJobs.forEach(j => {
    if (j.id !== openId) return;
    const pts = getRouteWaypoints(j.from, j.to);
    if (pts.length < 2) return;
    L.polyline(pts, {
      color: '#f59e0b',
      weight: 6,
      opacity: 1.0,
      dashArray: '12, 8',
      className: 'map-dash-flow'
    }).addTo(leafletLinesGroup);
  });

  // 3. Render Active Transit Lines & Moving Trucks
  const now = Date.now();
  drawActive.forEach(j => {
    const pts = getRouteWaypoints(j.from, j.to);
    if (pts.length < 2) return;

    // Glowing green active transit polyline
    L.polyline(pts, {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
      dashArray: '10, 8',
      className: 'map-dash-flow'
    }).addTo(leafletLinesGroup);

    // Interpolate truck position along waypoints
    const startMs = j.start || j.startTime || (now - 60000);
    const endMs = j.end || (startMs + ((j.km || 200) / 60) * 3600 * 1000);
    const totalDuration = Math.max(1000, endMs - startMs);
    const elapsed = Math.max(0, now - startMs);
    const pct = Math.min(0.99, Math.max(0.01, elapsed / totalDuration));

    const pointCount = pts.length;
    const targetIndex = Math.floor(pct * (pointCount - 1));
    const nextIndex = Math.min(pointCount - 1, targetIndex + 1);
    const segmentPct = (pct * (pointCount - 1)) - targetIndex;
    
    const p1 = pts[targetIndex], p2 = pts[nextIndex];
    const curLat = p1[0] + (p2[0] - p1[0]) * segmentPct;
    const curLng = p1[1] + (p2[1] - p1[1]) * segmentPct;

    // Bearing angle for directional arrow
    const dLng = (p2[1] - p1[1]) * Math.PI / 180;
    const lat1 = p1[0] * Math.PI / 180, lat2 = p2[0] * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);

    const truckId = j.truck || j.truckId || 1;
    const truckObj = (S.fleet || []).find((t: any) => t.id === truckId);
    const driverObj = (S.drivers || []).find((d: any) => d.id === (truckObj?.driverId));
    const driverName = driverObj ? driverObj.name : (truckObj ? truckObj.name : `Rig #${truckId}`);
    const pctDisplay = Math.round(pct * 100);

    const truckIcon = L.divIcon({
      html: `
        <div style="position:relative; width:36px; height:36px; display:grid; place-items:center; cursor:pointer;" data-act="open-telematics" data-id="${truckId}">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(255,255,255,0.15); animation:mapPulse 2s infinite;"></div>
          <div style="width:24px; height:24px; display:grid; place-items:center; transform:rotate(${bearing}deg); transition:transform 0.4s linear;">
            <div style="width:18px; height:18px; color:#ffffff; filter:drop-shadow(0 0 4px rgba(0,0,0,0.8));">
              ${ic('truckTop')}
            </div>
          </div>
        </div>`,
      className: 'custom-truck-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const popupHtml = `
      <div style="font-family:sans-serif; padding:4px; color:#f1f5f9; min-width:190px;">
        <div style="font-size:11px; font-weight:900; color:#10b981; text-transform:uppercase; display:flex; justify-content:space-between; align-items:center;">
          <span>🚚 ${driverName}</span>
          <span style="font-family:monospace; font-size:9px; color:#c19a5b;">${pctDisplay}%</span>
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-top:2px; font-weight:700;">
          Unit #${truckId} · ${truckObj ? truckObj.name : 'Heavy Duty Rig'}
        </div>
        <div style="font-size:9px; color:#cbd5e1; margin-top:4px;">
          Assigned Driver: <b style="color:#f1f5f9;">${driverName}</b>
        </div>
        <div style="font-size:9px; color:#cbd5e1; margin-top:2px;">
          Consignment: <b style="color:#c19a5b;">${j.cargo || 'Freight'}</b> (${j.from} → ${j.to})
        </div>
        <div style="margin-top:6px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
          <div style="width:${pctDisplay}%; height:100%; background:#10b981;"></div>
        </div>
        <button style="margin-top:8px; width:100%; padding:6px; background:#c19a5b; color:#0a0f1d; border:none; border-radius:4px; font-size:9px; font-weight:900; cursor:pointer; font-family:monospace;" onclick="window.__openTelem?.(${truckId})">
          🛰️ OPEN TELEMATICS
        </button>
      </div>
    `;

    const marker = L.marker([curLat, curLng], { icon: truckIcon }).addTo(leafletMarkersGroup);
    marker.bindPopup(popupHtml, { className: 'dark-telematics-popup' });
    marker.on('click', () => {
      openTelematicsModal(truckId);
    });
  });

  // 4. Render City & Hub Markers
  visibleEntries.forEach(([c, loc]) => {
    const isSelectedEnd = ends.includes(c);
    const matchingHub = REGIONAL_HUBS.find(h => h.city === c);
    const isOwnedHub = matchingHub && ownedHubIds.includes(matchingHub.id);
    const weatherIcon = loc.typicalWeather === 'snow' ? '❄️' : loc.typicalWeather === 'rain' ? '🌧️' : loc.typicalWeather === 'heatwave' ? '🔥' : loc.typicalWeather === 'fog' ? '🌫️' : '☀️';

    const markerIcon = L.divIcon({
      html: `
        <div style="position:relative; text-align:center; cursor:pointer;">
          ${isOwnedHub ? `<div style="width:18px; height:18px; margin:auto; border-radius:50%; background:#f59e0b; border:2px solid #fff; box-shadow:0 0 10px #f59e0b; display:grid; place-items:center; font-size:10px;">${matchingHub.icon}</div>` 
                       : `<div style="width:10px; height:10px; margin:auto; border-radius:50%; background:${isSelectedEnd ? '#f59e0b' : '#3b82f6'}; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>`}
          <div style="font-size:9px; font-weight:800; color:${isOwnedHub ? '#f59e0b' : isSelectedEnd ? '#f1f5f9' : '#cbd5e1'}; font-family:monospace; margin-top:2px; text-shadow:0 1px 4px #000; white-space:nowrap;">
            ${loc.name} ${activeLayer === 'weather' ? weatherIcon : ''}
          </div>
        </div>`,
      className: 'custom-city-marker',
      iconSize: [40, 30],
      iconAnchor: [20, 10]
    });

    L.marker(loc.latLng, { icon: markerIcon })
      .addTo(leafletMarkersGroup)
      .on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        homeState.inspectCity = homeState.inspectCity === c ? null : c;
        refresh();
      });
  });
}

export function renderMap(S: any) {
  const currentRegion = homeState.selectedRegion;
  const oj = S.jobs.find((j: any) => j.id === homeState.openJobId);
  const activeLayer = homeState.mapLayer || 'all';

  // Trigger map sync
  setTimeout(() => syncLeafletMap(S), 50);

  return `
    <div class="mapc" style="background:#080d1a; border:1px solid #1e293b; border-radius:12px; margin-bottom:14px; overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.5);">
      <div class="maph" style="padding:10px 14px; background:linear-gradient(180deg, #111827 0%, #0b1120 100%); border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#10b981; display:inline-block;" class="map-pulse"></span>
          <span style="font-size:10px; font-weight:900; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
            TELEMATICS GPS GRID
          </span>
        </div>
        <div style="font-size:10px; color:var(--tx); font-family:monospace;">
          ${oj ? `${oj.from} → ${oj.to}` : `${(S.active || []).length} TRUCKS EN ROUTE`}
        </div>
      </div>

      <div style="display:flex; gap:4px; padding:6px 12px; background:#0b1120; border-bottom:1px solid #1e293b; overflow-x:auto;">
        <button class="btn ${activeLayer === 'all' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; border-radius:4px;" data-act="set-map-layer" data-layer="all">🌐 ALL</button>
        <button class="btn ${activeLayer === 'active' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; border-radius:4px;" data-act="set-map-layer" data-layer="active">🚚 FLEET</button>
        <button class="btn ${activeLayer === 'hubs' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; border-radius:4px;" data-act="set-map-layer" data-layer="hubs">🏛️ HUBS</button>
        <button class="btn ${activeLayer === 'weather' ? 'gold' : 'alt'}" style="padding:3px 8px; font-size:9px; border-radius:4px;" data-act="set-map-layer" data-layer="weather">❄️ WEATHER</button>
      </div>

      <div id="leaflet-map-container" style="width: 100%; height: 260px; background: #080d1a;"></div>
    </div>
  `;
}
