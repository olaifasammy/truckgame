/**
 * Realistic side-view trailers (colorable). Coordinates match the realistic tractors:
 * deck y=176, wheels y=219, trailer starts at x0 (just behind the fifth wheel).
 *
 * Types: curtain, box, reefer, tanker, hazmat, flatbed, lowboy, tipper, container, double_trailer, carrier
 */
import type { Palette } from './trucks.realistic.shared';
import { spinWheel, curtainTrailer, lighten, darken, axleGroup, trailerSkirt } from './trucks.realistic.shared';

export const REALISTIC_TRAILER_TYPES = [
  'curtain', 'box', 'reefer', 'tanker', 'hazmat', 'flatbed', 'lowboy', 'tipper', 'container', 'double_trailer', 'carrier',
] as const;
const TRAILER_SET = new Set<string>(REALISTIC_TRAILER_TYPES);
export const hasRealisticTrailer = (t?: string | null) => !!t && TRAILER_SET.has(t);

export interface TrailerLayout { x1: number; axles: number[]; }

export function trailerLayout(type: string, x0: number): TrailerLayout {
  switch (type) {
    case 'double_trailer': {
      const x1 = x0 + 880;
      return { x1, axles: [x0 + 330, x0 + 376, x1 - 100, x1 - 54] };
    }
    case 'lowboy': {
      const x1 = x0 + 772;
      return { x1, axles: [x1 - 110, x1 - 60, x1 - 10] };
    }
    default: {
      const x1 = x0 + 772;
      return { x1, axles: [x1 - 154, x1 - 104, x1 - 54] };
    }
  }
}

/* ---------- shared pieces ---------- */
function chassisBack(u: string, P: Palette, x0: number, x1: number, a0: number, beam = true, skirt = false): string {
  const guardX = x0 + 98;
  return `
  ${beam ? `<rect x="${x0}" y="176" width="${x1 - x0}" height="12" fill="#14171c"/><rect x="${x0}" y="176" width="${x1 - x0}" height="2" fill="#3a4049"/>` : ''}
  ${skirt ? trailerSkirt(u, P, x0 + 160, a0 - 52) : `<rect x="${guardX}" y="192" width="${Math.max(40, a0 - 60 - guardX)}" height="5" rx="2" fill="url(#${u}chrome)"/>`}
  <!-- Retracted landing gear (cranked up when coupled) -->
  <rect x="${x0 + 48}" y="181" width="12" height="11" rx="2" fill="#1f232b" stroke="#4b525a"/>
  <rect x="${x0 + 64}" y="181" width="12" height="11" rx="2" fill="#1f232b" stroke="#4b525a"/>
  <rect x="${x0 + 42}" y="185" width="38" height="3" fill="url(#${u}chrome)"/>
  <circle cx="${x0 + 84}" cy="186" r="3" fill="#cfd6dc"/>

  <!-- Fifth wheel kingpin coupling & realistic umbilical jumper cables (Gladhands & Pigtail) -->
  <path d="M${x0 - 24},144 Q${x0 - 12},126 ${x0 + 6},140" fill="none" stroke="#e74c3c" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M${x0 - 22},148 Q${x0 - 10},130 ${x0 + 8},144" fill="none" stroke="#3498db" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M${x0 - 26},141 Q${x0 - 14},122 ${x0 + 4},136" fill="none" stroke="#f1c40f" stroke-width="2.2" stroke-dasharray="3 2" stroke-linecap="round"/>
  <rect x="${x0 - 6}" y="168" width="22" height="10" rx="2" fill="url(#${u}chromeH)" stroke="#2b3036"/>`;
}

function wheelsFront(u: string, axles: number[], moving: boolean, fender = true): string {
  const a0 = axles[0], an = axles[axles.length - 1];
  return `
  <rect x="${an + 38}" y="190" width="7" height="44" rx="2" fill="#0b0c0e"/>
  ${axleGroup(u, axles, moving, { flap: false })}`;
}

function lightsAndTail(x0: number, x1: number): string {
  const lights: number[] = []; for (let x = x0 + 38; x < x1 - 60; x += 100) lights.push(x);
  return `<g fill="#ffa21a">${lights.map(x => `<circle cx="${x}" cy="171" r="2.5"/>`).join('')}</g>
  <rect x="${x1 - 5}" y="150" width="6" height="18" rx="2" fill="#d6141b"/>`;
}

/* ---------- box (dry van) ---------- */
function boxBody(u: string, P: Palette, xa: number, xb: number): string {
  const w = xb - xa;
  const ribs: number[] = []; for (let x = xa + 22; x < xb - 14; x += 34) ribs.push(x);
  return `
  <rect x="${xa}" y="30" width="${w}" height="146" rx="3" fill="url(#${u}body)"/>
  <g fill="#ffffff" opacity=".07">${ribs.map(x => `<rect x="${x}" y="34" width="2" height="132"/>`).join('')}</g>
  <rect x="${xa}" y="132" width="${w}" height="7" fill="url(#${u}gold)"/>
  <rect x="${xa}" y="143" width="${w}" height="2" fill="${P.goldLow}" opacity=".8"/>
  <rect x="${xa - 2}" y="26" width="${w + 4}" height="8" rx="3" fill="url(#${u}chrome)"/>
  <rect x="${xa - 2}" y="166" width="${w + 4}" height="11" rx="2" fill="url(#${u}chrome)"/>
  <rect x="${xa - 2}" y="28" width="6" height="150" rx="2" fill="url(#${u}chromeH)"/>
  <rect x="${xb - 6}" y="28" width="8" height="150" rx="2" fill="url(#${u}chromeH)"/>
  <rect x="${xb - 34}" y="44" width="3" height="116" fill="url(#${u}chrome)"/>
  <rect x="${xb - 52}" y="44" width="3" height="116" fill="url(#${u}chrome)"/>
  <rect x="${xb - 36}" y="100" width="7" height="12" rx="1" fill="#2b3036"/>`;
}

function reeferUnit(u: string, x0: number): string {
  return `
  <rect x="${x0 - 16}" y="38" width="16" height="76" rx="3" fill="#cfd6dc" stroke="#7c8791"/>
  <circle cx="${x0 - 8}" cy="62" r="6" fill="#2a3138" stroke="#9aa3ad"/>
  <path d="M${x0 - 8},55 L${x0 - 5},62 L${x0 - 8},69 L${x0 - 11},62 Z" fill="#7dd3fc" opacity=".8"/>
  <g stroke="#7c8791" stroke-width="1.4"><path d="M${x0 - 14} 84H${x0 - 2}M${x0 - 14} 90H${x0 - 2}M${x0 - 14} 96H${x0 - 2}M${x0 - 14} 102H${x0 - 2}"/></g>
  <rect x="${x0 + 90}" y="192" width="70" height="16" rx="6" fill="url(#${u}chromeH)"/>`;
}

/* ---------- tanker / hazmat ---------- */
function tankBody(u: string, P: Palette, x0: number, x1: number, hazard: boolean): string {
  const tx0 = x0 + 2, tx1 = x1 - 16, ty0 = 54, ty1 = 170, h = ty1 - ty0;
  const rings: number[] = []; for (let x = x0 + 120; x < x1 - 80; x += 130) rings.push(x);
  const saddles = [x0 + 90, x0 + 380, x1 - 150];
  return `
  <defs>
    <linearGradient id="${u}tank" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lighten(P.trailerPaint, 0.6)}"/><stop offset=".3" stop-color="${lighten(P.trailerPaint, 0.15)}"/><stop offset="1" stop-color="${darken(P.trailerPaint, 0.55)}"/>
    </linearGradient>
    <pattern id="${u}haz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="7" height="14" fill="#111"/><rect x="7" width="7" height="14" fill="#f5c400"/>
    </pattern>
  </defs>
  ${saddles.map(x => `<rect x="${x}" y="160" width="26" height="18" fill="#1a1e24"/>`).join('')}
  <rect x="${tx0}" y="${ty0}" width="${tx1 - tx0}" height="${h}" rx="${h / 2}" fill="url(#${u}tank)"/>
  <g fill="${darken(P.trailerPaint, 0.35)}" opacity=".55">${rings.map(x => `<rect x="${x}" y="${ty0 + 3}" width="4" height="${h - 6}"/>`).join('')}</g>
  <rect x="${tx0 + 34}" y="${ty0 + 10}" width="${tx1 - tx0 - 68}" height="6" rx="3" fill="#fff" opacity=".25"/>
  <rect x="${tx0 + 80}" y="${ty0 - 6}" width="${tx1 - tx0 - 160}" height="4" fill="#20252a"/>
  ${[x0 + 200, x0 + 400, x0 + 600].map(x => `<rect x="${x}" y="${ty0 - 14}" width="24" height="9" rx="3" fill="url(#${u}chrome)"/>`).join('')}
  <rect x="${tx0 + 40}" y="118" width="${tx1 - tx0 - 80}" height="7" fill="url(#${u}gold)"/>
  <rect x="${x1 - 18}" y="146" width="18" height="28" rx="3" fill="url(#${u}chromeH)"/>
  <rect x="${x1 - 34}" y="164" width="18" height="6" fill="#4b525a"/>
  ${hazard ? `
    <rect x="${tx0 + 70}" y="140" width="${tx1 - tx0 - 140}" height="10" fill="url(#${u}haz)"/>
    ${[x0 + 160, x0 + 330, x0 + 500].map(cx => `
    <g transform="translate(${cx},92)">
      <polygon points="0,-22 22,0 0,22 -22,0" fill="#ff6a00" stroke="#111" stroke-width="2"/>
      <rect x="-2" y="-11" width="4" height="14" fill="#111"/><circle cy="8" r="2.4" fill="#111"/>
    </g>`).join('')}` : ''}`;
}

/* ---------- flatbed ---------- */
function flatbedBody(u: string, P: Palette, x0: number, x1: number): string {
  const crates: string[] = [];
  const cw = 134;
  for (let i = 0; i < 5; i++) {
    const x = x0 + 34 + i * (cw + 6);
    crates.push(`<rect x="${x}" y="116" width="${cw}" height="52" rx="2" fill="${i % 2 ? lighten(P.trailerPaint, 0.1) : P.trailerPaint}" stroke="#0b0c0e" stroke-opacity=".6"/>`);
    if (i < 4) crates.push(`<rect x="${x + 10}" y="64" width="${cw - 20}" height="52" rx="2" fill="${i % 2 ? P.trailerPaint : lighten(P.trailerPaint, 0.1)}" stroke="#0b0c0e" stroke-opacity=".6"/>`);
  }
  return `
  <rect x="${x0}" y="168" width="${x1 - x0}" height="10" fill="#2b3037"/>
  <rect x="${x0}" y="168" width="${x1 - x0}" height="2" fill="#6b737c"/>
  <rect x="${x0}" y="176" width="${x1 - x0}" height="12" fill="#14171c"/>
  ${crates.join('')}
  <g fill="${P.accent}" opacity=".9">${[x0 + 120, x0 + 330, x0 + 560].map(x => `<rect x="${x}" y="62" width="5" height="108"/>`).join('')}</g>
  <rect x="${x0 + 2}" y="96" width="8" height="74" rx="2" fill="url(#${u}chromeH)"/>
  ${[x0 + 200, x0 + 400, x0 + 600].map(x => `<rect x="${x}" y="150" width="5" height="18" fill="#4b525a"/>`).join('')}`;
}

/* ---------- lowboy ---------- */
function lowboyBody(u: string, P: Palette, x0: number, x1: number): string {
  const g1 = x0 + 110, g2 = x0 + 140, l1 = x1 - 200, l2 = x1 - 170;
  const deck = `M${x0},170 L${g1},170 L${g2},200 L${l1},200 L${l2},170 L${x1},170 L${x1},186 L${l2 + 10},186 L${l1 + 8},214 L${g2 - 8},214 L${g1 - 6},186 L${x0},186 Z`;
  const tx0 = g2 + 40, tx1 = l1 - 30;
  const fins: number[] = []; for (let x = tx0 + 18; x < tx1 - 10; x += 12) fins.push(x);
  return `
  <path d="${deck}" fill="#1c2026" stroke="#3a4049" stroke-width="1.5"/>
  <path d="M${g2},200 L${l1},200" stroke="#6b737c" stroke-width="2"/>
  <defs><linearGradient id="${u}xf" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${lighten(P.trailerPaint, 0.3)}"/><stop offset="1" stop-color="${darken(P.trailerPaint, 0.5)}"/>
  </linearGradient></defs>
  <rect x="${tx0}" y="108" width="${tx1 - tx0}" height="92" rx="4" fill="url(#${u}xf)" stroke="#0b0c0e" stroke-opacity=".6"/>
  <g stroke="#000" stroke-opacity=".3" stroke-width="2">${fins.map(x => `<path d="M${x} 116V194"/>`).join('')}</g>
  ${[0.25, 0.5, 0.75].map(p => {
    const cx = Math.round(tx0 + (tx1 - tx0) * p);
    return `<rect x="${cx - 6}" y="84" width="12" height="26" rx="2" fill="#e8e2d4" stroke="#7c8791"/><ellipse cx="${cx}" cy="84" rx="9" ry="4" fill="#cfc8b8" stroke="#7c8791"/>`;
  }).join('')}
  <rect x="${tx0 - 4}" y="124" width="${tx1 - tx0 + 8}" height="6" fill="url(#${u}gold)"/>
  <g stroke="#f5c400" stroke-width="3"><path d="M${tx0 + 20} 108L${tx0 - 6} 198M${tx1 - 20} 108L${tx1 + 6} 198"/></g>
  <rect x="${x0 + 30}" y="150" width="20" height="20" rx="3" fill="#2b3037"/>`;
}

/* ---------- tipper (end-dump) ---------- */
function tipperBody(u: string, P: Palette, x0: number, x1: number): string {
  const ribs: number[] = []; for (let x = x0 + 70; x < x1 - 20; x += 80) ribs.push(x);
  return `
  <rect x="${x0}" y="176" width="${x1 - x0}" height="12" fill="#14171c"/>
  <line x1="${x0 + 52}" y1="180" x2="${x0 + 84}" y2="112" stroke="#4b525a" stroke-width="12" stroke-linecap="round"/>
  <line x1="${x0 + 52}" y1="180" x2="${x0 + 84}" y2="112" stroke="url(#${u}chromeH)" stroke-width="7" stroke-linecap="round"/>
  <path d="M${x0},48 L${x0 + 30},42 L${x1 - 14},62 L${x1 - 8},166 Q${x1 - 10},178 ${x1 - 24},178 L${x0 + 12},178 Q${x0},176 ${x0},166 Z" fill="url(#${u}body)" stroke="#0b0c0e" stroke-opacity=".5"/>
  <g stroke="#000" stroke-opacity=".22" stroke-width="2">${ribs.map(x => `<path d="M${x} 56V172"/>`).join('')}</g>
  <g stroke="#fff" stroke-opacity=".1" stroke-width="2"><path d="M${x0 + 6} 86H${x1 - 12}M${x0 + 6} 116H${x1 - 10}M${x0 + 6} 146H${x1 - 10}"/></g>
  <path d="M${x0 + 30},42 L${x1 - 14},62" stroke="url(#${u}chrome)" stroke-width="5"/>
  <rect x="${x0 + 6}" y="130" width="${x1 - x0 - 20}" height="7" fill="url(#${u}gold)" opacity=".95"/>
  <rect x="${x1 - 18}" y="56" width="10" height="16" rx="2" fill="#2b3036"/>
  <rect x="${x1 - 14}" y="150" width="8" height="14" rx="2" fill="url(#${u}chrome)"/>
  <rect x="${x0 + 24}" y="38" width="8" height="12" fill="#2b3036"/>`;
}

/* ---------- container ---------- */
function containerBody(u: string, P: Palette, x0: number, x1: number): string {
  const cx0 = x0 + 20, cx1 = x1 - 20;
  const corr: number[] = []; for (let x = cx0 + 10; x < cx1 - 56; x += 8) corr.push(x);
  return `
  <rect x="${x0}" y="176" width="${x1 - x0}" height="12" fill="#14171c"/>
  <rect x="${x0}" y="176" width="${x1 - x0}" height="2" fill="#3a4049"/>
  <defs><linearGradient id="${u}cont" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${lighten(P.trailerPaint, 0.18)}"/><stop offset="1" stop-color="${darken(P.trailerPaint, 0.4)}"/>
  </linearGradient></defs>
  <rect x="${cx0}" y="24" width="${cx1 - cx0}" height="152" rx="2" fill="url(#${u}cont)"/>
  <g stroke="#000" stroke-opacity=".2" stroke-width="3">${corr.map(x => `<path d="M${x} 32V168"/>`).join('')}</g>
  <g stroke="#fff" stroke-opacity=".1" stroke-width="1.5">${corr.map(x => `<path d="M${x + 3} 32V168"/>`).join('')}</g>
  <rect x="${cx0}" y="24" width="${cx1 - cx0}" height="8" fill="${darken(P.trailerPaint, 0.4)}"/>
  <rect x="${cx0}" y="168" width="${cx1 - cx0}" height="8" fill="${darken(P.trailerPaint, 0.5)}"/>
  ${[[cx0, 24], [cx1 - 12, 24], [cx0, 166], [cx1 - 12, 166]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="10" fill="#1a1e24" stroke="#4b525a"/>`).join('')}
  <rect x="${cx1 - 56}" y="32" width="56" height="136" fill="${darken(P.trailerPaint, 0.2)}"/>
  ${[cx1 - 48, cx1 - 36, cx1 - 24, cx1 - 12].map(x => `<rect x="${x}" y="36" width="3" height="128" fill="url(#${u}chrome)"/>`).join('')}
  <rect x="${cx0 + 40}" y="70" width="150" height="40" rx="3" fill="#fff" opacity=".14"/>
  <rect x="${cx0 + 40}" y="118" width="150" height="6" fill="url(#${u}gold)"/>`;
}

/* ---------- car carrier ---------- */
const CAR_COLORS = ['#c0392b', '#2e86c1', '#e9edef', '#f1c40f', '#7f8c8d', '#27ae60'];
function car(x: number, yBase: number, c: string): string {
  return `<g transform="translate(${x},${yBase - 80})">
    <path d="M4,74 L4,52 Q4,44 18,42 L70,38 Q96,8 132,8 L178,8 Q202,12 216,40 L230,44 Q238,48 238,60 L238,74 Z" fill="${c}" stroke="#0b0c0e" stroke-width="1.5"/>
    <path d="M84,38 Q104,16 132,16 L172,16 Q190,18 202,38 Z" fill="#7fb6d6" stroke="#0b0c0e"/>
    <rect x="136" y="40" width="3" height="30" fill="#000" opacity=".25"/>
    <circle cx="52" cy="72" r="14" fill="#0d0d0e"/><circle cx="52" cy="72" r="7" fill="#9aa3ad"/>
    <circle cx="190" cy="72" r="14" fill="#0d0d0e"/><circle cx="190" cy="72" r="7" fill="#9aa3ad"/>
    <rect x="3" y="54" width="8" height="6" fill="#fff8d6"/>
  </g>`;
}
function carrierBody(u: string, P: Palette, x0: number, x1: number): string {
  const posts = [x0 + 36, x0 + 262, x0 + 500, x1 - 44];
  const lowerX = [x0 + 12, x0 + 262, x0 + 512];
  const upperX = [x0 + 40, x0 + 288, x0 + 520];
  return `
  <rect x="${x0}" y="186" width="${x1 - x0 - 6}" height="8" fill="#1c2026" stroke="#3a4049"/>
  ${posts.map(x => `<rect x="${x}" y="105" width="6" height="81" fill="#2b3037"/>`).join('')}
  <g stroke="#2b3037" stroke-width="3">${posts.slice(0, -1).map((x, i) => `<path d="M${x + 6} 186L${posts[i + 1]} 105"/>`).join('')}</g>
  ${lowerX.map((x, i) => car(x, 186, CAR_COLORS[i % CAR_COLORS.length])).join('')}
  <rect x="${x0 + 30}" y="98" width="${x1 - x0 - 66}" height="7" fill="#1c2026" stroke="#3a4049"/>
  ${upperX.map((x, i) => car(x, 98, CAR_COLORS[(i + 3) % CAR_COLORS.length])).join('')}
  <rect x="${x0}" y="12" width="8" height="182" fill="url(#${u}chromeH)"/>
  <rect x="${x0}" y="12" width="${x1 - x0 - 120}" height="5" fill="#2b3037"/>
  <g stroke="url(#${u}chrome)" stroke-width="6"><path d="M${x0 + 150} 186L${x0 + 150} 160M${x0 + 420} 186L${x0 + 420} 160"/></g>
  <rect x="${x1 - 10}" y="60" width="4" height="126" fill="#4b525a"/>
  <rect x="${x0 + 140}" y="194" width="${x1 - x0 - 250}" height="5" rx="2" fill="url(#${u}gold)"/>`;
}

/* ---------- double (LCV) ---------- */
function doubleBody(u: string, P: Palette, x0: number, x1: number, axles: number[], moving: boolean): string {
  const aEnd = x0 + 395, bStart = x0 + 425;
  const [a1, a2, b1, b2] = axles;
  return `
  <rect x="${x0}" y="176" width="${aEnd - x0}" height="12" fill="#14171c"/>
  <rect x="${bStart}" y="176" width="${x1 - bStart}" height="12" fill="#14171c"/>
  <path d="M${aEnd},182 L${bStart},182" stroke="#6b737c" stroke-width="5"/>
  <rect x="${aEnd + 8}" y="178" width="14" height="10" fill="#2b3037"/>
  ${boxBody(u, P, x0, aEnd)}
  ${boxBody(u, P, bStart, x1)}
  <rect x="${a2 + 40}" y="190" width="6" height="40" rx="2" fill="#0b0c0e"/>
  <rect x="${b2 + 38}" y="190" width="7" height="44" rx="2" fill="#0b0c0e"/>
  ${axleGroup(u, [a1, a2], moving, { flap: false })}${axleGroup(u, [b1, b2], moving, { flap: false })}
  ${lightsAndTail(x0, x1)}`;
}

/* ---------- entry point ---------- */
export function renderRealisticTrailer(type: string, u: string, P: Palette, x0: number, moving: boolean): string | null {
  if (!hasRealisticTrailer(type)) return null;
  const { x1, axles } = trailerLayout(type, x0);
  const a0 = axles[0];

  switch (type) {
    case 'curtain':
      return curtainTrailer(u, P, x0, x1, axles, moving);
    case 'box':
      return `${chassisBack(u, P, x0, x1, a0, true, true)}${boxBody(u, P, x0, x1)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'reefer':
      return `${chassisBack(u, P, x0, x1, a0, true, true)}${boxBody(u, P, x0, x1)}${reeferUnit(u, x0)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'tanker':
      return `${chassisBack(u, P, x0, x1, a0)}${tankBody(u, P, x0, x1, false)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'hazmat':
      return `${chassisBack(u, P, x0, x1, a0)}${tankBody(u, P, x0, x1, true)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'flatbed':
      return `${chassisBack(u, P, x0, x1, a0, false)}${flatbedBody(u, P, x0, x1)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'lowboy':
      return `${chassisBack(u, P, x0, x1, a0, false)}${lowboyBody(u, P, x0, x1)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'tipper':
      return `${chassisBack(u, P, x0, x1, a0, false)}${tipperBody(u, P, x0, x1)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'container':
      return `${chassisBack(u, P, x0, x1, a0, false)}${containerBody(u, P, x0, x1)}${lightsAndTail(x0, x1)}${wheelsFront(u, axles, moving)}`;
    case 'carrier':
      return `${chassisBack(u, P, x0, x1, a0, false)}${carrierBody(u, P, x0, x1)}${wheelsFront(u, axles, moving, false)}`;
    case 'double_trailer':
      return `${chassisBack(u, P, x0, x0 + 395, axles[0], false, true)}${doubleBody(u, P, x0, x1, axles, moving)}`;
    default:
      return null;
  }
}
