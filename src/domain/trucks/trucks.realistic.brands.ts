/**
 * Per-brand / per-model cab styles for the realistic trucks.
 * pickCabSpec(model) reads model.id / name / brand / region / engine and returns the style to draw,
 * or null when the model has no realistic cab yet (the caller then falls back to the old silhouette).
 *
 * Add or tweak a brand by editing the tables below - nothing else needs to change.
 */

export type Deflector = 'wedge' | 'fairing' | 'spoiler' | 'none';
export type EuroGrille = 'scania' | 'volvo' | 'merc' | 'man' | 'daf' | 'iveco' | 'renault' | 'hino' | 'isuzu' | 'fuso' | 'howo' | 'faw' | 'plain';
export type Headlight = 'slim' | 'tall' | 'wide' | 'rect' | 'round';
export type Drl = 'v' | 'hammer' | 'bar' | 'none';

export interface EuroStyle {
  brand: string;
  badge: string;          // model badge on the door (first word of model name)
  v8: boolean;
  electric: boolean;
  paint: string;          // default paint when the game passes none
  accent: string;
  roofY: number;          // roof top y. smaller = taller cab (36 tallest .. 62 low)
  rake: number;           // windscreen rake (0 upright .. 12 sloped)
  roofRound: number;      // rear roof corner rounding
  rearX: number;          // cab rear x (174 sleeper, 150 day cab)
  deflector: Deflector;
  grille: EuroGrille;
  headlight: Headlight;
  drl: Drl;
  sleeperWindow: boolean;
  mirrorCam: boolean;
  steelBumper: boolean;
  skirt: boolean;
}

export type UsHood = 'long' | 'aero' | 'short';
export type UsGrille = 'kw' | 'pete' | 'fl' | 'mack' | 'plain';

export interface AmericanStyle {
  brand: string;
  badge: string;
  v8: boolean;
  electric: boolean;
  paint: string;
  accent: string;
  hood: UsHood;
  roofY: number;          // 32 high roof .. 62 day cab
  sleeper: boolean;
  sleeperIn: number;      // sleeper length in inches (parsed from the model name; 72 default)
  fairing: boolean;       // aero roof fairing over the sleeper
  visor: boolean;
  stacks: 0 | 1 | 2;
  grille: UsGrille;
  bumper: 'chrome' | 'steel' | 'aero';
  bulldog: boolean;
}

export type CabSpec =
  | { family: 'euro'; euro: EuroStyle }
  | { family: 'american'; us: AmericanStyle };

const AMERICAN_BRANDS = new Set(['Kenworth', 'Peterbilt', 'Freightliner', 'Mack', 'Ford']);

function badgeOf(model: any): string {
  const first = String(model?.name || '').trim().split(/\s+/)[0] || '';
  return first.replace(/["'“”]/g, '').toUpperCase().slice(0, 9);
}

/* ------------------------------------------------------------------ EURO */
function euroStyle(model: any, text: string, electric: boolean, v8: boolean): EuroStyle {
  const brand = String(model.brand || '');
  const name = String(model.name || '').toLowerCase();
  let s: EuroStyle = {
    brand, badge: badgeOf(model), v8, electric,
    paint: '#2b4a6f', accent: '#c9a24f',
    roofY: 49, rake: 0, roofRound: 6, rearX: 182,
    deflector: 'wedge', grille: 'plain', headlight: 'wide', drl: 'none',
    sleeperWindow: true, mirrorCam: false, steelBumper: false, skirt: false,
  };

  switch (brand) {
    case 'Scania':
      s = { ...s, paint: '#1b4f9c', grille: 'scania', headlight: 'slim', drl: 'v' };
      if (/^(s\d{3}|770s)/.test(name)) s = { ...s, roofY: 42, rake: 4 };          // S-series: flat floor, tallest
      else if (/^g\d{3}/.test(name)) s = { ...s, roofY: 57, deflector: 'none', sleeperWindow: false }; // G-series: low
      break;
    case 'Volvo':
      s = { ...s, paint: '#2b6b5c', roofY: 42, rake: 6, roofRound: 14, deflector: 'fairing', grille: 'volvo', headlight: 'tall', drl: 'hammer', skirt: true };
      break;
    case 'Mercedes-Benz':
      s = { ...s, paint: '#5b6770', roofY: 38, rake: 2, roofRound: 8, deflector: 'none', grille: 'merc', headlight: 'wide', drl: 'bar', skirt: true,
            mirrorCam: /actros l|eactros|edition 3|procabin/.test(name) };
      if (/arocs|zetros/.test(name)) s = { ...s, roofY: 54, deflector: 'none', sleeperWindow: false, skirt: false, mirrorCam: false };
      else if (/antos/.test(name)) s = { ...s, roofY: 50, deflector: 'spoiler' };
      break;
    case 'MAN':
      s = { ...s, paint: '#a82a1f', roofY: 44, rake: 4, roofRound: 8, deflector: 'spoiler', grille: 'man', headlight: 'slim', drl: 'bar' };
      if (/^tgs/.test(name)) s = { ...s, roofY: 53, deflector: 'none' };
      break;
    case 'DAF':
      s = { ...s, paint: '#dfe3e8', accent: '#c0392b', roofY: 36, rake: 0, roofRound: 4, deflector: 'spoiler', grille: 'daf', headlight: 'rect', drl: 'bar', skirt: true };
      if (/^(cf|xd)\b/.test(name)) s = { ...s, roofY: 52, deflector: 'none', sleeperWindow: false, skirt: false };
      break;
    case 'Iveco':
      s = { ...s, paint: '#2e86c1', roofY: 46, rake: 10, roofRound: 12, deflector: 'wedge', grille: 'iveco', headlight: 'slim', drl: 'bar' };
      break;
    case 'Renault':
      s = { ...s, paint: '#8a3fa0', roofY: 40, rake: 2, roofRound: 4, deflector: 'spoiler', grille: 'renault', headlight: 'tall' };
      break;
    case 'Ford':
      s = { ...s, paint: '#1d3b6f', roofY: 42, rake: 2, roofRound: 6, deflector: 'wedge', grille: 'plain', headlight: 'wide' };
      break;
  }

  // Modifiers from the model name
  const vocational = /tipper|construction|mining|grounder|severe|off-road|heavy haul|heavy hauler|\bxt\b|dkx|trakker|magirus|fmx|zetros|slt/.test(text);
  const dayCab = /day cab/.test(text);
  const classic = /classic|heritage|legend|143m|164l|\bsk\b|f2000|95 ati|3300|turbostar|eurotech|mp3|xf105|\btga\b|stralis|eurostar|premium|prestige/.test(text);

  if (vocational) s = { ...s, roofY: Math.max(s.roofY, 50) + 6, deflector: 'none', sleeperWindow: false, steelBumper: true, skirt: false, mirrorCam: false };
  if (classic) s = { ...s, roofY: Math.max(s.roofY, 54), rake: 0, roofRound: 2, deflector: 'none', headlight: 'round', drl: 'none', skirt: false, mirrorCam: false };
  if (!dayCab && !classic && !vocational && /xxl|gigaspace|super space|lion s|streamspace|space cab|highline/.test(text)) s = { ...s, rearX: 188 };
  if (dayCab) s = { ...s, rearX: 158, sleeperWindow: false, deflector: 'none', roofY: Math.max(s.roofY, 56) };
  return s;
}

/** Asian cab-overs: Japanese (Hino / Isuzu / Fuso) are upright and compact, Chinese (Howo / FAW) are big and boxy. */
function asiaStyle(model: any, text: string, electric: boolean, v8: boolean): EuroStyle {
  const brand = String(model.brand || '');
  const name = String(model.name || '').toLowerCase();
  let s: EuroStyle = {
    brand, badge: badgeOf(model), v8, electric,
    paint: '#d2481f', accent: '#c9a24f',
    roofY: 52, rake: 2, roofRound: 6, rearX: 174,
    deflector: 'spoiler', grille: 'plain', headlight: 'rect', drl: 'none',
    sleeperWindow: false, mirrorCam: false, steelBumper: false, skirt: false,
  };
  switch (brand) {
    case 'Hino':
      s = { ...s, paint: '#d2481f', grille: 'hino', headlight: 'rect' };
      if (/700|profia/.test(text)) s = { ...s, roofY: 46, rearX: 180, sleeperWindow: true, deflector: 'wedge' };
      break;
    case 'Isuzu':
      s = { ...s, paint: '#e6e9ec', accent: '#c0392b', grille: 'isuzu', headlight: 'wide' };
      if (/giga|810|c_series/.test(text)) s = { ...s, roofY: 44, rearX: 180, sleeperWindow: true, deflector: 'wedge' };
      break;
    case 'Mitsubishi Fuso':
      s = { ...s, paint: '#1e9d8b', accent: '#e8e2d4', grille: 'fuso', headlight: 'slim', drl: 'bar' };
      if (/super great/.test(name)) s = { ...s, roofY: 44, rearX: 180, sleeperWindow: true, deflector: 'wedge' };
      break;
    case 'SINOTRUK':
      s = { ...s, paint: '#3b6b3b', accent: '#c9a24f', grille: 'howo', headlight: 'tall', roofY: 42, rake: 4, roofRound: 8, rearX: 186, sleeperWindow: true, deflector: 'wedge', skirt: true };
      if (/t5g/.test(text)) s = { ...s, roofY: 50, rearX: 168, sleeperWindow: false, deflector: 'spoiler' };
      break;
    case 'FAW':
      s = { ...s, paint: '#b8860b', accent: '#2a2f36', grille: 'faw', headlight: 'wide', drl: 'bar', roofY: 42, rake: 4, roofRound: 8, rearX: 186, sleeperWindow: true, deflector: 'wedge', skirt: true };
      if (/j7/.test(text)) s = { ...s, roofY: 36, rake: 2, deflector: 'fairing' };
      break;
  }
  const vocational = /tipper|mining|heavy/.test(text);
  if (vocational) s = { ...s, roofY: Math.max(s.roofY, 50) + 6, deflector: 'none', sleeperWindow: false, steelBumper: true, skirt: false };
  return s;
}

/** Cab-over cab for American COE trucks (Kenworth K100E, Peterbilt 362). */
function coeStyle(model: any, electric: boolean, v8: boolean): EuroStyle {
  const brand = String(model.brand || '');
  return {
    brand, badge: badgeOf(model), v8, electric,
    paint: brand === 'Peterbilt' ? '#1f232b' : '#8e1b1b', accent: '#d6b25e',
    roofY: 40, rake: 0, roofRound: 4, rearX: 174,
    deflector: 'wedge', grille: 'plain', headlight: 'round', drl: 'none',
    sleeperWindow: true, mirrorCam: false, steelBumper: false, skirt: false,
  };
}

/* -------------------------------------------------------------- AMERICAN */
/** '86" Studio Sleeper' -> 86. No size in the name: long-sleeper keywords -> 80, otherwise 72. */
function sleeperInches(model: any, text: string): number {
  const m = String(model?.name || '').match(/(\d{2,3})\s*(?:"|\u201d|in\b)/);
  const inch = m ? parseInt(m[1], 10) : 0;
  if (inch >= 56 && inch <= 100) return inch;              // 132" hood sizes etc. are ignored
  if (/ultraloft|studio|platinum|limited edition sleeper|super-liner|superliner/.test(text)) return 82;
  return 72;
}

function usStyle(model: any, text: string, electric: boolean, v8: boolean): AmericanStyle {
  const brand = String(model.brand || '');
  let s: AmericanStyle = {
    brand, badge: badgeOf(model), v8, electric,
    paint: '#8e1b1b', accent: '#d6b25e',
    hood: 'long', roofY: 46, sleeper: true, sleeperIn: sleeperInches(model, text), fairing: false, visor: true,
    stacks: 2, grille: 'plain', bumper: 'chrome', bulldog: false,
  };
  const aero = (roofY: number, fairing: boolean): Partial<AmericanStyle> =>
    ({ hood: 'aero', roofY, fairing, visor: false, stacks: 0, bumper: 'aero' });
  const vocational: Partial<AmericanStyle> =
    ({ hood: 'short', roofY: 62, sleeper: false, visor: false, stacks: 1, bumper: 'steel' });

  switch (brand) {
    case 'Kenworth':
      s = { ...s, paint: '#8e1b1b', grille: 'kw' };
      if (/t680|t2000/.test(text)) s = { ...s, ...aero(32, true) };
      else if (/t600/.test(text)) s = { ...s, ...aero(40, false), stacks: 1 };
      else if (/t880|c500/.test(text)) s = { ...s, ...vocational };
      else if (/w990/.test(text)) s = { ...s, roofY: 44 };
      break;
    case 'Peterbilt':
      s = { ...s, paint: '#1f232b', grille: 'pete' };
      if (/579/.test(text)) s = { ...s, ...aero(32, true) };
      else if (/567/.test(text)) s = { ...s, roofY: 50, stacks: 1 };
      else if (/379|359/.test(text)) s = { ...s, roofY: 52 };
      break;
    case 'Freightliner':
      s = { ...s, paint: '#c8ccd2', accent: '#2b6fb3', grille: 'fl' };
      if (/cascadia/.test(text)) s = { ...s, ...aero(34, true) };
      else if (/114sd|122sd/.test(text)) s = { ...s, ...vocational };
      else if (/classic xl|coronado/.test(text)) s = { ...s, roofY: 44, stacks: 2 };
      else if (/century|columbia|fld/.test(text)) s = { ...s, roofY: 50, stacks: 1 };
      break;
    case 'Mack':
      s = { ...s, paint: '#c98a12', accent: '#2a2f36', grille: 'mack', bulldog: true };
      if (/anthem/.test(text)) s = { ...s, ...aero(38, true), stacks: 1 };
      else if (/pinnacle|chu613/.test(text)) s = { ...s, ...aero(42, false), stacks: 1, visor: true };
      else if (/granite|terrapro/.test(text)) s = { ...s, ...vocational };
      else if (/b_model|b-model/.test(text)) s = { ...s, ...vocational, roofY: 56 };
      else if (/r_series|superliner|super-liner/.test(text)) s = { ...s, roofY: 50 };
      break;
    case 'Ford':
      s = { ...s, paint: '#1d3b6f', roofY: 52, stacks: 1 };
      break;
  }
  if (/day cab|_day\b/.test(text)) s = { ...s, sleeper: false, roofY: Math.max(s.roofY, 58), fairing: false };
  if (electric) s = { ...s, stacks: 0 };
  return s;
}

/* ----------------------------------------------------------------- ENTRY */
export function pickCabSpec(model: any): CabSpec | null {
  if (!model) return null;
  const brand = String(model.brand || '');
  const text = `${model.id || ''} ${model.name || ''}`.toLowerCase();
  const electric = model.engine?.fuelType === 'Electric' || /electric|eactros|etgx|\bbev\b|ecascadia|579ev|t680e/.test(text);
  const v8 = model.engine?.cylinders === 8 || /\bv8\b/.test(text);

  if (model.region === 'Europe') return { family: 'euro', euro: euroStyle(model, text, electric, v8) };
  if (model.region === 'America' && AMERICAN_BRANDS.has(brand)) {
    if (/k100e|\b362\b|_362/.test(text)) return { family: 'euro', euro: coeStyle(model, electric, v8) };
    return { family: 'american', us: usStyle(model, text, electric, v8) };
  }
  const asian = new Set(['Hino', 'Isuzu', 'Mitsubishi Fuso', 'SINOTRUK', 'FAW']);
  if (asian.has(brand)) return { family: 'euro', euro: asiaStyle(model, text, electric, v8) };
  return null;
}
