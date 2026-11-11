/**
 * Realistic side-view Rigid trucks (Box, Tipper, Tanker, Flatbed).
 */
import { makePalette, nextUid, baseDefs, svgHead, spinWheel, badgeColor, axleGroup, darken, lighten, trailerSkirt } from './trucks.realistic.shared';
import type { RealisticOpts, Palette } from './trucks.realistic.shared';
import { pickCabSpec } from './trucks.realistic.brands';
import type { EuroStyle, AmericanStyle, VanStyle } from './trucks.realistic.brands';

export function getRealisticRigidSvg(model: any, axle: string, trailerType: string, opts: RealisticOpts): string {
  const spec = pickCabSpec(model);
  const u = nextUid();
  const moving = !!opts.isMoving;
  
  // Base heavy truck layout
  const vbW = 440;
  const driveX = axle === '4x2' ? [310] : [270, 330];
  const bodyX0 = 175;
  const bodyW = vbW - bodyX0 - 20;

  if (spec?.family === 'american') {
    // For simplicity, let's focus on Euro style rigids first or generic heavy rigids
    // but we can try to blend it.
  }

  const s = (spec as any).euro || (spec as any).us;
  const P = makePalette({ ...opts, paint: opts.paint || s.paint, accent: opts.accent || s.accent });

  const cabPath = spec?.family === 'american'
    ? `M10,212 L10,185 Q10,165 24,165 L35,120 L85,120 L105,115 L145,115 L175,115 L175,210 Z`
    : `M30,208 L26,152 Q26,130 40,118 L80,118 L175,118 L175,210 Z`;

  let bodyContent = '';
  switch (trailerType) {
    case 'rigid_box':
    case 'curtain':
    case 'box':
    case 'reefer':
      bodyContent = `
        <rect x="${bodyX0}" y="40" width="${bodyW}" height="162" rx="4" fill="url(#${u}body)" stroke="${P.cabEdge}" stroke-width="1.5"/>
        <rect x="${bodyX0}" y="140" width="${bodyW}" height="10" fill="url(#${u}gold)"/>
        <rect x="${vbW - 25}" y="50" width="8" height="150" rx="2" fill="url(#${u}chromeH)"/>
      `;
      break;
    case 'rigid_tipper':
    case 'tipper':
      bodyContent = `
        <path d="${bodyX0},80 L${vbW - 20},80 L${vbW - 30},202 L${bodyX0},202 Z" fill="url(#${u}body)" stroke="#000" stroke-width="1.5"/>
        <path d="M140,80 L${bodyX0},80 L${bodyX0},118 Z" fill="${P.cabMid}"/>
        ${[0.2, 0.4, 0.6, 0.8].map(p => `<line x1="${bodyX0 + bodyW * p}" y1="80" x2="${bodyX0 + bodyW * p}" y2="202" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`).join('')}
      `;
      break;
    case 'rigid_tanker':
    case 'tanker':
      bodyContent = `
        <rect x="${bodyX0}" y="70" width="${bodyW}" height="130" rx="40" fill="url(#${u}chrome)" stroke="#000" stroke-width="1"/>
        <rect x="${bodyX0 + 20}" y="80" width="${bodyW - 40}" height="4" fill="#fff" opacity=".3"/>
        <ellipse cx="${bodyX0 + bodyW / 2}" cy="68" rx="20" ry="4" fill="#333"/>
      `;
      break;
    case 'rigid_flatbed':
    case 'flatbed':
      bodyContent = `
        <rect x="${bodyX0}" y="180" width="${bodyW}" height="24" rx="2" fill="#222" stroke="${P.cabEdge}"/>
        <rect x="${bodyX0 + 10}" y="140" width="40" height="40" fill="#666" stroke="#000"/>
        <rect x="${bodyX0 + 60}" y="130" width="80" height="50" fill="#444" stroke="#000"/>
        <line x1="${bodyX0 + 30}" y1="140" x2="${bodyX0 + 30}" y2="180" stroke="${P.accent}" stroke-width="2"/>
        <line x1="${bodyX0 + 100}" y1="130" x2="${bodyX0 + 100}" y2="180" stroke="${P.accent}" stroke-width="2"/>
      `;
      break;
    default:
      bodyContent = `<rect x="${bodyX0}" y="40" width="${bodyW}" height="162" rx="4" fill="url(#${u}body)" stroke="${P.cabEdge}" stroke-width="1.5"/>`;
  }

  return `
${svgHead(vbW, moving)}
  <defs>
    ${baseDefs(u, P)}
    <path id="${u}cabpath" d="${cabPath}"/>
    <clipPath id="${u}cabclip"><use href="#${u}cabpath"/></clipPath>
  </defs>

  <ellipse cx="${vbW / 2}" cy="252" rx="${vbW / 2 - 10}" ry="10" fill="#000" opacity=".4"/>
  
  <!-- CHASSIS -->
  <rect x="60" y="198" width="${vbW - 100}" height="12" fill="#14171c"/>
  ${axleGroup(u, [95, ...driveX], moving, { color: P.cabDark })}

  ${bodyContent}

  <!-- CAB (Simplified realistic) -->
  <use href="#${u}cabpath" fill="url(#${u}cab)"/>
  <g clip-path="url(#${u}cabclip)">
    <circle cx="95" cy="219" r="38" fill="#07090c"/>
    <circle cx="95" cy="219" r="38" fill="none" stroke="#3a4049" stroke-width="2"/>
    <path d="M27,170 L${bodyX0},166 L${bodyX0},172 L27,176 Z" fill="url(#${u}gold)"/>
  </g>
  
  <!-- Glass -->
  <path d="M46,122 L${spec?.family === 'american' ? 145 : 120},122 L${spec?.family === 'american' ? 145 : 120},200 L46,200 Z" fill="none" stroke="#0a0f14" stroke-width="2" opacity=".5"/>
  <path d="M50,126 L${spec?.family === 'american' ? 140 : 110},126 L${spec?.family === 'american' ? 140 : 110},162 L50,162 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2.5"/>

  <!-- Headlight / Grille -->
  <path d="M26,172 L42,166 L44,184 L27,192 Z" fill="#fff8d6" stroke="#9aa3ad" stroke-width="1.2"/>
  <rect x="28" y="196" width="14" height="14" rx="2" fill="#0b0e12" stroke="#5b636d"/>
  
  <rect x="${vbW - 25}" y="200" width="10" height="15" rx="2" fill="#d6141b"/>
  
  <line x1="0" y1="250" x2="${vbW}" y2="250" stroke="#ffffff" stroke-opacity=".08" stroke-dasharray="6 8"/>
</svg>`;
}
