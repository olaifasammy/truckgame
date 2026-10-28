import { CITIES, LOCATIONS, RegionName } from '../../data/world';
import { homeState } from './state';

const line = (a: string, b: string, c: string, w: number, dash = '') => {
  const p1 = (CITIES as any)[a], p2 = (CITIES as any)[b];
  if (!p1 || !p2) return '';
  return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
};

export function renderMap(S: any) {
  const openId = homeState.openJobId;
  const currentRegion = homeState.selectedRegion;
  const oj = S.jobs.find((j: any) => j.id === openId);
  const ends = oj ? [oj.from, oj.to] : [];
  
  // Filter visible cities based on selected region
  const visibleEntries = Object.entries(LOCATIONS).filter(([_, loc]) => {
    if (currentRegion === 'All') return true;
    return loc.region === currentRegion;
  });

  const cityKeys = visibleEntries.map(([k]) => k);

  // Dynamic regional viewport bounding
  let viewBox = '0 0 380 190';
  if (currentRegion !== 'All' && visibleEntries.length > 0) {
    const xs = visibleEntries.map(([_, l]) => l.coords[0]);
    const ys = visibleEntries.map(([_, l]) => l.coords[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = Math.max(24, Math.round((maxX - minX) * 0.3));
    const padY = Math.max(22, Math.round((maxY - minY) * 0.35));
    const vbX = Math.max(0, Math.round(minX - padX));
    const vbY = Math.max(0, Math.round(minY - padY));
    const vbW = Math.round((maxX - minX) + padX * 2);
    const vbH = Math.round((maxY - minY) + padY * 2);
    viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;
  }

  const base = S.jobs
    .filter((j: any) => j.id !== openId && (currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to)))
    .map((j: any) => line(j.from, j.to, 'rgba(255,255,255,0.08)', 1.2))
    .join('');
    
  const act = S.active
    .filter((j: any) => currentRegion === 'All' || cityKeys.includes(j.from) || cityKeys.includes(j.to))
    .map((j: any) => line(j.from, j.to, '#10b981', 2, '4 3'))
    .join('');
    
  const hl = oj ? line(oj.from, oj.to, '#c19a5b', 2.8, '5 3') : '';
  
  const nodes = visibleEntries.map(([c, loc]) => {
    const on = ends.includes(c);
    const p = loc.coords;
    const isHub = ['LAGOS', 'ROTTERDAM', 'CHICAGO', 'TOKYO'].includes(c);
    const weatherIcon = loc.typicalWeather === 'snow' ? '❄' : loc.typicalWeather === 'rain' ? '🌧' : loc.typicalWeather === 'heatwave' ? '🔥' : '●';

    return `
      <g style="cursor:pointer;" data-act="home-toggle" data-id="${oj?.id || ''}">
        <circle cx="${p[0]}" cy="${p[1]}" r="${on ? 6 : isHub ? 4.5 : 3.5}" 
          fill="${on ? '#c19a5b' : isHub ? '#3b82f6' : '#1e293b'}" 
          stroke="${on ? '#ffffff' : '#0a0f1d'}" stroke-width="1.5"/>
        <text x="${p[0]}" y="${p[1] + (currentRegion === 'All' ? 12 : 14)}" text-anchor="middle" font-size="${currentRegion === 'All' ? '8' : '9'}" 
          fill="${on ? '#f1f5f9' : '#94a3b8'}" font-family="monospace" font-weight="800" letter-spacing=".3">
          ${loc.name}
        </text>
        <text x="${p[0]}" y="${p[1] - 6}" text-anchor="middle" font-size="7" fill="${on ? '#c19a5b' : '#64748b'}">
          ${weatherIcon}
        </text>
      </g>
    `;
  }).join('');

  return `
    <div class="mapc" style="background:#0b0f19; border:1px solid #1e2638; border-radius:10px; margin-bottom:14px; overflow:hidden;">
      <div class="maph" style="padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:10px; font-weight:800; color:var(--gold); letter-spacing:1px; text-transform:uppercase;">
            ${currentRegion === 'All' ? 'GLOBAL TELEMATICS CORRIDOR' : `${currentRegion.toUpperCase()} LOGISTICS GRID`}
          </span>
          <span style="font-size:9px; color:var(--mu); font-family:monospace;">${visibleEntries.length} TERMINALS</span>
        </div>
        <b style="font-size:11px; color:var(--tx); font-family:monospace;">
          ${oj ? `${oj.from} → ${oj.to} (${oj.km} km)` : `${S.jobs.length} Available Hauls`}
        </b>
      </div>
      <svg viewBox="${viewBox}" style="width:100%; height:auto; display:block; background:radial-gradient(circle at 50% 50%, #0d1527 0%, #080c14 100%); transition:all 0.4s ease;">
        <!-- Subtle Grid Lines -->
        <line x1="0" y1="95" x2="380" y2="95" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        <line x1="190" y1="0" x2="190" y2="190" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        ${base}${act}${hl}${nodes}
      </svg>
    </div>
  `;
}

