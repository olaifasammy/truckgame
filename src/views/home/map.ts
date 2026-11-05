import { LOCATIONS, RegionName, LocationInfo } from '../../data/world';
import { REGIONAL_HUBS } from '../../domain/logistics/network';
import { homeState } from './state';

declare const L: any; // Leaflet global from CDN

const routeCache: Record<string, [number, number][]> = {};
let leafletMapInstance: any = null;
let leafletMarkersGroup: any = null;
let leafletLinesGroup: any = null;
let lastContainer: HTMLElement | null = null;
let isSyncing = false;

/**
 * Fetch real-world road geometry between two points using OSRM
 */
async function getRoadRoute(from: [number, number], to: [number, number]): Promise<[number, number][]> {
  const cacheKey = `${from.join(',')}-${to.join(',')}`;
  if (routeCache[cacheKey]) return routeCache[cacheKey];

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes?.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      routeCache[cacheKey] = coords;
      return coords;
    }
  } catch (e) {
    console.error('OSRM Routing Error:', e);
  }
  return [from, to];
}

let lastRegion = '';

/**
 * Sync Leaflet Map state with Game Store
 */
export async function syncLeafletMap(S: any) {
  const container = document.getElementById('leaflet-map-container');
  if (!container || typeof L === 'undefined' || isSyncing) return;

  // Handle re-renders by checking if the container element changed
  if (lastContainer !== container) {
    if (leafletMapInstance) {
      try {
        leafletMapInstance.remove();
      } catch (e) {}
      leafletMapInstance = null;
    }
    lastContainer = container;
    lastRegion = ''; // Force flyTo on new container
  }

  const currentRegion = homeState.selectedRegion;
  const activeLayer = homeState.mapLayer || 'all';
  const openId = homeState.openJobId;
  const oj = S.jobs.find((j: any) => j.id === openId);
  const ends = oj ? [oj.from, oj.to] : [];
  const ownedHubIds = S.depots || ['hub_lagos'];

  if (!leafletMapInstance) {
    leafletMapInstance = L.map(container, {
      center: [25.0, 15.0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      trackResize: true
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 12
    }).addTo(leafletMapInstance);

    L.control.zoom({ position: 'topright' }).addTo(leafletMapInstance);
    leafletMarkersGroup = L.layerGroup().addTo(leafletMapInstance);
    leafletLinesGroup = L.layerGroup().addTo(leafletMapInstance);
  }

  // Set View based on selected region - ONLY IF CHANGED
  if (currentRegion !== lastRegion) {
    if (currentRegion === 'Africa') leafletMapInstance.flyTo([9.0, 8.0], 5, { animate: true });
    else if (currentRegion === 'Europe') leafletMapInstance.flyTo([51.0, 10.0], 5, { animate: true });
    else if (currentRegion === 'America') leafletMapInstance.flyTo([38.0, -96.0], 4, { animate: true });
    else if (currentRegion === 'Asia') leafletMapInstance.flyTo([35.0, 105.0], 4, { animate: true });
    else if (currentRegion === 'All' && !homeState.inspectCity) leafletMapInstance.flyTo([25.0, 15.0], 2, { animate: true });
    lastRegion = currentRegion;
  }

  isSyncing = true;

  try {
    const visibleEntries = Object.entries(LOCATIONS).filter(([_, loc]) => {
      if (currentRegion === 'All') return true;
      return loc.region === currentRegion;
    });
    const cityKeys = visibleEntries.map(([k]) => k);

    // 1. Prepare Road Routes
    const drawJobs = (activeLayer === 'all' || activeLayer === 'hubs') 
      ? S.jobs.filter((j: any) => currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to))
      : [];
    
    const drawActive = (activeLayer === 'all' || activeLayer === 'active')
      ? S.active.filter((j: any) => currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to))
      : [];

    // Parallel fetch routes with catch to prevent total failure
    const routePromises = [...drawJobs, ...drawActive].map(async j => {
      const f = LOCATIONS[j.from], t = LOCATIONS[j.to];
      if (!f || !t) return [];
      try {
        return await getRoadRoute(f.latLng, t.latLng);
      } catch (err) {
        return [f.latLng, t.latLng]; // Fallback to straight line on error
      }
    });

    const routes = await Promise.all(routePromises);

    // ONLY CLEAR AND RE-DRAW AFTER DATA IS READY TO PREVENT FLICKER
    leafletMarkersGroup.clearLayers();
    leafletLinesGroup.clearLayers();

    let routeIdx = 0;

    // Render Job Board Routes
    drawJobs.forEach(j => {
      const pts = routes[routeIdx++];
      if (pts.length < 2) return;
      const isSelected = j.id === openId;
      L.polyline(pts, {
        color: isSelected ? '#f59e0b' : '#3b82f6',
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 0.9 : 0.4,
        dashArray: isSelected ? '6, 6' : '4, 4'
      }).addTo(leafletLinesGroup);
    });

    // Render Active Transit Routes & Trucks
    const now = Date.now();
    drawActive.forEach(j => {
      const pts = routes[routeIdx++];
      if (pts.length < 2) return;

      L.polyline(pts, {
        color: '#10b981',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 4'
      }).addTo(leafletLinesGroup);

      // Interpolate truck position
      const totalDuration = (j.km / 60) * 3600 * 1000;
      const elapsed = Math.max(0, now - (j.startTime || (now - 60000)));
      const pct = Math.min(0.99, Math.max(0.01, totalDuration > 0 ? elapsed / totalDuration : 0.5));

      const pointCount = pts.length;
      const targetIndex = Math.floor(pct * (pointCount - 1));
      const nextIndex = Math.min(pointCount - 1, targetIndex + 1);
      const segmentPct = (pct * (pointCount - 1)) - targetIndex;
      
      const p1 = pts[targetIndex], p2 = pts[nextIndex];
      const curLat = p1[0] + (p2[0] - p1[0]) * segmentPct;
      const curLng = p1[1] + (p2[1] - p1[1]) * segmentPct;

      const truckIcon = L.divIcon({
        html: `
          <div style="position:relative; width:28px; height:28px; display:grid; place-items:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(16,185,129,0.3); animation:mapPulse 2s infinite;"></div>
            <div style="width:14px; height:14px; border-radius:50%; background:#10b981; border:2px solid #fff; box-shadow:0 0 8px #10b981;"></div>
            <div style="position:absolute; bottom:-14px; font-size:9px; font-weight:900; color:#10b981; font-family:monospace; white-space:nowrap; text-shadow:0 1px 3px #000;">
              🚚 #${j.truckId}
            </div>
          </div>`,
        className: 'custom-truck-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([curLat, curLng], { icon: truckIcon }).addTo(leafletMarkersGroup);
    });

    // 3. Render City Markers
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

      L.marker(loc.latLng, { icon: markerIcon }).addTo(leafletMarkersGroup);
    });
  } finally {
    isSyncing = false;
  }
}

export function renderMap(S: any) {
  const currentRegion = homeState.selectedRegion;
  const oj = S.jobs.find((j: any) => j.id === homeState.openJobId);
  const activeLayer = homeState.mapLayer || 'all';

  // Request sync after the DOM has likely updated
  setTimeout(() => syncLeafletMap(S), 100);

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
          ${oj ? `${oj.from} → ${oj.to}` : `${S.active.length} TRUCKS EN ROUTE`}
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
