from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/domain/trucks/trucks.visuals.ts")
if not path.exists():
    raise SystemExit(f"ERROR: File not found: {path}")

source = path.read_text()

anchor = """  // Append model-specific details without changing the shared chassis,
  // wheel, axle, or trailer rendering.
  tractorSvg += modelDetails;
"""
if anchor not in source:
    raise SystemExit("ERROR: Insertion point not found. No changes made.")

required_ids = ["scania_s730","volvo_fh16","merc_actros_1853",
                "kenworth_w900","peterbilt_389","freightliner_cascadia"]
for m in required_ids:
    if f"case '{m}':" not in source:
        raise SystemExit(f"ERROR: Missing model profile: {m}. No changes made.")

geometry = r"""
  // MODEL-SPECIFIC CAB GEOMETRY
  // Layered cab art: base body, shading, glass + glare, seams, mirrors, lamps.
  const cabLamp = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x - 1.5}" y="${y - 1.5}" width="${w + 3}" height="${h + 3}" rx="2" fill="#fde68a" fill-opacity="0.18"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.6"/>`;
  const cabGrille = (x: number, y: number, w: number, rows: number, gap: number) =>
    Array.from({ length: rows }, (_, i) =>
      `<rect x="${x}" y="${y + i * gap}" width="${w}" height="0.9" fill="#94a3b8" fill-opacity="0.85"/>`
    ).join('');
  const cabMirror = (x: number, y: number) =>
    `<path d="M${x} ${y + 2} L${x + 3} ${y} L${x + 3} ${y + 9} L${x} ${y + 8} Z" fill="#0f172a" stroke="#94a3b8" stroke-width="0.6"/>` +
    `<path d="M${x + 1.5} ${y + 8} L${x + 1.5} ${y + 12}" stroke="#64748b" stroke-width="0.7"/>`;
  const cabHandle = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="4" height="1.2" rx="0.6" fill="#e2e8f0"/>`;
  const cabSeam = (d: string) =>
    `<path d="${d}" stroke="#0f172a" stroke-opacity="0.55" stroke-width="0.7" fill="none"/>`;
  const cabShade = (d: string) => `<path d="${d}" fill="#000" fill-opacity="0.2"/>`;
  const cabLight = (d: string) => `<path d="${d}" fill="#fff" fill-opacity="0.14"/>`;
  const cabGlare = (d: string) => `<path d="${d}" fill="#fff" fill-opacity="0.2"/>`;
  const cabStack = (x: number, y: number, h: number) =>
    `<rect x="${x}" y="${y}" width="3.2" height="${h}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.6"/>` +
    `<rect x="${x - 0.6}" y="${y - 1.4}" width="4.4" height="2" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.5"/>` +
    `<rect x="${x + 0.5}" y="${y}" width="0.8" height="${h}" fill="#fff" fill-opacity="0.6"/>`;
  let modelCabGeometry = '';

  switch (modelId) {

    case 'scania_s730':
      // Tall, upright cab, panoramic glass, LED signature.
      modelCabGeometry = `
        <path d="M10 52 L10 37 L14 19 L25 8 Q42 5 59 9 L66 15 L66 43
                 L52 43 L52 36 L23 36 L23 43 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabLight('M25 9 Q42 6 59 10 L63 14 L24 13 Z')}
        ${cabShade('M10 43 L23 43 L23 51 L10 52 Z M52 38 L66 38 L66 43 L52 43 Z')}
        <path d="M15 23 L24 13 L45 12 L43 29 L14 29 Z"
          fill="#38bdf8" fill-opacity="0.34" stroke="#bae6fd" stroke-width="0.8"/>
        ${cabGlare('M20 17 L26 13 L31 13 L22 29 L16 29 Z')}
        <path d="M46 13 L58 15 L61 29 L45 29 Z"
          fill="#38bdf8" fill-opacity="0.26" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M21 8 Q42 3 61 9 L72 13 L66 18 L24 14 Z"
          fill="#334155" stroke="${accentColor}" stroke-width="1"/>
        <rect x="30" y="4.5" width="22" height="1.6" rx="0.8" fill="${accentColor}" fill-opacity="0.9"/>
        ${cabSeam('M45 13 L46 36')}
        ${cabHandle(48, 31)}
        ${cabMirror(10, 20)}
        <path d="M10 31 L20 31 L19 43 L11 43 Z" fill="#0b121a" stroke="#cbd5e1" stroke-width="0.8"/>
        ${cabGrille(12, 33, 6, 4, 2.2)}
        ${cabLamp(11, 44, 6, 5)}
        <path d="M11 42 L18 42" stroke="#38bdf8" stroke-width="0.7"/>
        <path d="M24 31 L42 31 L40 34 L24 34" stroke="${accentColor}" stroke-width="1" fill="none"/>
        <path d="M20 43 L28 43 L28 51 L20 51 Z" fill="#334155" stroke="#64748b" stroke-width="0.6"/>
        <path d="M21 46 L27 46 M21 48.5 L27 48.5" stroke="#94a3b8" stroke-width="0.6"/>
      `;
      break;

    case 'volvo_fh16':
      // Curved roofline, broad glass, signature light bar.
      modelCabGeometry = `
        <path d="M10 52 L10 37 Q13 19 27 10 Q43 5 59 11 L67 18 L64 43
                 L51 43 L49 34 L22 34 L21 43 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabLight('M27 11 Q43 6 58 12 L62 16 L26 14 Z')}
        ${cabShade('M10 43 L21 43 L21 51 L10 52 Z M51 38 L64 38 L64 43 L51 43 Z')}
        <path d="M14 24 Q25 12 44 12 L42 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.32" stroke="#bae6fd" stroke-width="0.8"/>
        ${cabGlare('M19 22 Q24 15 32 13 L26 31 L16 31 Z')}
        <path d="M27 14 L26 31" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M46 13 L58 16 L61 31 L45 31 Z"
          fill="#38bdf8" fill-opacity="0.24" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M20 9 Q43 3 61 10 L70 16 L63 19 L23 14 Z"
          fill="#475569" stroke="${accentColor}" stroke-width="1"/>
        <path d="M30 6 Q44 3 56 7" stroke="${accentColor}" stroke-width="1.3" fill="none"/>
        ${cabSeam('M45 13 L47 34')}
        ${cabHandle(48, 29)}
        ${cabMirror(10, 19)}
        <path d="M10 32 L20 32 L19 44 L11 45 Z" fill="#0b121a" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M11 35 L19 35 M11 38.5 L19 38.5 M11 42 L19 42" stroke="#94a3b8" stroke-width="0.7"/>
        <path d="M11 45 L18 44 L17 49 L11 50 Z" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M11 44.5 L17 43.7" stroke="#38bdf8" stroke-width="0.7"/>
        <path d="M23 33 L41 33" stroke="${accentColor}" stroke-width="1"/>
      `;
      break;

    case 'merc_actros_1853':
      // Squared cab, flat roof, big star grille, stepped glazing.
      modelCabGeometry = `
        <path d="M10 52 L10 37 L15 19 L24 11 L57 10 L65 16 L65 43
                 L51 43 L49 35 L22 35 L21 43 Z"
          fill="#293747" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabLight('M24 11 L57 10 L63 15 L23 15 Z')}
        ${cabShade('M10 43 L21 43 L21 51 L10 52 Z M51 38 L65 38 L65 43 L51 43 Z')}
        <path d="M15 23 L23 14 L43 14 L42 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.3" stroke="#bae6fd" stroke-width="0.8"/>
        ${cabGlare('M19 22 L24 15 L29 15 L22 31 L15 31 Z')}
        <path d="M45 15 L57 15 L60 30 L45 30 Z"
          fill="#38bdf8" fill-opacity="0.24" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M23 10 L57 9 L68 15 L62 19 L24 15 Z"
          fill="#475569" stroke="${accentColor}" stroke-width="1"/>
        <rect x="28" y="5.6" width="3" height="3" rx="0.6" fill="${accentColor}"/>
        <rect x="34" y="5.6" width="3" height="3" rx="0.6" fill="${accentColor}"/>
        <rect x="40" y="5.6" width="3" height="3" rx="0.6" fill="${accentColor}"/>
        ${cabSeam('M44 15 L45 35')}
        ${cabHandle(47, 31)}
        ${cabMirror(10, 18)}
        <path d="M10 32 L20 32 L19 44 L11 44 Z" fill="#111827" stroke="#cbd5e1" stroke-width="0.8"/>
        ${cabGrille(11.5, 34, 6.5, 4, 2.2)}
        ${cabLamp(10.5, 45, 7, 5)}
        <rect x="23" y="37" width="18" height="2" fill="#64748b" opacity="0.7"/>
        <circle cx="15" cy="37" r="2.1" fill="#334155" stroke="#e2e8f0" stroke-width="0.6"/>
        <path d="M15 35 L15 39 M13.3 38 L16.7 36 M13.3 36 L16.7 38"
          stroke="#f8fafc" stroke-width="0.55"/>
      `;
      break;

    case 'kenworth_w900':
      // Long conventional hood, tall sleeper, twin chrome stacks.
      modelCabGeometry = `
        <path d="M6 53 L6 42 L22 42 L27 30 L48 30 L48 43 L76 43 L76 14
                 L103 12 L105 18 L105 43 L117 43 L117 52 Z"
          fill="#293747" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabShade('M6 47 L117 47 L117 52 L6 53 Z')}
        ${cabLight('M27 30 L48 30 L48 32 L26 32 Z M77 14 L103 12 L104 15 L77 17 Z')}
        <path d="M27 31 L47 31 L47 38 L25 38 Z" fill="#334155" stroke="${accentColor}" stroke-width="0.7"/>
        <path d="M30 32 L30 37 M34 32 L34 37 M38 32 L38 37 M42 32 L42 37" stroke="#0f172a" stroke-opacity="0.5" stroke-width="0.8"/>
        <path d="M49 30 L56 19 L75 19 L75 42 L49 42 Z" fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <path d="M52 30 L58 21 L69 21 L68 30 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#bae6fd" stroke-width="0.7"/>
        ${cabGlare('M55 28 L59 22 L63 22 L58 30 Z')}
        ${cabSeam('M62 30 L62 42')}
        ${cabHandle(64, 34)}
        <path d="M78 16 L101 15 L101 42 L78 42 Z" fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <rect x="82" y="21" width="14" height="9" rx="1" fill="#38bdf8" fill-opacity="0.26" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M78 36 L101 36" stroke="${accentColor}" stroke-width="1.2" stroke-opacity="0.8"/>
        ${cabSeam('M89 30 L89 42')}
        ${cabMirror(49, 20)}
        <path d="M9 40 L19 40 L19 51 L9 51 Z" fill="#0b121a" stroke="#cbd5e1" stroke-width="0.8"/>
        ${cabGrille(10.5, 42, 7, 4, 2.2)}
        <path d="M5 53 L23 53 L22 57 L5 57 Z" fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        ${cabLamp(3, 44, 3, 6)}
        <path d="M76 34 L76 6 L79 4 L79 34" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M96 31 L96 7 L99 5 L99 31" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M76.8 33 L76.8 7 M96.8 30 L96.8 8" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>
        <rect x="106" y="46" width="10" height="4" rx="1" fill="#475569" stroke="#94a3b8" stroke-width="0.6"/>
      `;
      break;

    case 'peterbilt_389':
      // Extended hood, rounded sleeper, classic chrome front end.
      modelCabGeometry = `
        <path d="M5 53 L5 42 L22 42 L27 30 L49 30 L49 42 L77 42 L77 16
                 Q89 11 102 16 L104 22 L104 43 L117 43 L117 52 Z"
          fill="#293747" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabShade('M5 47 L117 47 L117 52 L5 53 Z')}
        ${cabLight('M27 30 L49 30 L49 32 L26 32 Z M79 17 Q91 13 101 18 L101 20 Q91 16 79 19 Z')}
        <path d="M27 31 L48 31 L48 37 L25 37 Z" fill="#334155" stroke="${accentColor}" stroke-width="0.7"/>
        <path d="M31 32 L31 36 M35 32 L35 36 M39 32 L39 36 M43 32 L43 36" stroke="#0f172a" stroke-opacity="0.5" stroke-width="0.8"/>
        <path d="M50 30 L57 19 L76 19 L76 42 L50 42 Z" fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <path d="M53 30 L59 21 L70 21 L69 30 Z" fill="#38bdf8" fill-opacity="0.28" stroke="#bae6fd" stroke-width="0.7"/>
        ${cabGlare('M56 28 L60 22 L64 22 L59 30 Z')}
        ${cabSeam('M63 30 L63 42')}
        ${cabHandle(65, 34)}
        <path d="M79 17 Q91 13 101 18 L101 42 L79 42 Z" fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <rect x="83" y="21" width="12" height="9" rx="1" fill="#38bdf8" fill-opacity="0.26" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M79 36 L101 36" stroke="${accentColor}" stroke-width="1.2" stroke-opacity="0.8"/>
        ${cabSeam('M90 30 L90 42')}
        ${cabMirror(50, 20)}
        <rect x="9" y="39" width="10" height="13" rx="1" fill="#0b121a" stroke="#cbd5e1" stroke-width="0.9"/>
        <path d="M11 40 L11 51 M13.5 40 L13.5 51 M16 40 L16 51" stroke="#cbd5e1" stroke-width="0.7"/>
        <path d="M5 53 L23 53 L22 57 L5 57 Z" fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <circle cx="7" cy="42" r="3.2" fill="#fde68a" fill-opacity="0.2"/>
        <circle cx="7" cy="48" r="3.2" fill="#fde68a" fill-opacity="0.2"/>
        <circle cx="7" cy="42" r="2" fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <circle cx="7" cy="48" r="2" fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <path d="M77 34 L77 5 L80 3 L80 34" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M96 31 L96 8 L99 6 L99 31" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M77.8 33 L77.8 6 M96.8 30 L96.8 9" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>
        <rect x="106" y="46" width="10" height="4" rx="1" fill="#475569" stroke="#94a3b8" stroke-width="0.6"/>
      `;
      break;

    case 'freightliner_cascadia':
      // Sloped aero nose, integrated sleeper fairing, roof marker lights.
      modelCabGeometry = `
        <path d="M10 52 L10 38 L15 20 Q27 9 46 10 L61 13 L68 20 L65 43
                 L52 43 L50 35 L23 35 L20 43 Z"
          fill="#293747" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        ${cabLight('M20 12 Q30 8 46 10 L60 13 L64 17 L24 15 Z')}
        ${cabShade('M10 43 L20 43 L20 51 L10 52 Z M52 38 L65 38 L65 43 L52 43 Z')}
        <path d="M15 24 Q27 13 45 14 L43 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.32" stroke="#bae6fd" stroke-width="0.8"/>
        ${cabGlare('M19 22 Q25 16 33 15 L26 31 L16 31 Z')}
        <path d="M47 15 L59 18 L62 31 L45 31 Z"
          fill="#38bdf8" fill-opacity="0.24" stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M20 10 Q42 5 61 13 L70 19 L63 21 L23 15 Z"
          fill="#475569" stroke="${accentColor}" stroke-width="1"/>
        <path d="M24 17 Q40 13 58 20" stroke="${accentColor}" stroke-width="1" fill="none" stroke-opacity="0.8"/>
        ${cabSeam('M45 15 L47 35')}
        ${cabHandle(49, 31)}
        ${cabMirror(10, 20)}
        <path d="M10 32 L19 32 L19 44 L11 47 Z" fill="#0b121a" stroke="#94a3b8" stroke-width="0.8"/>
        ${cabGrille(11.5, 34, 6, 4, 2.2)}
        <path d="M10 45 L18 43 L18 48 L11 50 Z" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M11 44.5 L18 42.6" stroke="#38bdf8" stroke-width="0.7"/>
        <path d="M57 39 L88 42 L88 51 L57 51 Z" fill="#475569" stroke="#94a3b8" stroke-width="0.6" opacity="0.85"/>
        <path d="M60 43 L86 45 M60 46 L86 48" stroke="#94a3b8" stroke-width="0.6" stroke-opacity="0.8"/>
        ${[27,35,43,51].map(x =>
          `<circle cx="${x}" cy="10" r="1.6" fill="#fbbf24" fill-opacity="0.25"/>` +
          `<circle cx="${x}" cy="10" r="0.8" fill="#fbbf24"/>`
        ).join('')}
      `;
      break;
  }

  // Draw the model-specific body over the generic cab surfaces.
  tractorSvg += modelCabGeometry;

"""

marker = "  // MODEL-SPECIFIC CAB GEOMETRY"
if marker in source:
    s = source.index(marker)
    e = source.index(anchor)
    if e < s:
        raise SystemExit("ERROR: Unexpected layout. No changes made.")
    updated = source[:s] + geometry.lstrip("\n") + source[e:]
    mode = "upgraded existing block"
else:
    updated = source.replace(anchor, geometry + anchor, 1)
    mode = "inserted new block"

backup = path.with_suffix(path.suffix + f".{datetime.now():%Y%m%d_%H%M%S}.bak")
shutil.copy2(path, backup)
path.write_text(updated)

print(f"SUCCESS: {mode}")
print(f"Backup:  {backup}")
print(f"Updated: {path}")
