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
    raise SystemExit(
        "ERROR: Expected insertion point not found. "
        "No changes made."
    )

if "MODEL-SPECIFIC CAB GEOMETRY" in source:
    raise SystemExit("Already patched. No changes made.")

required_ids = [
    "scania_s730",
    "volvo_fh16",
    "merc_actros_1853",
    "kenworth_w900",
    "peterbilt_389",
    "freightliner_cascadia",
]

for model_id in required_ids:
    if f"case '{model_id}':" not in source:
        raise SystemExit(
            f"ERROR: Missing existing model profile: {model_id}. "
            "No changes made."
        )

geometry = r"""
  // MODEL-SPECIFIC CAB GEOMETRY
  // Replaces the generic visible cab surfaces while retaining
  // the shared chassis, wheel, axle and trailer systems.
  let modelCabGeometry = '';

  switch (modelId) {

    case 'scania_s730':
      // Scania S-series: tall, upright cab with panoramic windscreen.
      modelCabGeometry = `
        <path d="M10 52 L10 37 L14 19 L25 8
                 Q42 5 59 9 L66 15 L66 43
                 L52 43 L52 36 L23 36 L23 43 Z"
          fill="#263445" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M15 23 L24 13 L45 12 L43 29
                 L14 29 Z"
          fill="#38bdf8" fill-opacity="0.32"
          stroke="#bae6fd" stroke-width="0.8"/>
        <path d="M46 13 L58 15 L61 29 L45 29 Z"
          fill="#38bdf8" fill-opacity="0.24"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M21 8 Q42 3 61 9 L72 13
                 L66 18 L24 14 Z"
          fill="#334155" stroke="${accentColor}"
          stroke-width="1"/>
        <path d="M10 31 L20 31 L19 43 L11 43 Z"
          fill="#101820" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M11 44 L17 44 L16 49 L11 49 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M24 31 L42 31 L40 34 L24 34"
          stroke="${accentColor}" stroke-width="1" fill="none"/>
        <path d="M20 43 L28 43 L28 51 L20 51 Z"
          fill="#334155" stroke="#64748b" stroke-width="0.6"/>
      `;
      break;

    case 'volvo_fh16':
      // Volvo FH: curved roofline, broad panoramic glass and sloped front.
      modelCabGeometry = `
        <path d="M10 52 L10 37 Q13 19 27 10
                 Q43 5 59 11 L67 18 L64 43
                 L51 43 L49 34 L22 34 L21 43 Z"
          fill="#263445" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M14 24 Q25 12 44 12
                 L42 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.3"
          stroke="#bae6fd" stroke-width="0.8"/>
        <path d="M27 14 L26 31"
          stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M46 13 L58 16 L61 31 L45 31 Z"
          fill="#38bdf8" fill-opacity="0.22"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M20 9 Q43 3 61 10
                 L70 16 L63 19 L23 14 Z"
          fill="#475569" stroke="${accentColor}"
          stroke-width="1"/>
        <path d="M10 32 L20 32 L19 44 L11 45 Z"
          fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M11 45 L18 44 L17 49 L11 50 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M23 33 L41 33"
          stroke="${accentColor}" stroke-width="1"/>
      `;
      break;

    case 'merc_actros_1853':
      // Actros StreamSpace: flatter roof, squared cab and stepped glazing.
      modelCabGeometry = `
        <path d="M10 52 L10 37 L15 19 L24 11
                 L57 10 L65 16 L65 43
                 L51 43 L49 35 L22 35 L21 43 Z"
          fill="#293747" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M15 23 L23 14 L43 14
                 L42 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.28"
          stroke="#bae6fd" stroke-width="0.8"/>
        <path d="M45 15 L57 15 L60 30 L45 30 Z"
          fill="#38bdf8" fill-opacity="0.22"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M23 10 L57 9 L68 15
                 L62 19 L24 15 Z"
          fill="#475569" stroke="${accentColor}"
          stroke-width="1"/>
        <path d="M10 32 L20 32 L19 44 L11 44 Z"
          fill="#111827" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M10 45 L18 44 L17 50 L11 50 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <rect x="23" y="37" width="18" height="2"
          fill="#64748b" opacity="0.7"/>
        <circle cx="15" cy="37" r="2.1"
          fill="#334155" stroke="#e2e8f0" stroke-width="0.6"/>
        <path d="M15 35 L15 39 M13.3 38 L16.7 36"
          stroke="#f8fafc" stroke-width="0.55"/>
      `;
      break;

    case 'kenworth_w900':
      // W900: long conventional bonnet, tall sleeper and twin stacks.
      modelCabGeometry = `
        <path d="M6 53 L6 42 L22 42 L27 30
                 L48 30 L48 43 L76 43
                 L76 14 L103 12 L105 18
                 L105 43 L117 43 L117 52 Z"
          fill="#293747" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M27 31 L47 31 L47 38 L25 38 Z"
          fill="#334155" stroke="${accentColor}" stroke-width="0.7"/>
        <path d="M49 30 L56 19 L75 19
                 L75 42 L49 42 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <path d="M52 30 L58 21 L69 21 L68 30 Z"
          fill="#38bdf8" fill-opacity="0.28"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M78 16 L101 15 L101 42 L78 42 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <rect x="82" y="21" width="14" height="9" rx="1"
          fill="#38bdf8" fill-opacity="0.25"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M9 40 L19 40 L19 51 L9 51 Z"
          fill="#101820" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M5 53 L23 53 L22 57 L5 57 Z"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <path d="M76 34 L76 6 L79 4 L79 34"
          fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M96 31 L96 7 L99 5 L99 31"
          fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M24 37 L45 37"
          stroke="#cbd5e1" stroke-width="0.8"/>
      `;
      break;

    case 'peterbilt_389':
      // Peterbilt 389: extended hood, rounded sleeper and classic front.
      modelCabGeometry = `
        <path d="M5 53 L5 42 L22 42 L27 30
                 L49 30 L49 42 L77 42
                 L77 16 Q89 11 102 16
                 L104 22 L104 43 L117 43
                 L117 52 Z"
          fill="#293747" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M27 31 L48 31 L48 37 L25 37 Z"
          fill="#334155" stroke="${accentColor}" stroke-width="0.7"/>
        <path d="M50 30 L57 19 L76 19
                 L76 42 L50 42 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <path d="M53 30 L59 21 L70 21 L69 30 Z"
          fill="#38bdf8" fill-opacity="0.25"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M79 17 Q91 13 101 18
                 L101 42 L79 42 Z"
          fill="#263445" stroke="${accentColor}" stroke-width="1"/>
        <rect x="83" y="21" width="12" height="9" rx="1"
          fill="#38bdf8" fill-opacity="0.25"
          stroke="#bae6fd" stroke-width="0.7"/>
        <rect x="9" y="39" width="10" height="13" rx="1"
          fill="#101820" stroke="#cbd5e1" stroke-width="0.9"/>
        <path d="M5 53 L23 53 L22 57 L5 57 Z"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <circle cx="7" cy="42" r="2"
          fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <circle cx="7" cy="48" r="2"
          fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <path d="M77 34 L77 5 L80 3 L80 34"
          fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M96 31 L96 8 L99 6 L99 31"
          fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
      `;
      break;

    case 'freightliner_cascadia':
      // Cascadia: sloped aerodynamic nose and integrated sleeper fairing.
      modelCabGeometry = `
        <path d="M10 52 L10 38 L15 20
                 Q27 9 46 10 L61 13
                 L68 20 L65 43 L52 43
                 L50 35 L23 35 L20 43 Z"
          fill="#293747" stroke="${accentColor}"
          stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M15 24 Q27 13 45 14
                 L43 31 L14 31 Z"
          fill="#38bdf8" fill-opacity="0.3"
          stroke="#bae6fd" stroke-width="0.8"/>
        <path d="M47 15 L59 18 L62 31 L45 31 Z"
          fill="#38bdf8" fill-opacity="0.22"
          stroke="#bae6fd" stroke-width="0.7"/>
        <path d="M20 10 Q42 5 61 13
                 L70 19 L63 21 L23 15 Z"
          fill="#475569" stroke="${accentColor}"
          stroke-width="1"/>
        <path d="M10 32 L19 32 L19 44 L11 47 Z"
          fill="#111827" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M10 45 L18 43 L18 48 L11 50 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M57 39 L88 42 L88 51 L57 51 Z"
          fill="#475569" stroke="#94a3b8"
          stroke-width="0.6" opacity="0.85"/>
        ${[27,35,43,51].map(x =>
          `<circle cx="${x}" cy="10" r="0.8" fill="#fbbf24"/>`
        ).join('')}
      `;
      break;
  }

  // Draw the model-specific body over the generic cab surfaces.
  // Existing shared wheels, chassis and trailer remain unchanged.
  tractorSvg += modelCabGeometry;

"""

updated = source.replace(anchor, geometry + anchor, 1)

backup = path.with_suffix(path.suffix + ".bak")
if backup.exists():
    backup = path.with_suffix(
        path.suffix + f".{datetime.now():%Y%m%d_%H%M%S}.bak"
    )

shutil.copy2(path, backup)
path.write_text(updated)

print("SUCCESS: Model-specific truck cab geometry added.")
print(f"Backup: {backup}")
print(f"Updated: {path}")
print("Profiles updated:")
for model_id in required_ids:
    print(f"  - {model_id}")
