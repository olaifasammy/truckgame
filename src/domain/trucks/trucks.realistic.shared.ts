/**
 * Shared helpers for the realistic truck SVGs: color math, gradients, wheels, curtainside trailer.
 */
import { getAnimationStyles } from './trucks.trailers.visuals';

export interface RealisticOpts {
  /** Cab paint color (hex). Anything that isn't a hex falls back to DEFAULT_PAINT. */
  paint?: string;
  /** Trailer body/curtain color (hex). Defaults to a dark shade of the paint. */
  trailerPaint?: string;
  /** Livery stripe color (hex). */
  accent?: string;
  isMoving?: boolean;
}

export const DEFAULT_PAINT = '#2b4a6f';
export const DEFAULT_ACCENT = '#c9a24f';

export function toRgb(c: string): number[] | null {
  let h = String(c || '').trim().replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return null;
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
function mix(c: string, target: number, t: number, fallback: string): string {
  const rgb = toRgb(c) || toRgb(fallback)!;
  const out = rgb.map(v => Math.round(v + (target - v) * t));
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
}
export const lighten = (c: string, t: number, fb = DEFAULT_PAINT) => mix(c, 255, t, fb);
export const darken = (c: string, t: number, fb = DEFAULT_PAINT) => mix(c, 0, t, fb);

/** Badge text color that stays readable on the paint (dark text on light paint). */
export function badgeColor(paint: string, light: string): string {
  const rgb = toRgb(paint) || toRgb(DEFAULT_PAINT)!;
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.62 ? '#2a2f36' : light;
}

let uid = 0;
/** Unique id prefix so several inline SVGs on one page don't share gradient ids. */
export const nextUid = () => `rt${++uid}`;

export interface Palette {
  paint: string; accent: string; trailerPaint: string;
  cabTop: string; cabMid: string; cabLow: string; cabEdge: string; cabDark: string;
  bodyTop: string; bodyLow: string; strap: string;
  goldTop: string; goldLow: string;
}

export function makePalette(opts: RealisticOpts = {}): Palette {
  const paint = toRgb(opts.paint || '') ? opts.paint! : DEFAULT_PAINT;
  const accent = toRgb(opts.accent || '') ? opts.accent! : DEFAULT_ACCENT;
  const trailerPaint = toRgb(opts.trailerPaint || '') ? opts.trailerPaint! : darken(paint, 0.25);
  return {
    paint, accent, trailerPaint,
    cabTop: lighten(paint, 0.28), cabMid: paint, cabLow: darken(paint, 0.6),
    cabEdge: lighten(paint, 0.6), cabDark: darken(paint, 0.35),
    bodyTop: lighten(trailerPaint, 0.12), bodyLow: darken(trailerPaint, 0.45),
    strap: darken(trailerPaint, 0.65),
    goldTop: lighten(accent, 0.3, DEFAULT_ACCENT), goldLow: darken(accent, 0.35, DEFAULT_ACCENT),
  };
}

export const svgHead = (vbW: number, moving: boolean) =>
  `<svg viewBox="0 0 ${vbW} 280" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">\n  ${moving ? getAnimationStyles() : ''}`;

/** Gradients + the wheel symbol. Put inside <defs>. */
export function baseDefs(u: string, P: Palette): string {
  return `
    <linearGradient id="${u}cab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.cabTop}"/><stop offset=".4" stop-color="${P.cabMid}"/><stop offset="1" stop-color="${P.cabLow}"/>
    </linearGradient>
    <linearGradient id="${u}glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9fd0ef"/><stop offset=".45" stop-color="#3b6d93"/><stop offset="1" stop-color="#14283a"/>
    </linearGradient>
    <linearGradient id="${u}chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f4f6"/><stop offset=".5" stop-color="#8d96a0"/><stop offset="1" stop-color="#4b525a"/>
    </linearGradient>
    <linearGradient id="${u}chromeH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4b525a"/><stop offset=".4" stop-color="#e9edf0"/><stop offset="1" stop-color="#6b737c"/>
    </linearGradient>
    <linearGradient id="${u}body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.bodyTop}"/><stop offset="1" stop-color="${P.bodyLow}"/>
    </linearGradient>
    <linearGradient id="${u}gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.goldTop}"/><stop offset="1" stop-color="${P.goldLow}"/>
    </linearGradient>
    <radialGradient id="${u}rim" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#f4f6f8"/><stop offset=".6" stop-color="#9aa3ad"/><stop offset="1" stop-color="#4a525b"/>
    </radialGradient>
    <filter id="${u}blur"><feGaussianBlur stdDeviation="6"/></filter>
    <g id="${u}w">
      <circle r="31" fill="#0d0d0e"/>
      <circle r="31" fill="none" stroke="#2a2a2c" stroke-width="2"/>
      <circle r="25" fill="#17181a"/>
      <circle r="24" fill="none" stroke="#242528" stroke-width="1" stroke-dasharray="3 3"/>
      <circle r="17.5" fill="url(#${u}rim)"/>
      <circle r="13" fill="#2b3036"/>
      <circle r="9" fill="url(#${u}rim)"/>
      <circle r="3.5" fill="#20252a"/>
      <g fill="#1c2026">
        <circle cx="0" cy="-11" r="1.6"/><circle cx="7.8" cy="-7.8" r="1.6"/><circle cx="11" cy="0" r="1.6"/><circle cx="7.8" cy="7.8" r="1.6"/>
        <circle cx="0" cy="11" r="1.6"/><circle cx="-7.8" cy="7.8" r="1.6"/><circle cx="-11" cy="0" r="1.6"/><circle cx="-7.8" cy="-7.8" r="1.6"/>
      </g>
    </g>`;
}

export function spinWheel(u: string, x: number, moving: boolean, y = 219): string {
  return moving
    ? `<g transform="translate(${x},${y})"><g style="animation: spinWheel 0.5s linear infinite; transform-origin: 0px 0px;"><use href="#${u}w"/></g></g>`
    : `<use href="#${u}w" transform="translate(${x},${y})"/>`;
}

/** Wheel well + wheels + fender lip (+ mud flap) for one axle group. xs = axle x positions. */
export function axleGroup(u: string, xs: number[], moving: boolean, opts: { cy?: number; flap?: boolean; color?: string } = {}): string {
  const cy = opts.cy ?? 219;
  const color = opts.color ?? '#171b21';
  const xa = xs[0], xb = xs[xs.length - 1];
  const well = `<path d="M${xa - 38},${cy} A38,38 0 0 1 ${xa},${cy - 38} L${xb},${cy - 38} A38,38 0 0 1 ${xb + 38},${cy} Z" fill="#07090c"/>`;
  const lip = `<path d="M${xa - 41},${cy} A41,41 0 0 1 ${xa},${cy - 41} L${xb},${cy - 41} A41,41 0 0 1 ${xb + 41},${cy} L${xb + 34},${cy} A34,34 0 0 0 ${xb},${cy - 34} L${xa},${cy - 34} A34,34 0 0 0 ${xa - 34},${cy} Z" fill="${color}" stroke="#3a4049" stroke-width="1.2"/>
  <path d="M${xa - 41},${cy} A41,41 0 0 1 ${xa},${cy - 41} L${xb},${cy - 41}" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="1.4"/>`;
  const flap = opts.flap === false ? '' : `<rect x="${xb + 37}" y="${cy - 2}" width="6" height="32" rx="2" fill="#0b0c0e" stroke="#2a2f36"/>`;
  return `${well}${xs.map(x => spinWheel(u, x, moving, cy)).join('')}${lip}${flap}`;
}

/** Aero side skirt panel under a box-type trailer. */
export function trailerSkirt(u: string, P: Palette, xa: number, xb: number): string {
  if (xb - xa < 30) return '';
  const w = xb - xa;
  const ribs: string[] = [];
  for (let x = xa + 24; x < xb - 10; x += 40) ribs.push(`<rect x="${x}" y="191" width="2" height="14"/>`);
  return `<rect x="${xa}" y="188" width="${w}" height="20" rx="3" fill="${darken(P.trailerPaint, 0.55)}" stroke="#0b0c0e" stroke-opacity=".5"/>
  <rect x="${xa}" y="188" width="${w}" height="3" fill="#ffffff" opacity=".12"/>
  <g fill="#000" opacity=".25">${ribs.join('')}</g>
  <rect x="${xa}" y="206" width="${w}" height="3" rx="1.5" fill="url(#${u}chrome)"/>`;
}

/** Curtainside trailer from x0 to x1 (deck y=176, wheels at y=219) on the given axle x positions. */
export function curtainTrailer(u: string, P: Palette, x0: number, x1: number, axles: number[], moving: boolean): string {
  const w = x1 - x0;
  const pleats: number[] = []; for (let x = x0 + 13; x < x1 - 10; x += 17) pleats.push(x);
  const straps: number[] = []; for (let x = x0 + 32; x < x1 - 40; x += 64) straps.push(x);
  const lights: number[] = []; for (let x = x0 + 38; x < x1 - 60; x += 100) lights.push(x);
  const a0 = axles[0], an = axles[axles.length - 1];
  const gear = x0 + 248;
  return `
  <rect x="${x0}" y="176" width="${w}" height="12" fill="#14171c"/>
  <rect x="${x0}" y="176" width="${w}" height="2" fill="#3a4049"/>
  ${trailerSkirt(u, P, x0 + 290, a0 - 52)}
  <rect x="${gear}" y="188" width="8" height="46" fill="#2b3037"/>
  <rect x="${gear + 12}" y="188" width="8" height="46" fill="#23272d"/>
  <rect x="${gear - 8}" y="233" width="36" height="5" rx="2" fill="#3a4049"/>
  <rect x="${x0}" y="30" width="${w}" height="146" rx="3" fill="url(#${u}body)"/>
  <g stroke="#ffffff" stroke-opacity=".05" stroke-width="2"><path d="${pleats.map(x => `M${x} 34V172`).join('')}"/></g>
  <g fill="${P.strap}">${straps.map(x => `<rect x="${x}" y="32" width="6" height="140"/>`).join('')}</g>
  <g fill="url(#${u}chrome)">${straps.map(x => `<rect x="${x - 1}" y="96" width="8" height="12" rx="1"/>`).join('')}</g>
  <rect x="${x0}" y="132" width="${w}" height="7" fill="url(#${u}gold)"/>
  <rect x="${x0}" y="143" width="${w}" height="2" fill="${P.goldLow}" opacity=".8"/>
  <rect x="${x0 - 2}" y="24" width="${w + 4}" height="9" rx="3" fill="url(#${u}chrome)"/>
  <rect x="${x0 - 2}" y="166" width="${w + 4}" height="11" rx="2" fill="url(#${u}chrome)"/>
  <rect x="${x1 - 6}" y="26" width="8" height="152" rx="2" fill="url(#${u}chromeH)"/>
  <rect x="${x0 - 2}" y="26" width="6" height="152" rx="2" fill="url(#${u}chromeH)"/>
  <g fill="#ffa21a">${lights.map(x => `<circle cx="${x}" cy="171" r="2.5"/>`).join('')}</g>
  <rect x="${x1 - 5}" y="150" width="6" height="18" rx="2" fill="#d6141b"/>
  <rect x="${an + 38}" y="190" width="7" height="44" rx="2" fill="#0b0c0e"/>
  ${axleGroup(u, axles, moving, { flap: false })}`;
}
