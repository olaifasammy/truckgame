/**
 * Rigid, Vocational and Light Commercial Vehicle SVG schematics.
 */

import { wheelSvg, getAnimationStyles, getExhaustSmokeSvg } from './trucks.trailers.visuals';

/**
 * Render light commercial Sprinter / Cargo Van silhouette with integrated cargo box.
 */
export function getSprinterVanSvg(model: any, accentColor = 'var(--gold)', options?: { isMoving?: boolean }): string {
  const isMoving = !!options?.isMoving;
  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <!-- Ground line -->
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Underbody Chassis Frame -->
      <path d="M12 53 L148 53 L148 56 L12 56 Z" fill="#1e293b" stroke="#475569" stroke-width="0.8"/>

      <!-- Van Cab Nose (Aerodynamic sloped bonnet) -->
      <path d="M10 52 L10 44 L20 38 L36 26 L52 24 L56 24 L56 52 Z" fill="rgba(193,154,91,0.18)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      
      <!-- Windshield & Sky Glare -->
      <path d="M22 37 L35 27 L48 27 L46 37 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>
      <path d="M26 35 L33 28 L38 28 L31 35 Z" fill="#ffffff" fill-opacity="0.2"/>

      <!-- Driver Cab Door & Side Window -->
      <path d="M48 27 L55 27 L55 37 L47 37 Z" fill="#38bdf8" fill-opacity="0.22" stroke="#38bdf8" stroke-width="0.7"/>
      <line x1="46" y1="25" x2="46" y2="52" stroke="${accentColor}" stroke-width="0.7" opacity="0.6"/>
      <!-- Cab Door Handle -->
      <rect x="48" y="40" width="3.5" height="1.2" rx="0.6" fill="#cbd5e1"/>
      
      <!-- Front Grille & Van Badge -->
      <path d="M10 44 L18 40 L18 50 L10 50 Z" fill="#0f172a" stroke="#64748b" stroke-width="0.8"/>
      <line x1="12" y1="43" x2="17" y2="42" stroke="#cbd5e1" stroke-width="0.6"/>
      <line x1="11" y1="46" x2="17" y2="45" stroke="#cbd5e1" stroke-width="0.6"/>
      <line x1="11" y1="49" x2="17" y2="48" stroke="#cbd5e1" stroke-width="0.6"/>

      <!-- Angled Headlamp Cluster -->
      <path d="M10 44 L16 41 L16 45 L10 47 Z" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.7"/>

      <!-- Exterior Side Wing Mirror -->
      <path d="M25 36 L19 34 L18 30" stroke="#94a3b8" stroke-width="0.9" fill="none"/>
      <rect x="16" y="27" width="3.5" height="5" rx="0.8" fill="#1e293b" stroke="#cbd5e1" stroke-width="0.6"/>

      <!-- Integrated High-Roof Cargo Box / Van Body -->
      <path d="M56 22 L148 22 L148 52 L56 52 Z" fill="rgba(193,154,91,0.12)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>

      <!-- Roof Wind Deflector Fairing -->
      <path d="M36 26 L56 22 L56 24 L36 26 Z" fill="${accentColor}" fill-opacity="0.3"/>

      <!-- Side Cargo Box Panel Seams & Rivets -->
      <line x1="86" y1="23" x2="86" y2="51" stroke="${accentColor}" stroke-width="0.6" stroke-dasharray="4 2" opacity="0.6"/>
      <line x1="116" y1="23" x2="116" y2="51" stroke="${accentColor}" stroke-width="0.6" stroke-dasharray="4 2" opacity="0.6"/>

      <!-- Rear Double Barn Door Hinge & Latch Lines -->
      <line x1="144" y1="24" x2="144" y2="50" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="144" cy="34" r="1" fill="#eab308"/>
      <circle cx="144" cy="42" r="1" fill="#eab308"/>

      <!-- Side Protective Skirting -->
      <line x1="12" y1="51" x2="148" y2="51" stroke="#475569" stroke-width="1"/>
      <rect x="58" y="52" width="60" height="2" fill="#334155"/>

      <!-- Rear Bumper Step & LED Tail Lamp -->
      <rect x="148" y="46" width="3" height="6" rx="0.5" fill="#dc2626" stroke="#f87171" stroke-width="0.5"/>
      <rect x="148" y="52" width="4" height="3" fill="#64748b"/>

      ${isMoving ? getExhaustSmokeSvg(46, 23) : ''}

      <!-- Wheels (Front steer + Rear drive) -->
      ${wheelSvg(30, 54, 7, isMoving)}
      ${wheelSvg(122, 54, 7, isMoving)}

      <!-- Wheel Arches / Mudguards -->
      <path d="M22 53 Q30 45 38 53" stroke="#475569" stroke-width="1.2" fill="none"/>
      <path d="M114 53 Q122 45 130 53" stroke="#475569" stroke-width="1.2" fill="none"/>

      <!-- Sprinter / Van Identity Badge -->
      <text x="64" y="32" font-size="5" font-weight="900" fill="${accentColor}" font-family="sans-serif" letter-spacing="1">CITY FREIGHT</text>
    </svg>
  `;
}

/**
 * Render Heavy Vocational Mining Tipper / Dump Bed Truck silhouette.
 */
export function getRigidTipperSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', options?: { isMoving?: boolean }): string {
  const isMoving = !!options?.isMoving;
  const is8x4 = axle === '8x4';

  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Underbody Reinforced Heavy Chassis -->
      <path d="M8 52 L150 52 L150 56 L8 56 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Severe-Duty Day Cab -->
      <path d="M10 52 L10 36 L14 20 L22 14 L46 12 L50 16 L50 52 Z" fill="rgba(234,88,12,0.15)" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M14 23 L22 15 L42 14 L40 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>
      <rect x="10" y="32" width="8" height="11" rx="0.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8"/>

      <!-- Heavy Steel Tipper Dump Bed Body -->
      <path d="M52 20 L150 20 L148 52 L52 52 Z" fill="rgba(234,88,12,0.14)" stroke="#f97316" stroke-width="1.5"/>

      <!-- Overhead Steel Cab Protector Canopy Shield -->
      <path d="M34 14 L54 14 L52 20 L32 18 Z" fill="#ea580c" fill-opacity="0.5" stroke="#f97316" stroke-width="1"/>

      <!-- Heavy Side Structural Rib Stanchions -->
      ${[0.2, 0.4, 0.6, 0.8].map(pct => {
        const x = Math.round(52 + 96 * pct);
        return `<line x1="${x}" y1="20" x2="${x}" y2="52" stroke="#ea580c" stroke-width="1.2"/>`;
      }).join('')}

      <!-- Underbody Hydraulic Piston Arm -->
      <line x1="65" y1="44" x2="80" y2="52" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Rear Hinged Tailgate & Heavy Lock Pins -->
      <line x1="148" y1="20" x2="148" y2="52" stroke="#f97316" stroke-width="1.5"/>
      <circle cx="148" cy="22" r="1.5" fill="#facc15"/>

      ${isMoving ? getExhaustSmokeSvg(46, 12) : ''}

      <!-- Wheels (Steer + Bogie Drive) -->
      ${wheelSvg(24, 54, 7.5, isMoving)}
      ${is8x4 ? wheelSvg(40, 54, 7.5, isMoving) : ''}
      ${wheelSvg(114, 54, 7.5, isMoving)}
      ${wheelSvg(134, 54, 7.5, isMoving)}

      <!-- Mining Dump Badge -->
      <text x="64" y="32" font-size="4.5" font-weight="900" fill="#f97316" font-family="sans-serif" letter-spacing="1">MINING DUMP</text>
    </svg>
  `;
}

/**
 * Render Vocational Waste Refuse Compactor Truck silhouette.
 */
export function getRigidRefuseSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', options?: { isMoving?: boolean }): string {
  const isMoving = !!options?.isMoving;

  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Low-Entry Urban Refuse Day Cab (e.g. Econic, TerraPro, PB 520) -->
      <path d="M10 52 L10 30 L16 16 L48 14 L50 20 L50 52 Z" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="1.5"/>
      <rect x="12" y="18" width="32" height="12" rx="1" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>
      <!-- Low Entry Panoramic Glass Door -->
      <rect x="14" y="32" width="10" height="18" rx="0.5" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.6"/>

      <!-- Waste Compactor Curved Body -->
      <path d="M50 16 Q100 10 144 18 L144 52 L50 52 Z" fill="rgba(16,185,129,0.14)" stroke="#10b981" stroke-width="1.5"/>

      <!-- Side Hydraulic Bin Lifter Arm & Track -->
      <line x1="65" y1="20" x2="65" y2="48" stroke="#10b981" stroke-width="1.5"/>
      <rect x="62" y="28" width="6" height="10" rx="1" fill="#34d399" stroke="#059669" stroke-width="0.6"/>

      <!-- Rear Hopper Loading Step & Packer Panel Assembly -->
      <path d="M144 18 L154 26 L154 52 L144 52 Z" fill="#047857" stroke="#10b981" stroke-width="1"/>
      <rect x="146" y="52" width="6" height="3" fill="#cbd5e1"/>

      ${isMoving ? getExhaustSmokeSvg(46, 14) : ''}

      <!-- Wheels -->
      ${wheelSvg(28, 54, 7.5, isMoving)}
      ${wheelSvg(114, 54, 7.5, isMoving)}
      ${wheelSvg(134, 54, 7.5, isMoving)}

      <!-- Refuse Badge -->
      <text x="64" y="32" font-size="4.5" font-weight="900" fill="#10b981" font-family="sans-serif" letter-spacing="1">REFUSE COMPACTOR</text>
    </svg>
  `;
}

/**
 * Render Vocational Rigid Tanker Truck silhouette.
 */
export function getRigidTankerSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', options?: { isMoving?: boolean }): string {
  const isMoving = !!options?.isMoving;

  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Day Cab -->
      <path d="M10 52 L10 36 L14 20 L22 14 L46 12 L50 16 L50 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.4"/>
      <path d="M14 23 L22 15 L42 14 L40 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>

      <!-- Integrated Stainless Steel Tank -->
      <path d="M52 20 L146 20 Q152 36 146 50 L52 50 Q46 36 52 20 Z" fill="rgba(203,213,225,0.15)" stroke="#cbd5e1" stroke-width="1.5"/>

      <!-- Stainless Tank Reinforcement Rings -->
      ${[0.25, 0.5, 0.75].map(pct => {
        const x = Math.round(52 + 94 * pct);
        return `<path d="M${x} 20 Q${x + 3} 36 ${x} 50" stroke="#94a3b8" stroke-width="1" fill="none"/>`;
      }).join('')}

      <!-- Top Manholes & Catwalk -->
      <line x1="60" y1="18" x2="135" y2="18" stroke="#cbd5e1" stroke-width="1"/>
      <ellipse cx="75" cy="18" rx="3.5" ry="1.5" fill="#64748b"/>
      <ellipse cx="120" cy="18" rx="3.5" ry="1.5" fill="#64748b"/>

      <!-- Rear Access Ladder -->
      <line x1="142" y1="21" x2="142" y2="48" stroke="#cbd5e1" stroke-width="1"/>

      ${isMoving ? getExhaustSmokeSvg(46, 12) : ''}

      <!-- Wheels -->
      ${wheelSvg(28, 54, 7.5, isMoving)}
      ${wheelSvg(118, 54, 7.5, isMoving)}
      ${wheelSvg(136, 54, 7.5, isMoving)}

      <!-- Tanker Badge -->
      <text x="64" y="32" font-size="4.5" font-weight="900" fill="#cbd5e1" font-family="sans-serif" letter-spacing="1">RIGID TANKER</text>
    </svg>
  `;
}

/**
 * Render Vocational Rigid Dropside Flatbed Truck silhouette with payload.
 */
export function getRigidFlatbedSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', options?: { isMoving?: boolean }): string {
  const isMoving = !!options?.isMoving;

  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Chassis Frame -->
      <path d="M10 52 L150 52 L150 56 L10 56 Z" fill="#1e293b" stroke="#475569" stroke-width="1"/>

      <!-- Day Cab -->
      <path d="M10 52 L10 36 L14 20 L22 14 L46 12 L50 16 L50 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.4"/>
      <path d="M14 23 L22 15 L42 14 L40 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>

      <!-- Dropside Flatbed Body Deck -->
      <rect x="52" y="44" width="98" height="8" rx="0.5" fill="#334155" stroke="${accentColor}" stroke-width="1.2"/>
      <line x1="52" y1="46" x2="150" y2="46" stroke="#475569" stroke-width="0.8"/>

      <!-- Front Steel Headboard Bulkhead -->
      <path d="M52 44 L52 22 L56 22 L56 44 Z" fill="#475569" stroke="#cbd5e1" stroke-width="0.8"/>

      <!-- Cargo Payload (Building Construction Materials / Bricks Pallet) -->
      <rect x="62" y="30" width="30" height="14" rx="1" fill="#b45309" stroke="#d97706" stroke-width="0.8"/>
      <line x1="62" y1="37" x2="92" y2="37" stroke="#78350f" stroke-width="0.6"/>
      <rect x="102" y="32" width="38" height="12" rx="1" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
      <!-- Cargo Ratchet Tie-Down Straps -->
      <line x1="77" y1="30" x2="77" y2="44" stroke="#eab308" stroke-width="1.2"/>
      <line x1="121" y1="32" x2="121" y2="44" stroke="#eab308" stroke-width="1.2"/>

      ${isMoving ? getExhaustSmokeSvg(46, 12) : ''}

      <!-- Wheels -->
      ${wheelSvg(28, 54, 7.5, isMoving)}
      ${wheelSvg(118, 54, 7.5, isMoving)}
      ${wheelSvg(136, 54, 7.5, isMoving)}

      <!-- Flatbed Badge -->
      <text x="64" y="26" font-size="4.5" font-weight="900" fill="${accentColor}" font-family="sans-serif" letter-spacing="1">DROPSIDE FLATBED</text>
    </svg>
  `;
}

/**
 * Render medium / heavy Rigid Box Truck silhouette with integrated chassis-mounted cargo body.
 */
export function getRigidTruckSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4', options?: { isMoving?: boolean }): string {
  const is6x4 = axle === '6x4' || axle === '6x2' || axle === '8x4';
  const isAmerican = model?.region === 'America';
  const isMoving = !!options?.isMoving;

  return `
    <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${isMoving ? getAnimationStyles() : ''}
      <!-- Ground line -->
      <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" style="${isMoving ? 'animation: roadDash 0.3s linear infinite;' : ''}" />

      <!-- Underbody Chassis Frame Rail -->
      <path d="M10 52 L150 52 L150 56 L10 56 Z" fill="#1e293b" stroke="#475569" stroke-width="1"/>

      <!-- Compact Commercial Day Cab (European Cabover or American Day Cab) -->
      ${isAmerican ? `
        <!-- American Medium Duty Hood -->
        <path d="M10 52 L10 44 L22 36 L40 28 L48 28 L48 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M24 35 L38 29 L46 29 L44 37 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.7"/>
        <rect x="9" y="44" width="7" height="7" rx="0.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.7"/>
        <rect x="6" y="43" width="4" height="3" rx="0.5" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.5"/>
      ` : `
        <!-- European Distribution Day Cab -->
        <path d="M10 52 L10 36 L14 20 L22 14 L46 12 L50 16 L50 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M14 23 L22 15 L42 14 L40 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.8"/>
        <rect x="10" y="32" width="7" height="11" rx="0.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.7"/>
        <path d="M10 44 L15 44 L15 49 L10 49 Z" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.6"/>
      `}

      <!-- Exterior Wing Mirror -->
      <path d="M14 26 L8 24 L7 19" stroke="#94a3b8" stroke-width="0.9" fill="none"/>
      <rect x="4" y="17" width="3.5" height="6" rx="0.8" fill="#1e293b" stroke="#cbd5e1" stroke-width="0.6"/>

      <!-- Integrated Heavy Duty Distribution Cargo Box Body -->
      <rect x="52" y="15" width="98" height="37" rx="1.5" fill="rgba(193,154,91,0.12)" stroke="${accentColor}" stroke-width="1.5"/>

      <!-- Aerodynamic Roof Fairing cap over cab -->
      <path d="M30 13 L52 15 L52 20 L30 16 Z" fill="${accentColor}" fill-opacity="0.3"/>

      <!-- Box Aluminum Framing & Corner Edge Reinforcements -->
      <line x1="52" y1="17" x2="150" y2="17" stroke="${accentColor}" stroke-width="0.8" opacity="0.8"/>
      <line x1="52" y1="50" x2="150" y2="50" stroke="${accentColor}" stroke-width="0.8" opacity="0.8"/>

      <!-- Vertical Panel Corrugation / Seam Lines -->
      ${[0.25, 0.5, 0.75].map(pct => {
        const x = Math.round(52 + 98 * pct);
        return `<line x1="${x}" y1="16" x2="${x}" y2="51" stroke="${accentColor}" stroke-width="0.6" stroke-dasharray="3 2" opacity="0.5"/>`;
      }).join('')}

      <!-- Rear Door Hardware & Lock Line -->
      <line x1="147" y1="16" x2="147" y2="51" stroke="#cbd5e1" stroke-width="1.2"/>
      <circle cx="147" cy="34" r="1.2" fill="#eab308"/>

      <!-- Underrun Guard Rail under the box -->
      <line x1="48" y1="55" x2="${is6x4 ? 100 : 110}" y2="55" stroke="#64748b" stroke-width="1.2"/>
      <line x1="48" y1="58" x2="${is6x4 ? 100 : 110}" y2="58" stroke="#475569" stroke-width="0.8"/>

      <!-- Fuel Tank / Battery Box under side frame -->
      <rect x="54" y="45" width="22" height="7" rx="1.5" fill="#334155" stroke="#64748b" stroke-width="0.7"/>

      ${isMoving ? getExhaustSmokeSvg(46, 12) : ''}

      <!-- Wheels (Front steer + Single/Dual rear axles) -->
      ${wheelSvg(28, 54, 7.5, isMoving)}
      ${is6x4 ? `
        ${wheelSvg(114, 54, 7.5, isMoving)}
        ${wheelSvg(134, 54, 7.5, isMoving)}
        <path d="M105 53 Q114 45 123 53" stroke="#475569" stroke-width="1.2" fill="none"/>
        <path d="M125 53 Q134 45 143 53" stroke="#475569" stroke-width="1.2" fill="none"/>
      ` : `
        ${wheelSvg(126, 54, 7.5, isMoving)}
        <path d="M117 53 Q126 45 135 53" stroke="#475569" stroke-width="1.2" fill="none"/>
      `}

      <!-- Rear Crash Bumper & Reflectors -->
      <rect x="150" y="51" width="2" height="7" fill="#dc2626"/>

      <!-- Rigid Distribution Text Badge -->
      <text x="64" y="26" font-size="4.5" font-weight="900" fill="${accentColor}" font-family="sans-serif" letter-spacing="1">RIGID FREIGHT</text>
    </svg>
  `;
}
