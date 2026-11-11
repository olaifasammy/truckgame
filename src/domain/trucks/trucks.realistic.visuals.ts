/**
 * Realistic side-view trucks with a changeable paint color.
 * getRealisticTruckSvg() returns null when a model/trailer isn't covered yet,
 * so callers can fall back to the old silhouette renderer.
 *
 * Cab styles live in trucks.realistic.brands.ts (per brand / per model).
 * Trailers live in trucks.realistic.trailers.ts.
 * TODO (one by one): asian cab-over, rigids, vans.
 */
import type { RealisticOpts } from './trucks.realistic.shared';
import { makePalette, nextUid, baseDefs, svgHead, spinWheel, badgeColor, axleGroup } from './trucks.realistic.shared';
import { getRealisticAmericanSvg } from './trucks.realistic.american';
import { getRealisticVanSvg } from './trucks.realistic.vans';
import { getRealisticRigidSvg } from './trucks.realistic.rigids';
import { hasRealisticTrailer, trailerLayout, renderRealisticTrailer } from './trucks.realistic.trailers';
import { pickCabSpec } from './trucks.realistic.brands';
import type { EuroStyle } from './trucks.realistic.brands';

export type { RealisticOpts } from './trucks.realistic.shared';
export { DEFAULT_PAINT } from './trucks.realistic.shared';
export { pickCabSpec } from './trucks.realistic.brands';

export type TruckFamily = 'euro' | 'american' | 'van' | null;

export function pickTruckFamily(model: any): TruckFamily {
  const spec = pickCabSpec(model);
  return spec ? spec.family : null;
}

export function hasRealisticTruck(model: any, trailerType?: string | null): boolean {
  if (!pickCabSpec(model)) return false;
  if (!trailerType || trailerType === 'none') return true;
  return hasRealisticTrailer(trailerType);
}

export function getRealisticTruckSvg(
  model: any,
  axle: string = '6x4',
  trailerType?: string | null,
  opts: RealisticOpts = {}
): string | null {
  const spec = pickCabSpec(model);
  if (!spec) return null;
  
  const isRigid = (spec.family === 'euro' && spec.euro.rigid) || (spec.family === 'american' && spec.us.rigid) || (trailerType && trailerType.startsWith('rigid_'));
  
  if (isRigid && (spec.family === 'euro' || spec.family === 'american')) {
    return getRealisticRigidSvg(model, axle, trailerType || 'rigid_box', opts);
  }

  if (spec.family === 'van') return getRealisticVanSvg(spec.van, opts);
  if (!hasRealisticTruck(model, trailerType)) return null;
  if (spec.family === 'american') return getRealisticAmericanSvg(spec.us, axle, trailerType, opts);
  return getRealisticEuroSvg(spec.euro, axle, trailerType, opts);
}

/* ---------- euro cab pieces ---------- */
function headlightSvg(s: EuroStyle): string {
  const fill = 'fill="#fff8d6" stroke="#9aa3ad" stroke-width="1"';
  let lamp: string;
  switch (s.headlight) {
    case 'slim':  lamp = `<path d="M26,148 L40,143 L41,152 L27,156 Z" ${fill}/>`; break;
    case 'tall':  lamp = `<path d="M26,138 L37,134 L40,160 L27,163 Z" ${fill}/>`; break;
    case 'rect':  lamp = `<path d="M26,140 L41,138 L42,157 L27,159 Z" ${fill}/>`; break;
    case 'round': lamp = `<circle cx="33" cy="151" r="8" ${fill}/><circle cx="33" cy="151" r="4" fill="#fff" opacity=".7"/>`; break;
    default:      lamp = `<path d="M26,146 L40,142 L42,160 L27,162 Z" ${fill}/>`;
  }
  let drl = '';
  if (s.drl === 'v') drl = `<path d="M27,158 L33,153 L40,145" stroke="#fff" stroke-width="1.6" fill="none"/>`;
  if (s.drl === 'hammer') drl = `<path d="M31,137 L31,160 M27,142 L37,141" stroke="#fff" stroke-width="1.6" fill="none"/>`;
  if (s.drl === 'bar') drl = `<path d="M27,161 L41,157" stroke="#fff" stroke-width="1.8" fill="none"/>`;
  return lamp + drl;
}

function grilleSvg(s: EuroStyle): string {
  const frame = `<rect x="28" y="166" width="14" height="30" rx="2" fill="#0b0e12" stroke="#5b636d"/>`;
  const slats = `<g stroke="#6b737c" stroke-width="1"><path d="M30 170H40M30 174H40M30 178H40M30 182H40M30 186H40M30 190H40"/></g>`;
  switch (s.grille) {
    case 'volvo':
      return `${frame}<path d="M30,170 H40 M30,190 H40" stroke="#6b737c"/><path d="M28,168 L42,194" stroke="#d6dce2" stroke-width="2.6"/><circle cx="35" cy="181" r="3.4" fill="none" stroke="#d6dce2" stroke-width="1.4"/>`;
    case 'merc':
      return `${frame}<g stroke="#9aa3ad" stroke-width="2.2"><path d="M30 171H40M30 176H40M30 186H40M30 191H40"/></g><circle cx="35" cy="181" r="4.6" fill="#0b0e12" stroke="#e2e6ea" stroke-width="1.4"/><path d="M35,177 L35,185 M31,183 L35,181 L39,183" stroke="#e2e6ea" stroke-width="1"/>`;
    case 'man': {
      const dots: string[] = [];
      for (let y = 170; y <= 192; y += 4) for (let x = 31; x <= 40; x += 3.5) dots.push(`<circle cx="${x}" cy="${y}" r=".9" fill="#7c8791"/>`);
      return `${frame}${dots.join('')}<rect x="30" y="178" width="10" height="5" rx="1" fill="#1a1e24" stroke="#cfd6dc" stroke-width=".8"/>`;
    }
    case 'daf':
      return `${frame}<g stroke="#d6dce2" stroke-width="3"><path d="M29 172H41M29 181H41M29 190H41"/></g><rect x="31" y="176" width="8" height="10" fill="#1d4f9c" stroke="#e2e6ea" stroke-width=".8"/>`;
    case 'iveco':
      return `${frame}${slats}<path d="M28,181 H42" stroke="#e2e6ea" stroke-width="3"/><rect x="31" y="179" width="8" height="4" fill="#1d4f9c"/>`;
    case 'renault':
      return `${frame}${slats}<path d="M35,174 L40,181 L35,188 L30,181 Z" fill="#e8c34a" stroke="#fff3b0" stroke-width=".8"/>`;
    case 'hino':
      return `${frame}<g stroke="#d6dce2" stroke-width="2.4"><path d="M29 171H41M29 177H41M29 183H41M29 189H41"/></g><circle cx="35" cy="180" r="3.4" fill="#d2481f" stroke="#fff" stroke-width=".8"/>`;
    case 'isuzu':
      return `${frame}<g stroke="#d6dce2" stroke-width="3.2"><path d="M29 172H41M29 190H41"/></g><rect x="30" y="177" width="10" height="9" fill="#c0392b" stroke="#fff" stroke-width=".8"/>`;
    case 'fuso':
      return `${frame}${slats}<g fill="#d6dce2"><path d="M35,172 L38,177 L35,182 L32,177 Z"/><path d="M31,181 L34,186 L31,191 L28.5,186 Z"/><path d="M39,181 L42,186 L39,191 L36.5,186 Z"/></g>`;
    case 'howo': {
      const m: string[] = [];
      for (let y = 169; y <= 193; y += 3) m.push(`M29 ${y}H41`);
      return `${frame}<path d="${m.join('')}" stroke="#6b737c" stroke-width=".9"/><rect x="29" y="176" width="12" height="7" rx="1" fill="#e2e6ea" stroke="#5b636d"/>`;
    }
    case 'faw':
      return `${frame}<g stroke="#d6dce2" stroke-width="2"><path d="M29 171H41M29 176H41M29 186H41M29 191H41"/></g><ellipse cx="35" cy="181" rx="5.5" ry="3.6" fill="#1d4f9c" stroke="#e2e6ea" stroke-width=".9"/>`;
    case 'scania':
      return `${frame}${slats}<rect x="28" y="166" width="14" height="3" fill="#d6dce2"/>`;
    default:
      return `${frame}${slats}`;
  }
}

function deflectorSvg(u: string, s: EuroStyle): string {
  const { roofY: y, rake: rk, rearX: R } = s;
  const fx = 88 + rk * 0.5;
  const stroke = `stroke="${'#ffffff'}" stroke-opacity=".0"`;
  if (s.deflector === 'wedge')
    return `<path d="M${56 + rk},${y + 15} Q${64 + rk},${y - 13} ${R - 48},${y - 18} L${R - 4},${y - 13} L${R - 2},${y + 1} L${fx},${y + 3} Z" fill="url(#${u}cab)" stroke="DEFEDGE" stroke-opacity=".6" stroke-width="1"/>
  <path d="M${64 + rk},${y + 1} Q${72 + rk},${y - 11} ${R - 48},${y - 15}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.2"/>`;
  if (s.deflector === 'fairing')
    return `<path d="M${60 + rk},${y + 12} Q${86 + rk},${y - 20} ${R - 40},${y - 14} Q${R - 8},${y - 12} ${R - 2},${y + 2} L${fx},${y + 3} Z" fill="url(#${u}cab)" stroke="DEFEDGE" stroke-opacity=".6" stroke-width="1"/>
  <path d="M${72 + rk},${y - 2} Q${96 + rk},${y - 15} ${R - 44},${y - 11}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.2"/>`;
  if (s.deflector === 'spoiler')
    return `<path d="M${76 + rk},${y + 4} L${R - 40},${y - 8} L${R - 2},${y - 4} L${R - 2},${y + 2} L${fx},${y + 3} Z" fill="url(#${u}cab)" stroke="DEFEDGE" stroke-opacity=".6" stroke-width="1"/>`;
  void stroke;
  return '';
}

function getRealisticEuroSvg(s: EuroStyle, axle: string, trailerType: string | null | undefined, opts: RealisticOpts): string {
  const u = nextUid();
  const P = makePalette({ ...opts, paint: opts.paint || s.paint, accent: opts.accent || s.accent });
  const moving = !!opts.isMoving;
  const hasTrailer = !!trailerType && trailerType !== 'none';
  const driveX = axle === '4x2' ? [290] : [262, 316];
  const layout = hasTrailer ? trailerLayout(trailerType!, 192) : null;
  const vbW = layout ? layout.x1 + 36 : 400;
  const d0 = driveX[0], dn = driveX[driveX.length - 1];
  const { roofY: y, rake: rk, rearX: R, roofRound: rr } = s;
  const fx = 88 + rk * 0.5;
  const sleeper = R >= 170;
  const my = y + 43; // mirror top

  const cabPath =
    `M30,208 L26,152 Q26,130 40,118 L${68 + rk},${y + 15} Q${73 + rk},${y + 3} ${fx},${y + 2} L${R - 24 - rr},${y} Q${R - 4},${y} ${R - 2},${y + 19 + rr} L${R},204 Z`;

  const tankOrBattery = s.electric
    ? `<rect x="182" y="184" width="62" height="32" rx="4" fill="#1d2630" stroke="#4b525a"/>
  <g stroke="#3a4552" stroke-width="2"><path d="M198 186V214M213 186V214M228 186V214"/></g>
  <path d="M216,190 L205,203 L212,203 L208,212 L221,198 L214,198 Z" fill="#3ddc97"/>`
    : `<rect x="182" y="184" width="62" height="32" rx="7" fill="url(#${u}chrome)"/>
  <rect x="190" y="192" width="46" height="2" fill="#fff" opacity=".35"/>`;

  const stack = s.electric ? '' : `
  <rect x="${R + 2}" y="${y + 21}" width="7" height="${188 - (y + 21)}" rx="3" fill="url(#${u}chromeH)"/>
  <rect x="${R - 1}" y="${y + 13}" width="13" height="10" rx="3" fill="url(#${u}chromeH)"/>`;

  const bumper = s.steelBumper
    ? `<rect x="14" y="188" width="36" height="22" rx="3" fill="#23272d" stroke="#5b636d"/>
  <rect x="14" y="188" width="36" height="3" fill="#6b737c"/><circle cx="24" cy="204" r="2.4" fill="#9aa3ad"/>`
    : `<rect x="22" y="196" width="26" height="12" rx="3" fill="url(#${u}chrome)"/>`;

  const camX = Math.round(40 + (118 - (y + 30)) / (118 - (y + 15)) * (28 + rk));
  const mirrors = s.mirrorCam
    ? `<rect x="${camX - 12}" y="${y + 29}" width="16" height="4" rx="2" fill="#10151b" stroke="#3b4756"/>
  <rect x="${camX - 17}" y="${y + 27}" width="8" height="10" rx="2" fill="#10151b" stroke="#3b4756"/>`
    : `<rect x="42" y="${my}" width="9" height="30" rx="3" fill="#10151b" stroke="#3b4756"/>
  <rect x="50" y="${my + 10}" width="12" height="3" fill="#10151b"/>`;

  const bc = badgeColor(P.paint, P.goldTop);
  const badge = `<text x="52" y="158" font-family="Arial, sans-serif" font-weight="700" font-size="8" fill="${bc}" opacity=".9" letter-spacing=".6">${s.badge}</text>`
    + (s.v8 && sleeper ? `<text x="${R - 34}" y="190" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="${bc}" opacity=".9" letter-spacing="1">V8</text>` : '')
    + (s.electric ? `<text x="${R - 36}" y="190" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="#3ddc97" letter-spacing="1">EV</text>` : '');

  const deflector = deflectorSvg(u, s).replace(/DEFEDGE/g, P.cabEdge);

  return `
${svgHead(vbW, moving)}
  <defs>
    ${baseDefs(u, P)}
    <path id="${u}cabpath" d="${cabPath}"/>
    <clipPath id="${u}cabclip"><use href="#${u}cabpath"/></clipPath>
  </defs>

  <ellipse cx="${vbW / 2}" cy="252" rx="${vbW / 2 - 10}" ry="9" fill="#000" opacity=".45" filter="url(#${u}blur)"/>
  ${hasTrailer ? renderRealisticTrailer(trailerType!, u, P, 192, moving) : ''}

  <!-- TRACTOR -->
  <rect x="60" y="192" width="300" height="11" fill="#14171c"/>
  ${tankOrBattery}
  <!-- Elegant Aero Side Cover / Chassis Fairing Panel -->
  <rect x="136" y="179" width="112" height="21" rx="4" fill="url(#${u}cab)" stroke="${P.cabEdge}" stroke-width="1.2"/>
  <rect x="140" y="182" width="104" height="3" fill="#fff" opacity="0.28"/>
  <rect x="140" y="196" width="104" height="2" fill="url(#${u}chrome)"/>
  <rect x="332" y="194" width="30" height="12" rx="6" fill="url(#${u}chromeH)"/>
  ${stack}
  ${s.electric ? '' : `<rect x="128" y="198" width="44" height="20" rx="3" fill="#1c2026" stroke="#3a4049"/><rect x="128" y="198" width="44" height="3" fill="#fff" opacity=".12"/><path d="M140 198V218M160 198V218" stroke="#0b0c0e" stroke-width="3"/>`}
  <rect x="250" y="196" width="26" height="16" rx="3" fill="#23272d" stroke="#3a4049"/><rect x="257" y="202" width="12" height="3" rx="1.5" fill="url(#${u}chrome)"/>
  <rect x="232" y="170" width="86" height="7" rx="2" fill="#2f353d"/>
  <rect x="232" y="170" width="86" height="2" fill="#5b636d"/>
  ${axleGroup(u, driveX, moving, { color: P.cabDark })}

  <use href="#${u}cabpath" fill="url(#${u}cab)"/>
  <g clip-path="url(#${u}cabclip)">
    <circle cx="95" cy="219" r="38" fill="#07090c"/>
    <circle cx="95" cy="219" r="38" fill="none" stroke="#3a4049" stroke-width="2"/>
    ${s.skirt ? `<path d="M34,188 L${R},186 L${R},204 L38,204 Z" fill="#000" opacity=".22"/>` : ''}
    <path d="M27,170 L${R},166 L${R},172 L27,176 Z" fill="url(#${u}gold)"/>
  </g>
  <path d="M40,118 L${68 + rk},${y + 15} Q${73 + rk},${y + 3} ${fx},${y + 2} L${R - 24 - rr},${y}" fill="none" stroke="${P.cabEdge}" stroke-opacity=".6" stroke-width="1.5"/>
  <path d="M30,206 L${R},204" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
  ${deflector}
  <path d="M46,122 L${72 + rk},${y + 21} Q${74 + rk},${y + 17} ${80 + rk},${y + 17} L128,${y + 17} L128,122 Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>
  <path d="M${82 + rk},${y + 19} L${100 + rk},${y + 19} L76,122 L60,122 Z" fill="#fff" opacity=".16"/>
  ${s.sleeperWindow && sleeper ? `<path d="M138,${y + 29} L${R - 12},${y + 29} L${R - 12},${y + 61} L138,${y + 61} Z" fill="url(#${u}glass)" stroke="#0a0f14" stroke-width="2"/>` : ''}
  <path d="M46,126 L130,126 L130,200 L38,200 Z" fill="none" stroke="#0a0f14" stroke-width="1.6" opacity=".8"/>
  <rect x="112" y="134" width="12" height="4" rx="2" fill="url(#${u}chrome)"/>
  ${sleeper ? `<rect x="140" y="124" width="1.5" height="80" fill="#0a0f14" opacity=".7"/>` : ''}
  <rect x="40" y="196" width="48" height="5" rx="1" fill="#2a2f36"/>
  ${mirrors}
  ${badge}
  ${headlightSvg(s)}
  ${grilleSvg(s)}
  ${bumper}
  <rect x="26" y="130" width="3" height="9" fill="#ffa21a"/>
  ${spinWheel(u, 95, moving)}

  <line x1="0" y1="250" x2="${vbW}" y2="250" stroke="#ffffff" stroke-opacity=".08" stroke-dasharray="6 8"/>
</svg>`;
}
