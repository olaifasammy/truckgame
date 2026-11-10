/**
 * American conventional tractors (Kenworth / Peterbilt / Freightliner / Mack / Ford).
 * Style comes from trucks.realistic.brands.ts (AmericanStyle). Faces left.
 */
import type { RealisticOpts } from './trucks.realistic.shared';
import { makePalette, nextUid, baseDefs, svgHead, spinWheel, badgeColor, axleGroup } from './trucks.realistic.shared';
import { trailerLayout, renderRealisticTrailer } from './trucks.realistic.trailers';
import type { AmericanStyle } from './trucks.realistic.brands';

const HOOD = {
  long:  { path: 'M26,202 L22,148 Q22,128 40,122 L164,117 L168,202 Z', top: 122, front: 22, gridTop: 136, edge: 'M40,122 L164,117', stripe: 'M20,150 L168,146 L168,153 L20,157 Z' },
  aero:  { path: 'M30,202 L24,160 Q25,142 52,136 L166,116 L168,202 Z',  top: 138, front: 24, gridTop: 148, edge: 'M52,136 L166,116', stripe: 'M20,168 L168,142 L168,149 L20,175 Z' },
  short: { path: 'M62,202 L58,150 Q58,134 76,130 L164,121 L168,202 Z',  top: 132, front: 58, gridTop: 142, edge: 'M76,130 L164,121', stripe: 'M50,154 L168,148 L168,155 L50,161 Z' },
} as const;

function grilleSvg(s: AmericanStyle, fx: number, gt: number): string {
  const h = 194 - gt;
  const x = fx - 5;
  switch (s.grille) {
    case 'pete':
      return `<rect x="${x - 1}" y="${gt - 2}" width="15" height="${h + 4}" rx="3" fill="url(#UchromeH)" stroke="#5b636d" stroke-width="1"/>
  <rect x="${x + 2}" y="${gt + 2}" width="9" height="${h - 4}" rx="1.5" fill="#0b0e12"/>
  <path d="M${x + 6.5} ${gt + 2}V${gt + h - 2}" stroke="#cfd6dc" stroke-width="1.6"/>`;
    case 'fl': {
      const lines: string[] = [];
      for (let y = gt + 4; y < gt + h - 2; y += 4) lines.push(`M${x + 2} ${y}H${x + 11}`);
      return `<rect x="${x}" y="${gt}" width="13" height="${h}" rx="4" fill="#0b0e12" stroke="#cfd6dc" stroke-width="1.4"/>
  <path d="${lines.join('')}" stroke="#4b525a" stroke-width="1.2"/>`;
    }
    case 'mack':
      return `<rect x="${x}" y="${gt}" width="13" height="${h}" rx="2" fill="url(#UchromeH)" stroke="#5b636d" stroke-width="1"/>
  <rect x="${x + 2}" y="${gt + 3}" width="9" height="${h - 6}" rx="1" fill="#0b0e12"/>
  <path d="M${x + 2} ${gt + h / 2}H${x + 11}" stroke="#e2e6ea" stroke-width="2.4"/>`;
    default:
      return `<rect x="${x}" y="${gt}" width="13" height="${h}" rx="3" fill="url(#UchromeH)" stroke="#5b636d" stroke-width="1"/>
  <g stroke="#3a4049" stroke-width="1.2"><path d="M${x + 3} ${gt + 5}V${gt + h - 4}M${x + 7} ${gt + 5}V${gt + h - 4}M${x + 11} ${gt + 5}V${gt + h - 4}"/></g>`;
  }
}

export function getRealisticAmericanSvg(
  s: AmericanStyle,
  axle: string,
  trailerType: string | null | undefined,
  opts: RealisticOpts = {}
): string {
  const u = nextUid();
  const P = makePalette({ ...opts, paint: opts.paint || s.paint, accent: opts.accent || s.accent });
  const moving = !!opts.isMoving;
  const hasTrailer = !!trailerType && trailerType !== 'none';
  const driveX = axle === '4x2' ? [456] : [428, 484];
  const d0 = driveX[0], dn = driveX[driveX.length - 1];
  const layout = hasTrailer ? trailerLayout(trailerType!, 372) : null;
  const vbW = layout ? layout.x1 + 36 : 560;

  const H = HOOD[s.hood];
  const y = s.roofY;
  const R = s.sleeper ? Math.round(238 + s.sleeperIn * 1.35) : 250;
  const longSleeper = s.sleeper && s.sleeperIn >= 80;
  const wW = longSleeper ? 54 : 40;
  const fx = H.front;
  const gt = H.gridTop;
  const sx = s.sleeper ? 240 : R + 4;

  const cabPath = `M166,192 L168,124 L190,${y + 10} Q194,${y} 206,${y} L${R - 12},${y} Q${R},${y} ${R},${y + 14} L${R},192 Z`;

  const tank = s.electric
    ? `<rect x="196" y="190" width="74" height="34" rx="4" fill="#1d2630" stroke="#4b525a"/>
  <g stroke="#3a4552" stroke-width="2"><path d="M214 192V222M233 192V222M252 192V222"/></g>
  <path d="M236,196 L224,210 L232,210 L228,221 L243,204 L235,204 Z" fill="#3ddc97"/>`
    : `<rect x="196" y="194" width="74" height="30" rx="12" fill="url(#${u}chrome)"/>
  <rect x="204" y="200" width="58" height="2" fill="#fff" opacity=".4"/>
  <rect x="222" y="194" width="3" height="30" fill="#4b525a" opacity=".7"/>
  <rect x="246" y="194" width="3" height="30" fill="#4b525a" opacity=".7"/>`;

  let stacks = '';
  if (s.stacks >= 1) {
    stacks += `<rect x="${sx}" y="${y - 12}" width="10" height="${192 - (y - 12)}" rx="4" fill="url(#${u}chromeH)"/>
  <rect x="${sx - 2}" y="${y - 16}" width="14" height="8" rx="3" fill="url(#${u}chromeH)"/>
  <rect x="${sx}" y="150" width="10" height="3" fill="#3a4049" opacity=".7"/>
  <rect x="${sx}" y="${Math.round((y + 150) / 2)}" width="10" height="3" fill="#3a4049" opacity=".7"/>`;
  }
  if (s.stacks === 2) {
    stacks += `<rect x="${sx + 15}" y="${y - 8}" width="8" height="${192 - (y - 8)}" rx="3" fill="url(#${u}chromeH)" opacity=".9"/>
  <rect x="${sx + 13}" y="${y - 12}" width="12" height="7" rx="3" fill="url(#${u}chromeH)"/>`;
  }
  if (s.stacks === 0 && !s.electric) {
    stacks += `<rect x="${R + 2}" y="${y + 6}" width="7" height="${192 - (y + 6)}" rx="3" fill="url(#${u}chromeH)"/>`;
  }

  const bumper = s.bumper === 'steel'
    ? `<rect x="${fx - 14}" y="186" width="36" height="24" rx="3" fill="#23272d" stroke="#5b636d"/>
  <rect x="${fx - 14}" y="186" width="36" height="3" fill="#6b737c"/><circle cx="${fx - 4}" cy="203" r="2.4" fill="#9aa3ad"/>`
    : s.bumper === 'aero'
      ? `<rect x="${fx - 10}" y="194" width="30" height="14" rx="6" fill="url(#${u}cab)" stroke="${P.cabEdge}" stroke-opacity=".5"/>`
      : `<rect x="${fx - 12}" y="196" width="28" height="13" rx="3" fill="url(#${u}chrome)"/>`;

  const louvres = s.hood === 'aero'
    ? `<path d="M118,134 L158,127" stroke="#000" stroke-opacity=".25" stroke-width="1.6"/>`
    : `<path d="M110,${H.top + 12} L156,${H.top + 11} M110,${H.top + 16} L156,${H.top + 15} M110,${H.top + 20} L156,${H.top + 19}" stroke="#000" stroke-opacity=".28" stroke-width="1.6"/>`;

  const bulldog = s.bulldog
    ? `<path transform="translate(${fx + 8},${H.top - 1})" d="M0,0 L0,-9 Q3,-15 9,-13 L15,-15 L17,-9 L13,-5 L11,0 Z" fill="${P.goldTop}" stroke="${P.goldLow}" stroke-width=".8"/>`
    : '';

  const sleeperBits = s.sleeper ? `
  <rect x="${R - 20 - wW}" y="${y + 32}" width="${wW}" height="30" rx="3" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>
  <rect x="${R - 20 - wW}" y="${y + 72}" width="${wW}" height="3" fill="#0a0f14" opacity=".5"/>
  <rect x="${R - 20 - wW}" y="${y + 78}" width="${wW}" height="3" fill="#0a0f14" opacity=".5"/>
  ${longSleeper ? `<rect x="${R - 20 - wW}" y="${y + 86}" width="${wW}" height="22" rx="2" fill="#000" opacity=".16"/>
  <rect x="${R - 70}" y="${y - 4}" width="26" height="5" rx="2" fill="url(#${u}chrome)"/>` : ''}
  ${s.fairing ? `<path d="M${R},${y + 12} L${R + 16},${y + 30} L${R + 16},176 L${R},184 Z" fill="${P.cabDark}" stroke="${P.cabEdge}" stroke-opacity=".5" stroke-width="1"/>
  <path d="M${R + 4},${y + 24} L${R + 12},${y + 36}" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>` : ''}
  ${s.fairing ? `<path d="M180,${y + 12} Q232,${y - 22} ${R - 4},${y - 10} L${R - 4},${y + 2} L206,${y + 3} Z" fill="url(#${u}cab)" stroke="${P.cabEdge}" stroke-opacity=".6" stroke-width="1"/>
  <path d="M196,${y - 2} Q236,${y - 22} ${R - 10},${y - 12}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>` : ''}` : '';

  const bc = badgeColor(P.paint, P.goldTop);
  const badge = `<text x="180" y="187" font-family="Arial, sans-serif" font-weight="700" font-size="8" fill="${bc}" opacity=".9" letter-spacing=".6">${s.badge}</text>`
    + (s.v8 && s.sleeper ? `<text x="${R - 36}" y="187" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="${bc}" opacity=".9" letter-spacing="1">V8</text>` : '')
    + (s.electric ? `<text x="${s.sleeper ? R - 36 : R - 32}" y="187" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="#3ddc97" letter-spacing="1">EV</text>` : '');

  const grille = grilleSvg(s, fx, gt).replace(/UchromeH/g, `${u}chromeH`);

  return `
${svgHead(vbW, moving)}
  <defs>
    ${baseDefs(u, P)}
    <path id="${u}hood" d="${H.path}"/>
    <clipPath id="${u}hoodclip"><use href="#${u}hood"/></clipPath>
    <path id="${u}cabp" d="${cabPath}"/>
    <clipPath id="${u}cabclip"><use href="#${u}cabp"/></clipPath>
  </defs>

  <ellipse cx="${vbW / 2}" cy="252" rx="${vbW / 2 - 10}" ry="9" fill="#000" opacity=".45" filter="url(#${u}blur)"/>
  ${hasTrailer ? renderRealisticTrailer(trailerType!, u, P, 372, moving) : ''}

  <!-- chassis -->
  <rect x="60" y="196" width="${hasTrailer ? 460 : 470}" height="10" fill="#14171c"/>
  <rect x="60" y="196" width="${hasTrailer ? 460 : 470}" height="2" fill="#3a4049"/>
  ${tank}
  <!-- Elegant Aero Side Cover / Chassis Fairing Panel -->
  <rect x="194" y="190" width="78" height="23" rx="4" fill="url(#${u}cab)" stroke="${P.cabEdge}" stroke-width="1.2"/>
  <rect x="198" y="193" width="70" height="3" fill="#fff" opacity="0.28"/>
  <rect x="198" y="210" width="70" height="2" fill="url(#${u}chrome)"/>
  ${s.electric ? '' : `<rect x="154" y="198" width="38" height="22" rx="3" fill="#1c2026" stroke="#3a4049"/><rect x="154" y="198" width="38" height="3" fill="#fff" opacity=".12"/><path d="M166 198V220M180 198V220" stroke="#0b0c0e" stroke-width="3"/>`}
  <rect x="280" y="188" width="46" height="26" rx="3" fill="#2a2f36" stroke="#4b525a"/>
  <rect x="280" y="188" width="46" height="3" fill="#fff" opacity=".14"/><rect x="296" y="198" width="14" height="4" rx="2" fill="url(#${u}chrome)"/>
  <rect x="334" y="196" width="44" height="11" rx="5.5" fill="url(#${u}chromeH)"/><rect x="334" y="209" width="44" height="9" rx="4.5" fill="url(#${u}chromeH)" opacity=".85"/>
  <rect x="${d0 - 30}" y="172" width="${dn - d0 + 50}" height="8" rx="2" fill="#2f353d"/>
  <rect x="${d0 - 30}" y="172" width="${dn - d0 + 50}" height="2" fill="#5b636d"/>
  ${axleGroup(u, driveX, moving, { color: P.cabDark })}

  <!-- hood -->
  <use href="#${u}hood" fill="url(#${u}cab)"/>
  <g clip-path="url(#${u}hoodclip)">
    <circle cx="105" cy="219" r="38" fill="#07090c"/>
    <circle cx="105" cy="219" r="38" fill="none" stroke="#3a4049" stroke-width="2"/>
    <path d="${H.stripe}" fill="url(#${u}gold)"/>
    ${louvres}
  </g>
  <path d="${H.edge}" stroke="${P.cabEdge}" stroke-opacity=".7" stroke-width="1.6"/>
  ${bulldog}
  <!-- front fender -->
  <path d="M58,206 Q58,168 105,166 Q152,168 152,206 L146,206 Q146,180 105,180 Q64,180 64,206 Z" fill="url(#${u}cab)" stroke="${P.cabEdge}" stroke-opacity=".55" stroke-width="1"/>
  ${grille}
  <rect x="${fx - 6}" y="${gt - 12}" width="14" height="10" rx="3" fill="#fff8d6" stroke="#9aa3ad" stroke-width="1"/>
  <rect x="${fx - 5}" y="${gt + 34}" width="5" height="8" fill="#ffa21a"/>
  ${bumper}

  <!-- cab + sleeper -->
  <use href="#${u}cabp" fill="url(#${u}cab)"/>
  <path d="M168,124 L190,${y + 10} Q194,${y} 206,${y} L${R - 12},${y}" fill="none" stroke="${P.cabEdge}" stroke-opacity=".6" stroke-width="1.5"/>
  <path d="M166,190 L${R},190" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
  <path d="M166,166 L${R},164 L${R},170 L166,172 Z" fill="url(#${u}gold)" clip-path="url(#${u}cabclip)"/>
  <path d="M178,124 L196,${y + 14} L232,${y + 14} L232,124 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>
  <path d="M200,${y + 16} L214,${y + 16} L194,124 L182,124 Z" fill="#fff" opacity=".16"/>
  <path d="M174,128 L238,128 L238,192 L168,192 Z" fill="none" stroke="#0a0f14" stroke-width="1.6" opacity=".8"/>
  <rect x="216" y="140" width="13" height="4" rx="2" fill="url(#${u}chrome)"/>
  <rect x="238" y="${y}" width="1.6" height="${192 - y}" fill="#0a0f14" opacity=".65"/>
  ${sleeperBits}
  ${s.visor ? `<path d="M182,${y + 18} Q186,${y + 6} 196,${y + 4} L232,${y + 4} L232,${y + 10} L196,${y + 10} Z" fill="${P.cabDark}" stroke="${P.cabEdge}" stroke-opacity=".5"/>` : ''}
  <rect x="172" y="192" width="48" height="5" rx="1" fill="#2a2f36"/>
  <rect x="158" y="${y + 36}" width="9" height="36" rx="3" fill="#10151b" stroke="#3b4756"/>
  <rect x="166" y="${y + 50}" width="14" height="3" fill="#10151b"/>
  ${badge}
  ${stacks}
  ${spinWheel(u, 105, moving)}

  <line x1="0" y1="250" x2="${vbW}" y2="250" stroke="#ffffff" stroke-opacity=".08" stroke-dasharray="6 8"/>
</svg>`;
}
