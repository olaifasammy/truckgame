/**
 * Authentic commercial heavy vehicle SVG silhouettes, combination rigs, and trailer schematics.
 */
import { getRealisticTruckSvg } from "./trucks.realistic.visuals";
import { wheelSvg, getAnimationStyles, getExhaustSmokeSvg, renderCoupledTrailerSvg } from "./trucks.trailers.visuals";
import { makePalette, baseDefs } from "./trucks.realistic.shared";
import { trailerLayout, renderRealisticTrailer, hasRealisticTrailer } from "./trucks.realistic.trailers";
import {
  getSprinterVanSvg,
  getRigidTipperSvg,
  getRigidRefuseSvg,
  getRigidTankerSvg,
  getRigidFlatbedSvg,
  getRigidTruckSvg
} from "./trucks.rigid.visuals";

export {
  wheelSvg,
  getAnimationStyles,
  getExhaustSmokeSvg,
  renderCoupledTrailerSvg,
  getSprinterVanSvg,
  getRigidTipperSvg,
  getRigidRefuseSvg,
  getRigidTankerSvg,
  getRigidFlatbedSvg,
  getRigidTruckSvg
};

export function isSprinterModel(model: any): boolean {
  if (!model) return false;
  const id = String(model.id || '').toLowerCase();
  const name = String(model.name || '').toLowerCase();
  
  if (id === 'merc_sprinter' || id === 'isuzu_npr' || id === 'fuso_canter' || id === 'hino_dutro' || id === 'iveco_daily' || id === 'isuzu_elf') {
    return true;
  }
  if (name.includes('sprinter') || name.includes('van') || name.includes('box truck') || name.includes('city express')) {
    return true;
  }
  if (model.baseWeight && model.baseWeight <= 3.8 && Array.isArray(model.haul) && model.haul.length === 1 && model.haul[0] === 'rigid_box') {
    return true;
  }
  return false;
}

export function isRigidModel(model: any, trailerType?: string | null): boolean {
  if (!model) return false;
  if (isSprinterModel(model)) return false;
  
  const id = String(model.id || '').toLowerCase();
  const name = String(model.name || '').toLowerCase();

  if (trailerType === 'rigid_box') return true;

  const rigidIds = new Set([
    'scania_p250', 'scania_l320', 'scania_25p_bev',
    'merc_atego', 'merc_econic', 'merc_antos',
    'man_tgl', 'man_tgm',
    'daf_lf_210', 'daf_xb_electric',
    'kenworth_t480', 'peterbilt_220', 'peterbilt_536', 'peterbilt_520',
    'fl_m2', 'fl_econicsd', 'mack_md7', 'mack_terrapro', 'mack_lr_electric',
    'hino_300', 'hino_l6', 'hino_300_hybrid', 'hino_profia_fw', 'hino_zev', 'hino_ranger', 'hino_500_fg',
    'isuzu_ftr', 'isuzu_nrr_ev', 'isuzu_forward', 'isuzu_f_series',
    'iveco_eurocargo', 'ford_f650', 'howo_t5g', 'fuso_ecanter'
  ]);
  if (rigidIds.has(id)) return true;

  if (Array.isArray(model.haul) && model.haul.length === 1 && model.haul[0] === 'rigid_box') {
    return true;
  }
  if (name.includes('medium rigid') || name.includes('heavy rigid') || name.includes('distribution box') || name.includes('urban distribution')) {
    return true;
  }

  return false;
}

/**
 * Main Truck Silhouette Renderer.
 * - If trailerType is empty/none: renders standard bobtail tractor (viewBox="0 0 160 70").
 * - If trailerType is provided: renders complete connected tractor + trailer rig (viewBox="0 0 340 70" or 440 for LCV).
 */
export function getTruckSilhouetteSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', trailerType?: string | null, paint?: string): string {
  if (isSprinterModel(model)) {
    return getSprinterVanSvg(model, accentColor);
  }
  if (isRigidModel(model, trailerType)) {
    return getRigidTruckSvg(model, accentColor, axle || model?.axle);
  }

  const real = getRealisticTruckSvg(model, axle || model?.axle, trailerType, { paint });
  if (real) return real;

  const isAmerican = model.region === 'America';
  const is6x4 = axle === '6x4' || axle === '6x2' || axle === '8x4';
  const hasTrailer = !!trailerType && trailerType !== 'none';
  const isDouble = trailerType === 'double_trailer';
  
  const viewBoxWidth = hasTrailer ? (isDouble ? 460 : 340) : 160;
  const fifthWheelX = isAmerican ? 128 : 116;

  // Render tractor front (Cabover or Conventional)
  let tractorSvg = '';

  if (isAmerican) {
    // American Conventional (Long hood, vertical chrome exhaust stacks, sleeper cab)
    tractorSvg = `
      <!-- Chassis frame rail -->
      <path d="M12 52 L148 52 L148 56 L12 56 Z" fill="#2d3748" stroke="#4a5568" stroke-width="1"/>
      
      <!-- Long Hood & Front Bumper -->
      <path d="M14 54 L6 54 L6 42 L22 42 L26 30 L48 30 L48 54 Z" fill="rgba(193,154,91,0.12)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="4" y="44" width="4" height="10" rx="1" fill="#718096" stroke="#a0aec0" stroke-width="0.8"/>
      <rect x="7" y="44" width="3" height="4" rx="0.5" fill="#fef08a"/>
      
      <!-- Front grille with vertical chrome bars -->
      <rect x="10" y="43" width="9" height="9" rx="0.8" fill="#17212b" stroke="#94a3b8" stroke-width="0.8"/>
      ${[0, 1, 2, 3].map(i => `<line x1="${12 + i * 2}" y1="44" x2="${12 + i * 2}" y2="51" stroke="#cbd5e1" stroke-width="0.65"/>`).join('')}
      <!-- Headlamp and indicator cluster -->
      <rect x="6" y="40" width="5" height="3" rx="0.6" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.5"/>
      <rect x="7" y="49" width="3" height="2" fill="#f97316"/>
      <!-- Hood side panel detail -->
      <line x1="25" y1="34" x2="45" y2="34" stroke="${accentColor}" stroke-width="0.6" opacity="0.65"/>
      <line x1="27" y1="37" x2="45" y2="37" stroke="#94a3b8" stroke-width="0.5" opacity="0.6"/>

      <!-- Windshield & A-Pillar -->
      <path d="M48 30 L55 18 L76 18 L76 54 L48 54 Z" fill="rgba(193,154,91,0.18)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M50 30 L56 20 L66 20 L64 30 Z" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="0.8"/>
      
      <!-- Sleeper Berth Cab -->
      <path d="M76 14 L102 14 L102 52 L76 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="80" y="22" width="10" height="8" rx="1" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.6"/>
      <path d="M74 14 L104 12 L104 14 Z" fill="${accentColor}" opacity="0.6"/>
      
      <!-- Driver-side mirror assembly -->
      <path d="M48 27 L43 25 L42 21" stroke="#94a3b8" stroke-width="1" fill="none"/>
      <rect x="39" y="18" width="4" height="6" rx="1" fill="#334155" stroke="#cbd5e1" stroke-width="0.7"/>

      <!-- Vertical Chrome Exhaust Stacks -->
      <path d="M76 34 L76 6 L79 4 L79 34 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
      <path d="M74 34 L74 8 L76 6" stroke="#64748b" stroke-width="0.8"/>
      
      <!-- Cylindrical Aluminum Fuel Tank -->
      <rect x="52" y="44" width="32" height="9" rx="3.5" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
      
      <!-- Fifth Wheel Coupling Plate -->
      <path d="M120 48 L138 48 L135 45 L123 45 Z" fill="#64748b" stroke="#94a3b8" stroke-width="1"/>
      
      <!-- Front Steer Wheel -->
      ${wheelSvg(28, 54, 8)}
      
      ${is6x4 ? `
        ${wheelSvg(118, 54, 8)}
        ${wheelSvg(138, 54, 8)}
        <path d="M147 48 L149 58 L146 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
      ` : `
        ${wheelSvg(128, 54, 8)}
        <path d="M137 48 L139 58 L136 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
      `}
    `;
  } else {
    // European / Global Heavy Cabover (Highline Cab, Aerodynamic Deflector)
    tractorSvg = `
      <!-- Chassis frame rail -->
      <path d="M12 52 L146 52 L146 56 L12 56 Z" fill="#2d3748" stroke="#4a5568" stroke-width="1"/>
      
      <!-- European Cabover Body -->
      <path d="M10 52 L10 38 L14 20 L24 10 L56 8 L64 12 L64 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      
      <!-- Highline Roof Air Deflector -->
      <path d="M22 10 L58 8 L72 12 L64 18 L56 12 Z" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="1"/>
      
      <!-- Large Panoramic Windshield & Side Glass -->
      <path d="M14 24 L22 14 L44 13 L42 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="0.8"/>
      <path d="M43 14 L56 14 L56 28 L43 28 Z" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.8"/>
      
      <!-- Grille & Headlamp Cluster -->
      <path d="M10 32 L16 32 L16 46 L10 46 Z" fill="#1e293b" stroke="#64748b" stroke-width="0.8"/>
      <rect x="9" y="44" width="3" height="5" rx="0.5" fill="#fef08a"/>
      
      <!-- Wide European front grille -->
      <rect x="11" y="32" width="8" height="12" rx="0.8" fill="#17212b" stroke="#94a3b8" stroke-width="0.8"/>
      ${[0, 1, 2, 3, 4].map(i => `<line x1="12" y1="${34 + i * 2}" x2="18" y2="${34 + i * 2}" stroke="#cbd5e1" stroke-width="0.65"/>`).join('')}
      <!-- Modern headlamp cluster -->
      <path d="M10 44 L16 44 L16 50 L11 50 Z" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
      <rect x="11" y="49" width="4" height="1.5" fill="#f97316"/>
      <!-- Lower bumper detailing -->
      <line x1="11" y1="51" x2="25" y2="51" stroke="#94a3b8" stroke-width="1"/>
      <line x1="18" y1="47" x2="18" y2="50" stroke="#64748b" stroke-width="0.6"/>

      <!-- Cab Entry Steps -->
      <rect x="22" y="46" width="10" height="2" rx="0.5" fill="#94a3b8"/>
      <rect x="22" y="49" width="10" height="2" rx="0.5" fill="#94a3b8"/>
      
      <!-- Wide-angle exterior mirror -->
      <path d="M14 29 L8 27 L6 22" stroke="#94a3b8" stroke-width="1" fill="none"/>
      <rect x="3" y="19" width="4" height="6" rx="1" fill="#334155" stroke="#cbd5e1" stroke-width="0.7"/>

      <!-- Aluminum Fuel Tank -->
      <rect x="52" y="43" width="36" height="10" rx="2" fill="#334155" stroke="#64748b" stroke-width="0.8"/>
      
      <!-- Fifth Wheel Coupling Plate -->
      <path d="M110 48 L128 48 L125 45 L113 45 Z" fill="#64748b" stroke="#94a3b8" stroke-width="1"/>
      
      <!-- Front Steer Wheel -->
      ${wheelSvg(34, 54, 8)}
      
      ${is6x4 ? `
        ${wheelSvg(106, 54, 8)}
        ${wheelSvg(126, 54, 8)}
        <path d="M96 52 Q106 42 116 52" stroke="#475569" stroke-width="1.5" fill="none"/>
        <path d="M116 52 Q126 42 136 52" stroke="#475569" stroke-width="1.5" fill="none"/>
      ` : `
        ${wheelSvg(118, 54, 8)}
        <path d="M108 52 Q118 42 128 52" stroke="#475569" stroke-width="1.5" fill="none"/>
      `}
    `;
  }


  // MODEL-SPECIFIC TRUCK PROFILES
  // Additional SVG details are selected by the existing catalogue ID.
  const modelId = String(model?.id || '');

  let modelDetails = '';

  switch (modelId) {

    // SCANIA S730 - premium European V8 high-roof cab
    case 'scania_s730':
      modelDetails = `
        <!-- Scania premium roof visor -->
        <path d="M20 9 L55 7 L65 12 L57 14 L22 13 Z"
          fill="#64748b" stroke="${accentColor}" stroke-width="0.8"/>
        <!-- Sculpted V-shaped front grille -->
        <path d="M10 31 L20 31 L19 45 L11 45 Z"
          fill="#111827" stroke="#cbd5e1" stroke-width="0.8"/>
        <path d="M12 33 L18 33 M12 36 L18 36 M12 39 L18 39 M12 42 L18 42"
          stroke="#cbd5e1" stroke-width="0.8"/>
        <!-- V8 identity and side styling -->
        <path d="M25 31 L42 31 L39 35 L24 35"
          stroke="${accentColor}" stroke-width="0.9" fill="none"/>
        <text x="28" y="40" font-size="3.5" fill="#e2e8f0"
          font-weight="bold">V8</text>
        <path d="M25 15 L43 14 L42 27 L24 27 Z"
          stroke="#7dd3fc" stroke-width="0.5" fill="none" opacity="0.7"/>
        <line x1="20" y1="47" x2="28" y2="47"
          stroke="#cbd5e1" stroke-width="1"/>
      `;
      break;

    // VOLVO FH16 - panoramic windshield and strong aerodynamic cab
    case 'volvo_fh16':
      modelDetails = `
        <!-- Extended aerodynamic roof cap -->
        <path d="M19 10 Q35 4 57 9 L67 14 L58 15 L22 13 Z"
          fill="#64748b" stroke="${accentColor}" stroke-width="0.8"/>
        <!-- Panoramic windshield divisions -->
        <path d="M15 23 Q27 13 43 14 L41 28 L15 28 Z"
          fill="#38bdf8" fill-opacity="0.13"
          stroke="#bae6fd" stroke-width="0.8"/>
        <path d="M28 15 L27 28"
          stroke="#94a3b8" stroke-width="0.7"/>
        <!-- Volvo-style wide front grille -->
        <rect x="10" y="31" width="10" height="13" rx="1"
          fill="#0f172a" stroke="#cbd5e1" stroke-width="0.9"/>
        ${[0,1,2,3,4].map(i =>
          `<line x1="11" y1="${33+i*2}" x2="19" y2="${33+i*2}"
          stroke="#94a3b8" stroke-width="0.7"/>`
        ).join('')}
        <!-- Diagonal grille accent -->
        <path d="M11 42 L19 33"
          stroke="#e2e8f0" stroke-width="1"/>
        <!-- Lower signature lighting -->
        <path d="M10 45 L17 45 L16 49 L11 49 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.6"/>
        <path d="M23 30 L40 30"
          stroke="${accentColor}" stroke-width="0.8"/>
        <text x="30" y="38" font-size="3.5"
          fill="#e2e8f0" font-weight="bold">FH16</text>
      `;
      break;

    // MERCEDES ACTROS - modern StreamSpace cab
    case 'merc_actros_1853':
      modelDetails = `
        <!-- Actros roof fairing -->
        <path d="M22 9 L56 8 L65 13 L58 15 L23 13 Z"
          fill="#94a3b8" fill-opacity="0.4"
          stroke="${accentColor}" stroke-width="0.8"/>
        <!-- Distinctive multi-section grille -->
        <rect x="10" y="31" width="10" height="14" rx="1"
          fill="#0b1220" stroke="#94a3b8" stroke-width="0.8"/>
        ${[0,1,2,3,4].map(i =>
          `<line x1="11" y1="${33+i*2}" x2="19" y2="${33+i*2}"
          stroke="#cbd5e1" stroke-width="0.75"/>`
        ).join('')}
        <!-- Three-point star inspired central badge -->
        <circle cx="15" cy="37.5" r="2.2"
          fill="#334155" stroke="#e2e8f0" stroke-width="0.6"/>
        <path d="M15 35.5 L15 39.5 M13.3 38.5 L16.7 36.5 M13.3 36.5 L16.7 38.5"
          stroke="#f8fafc" stroke-width="0.55"/>
        <!-- Modern headlamp signature -->
        <path d="M10 45 L17 44 L17 49 L11 50 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M23 29 L42 29 L41 31 L23 31 Z"
          fill="#94a3b8" opacity="0.7"/>
        <!-- StreamSpace side window -->
        <path d="M45 15 L56 15 L56 27 L45 27 Z"
          fill="#38bdf8" fill-opacity="0.2"
          stroke="#bae6fd" stroke-width="0.7"/>
      `;
      break;

    // KENWORTH W900 - long-nose classic American conventional
    case 'kenworth_w900':
      modelDetails = `
        <!-- Long hood centre ridge -->
        <path d="M17 31 L46 31 L45 33 L20 33 Z"
          fill="${accentColor}" opacity="0.45"/>
        <!-- Tall polished radiator grille -->
        <rect x="9" y="39" width="10" height="13" rx="0.8"
          fill="#17212b" stroke="#cbd5e1" stroke-width="1"/>
        ${[0,1,2,3,4,5].map(i =>
          `<line x1="${11+i*1.3}" y1="40" x2="${11+i*1.3}" y2="51"
          stroke="#e2e8f0" stroke-width="0.65"/>`
        ).join('')}
        <!-- Heavy chrome bumper -->
        <path d="M5 53 L23 53 L22 57 L5 57 Z"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <!-- Classic hood ornaments -->
        <path d="M29 29 L32 25 L34 29 Z"
          fill="#cbd5e1" stroke="#f8fafc" stroke-width="0.5"/>
        <!-- Twin polished exhaust stacks -->
        <path d="M78 34 L78 4 L81 3 L81 34"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <path d="M94 30 L94 7 L97 5 L97 31"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <!-- Extended sleeper window -->
        <rect x="82" y="21" width="13" height="9" rx="1"
          fill="#38bdf8" fill-opacity="0.22"
          stroke="#cbd5e1" stroke-width="0.7"/>
        <!-- Hood side chrome strip -->
        <path d="M25 37 L44 37"
          stroke="#cbd5e1" stroke-width="0.8"/>
      `;
      break;

    // PETERBILT 389 - traditional long hood and classic sleeper
    case 'peterbilt_389':
      modelDetails = `
        <!-- Signature long hood contours -->
        <path d="M24 30 L47 30 L47 32 L24 32 Z"
          fill="${accentColor}" opacity="0.5"/>
        <path d="M25 35 L44 35"
          stroke="#cbd5e1" stroke-width="0.8"/>
        <!-- Traditional vertical grille -->
        <rect x="9" y="39" width="10" height="13" rx="1"
          fill="#101820" stroke="#cbd5e1" stroke-width="1"/>
        ${[0,1,2,3,4].map(i =>
          `<line x1="${11+i*1.4}" y1="40" x2="${11+i*1.4}" y2="51"
          stroke="#cbd5e1" stroke-width="0.7"/>`
        ).join('')}
        <!-- Dual round headlamps -->
        <circle cx="7" cy="42" r="2.1"
          fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <circle cx="7" cy="48" r="2.1"
          fill="#fef3c7" stroke="#e2e8f0" stroke-width="0.6"/>
        <!-- Heavy polished bumper -->
        <path d="M4 53 L23 53 L22 57 L5 57 Z"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <!-- Twin vertical exhaust stacks -->
        <path d="M77 34 L77 5 L80 3 L80 34"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <path d="M96 31 L96 8 L99 6 L99 31"
          fill="#94a3b8" stroke="#e2e8f0" stroke-width="0.8"/>
        <!-- Classic sleeper side window -->
        <rect x="82" y="21" width="12" height="9" rx="1"
          fill="#38bdf8" fill-opacity="0.2"
          stroke="#cbd5e1" stroke-width="0.7"/>
      `;
      break;

    // FREIGHTLINER CASCADIA - integrated aerodynamic highway tractor
    case 'freightliner_cascadia':
      modelDetails = `
        <!-- Aerodynamic roof deflector -->
        <path d="M20 10 Q42 4 59 12 L65 17 L56 15 L23 14 Z"
          fill="#94a3b8" fill-opacity="0.35"
          stroke="${accentColor}" stroke-width="0.8"/>
        <!-- Sloped modern front fascia -->
        <path d="M10 31 L18 31 L19 45 L11 48 Z"
          fill="#111827" stroke="#94a3b8" stroke-width="0.8"/>
        <!-- Cascadia dark grille -->
        <path d="M11 33 L18 33 L18 44 L12 45 Z"
          fill="#0f172a" stroke="#64748b" stroke-width="0.6"/>
        ${[0,1,2,3].map(i =>
          `<line x1="12" y1="${35+i*2}" x2="17" y2="${35+i*2}"
          stroke="#94a3b8" stroke-width="0.7"/>`
        ).join('')}
        <!-- Swept LED headlamp -->
        <path d="M9 44 L17 42 L18 47 L10 50 Z"
          fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>
        <path d="M11 47 L16 45"
          stroke="#fff" stroke-width="0.7"/>
        <!-- Integrated sleeper side glass -->
        <path d="M44 14 L57 15 L57 27 L44 27 Z"
          fill="#38bdf8" fill-opacity="0.2"
          stroke="#bae6fd" stroke-width="0.7"/>
        <!-- Aerodynamic side fairing -->
        <path d="M57 40 L88 42 L88 51 L57 51 Z"
          fill="#64748b" fill-opacity="0.25"
          stroke="#94a3b8" stroke-width="0.5"/>
        <!-- Roof marker lights -->
        ${[27,35,43,51].map(x =>
          `<circle cx="${x}" cy="9" r="0.8" fill="#fbbf24"/>`
        ).join('')}
      `;
      break;
  }


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

  // Append model-specific details without changing the shared chassis,
  // wheel, axle, or trailer rendering.
  tractorSvg += modelDetails;

  return `
    <svg viewBox="0 0 ${viewBoxWidth} 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Ground line across full length -->
      <line x1="2" y1="62" x2="${viewBoxWidth - 2}" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="2 2" />
      
      <!-- Tractor Unit -->
      ${tractorSvg}

      <!-- Connected Trailer (if hitched) -->
      ${hasTrailer ? renderCoupledTrailerSvg(trailerType as string, fifthWheelX, accentColor) : ''}
    </svg>
  `;
}

export function getTrailerSilhouetteSvg(type: string, accentColor = 'var(--gold)'): string {
  const trType = hasRealisticTrailer(type) ? type : 'curtain';
  const u = 'ts' + Math.random().toString(36).slice(2, 7);
  const P = makePalette({ paint: '#2b4a6f', accent: accentColor, trailerPaint: '#2563eb' });
  const layout = trailerLayout(trType, 10);
  const vbW = layout.x1 + 36;
  return `
    <svg viewBox="0 0 ${vbW} 260" class="trailer-blueprint" style="width:100%; height:100%; max-height:100px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${baseDefs(u, P)}
      </defs>
      ${renderRealisticTrailer(trType, u, P, 10, false)}
    </svg>
  `;
}
