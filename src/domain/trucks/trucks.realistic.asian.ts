/**
 * Asian heavy-duty cab-over tractor (Hino 700, Isuzu Giga, FAW J7, Sinotruk HOWO style)
 * with modern aerodynamics, distinctive grille, and matching geometry. Faces left.
 */
import type { RealisticOpts } from './trucks.realistic.shared';
import {
  makePalette, nextUid, baseDefs, svgHead, spinWheel,
} from './trucks.realistic.shared';
import { renderRealisticTrailer, trailerLayout } from './trucks.realistic.trailers';

export function getRealisticAsianSvg(
  axle: string,
  trailerType: string | null | undefined,
  opts: RealisticOpts = {}
): string {
  const u = nextUid();
  const P = makePalette(opts);
  const moving = !!opts.isMoving;
  const hasTrailer = !!trailerType && trailerType !== 'none';
  const x0 = 192;
  const x1 = hasTrailer ? trailerLayout(trailerType!, x0).x1 : x0;
  const vbW = hasTrailer ? x1 + 56 : 400;
  const driveX = axle === '4x2' ? [290] : (axle === '8x4' ? [250, 290, 336] : [262, 316]);
  const d0 = driveX[0], dn = driveX[driveX.length - 1];

  return `
${svgHead(vbW, moving)}
  <defs>
    ${baseDefs(u, P)}
    <path id="${u}asiancab" d="M30,208 L24,146 Q24,124 38,112 L72,56 Q78,46 94,46 L158,46 Q178,46 182,64 L184,204 Z"/>
    <clipPath id="${u}asianclip"><use href="#${u}asiancab"/></clipPath>
  </defs>

  <ellipse cx="${vbW / 2}" cy="252" rx="${vbW / 2 - 10}" ry="9" fill="#000" opacity=".45" filter="url(#${u}blur)"/>
  ${hasTrailer ? renderRealisticTrailer(trailerType!, u, P, x0, moving) : ''}

  <!-- TRACTOR CHASSIS -->
  <rect x="60" y="192" width="310" height="11" fill="#14171c"/>
  <rect x="182" y="184" width="62" height="32" rx="7" fill="url(#${u}chrome)"/>
  <rect x="190" y="192" width="46" height="2" fill="#fff" opacity=".35"/>
  <!-- Elegant Aero Side Cover / Chassis Fairing Panel -->
  <rect x="180" y="180" width="68" height="22" rx="4" fill="url(#${u}cab)" stroke="${P.accent}" stroke-width="1.2"/>
  <rect x="184" y="183" width="60" height="3" fill="#fff" opacity="0.28"/>
  <rect x="184" y="197" width="60" height="2" fill="url(#${u}chrome)"/>
  <rect x="342" y="194" width="30" height="12" rx="6" fill="url(#${u}chromeH)"/>
  <rect x="176" y="70" width="7" height="118" rx="3" fill="url(#${u}chromeH)"/>
  <rect x="173" y="62" width="13" height="10" rx="3" fill="url(#${u}chromeH)"/>
  <path d="M${d0 - 40},198 Q${d0 - 40},172 ${d0 - 10},172 L${dn + 2},172 Q${dn + 32},172 ${dn + 32},198 L${dn + 26},198 Q${dn + 24},180 ${dn + 2},180 L${d0 - 10},180 Q${d0 - 32},180 ${d0 - 34},198 Z" fill="#0f1217"/>
  <rect x="232" y="170" width="96" height="7" rx="2" fill="#2f353d"/>
  <rect x="232" y="170" width="96" height="2" fill="#5b636d"/>
  ${driveX.map(x => spinWheel(u, x, moving)).join('')}

  <!-- CAB BODY -->
  <use href="#${u}asiancab" fill="url(#${u}asiancab)"/>
  <g clip-path="url(#${u}asianclip)">
    <circle cx="90" cy="219" r="38" fill="#07090c"/>
    <circle cx="90" cy="219" r="38" fill="none" stroke="#3a4049" stroke-width="2"/>
  </g>
  <use href="#${u}asiancab" fill="url(#${u}cab)"/>
  <path d="M38,112 L72,56 Q78,46 94,46 L158,46" fill="none" stroke="${P.cabEdge}" stroke-opacity=".6" stroke-width="1.5"/>
  <path d="M30,206 L184,204" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
  <path d="M26,168 L184,164 L184,170 L26,174 Z" fill="url(#${u}gold)" clip-path="url(#${u}asianclip)"/>

  <!-- WINDSHIELD & SIDE GLASS -->
  <path d="M42,118 L70,64 Q72,60 78,60 L126,60 L126,118 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>
  <path d="M78,62 L94,62 L68,118 L52,118 Z" fill="#fff" opacity=".16"/>
  <path d="M134,74 L172,74 L172,108 L134,108 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>

  <!-- ASIAN SIGNATURE GRILLE & HEADLAMPS -->
  <rect x="24" y="122" width="22" height="44" rx="2" fill="#17212b" stroke="${P.accent}" stroke-width="1"/>
  ${[0, 1, 2, 3, 4].map(i => `<line x1="26" y1="${126 + i * 8}" x2="44" y2="${126 + i * 8}" stroke="#94a3b8" stroke-width="1.2"/>`).join('')}
  <rect x="25" y="168" width="20" height="18" rx="2" fill="#fef3c7" stroke="#fbbf24" stroke-width="1"/>
  <rect x="27" y="188" width="16" height="4" fill="#f97316"/>

  <!-- FUEL TANK & DETAILS -->
  <rect x="52" y="142" width="14" height="58" rx="3" fill="url(#${u}chrome)"/>
  <rect x="76" y="196" width="48" height="5" rx="1" fill="#2a2f36"/>
  ${spinWheel(u, 90, moving)}

  <line x1="0" y1="250" x2="${vbW}" y2="250" stroke="#ffffff" stroke-opacity=".08" stroke-dasharray="6 8"/>
</svg>`;
}
