/**
 * Authentic commercial heavy vehicle SVG silhouettes and telematics schematics.
 */
export function getTruckSilhouetteSvg(model: any, accentColor = 'var(--gold)', axle: string = '6x4'): string {
  const isAmerican = model.region === 'America';
  const is6x4 = axle === '6x4' || axle === '6x2' || axle === '8x4';

  if (isAmerican) {
    // American Conventional (Long hood, vertical chrome exhaust stacks, sleeper compartment)
    return `
      <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ground line -->
        <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="2 2" />
        
        <!-- Chassis frame rail -->
        <path d="M12 52 L150 52 L150 56 L12 56 Z" fill="#2d3748" stroke="#4a5568" stroke-width="1"/>
        
        <!-- Long Hood & Front Bumper -->
        <path d="M14 54 L6 54 L6 42 L22 42 L26 30 L48 30 L48 54 Z" fill="rgba(193,154,91,0.12)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="4" y="44" width="4" height="10" rx="1" fill="#718096" stroke="#a0aec0" stroke-width="0.8"/>
        <!-- Headlight -->
        <rect x="7" y="44" width="3" height="4" rx="0.5" fill="#fef08a"/>
        
        <!-- Windshield & A-Pillar -->
        <path d="M48 30 L55 18 L76 18 L76 54 L48 54 Z" fill="rgba(193,154,91,0.18)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M50 30 L56 20 L66 20 L64 30 Z" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="0.8"/>
        
        <!-- Sleeper Berth Cab -->
        <path d="M76 14 L102 14 L102 52 L76 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="80" y="22" width="10" height="8" rx="1" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.6"/>
        <path d="M74 14 L104 12 L104 14 Z" fill="${accentColor}" opacity="0.6"/>
        
        <!-- Vertical Exhaust Stacks -->
        <path d="M76 34 L76 6 L79 4 L79 34 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M74 34 L74 8 L76 6" stroke="#64748b" stroke-width="0.8"/>
        
        <!-- Fuel Tanks (Cylindrical Aluminum) -->
        <rect x="52" y="44" width="32" height="9" rx="3.5" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
        <line x1="62" y1="44" x2="62" y2="53" stroke="#94a3b8" stroke-width="0.8"/>
        <line x1="74" y1="44" x2="74" y2="53" stroke="#94a3b8" stroke-width="0.8"/>
        
        <!-- Fifth Wheel Coupling Plate -->
        <path d="M120 48 L138 48 L135 45 L123 45 Z" fill="#64748b" stroke="#94a3b8" stroke-width="1"/>
        
        <!-- Front Steer Wheel -->
        <circle cx="28" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
        <circle cx="28" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
        <circle cx="28" cy="54" r="1.5" fill="#cbd5e1"/>
        
        ${is6x4 ? `
          <!-- Tandem Rear Drive Axle 1 -->
          <circle cx="118" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="118" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="118" cy="54" r="1.5" fill="#cbd5e1"/>
          
          <!-- Tandem Rear Drive Axle 2 -->
          <circle cx="138" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="138" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="138" cy="54" r="1.5" fill="#cbd5e1"/>
          <!-- Mudflap -->
          <path d="M147 48 L149 58 L146 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        ` : `
          <!-- Single Rear Drive Axle -->
          <circle cx="128" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="128" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="128" cy="54" r="1.5" fill="#cbd5e1"/>
          <!-- Mudflap -->
          <path d="M137 48 L139 58 L136 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        `}
      </svg>
    `;
  } else {
    // European / Global Heavy Cabover (Highline Cab, Aerodynamic Deflector, Integrated Steps)
    return `
      <svg viewBox="0 0 160 70" class="truck-blueprint" style="width:100%; height:100%; max-height:85px;" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ground line -->
        <line x1="2" y1="62" x2="158" y2="62" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="2 2" />
        
        <!-- Chassis frame rail -->
        <path d="M12 52 L146 52 L146 56 L12 56 Z" fill="#2d3748" stroke="#4a5568" stroke-width="1"/>
        
        <!-- European Cabover Body -->
        <!-- Front Aerodynamic Face -->
        <path d="M10 52 L10 38 L14 20 L24 10 L56 8 L64 12 L64 52 Z" fill="rgba(193,154,91,0.15)" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
        
        <!-- Highline Roof Air Deflector -->
        <path d="M22 10 L58 8 L72 12 L64 18 L56 12 Z" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="1"/>
        
        <!-- Large Panoramic Windshield -->
        <path d="M14 24 L22 14 L44 13 L42 28 L15 28 Z" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="0.8"/>
        <!-- Side Cab Window -->
        <path d="M43 14 L56 14 L56 28 L43 28 Z" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.8"/>
        
        <!-- Grille & Headlamp Cluster -->
        <path d="M10 32 L16 32 L16 46 L10 46 Z" fill="#1e293b" stroke="#64748b" stroke-width="0.8"/>
        <line x1="10" y1="36" x2="16" y2="36" stroke="#94a3b8" stroke-width="0.6"/>
        <line x1="10" y1="40" x2="16" y2="40" stroke="#94a3b8" stroke-width="0.6"/>
        <rect x="9" y="44" width="3" height="5" rx="0.5" fill="#fef08a"/>
        
        <!-- Cab Steps -->
        <rect x="22" y="46" width="10" height="2" rx="0.5" fill="#94a3b8"/>
        <rect x="22" y="49" width="10" height="2" rx="0.5" fill="#94a3b8"/>
        
        <!-- Large Aluminum Fuel Tank -->
        <rect x="52" y="43" width="36" height="10" rx="2" fill="#334155" stroke="#64748b" stroke-width="0.8"/>
        <circle cx="56" cy="46" r="1.5" fill="#94a3b8"/>
        
        <!-- Fifth Wheel Coupling Plate -->
        <path d="M110 48 L128 48 L125 45 L113 45 Z" fill="#64748b" stroke="#94a3b8" stroke-width="1"/>
        
        <!-- Front Steer Axle -->
        <circle cx="34" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
        <circle cx="34" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
        <circle cx="34" cy="54" r="1.5" fill="#cbd5e1"/>
        
        ${is6x4 ? `
          <!-- Tandem Rear Drive Axle 1 -->
          <circle cx="106" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="106" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="106" cy="54" r="1.5" fill="#cbd5e1"/>
          
          <!-- Tandem Rear Drive Axle 2 -->
          <circle cx="126" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="126" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="126" cy="54" r="1.5" fill="#cbd5e1"/>
          <!-- Rear Fenders / Mudguards -->
          <path d="M96 52 Q106 42 116 52" stroke="#475569" stroke-width="1.5" fill="none"/>
          <path d="M116 52 Q126 42 136 52" stroke="#475569" stroke-width="1.5" fill="none"/>
          <path d="M136 50 L138 58 L135 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        ` : `
          <!-- Single Rear Drive Axle -->
          <circle cx="118" cy="54" r="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="118" cy="54" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
          <circle cx="118" cy="54" r="1.5" fill="#cbd5e1"/>
          <!-- Rear Fender -->
          <path d="M108 52 Q118 42 128 52" stroke="#475569" stroke-width="1.5" fill="none"/>
          <path d="M128 50 L130 58 L127 58" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        `}
      </svg>
    `;
  }
}
