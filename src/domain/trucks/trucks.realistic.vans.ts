/**
 * Realistic side-view Sprinter / Cargo Van / Light Commercial Vehicle SVGs.
 */
import { makePalette, nextUid, baseDefs, svgHead, spinWheel, badgeColor, axleGroup, darken, lighten } from './trucks.realistic.shared';
import type { RealisticOpts } from './trucks.realistic.shared';
import type { VanStyle } from './trucks.realistic.brands';

export function getRealisticVanSvg(s: VanStyle, opts: RealisticOpts): string {
  const u = nextUid();
  const P = makePalette({ ...opts, paint: opts.paint || s.paint, accent: opts.accent || s.accent });
  const moving = !!opts.isMoving;
  
  // Vans are typically shorter than tractors. 
  // Tractor vbW is 400. Let's make Vans ~280-320.
  const vbW = s.boxBody ? 340 : 280;
  
  const roofY = s.highRoof ? 100 : 130;
  const wheelX = s.boxBody ? [75, 270] : [75, 210];
  
  const cabPath = s.boxBody 
    ? `M35,212 L28,172 Q28,145 52,130 L95,115 L108,115 L112,210 Z`
    : `M35,212 L28,172 Q28,145 52,130 L90,110 L105,${roofY} L240,${roofY} Q255,${roofY} 258,${roofY + 20} L262,210 Z`;

  const bc = badgeColor(P.paint, P.goldTop);
  
  const glass = s.boxBody
    ? `<path d="M48,138 L88,126 L102,126 L98,162 L48,162 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2.5"/>`
    : `<path d="M48,138 L84,124 L102,118 L135,118 L130,162 L48,162 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2.5"/>
       <path d="M136,118 L180,118 L180,162 L136,162 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>`;

  const boxBody = s.boxBody ? `
    <rect x="115" y="60" width="215" height="148" rx="4" fill="url(#${u}body)" stroke="${P.cabEdge}" stroke-width="1.2"/>
    <path d="M98,115 L118,60 L135,60 L118,115 Z" fill="${P.cabMid}" opacity=".5"/>
    <rect x="115" y="140" width="215" height="10" fill="url(#${u}gold)"/>
    <rect x="320" y="70" width="6" height="130" rx="2" fill="url(#${u}chromeH)"/>
  ` : '';

  const headlight = `<path d="M28,172 L42,166 L44,184 L30,192 Z" fill="#fff8d6" stroke="#9aa3ad" stroke-width="1"/>
                     <path d="M30,190 L42,185" stroke="#fff" stroke-width="1.8" fill="none"/>`;

  const grille = `<rect x="30" y="196" width="12" height="12" rx="1" fill="#1a1e24" stroke="#cfd6dc" stroke-width=".8"/>
                  <line x1="32" y1="200" x2="40" y2="200" stroke="#6b737c"/>
                  <line x1="32" y1="204" x2="40" y2="204" stroke="#6b737c"/>`;

  return `
${svgHead(vbW, moving)}
  <defs>
    ${baseDefs(u, P)}
    <path id="${u}cabpath" d="${cabPath}"/>
    <clipPath id="${u}cabclip"><use href="#${u}cabpath"/></clipPath>
  </defs>

  <ellipse cx="${vbW / 2}" cy="252" rx="${vbW / 2 - 10}" ry="8" fill="#000" opacity=".4"/>
  
  <!-- CHASSIS -->
  <rect x="50" y="202" width="${vbW - 80}" height="10" fill="#14171c"/>
  ${axleGroup(u, wheelX, moving, { color: P.cabDark })}

  ${boxBody}

  <!-- CAB -->
  <use href="#${u}cabpath" fill="url(#${u}cab)"/>
  <g clip-path="url(#${u}cabclip)">
    <circle cx="${wheelX[0]}" cy="219" r="38" fill="#07090c"/>
    <circle cx="${wheelX[0]}" cy="219" r="38" fill="none" stroke="#3a4049" stroke-width="2"/>
    <path d="M30,172 L110,168 L110,174 L30,178 Z" fill="url(#${u}gold)"/>
  </g>
  ${glass}
  
  <rect x="90" y="168" width="12" height="4" rx="2" fill="url(#${u}chrome)"/>
  <text x="120" y="150" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="${bc}" opacity=".15" letter-spacing="2">CITY EXPRESS</text>
  
  ${headlight}
  ${grille}
  
  <rect x="250" y="200" width="10" height="12" rx="2" fill="#d6141b"/>
  
  <line x1="0" y1="250" x2="${vbW}" y2="250" stroke="#ffffff" stroke-opacity=".08" stroke-dasharray="6 8"/>
</svg>`;
}
