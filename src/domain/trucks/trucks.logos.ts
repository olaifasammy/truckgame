/**
 * Authentic vector SVG logos for heavy commercial truck manufacturers.
 * Clean, high-fidelity, mature monochrome/silver/heraldic OEM emblems.
 */

export function getManufacturerLogoSvg(brand: string, width = 64, height = 48): string {
  switch (brand) {
    case 'Scania':
      // The Scania Crowned Griffin (Grip) Crest & Typography
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Crowned Griffin Head -->
          <circle cx="60" cy="28" r="22" fill="#0d1527" stroke="#334155" stroke-width="1.5"/>
          <!-- Royal Crown -->
          <path d="M52 14 L54 10 L60 13 L66 10 L68 14 Z" fill="#c19a5b" stroke="#a6814a" stroke-width="0.8"/>
          <!-- Griffin Beak & Eye -->
          <path d="M56 16 C53 18, 51 22, 51 26 C47 27, 44 30, 43 33 C47 34, 52 32, 54 28 C55 33, 59 36, 64 36 C70 36, 73 31, 73 25 C73 18, 67 16, 60 16 Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1"/>
          <circle cx="56" cy="22" r="1.5" fill="#f8fafc"/>
          <!-- Brand Wordmark -->
          <text x="60" y="58" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="13" letter-spacing="3" fill="#f1f5f9">SCANIA</text>
        </svg>
      `;

    case 'Volvo':
      // The Volvo Iron Mark (Mars symbol with arrow and center blue nameplate)
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer Silver Ring -->
          <circle cx="60" cy="28" r="20" stroke="#cbd5e1" stroke-width="3.5" fill="#0b1120"/>
          <!-- Diagonal 45-deg Arrow pointing to top right -->
          <path d="M74 14 L84 4 L76 4 M84 4 L84 12" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="71" y1="17" x2="82" y2="6" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
          <!-- Center Blue Bar -->
          <rect x="36" y="23" width="48" height="10" rx="1.5" fill="#1e3a8a" stroke="#cbd5e1" stroke-width="0.8"/>
          <text x="60" y="31.5" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="800" font-size="8.5" letter-spacing="2.5" fill="#ffffff">VOLVO</text>
          <!-- Subtitle -->
          <text x="60" y="58" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" letter-spacing="4" fill="#f1f5f9">VOLVO</text>
        </svg>
      `;

    case 'Mercedes-Benz':
      // The Three-Pointed Star in Ring
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Silver Outer Ring -->
          <circle cx="60" cy="26" r="22" stroke="#cbd5e1" stroke-width="2.5" fill="#0f172a"/>
          <!-- 3-Pointed Star Facets -->
          <path d="M60 4 L62 25 L60 26 L58 25 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.5"/>
          <path d="M78 37 L61 28 L60 26 L62 25 Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="0.5"/>
          <path d="M42 37 L58 25 L60 26 L59 28 Z" fill="#64748b" stroke="#94a3b8" stroke-width="0.5"/>
          <path d="M60 4 L60 26 L78 37 Z" fill="#e2e8f0" opacity="0.9"/>
          <path d="M60 4 L42 37 L60 26 Z" fill="#94a3b8" opacity="0.9"/>
          <!-- Wordmark -->
          <text x="60" y="60" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="9" letter-spacing="1.5" fill="#f1f5f9">MERCEDES-BENZ</text>
        </svg>
      `;

    case 'MAN':
      // The MAN Braunschweig Lion atop bold MAN wordmark
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Lion Emblem Plate -->
          <rect x="42" y="4" width="36" height="22" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
          <!-- Roaring Prowling Lion Silhouette -->
          <path d="M48 20 C48 16, 52 14, 55 14 C56 12, 59 11, 62 11 C65 11, 68 12, 70 14 C73 14, 75 16, 75 19 C74 21, 71 22, 69 21 C67 23, 65 23, 63 22 C61 24, 57 24, 55 22 C53 23, 50 22, 48 20 Z" fill="#cbd5e1"/>
          <!-- MAN Bold Typography -->
          <text x="60" y="46" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="18" letter-spacing="2" fill="#f1f5f9">M·A·N</text>
          <!-- Underline Arch -->
          <path d="M38 52 Q60 56 82 52" stroke="#94a3b8" stroke-width="1.5" fill="none"/>
        </svg>
      `;

    case 'DAF':
      // The DAF Flagship Horizontal Emblem
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Chrome / Navy Plate -->
          <rect x="22" y="10" width="76" height="34" rx="4" fill="#0c1a30" stroke="#3b82f6" stroke-width="1.5"/>
          <rect x="25" y="13" width="70" height="28" rx="2" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
          <!-- DAF Letters -->
          <text x="60" y="34" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="20" letter-spacing="3" fill="#f8fafc">DAF</text>
          <!-- Red Accent Line -->
          <line x1="28" y1="38" x2="92" y2="38" stroke="#dc2626" stroke-width="2.5"/>
          <!-- Bottom Label -->
          <text x="60" y="58" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="9" letter-spacing="2" fill="#94a3b8">TRUCKS</text>
        </svg>
      `;

    case 'Kenworth':
      // The Kenworth Red Shield Crest
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Red Shield Outer -->
          <path d="M46 6 L74 6 L78 24 L60 38 L42 24 Z" fill="#991b1b" stroke="#cbd5e1" stroke-width="1.5"/>
          <!-- Interlocking KW Letters -->
          <path d="M48 10 L52 10 L52 28 L48 28 Z M53 19 L60 10 L65 10 L58 19 L66 28 L61 28 Z" fill="#ffffff"/>
          <path d="M62 10 L66 10 L70 28 L66 28 Z M68 18 L72 10 L76 28 L72 28 Z" fill="#ffffff" opacity="0.85"/>
          <!-- Wordmark -->
          <text x="60" y="56" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="12" letter-spacing="2.5" fill="#f1f5f9">KENWORTH</text>
        </svg>
      `;

    case 'Peterbilt':
      // The Iconic Peterbilt Red Oval with Script
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Chrome Rim Outer -->
          <ellipse cx="60" cy="28" rx="46" ry="20" fill="#991b1b" stroke="#cbd5e1" stroke-width="2.5"/>
          <!-- Inner Rim -->
          <ellipse cx="60" cy="28" rx="43" ry="17" fill="#b91c1c" stroke="#f87171" stroke-width="0.8"/>
          <!-- Peterbilt Script -->
          <text x="60" y="34" text-anchor="middle" font-family="'Brush Script MT', 'Lucida Calligraphy', cursive, serif" font-style="italic" font-weight="bold" font-size="20" fill="#ffffff" letter-spacing="0.5">Peterbilt</text>
          <!-- Wordmark -->
          <text x="60" y="60" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="9" letter-spacing="3" fill="#94a3b8">CLASS PAYS</text>
        </svg>
      `;

    case 'Freightliner':
      // The Freightliner Wing Crest Badge
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer Hex Shield -->
          <path d="M25 16 L60 8 L95 16 L90 38 L60 44 L30 38 Z" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.8"/>
          <!-- Horizontal Chrome Wings -->
          <path d="M34 22 L86 22 L84 25 L36 25 Z M37 28 L83 28 L81 31 L39 31 Z" fill="#94a3b8"/>
          <!-- Center Wordmark Box -->
          <rect x="22" y="20" width="76" height="12" rx="1.5" fill="#1e293b" stroke="#cbd5e1" stroke-width="1"/>
          <text x="60" y="29" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="7.5" letter-spacing="1.2" fill="#ffffff">FREIGHTLINER</text>
          <!-- Subtext -->
          <text x="60" y="58" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" letter-spacing="2" fill="#f1f5f9">FREIGHTLINER</text>
        </svg>
      `;

    case 'Mack':
      // The Mack Bulldog Silhouette & Bold Block Letters
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Heavy Bulldog Silhouette -->
          <path d="M48 26 C48 22, 51 18, 54 18 C56 16, 59 15, 62 17 C65 15, 69 16, 71 20 C73 22, 72 26, 70 28 C72 30, 70 33, 67 33 C64 33, 62 31, 61 31 C60 33, 56 33, 53 32 C50 32, 48 30, 48 26 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
          <!-- Bold MACK Wordmark -->
          <text x="60" y="52" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="18" letter-spacing="3" fill="#f1f5f9">MACK</text>
          <line x1="36" y1="58" x2="84" y2="58" stroke="#a38244" stroke-width="2"/>
        </svg>
      `;

    case 'Hino':
      // The Winged 'H' Emblem
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Chrome Oval Frame -->
          <ellipse cx="60" cy="25" rx="32" ry="19" stroke="#cbd5e1" stroke-width="2.5" fill="#0f172a"/>
          <!-- Winged Dynamic 'H' -->
          <path d="M44 25 C48 18, 54 18, 58 24 L58 26 C54 20, 48 20, 44 25 Z" fill="#dc2626"/>
          <path d="M76 25 C72 18, 66 18, 62 24 L62 26 C66 20, 72 20, 76 25 Z" fill="#dc2626"/>
          <rect x="52" y="24" width="16" height="3" fill="#cbd5e1"/>
          <!-- Wordmark -->
          <text x="60" y="56" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="13" letter-spacing="3" fill="#f1f5f9">HINO</text>
        </svg>
      `;

    case 'Isuzu':
      // The Isuzu Twin Pillars & Clean Heavy Block Letters
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Two Clean Pillar Pillars -->
          <rect x="47" y="10" width="8" height="20" rx="2" fill="#dc2626"/>
          <rect x="65" y="10" width="8" height="20" rx="2" fill="#dc2626"/>
          <!-- Bold ISUZU Typography -->
          <text x="60" y="48" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="15" letter-spacing="3" fill="#f1f5f9">ISUZU</text>
          <text x="60" y="60" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="8" letter-spacing="2" fill="#94a3b8">COMMERCIAL</text>
        </svg>
      `;

    case 'Iveco':
      // The Modern Geometric IVECO Wordmark
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Silver Frame Badge -->
          <rect x="22" y="14" width="76" height="28" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
          <!-- Bold Geometric IVECO -->
          <text x="60" y="34" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="17" letter-spacing="4" fill="#f1f5f9">IVECO</text>
          <!-- Underline -->
          <line x1="32" y1="52" x2="88" y2="52" stroke="#475569" stroke-width="1.5"/>
        </svg>
      `;

    default:
      return `
        <svg viewBox="0 0 120 70" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="80" height="36" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <text x="60" y="34" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="13" letter-spacing="2" fill="#f1f5f9">${brand.toUpperCase()}</text>
        </svg>
      `;
  }
}
