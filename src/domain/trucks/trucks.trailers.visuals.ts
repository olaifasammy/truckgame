/**
 * Authentic heavy commercial vehicle trailer SVG schematics and visualizations.
 */

// Helper to render high-definition dual/steer wheels with optional rotation animation
export const wheelSvg = (cx: number, cy: number = 54, r: number = 8, isMoving = false) => `
  <g class="${isMoving ? 'moving-wheel' : ''}" style="${isMoving ? `transform-origin: ${cx}px ${cy}px; animation: spinWheel 0.4s linear infinite;` : ''}">
    <!-- Commercial tyre and reinforced sidewall -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#101820" stroke="#64748b" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="#17212b" stroke="#334155" stroke-width="0.7"/>

    <!-- Alloy wheel rim -->
    <circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="#64748b" stroke="#cbd5e1" stroke-width="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.39}" fill="#334155" stroke="#94a3b8" stroke-width="0.6"/>

    <!-- Hub and wheel fasteners -->
    ${Array.from({ length: 6 }).map((_, i) => {
      const a = (Math.PI * 2 * i) / 6;
      const bx = cx + Math.cos(a) * r * 0.43;
      const by = cy + Math.sin(a) * r * 0.43;
      return `<circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="${Math.max(0.65, r * 0.075)}" fill="#cbd5e1"/>`;
    }).join('')}
    <!-- Wheel spoke crosshairs for rotational motion -->
    <line x1="${cx - r * 0.5}" y1="${cy}" x2="${cx + r * 0.5}" y2="${cy}" stroke="#e2e8f0" stroke-width="0.6"/>
    <line x1="${cx}" y1="${cy - r * 0.5}" x2="${cx}" y2="${cy + r * 0.5}" stroke="#e2e8f0" stroke-width="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.19}" fill="#cbd5e1" stroke="#e2e8f0" stroke-width="0.5"/>
  </g>
`;

export const getAnimationStyles = () => `
  <style>
    @keyframes spinWheel {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes exhaustSmokePuff1 {
      0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
      30% { opacity: 0.7; transform: translate(-8px, -6px) scale(1.4); }
      100% { opacity: 0; transform: translate(-26px, -18px) scale(2.8); }
    }
    @keyframes exhaustSmokePuff2 {
      0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
      40% { opacity: 0.8; transform: translate(-12px, -8px) scale(1.6); }
      100% { opacity: 0; transform: translate(-34px, -24px) scale(3.2); }
    }
    @keyframes roadDash {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -20; }
    }
  </style>
`;

export const getExhaustSmokeSvg = (stackX: number, stackY: number) => `
  <g class="exhaust-smoke">
    <circle cx="${stackX}" cy="${stackY}" r="3.5" fill="#94a3b8" style="animation: exhaustSmokePuff1 1.2s ease-out infinite; transform-origin: ${stackX}px ${stackY}px;"/>
    <circle cx="${stackX}" cy="${stackY}" r="4.5" fill="#cbd5e1" style="animation: exhaustSmokePuff2 1.2s ease-out infinite 0.5s; transform-origin: ${stackX}px ${stackY}px;"/>
  </g>
`;

/**
 * Render individual trailer components when coupled behind a tractor.
 * @param type Trailer type identifier
 * @param startX Starting X position on fifth-wheel pin (connects around x=112-120)
 * @param accentColor Theme accent color
 */
export function renderCoupledTrailerSvg(type: string, startX: number, accentColor: string): string {
  const trailerLen = 185;
  const endX = startX + trailerLen;
  const bogieAxle1 = endX - 44;
  const bogieAxle2 = endX - 25;
  const bogieAxle3 = endX - 6;

  // Common trailer undercarriage (Landing gear retracted, kingpin pin, rear bogie wheels, crash bumper)
  const undercarriage = `
    <!-- Trailer Kingpin Gooseneck Connection -->
    <path d="M${startX - 8} 48 L${startX + 20} 48 L${startX + 20} 52 L${startX - 8} 52 Z" fill="#475569" stroke="#64748b" stroke-width="0.8"/>
    <rect x="${startX + 3}" y="47" width="5" height="3" fill="#cbd5e1"/>
    
    <!-- Retracted Transit Landing Legs -->
    <rect x="${startX + 40}" y="50" width="3" height="8" rx="0.5" fill="#64748b" stroke="#94a3b8" stroke-width="0.5"/>
    <circle cx="${startX + 41.5}" cy="53" r="1.5" fill="#94a3b8"/>
    
    <!-- Side Cyclist Underrun Protection Guard Rail -->
    <line x1="${startX + 52}" y1="55" x2="${bogieAxle1 - 10}" y2="55" stroke="#64748b" stroke-width="1.2"/>
    <line x1="${startX + 52}" y1="58" x2="${bogieAxle1 - 10}" y2="58" stroke="#475569" stroke-width="0.8"/>

    <!-- Rear Bogie Tri-Axle Wheels -->
    ${wheelSvg(bogieAxle1, 54, 8)}
    ${wheelSvg(bogieAxle2, 54, 8)}
    ${wheelSvg(bogieAxle3, 54, 8)}

    <!-- Rear Fenders / Wheel Arches -->
    <path d="M${bogieAxle1 - 10} 52 Q${bogieAxle1} 43 ${bogieAxle1 + 10} 52" stroke="#475569" stroke-width="1.2" fill="none"/>
    <path d="M${bogieAxle2 - 10} 52 Q${bogieAxle2} 43 ${bogieAxle2 + 10} 52" stroke="#475569" stroke-width="1.2" fill="none"/>
    <path d="M${bogieAxle3 - 10} 52 Q${bogieAxle3} 43 ${bogieAxle3 + 10} 52" stroke="#475569" stroke-width="1.2" fill="none"/>

    <!-- Rear Underrun Crash Bumper & Reflectors -->
    <rect x="${endX + 2}" y="52" width="2" height="7" fill="#dc2626"/>
    <path d="M${endX + 1} 50 L${endX + 3} 59 L${endX} 59" stroke="#94a3b8" stroke-width="1"/>
  `;

  switch (type) {
    case 'curtain':
      return `
        <!-- Curtainside Semi-Trailer Body -->
        <rect x="${startX - 10}" y="14" width="${trailerLen + 10}" height="37" rx="2" fill="rgba(193,154,91,0.14)" stroke="${accentColor}" stroke-width="1.5"/>
        <path d="M${startX - 10} 14 L${startX + 6} 11 L${endX} 13" stroke="${accentColor}" stroke-width="1" fill="none"/>
        <!-- Tension Curtain Buckle Lines -->
        ${[0.18, 0.32, 0.46, 0.60, 0.74, 0.88].map(pct => {
          const x = Math.round(startX - 10 + (trailerLen + 10) * pct);
          return `<line x1="${x}" y1="16" x2="${x}" y2="50" stroke="${accentColor}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.6"/>`;
        }).join('')}
        <!-- Rear Aluminum Door Frame -->
        <line x1="${endX - 3}" y1="15" x2="${endX - 3}" y2="50" stroke="#cbd5e1" stroke-width="1.2"/>
        <circle cx="${endX - 3}" cy="32" r="1" fill="#f59e0b"/>
        ${undercarriage}
      `;

    case 'reefer':
      return `
        <!-- Refrigerated Reefer Cooling Compressor Unit -->
        <rect x="${startX - 16}" y="15" width="13" height="24" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
        <circle cx="${startX - 9.5}" cy="23" r="4.5" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8"/>
        <circle cx="${startX - 9.5}" cy="23" r="3.2" fill="none" stroke="#7dd3fc" stroke-width="0.6"/>
        <path d="M${startX - 9.5} 20 L${startX - 7.5} 23 L${startX - 9.5} 26 L${startX - 11.5} 23 Z" fill="#38bdf8" opacity="0.8"/>
        <rect x="${startX - 14}" y="30" width="9" height="5" rx="0.5" fill="#0f172a" stroke="#38bdf8" stroke-width="0.6"/>
        <line x1="${startX - 12}" y1="32" x2="${startX - 7}" y2="32" stroke="#7dd3fc" stroke-width="0.6"/>
        <line x1="${startX - 12}" y1="34" x2="${startX - 7}" y2="34" stroke="#7dd3fc" stroke-width="0.6"/>
        <rect x="${startX - 14}" y="37" width="9" height="2" rx="0.5" fill="#38bdf8" fill-opacity="0.8"/>
        <!-- Insulated Composite Box Body -->
        <rect x="${startX - 4}" y="12" width="${trailerLen + 4}" height="39" rx="1.5" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" stroke-width="1.5"/>
        <!-- Horizontal Insulated Panels -->
        <line x1="${startX}" y1="24" x2="${endX - 2}" y2="24" stroke="#38bdf8" stroke-width="0.5" opacity="0.5"/>
        <line x1="${startX}" y1="36" x2="${endX - 2}" y2="36" stroke="#38bdf8" stroke-width="0.5" opacity="0.5"/>
        <!-- Cold Chain Snowflake Icon -->
        <text x="${startX + 25}" y="20" font-size="7" fill="#38bdf8">❄</text>
        <text x="${startX + 36}" y="20" font-size="5" font-weight="900" fill="#38bdf8" font-family="monospace">COLD-CHAIN GDP</text>
        <!-- Heavy Cam Locks -->
        <line x1="${endX - 2}" y1="14" x2="${endX - 2}" y2="50" stroke="#cbd5e1" stroke-width="1.5"/>
        ${undercarriage}
      `;

    case 'tanker':
      return `
        <!-- Stainless Steel Cylindrical Foodgrade Tanker -->
        <path d="M${startX - 2} 22 L${endX - 8} 22 Q${endX + 2} 36 ${endX - 8} 49 L${startX - 2} 49 Q${startX - 12} 36 ${startX - 2} 22 Z" fill="rgba(203,213,225,0.14)" stroke="#cbd5e1" stroke-width="1.5"/>
        <!-- Stainless Tank Reinforcement Rings -->
        ${[0.2, 0.4, 0.6, 0.8].map(pct => {
          const x = Math.round(startX + trailerLen * pct);
          return `<path d="M${x} 22 Q${x + 3} 36 ${x} 49" stroke="#94a3b8" stroke-width="1" fill="none"/>`;
        }).join('')}
        <!-- Top Catwalk & Safety Rails -->
        <line x1="${startX + 15}" y1="19" x2="${endX - 25}" y2="19" stroke="#94a3b8" stroke-width="1"/>
        <!-- Top Manhole Covers -->
        <ellipse cx="${startX + 40}" cy="20" rx="3.5" ry="1.5" fill="#64748b" stroke="#cbd5e1" stroke-width="0.8"/>
        <ellipse cx="${startX + 95}" cy="20" rx="3.5" ry="1.5" fill="#64748b" stroke="#cbd5e1" stroke-width="0.8"/>
        <ellipse cx="${startX + 145}" cy="20" rx="3.5" ry="1.5" fill="#64748b" stroke="#cbd5e1" stroke-width="0.8"/>
        <!-- Tank Support Saddles and Reinforced Mounting Brackets -->
        ${[35, 145].map(offset => `
          <path d="M${startX + offset - 5} 45 L${startX + offset - 5} 51 L${startX + offset + 5} 51 L${startX + offset + 5} 45"
            fill="none" stroke="#64748b" stroke-width="1.5"/>
          <line x1="${startX + offset}" y1="48" x2="${startX + offset}" y2="53" stroke="#cbd5e1" stroke-width="0.8"/>
        `).join('')}
        <!-- Tank Access Ladder -->
        <path d="M${endX - 15} 23 L${endX - 15} 48 M${endX - 11} 23 L${endX - 11} 48"
          stroke="#94a3b8" stroke-width="0.9"/>
        ${[28, 34, 40, 46].map(y => `<line x1="${endX - 15}" y1="${y}" x2="${endX - 11}" y2="${y}" stroke="#cbd5e1" stroke-width="0.8"/>`).join('')}
        <!-- Bottom Discharge Cabinet -->
        <rect x="${startX + 65}" y="49" width="18" height="6" fill="#334155" stroke="#64748b" stroke-width="0.8"/>
        <rect x="${startX + 70}" y="50" width="8" height="3" fill="#64748b" stroke="#cbd5e1" stroke-width="0.5"/>
        ${undercarriage}
      `;

    case 'hazmat':
      return `
        <!-- ADR Hazardous Materials / Chemical Tanker -->
        <path d="M${startX - 2} 22 L${endX - 8} 22 Q${endX + 2} 36 ${endX - 8} 49 L${startX - 2} 49 Q${startX - 12} 36 ${startX - 2} 22 Z" fill="rgba(234,88,12,0.15)" stroke="#ea580c" stroke-width="1.5"/>
        <!-- Tank Rings -->
        ${[0.25, 0.5, 0.75].map(pct => {
          const x = Math.round(startX + trailerLen * pct);
          return `<path d="M${x} 22 Q${x + 3} 36 ${x} 49" stroke="#f97316" stroke-width="1" fill="none"/>`;
        }).join('')}
        <!-- Top Pressure Relief Manholes -->
        <ellipse cx="${startX + 50}" cy="20" rx="4" ry="1.8" fill="#c2410c" stroke="#fed7aa" stroke-width="0.8"/>
        <ellipse cx="${startX + 120}" cy="20" rx="4" ry="1.8" fill="#c2410c" stroke="#fed7aa" stroke-width="0.8"/>
        <!-- ADR Hazard Placard Diamonds -->
        <rect x="${startX + 35}" y="31" width="9" height="9" rx="1" transform="rotate(45 ${startX + 39.5} 35.5)" fill="#ea580c" stroke="#ffedd5" stroke-width="0.8"/>
        <text x="${startX + 39.5}" y="37" font-size="4" font-weight="900" text-anchor="middle" fill="#fff" font-family="monospace">ADR</text>
        <rect x="${startX + 85}" y="31" width="9" height="9" rx="1" transform="rotate(45 ${startX + 89.5} 35.5)" fill="#dc2626" stroke="#ffedd5" stroke-width="0.8"/>
        <text x="${startX + 89.5}" y="37" font-size="5" font-weight="900" text-anchor="middle" fill="#fff" font-family="monospace">☣</text>
        <!-- Yellow / Black Hazard Chevron Rear Bumper -->
        <rect x="${endX - 1}" y="49" width="4" height="6" fill="#f59e0b" stroke="#000" stroke-width="0.5"/>
        ${undercarriage}
      `;

    case 'flatbed':
      return `
        <!-- Heavy Industrial Steel Flatbed Deck -->
        <!-- Front Steel Headboard Bulkhead -->
        <path d="M${startX - 8} 52 L${startX - 8} 30 L${startX - 4} 30 L${startX - 4} 52 Z" fill="#475569" stroke="#94a3b8" stroke-width="1"/>
        <!-- Main Platform Beam -->
        <rect x="${startX - 8}" y="48" width="${trailerLen + 8}" height="4" fill="#334155" stroke="#cbd5e1" stroke-width="1"/>
        <!-- Structural Cargo: Bundled Industrial Heavy Pipes -->
        <rect x="${startX + 10}" y="35" width="${trailerLen - 40}" height="13" rx="1" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
        <line x1="${startX + 10}" y1="41" x2="${startX + trailerLen - 30}" y2="41" stroke="#475569" stroke-width="0.8"/>
        <!-- High-Visibility Yellow Ratchet Tie-Down Straps -->
        ${[0.18, 0.35, 0.52, 0.68].map(pct => {
          const x = Math.round(startX + 10 + (trailerLen - 40) * pct);
          return `
            <line x1="${x}" y1="35" x2="${x}" y2="49" stroke="#eab308" stroke-width="1.5"/>
            <rect x="${x - 1.5}" y="47" width="3" height="2" rx="0.5" fill="#facc15" stroke="#a16207" stroke-width="0.4"/>
            <circle cx="${x}" cy="34.5" r="1.3" fill="#facc15" stroke="#a16207" stroke-width="0.4"/>
          `;
        }).join('')}
        <!-- Exposed Industrial Pipe Bundle Ends -->
        ${[38, 42, 46].map(y => `
          <circle cx="${startX + 10}" cy="${y}" r="2" fill="#64748b" stroke="#cbd5e1" stroke-width="0.6"/>
          <circle cx="${startX + 10}" cy="${y}" r="0.9" fill="#1e293b"/>
        `).join('')}
        <!-- Side Tie-Down Anchor Hooks -->
        ${[0.22, 0.42, 0.62, 0.82].map(pct => {
          const x = Math.round(startX + 10 + (trailerLen - 40) * pct);
          return `<path d="M${x} 50 L${x} 53 Q${x + 2} 55 ${x + 3} 52" fill="none" stroke="#cbd5e1" stroke-width="0.8"/>`;
        }).join('')}
        ${undercarriage}
      `;

    case 'lowboy': {
      // Specialized Gooseneck Drop-Deck Machinery Trailer
      const deckStart = startX + 26;
      const deckEnd = endX - 60;
      return `
        <!-- Gooseneck Drop to Low Bed Well -->
        <path d="M${startX - 8} 48 L${startX + 18} 48 L${deckStart} 57 L${deckEnd} 57 L${deckEnd + 10} 48 L${endX} 48 L${endX} 52 L${deckEnd + 8} 52 L${deckEnd} 60 L${deckStart} 60 L${startX + 16} 52 L${startX - 8} 52 Z" fill="#1e293b" stroke="#eab308" stroke-width="1.2"/>
        
        <!-- Heavy Excavator / Industrial Plant Loaded in Well Deck -->
        <!-- Track Base -->
        <rect x="${deckStart + 16}" y="53" width="70" height="4.5" rx="1.5" fill="#0f172a" stroke="#64748b" stroke-width="0.8"/>
        <circle cx="${deckStart + 22}" cy="55" r="1.5" fill="#94a3b8"/>
        <circle cx="${deckStart + 51}" cy="55" r="1.5" fill="#94a3b8"/>
        <circle cx="${deckStart + 80}" cy="55" r="1.5" fill="#94a3b8"/>
        <!-- Yellow Excavator Body & Operator Cab -->
        <path d="M${deckStart + 22} 53 L${deckStart + 60} 53 L${deckStart + 60} 38 L${deckStart + 40} 38 L${deckStart + 35} 44 L${deckStart + 22} 44 Z" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <rect x="${deckStart + 44}" y="40" width="12" height="8" rx="1" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="0.6"/>
        <!-- Heavy Boom Arm -->
        <path d="M${deckStart + 32} 44 L${deckStart + 10} 24 L${deckStart - 6} 36" stroke="#ca8a04" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        
        <!-- Rear Ramps & Heavy Quad Bogie -->
        ${wheelSvg(bogieAxle1 - 10, 54, 7.5)}
        ${wheelSvg(bogieAxle2 - 5, 54, 7.5)}
        ${wheelSvg(bogieAxle3, 54, 7.5)}
        <!-- Heavy Fold-Down Loading Ramps -->
        <path d="M${endX} 48 L${endX + 6} 34 L${endX + 8} 35 L${endX + 2} 50" fill="#475569" stroke="#94a3b8" stroke-width="1"/>
      `;
    }

    case 'tipper':
      return `
        <!-- Heavy Aggregate Tipper Dump Tub -->
        <path d="M${startX + 6} 22 L${endX - 4} 22 L${endX - 12} 50 L${startX - 4} 50 Z" fill="rgba(193,154,91,0.18)" stroke="${accentColor}" stroke-width="1.5"/>
        <!-- Front Chrome Telescopic Hoist Ram -->
        <line x1="${startX - 6}" y1="24" x2="${startX + 2}" y2="48" stroke="#cbd5e1" stroke-width="3"/>
        <line x1="${startX - 6}" y1="24" x2="${startX - 2}" y2="36" stroke="#38bdf8" stroke-width="1.5"/>
        <!-- Tipper Side Reinforcement Ribs -->
        ${[0.25, 0.5, 0.75].map(pct => {
          const x = Math.round(startX + (trailerLen - 20) * pct);
          return `<line x1="${x + 6}" y1="24" x2="${x}" y2="49" stroke="${accentColor}" stroke-width="1"/>`;
        }).join('')}
        <!-- Sloped Rear Tailgate with Heavy Pivot -->
        <circle cx="${endX - 4}" cy="24" r="2" fill="#eab308"/>
        ${undercarriage}
      `;

    case 'container':
      return `
        <!-- Skeletal Intermodal Container Chassis -->
        <rect x="${startX - 8}" y="49" width="${trailerLen + 8}" height="3" fill="#334155" stroke="#64748b" stroke-width="1"/>
        
        <!-- ISO 40ft Maritime Corrugated Shipping Container -->
        <rect x="${startX - 6}" y="15" width="${trailerLen + 4}" height="34" rx="1" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
        <!-- Vertical Corrugation Flutes -->
        ${Array.from({ length: 18 }).map((_, idx) => {
          const x = Math.round(startX + (idx * 9.5));
          return `<line x1="${x}" y1="17" x2="${x}" y2="47" stroke="#38bdf8" stroke-width="0.6" opacity="0.4"/>`;
        }).join('')}
        <!-- Maritime Shipping Line Branding & ISO Corner Castings -->
        <text x="${startX + 14}" y="24" font-size="5" font-weight="900" fill="#38bdf8" font-family="monospace">NEX-HAUL 40' HC</text>
        <rect x="${startX - 6}" y="15" width="4" height="4" fill="#64748b" stroke="#cbd5e1" stroke-width="0.5"/>
        <rect x="${endX - 4}" y="15" width="4" height="4" fill="#64748b" stroke="#cbd5e1" stroke-width="0.5"/>
        <rect x="${startX - 6}" y="45" width="4" height="4" fill="#64748b" stroke="#cbd5e1" stroke-width="0.5"/>
        <rect x="${endX - 4}" y="45" width="4" height="4" fill="#64748b" stroke="#cbd5e1" stroke-width="0.5"/>
        <!-- Rear Container Double Doors and Locking Bars -->
        <line x1="${endX - 9}" y1="17" x2="${endX - 9}" y2="47" stroke="#94a3b8" stroke-width="1"/>
        <line x1="${endX - 5}" y1="17" x2="${endX - 5}" y2="47" stroke="#94a3b8" stroke-width="1"/>
        ${[20, 44].map(y => `
          <rect x="${endX - 10}" y="${y}" width="6" height="2" rx="0.4" fill="#cbd5e1"/>
        `).join('')}
        <!-- Chassis Twist-Lock Mounts -->
        ${[startX + 5, endX - 8].map(x => `
          <rect x="${x}" y="49" width="4" height="2" rx="0.3" fill="#eab308" stroke="#a16207" stroke-width="0.4"/>
        `).join('')}
        ${undercarriage}
      `;

    case 'double_trailer': {
      // Long Combination Vehicle (LCV) - Two 28ft pup trailers connected via converter dolly
      const pup1End = startX + 105;
      const dollyAxle = pup1End + 15;
      const pup2Start = pup1End + 28;
      const pup2End = pup2Start + 110;
      return `
        <!-- Lead Pup Semi-Trailer (28ft) -->
        <rect x="${startX - 6}" y="15" width="108" height="36" rx="2" fill="rgba(193,154,91,0.14)" stroke="${accentColor}" stroke-width="1.2"/>
        ${wheelSvg(pup1End - 16, 54, 7.5)}
        ${wheelSvg(pup1End - 2, 54, 7.5)}

        <!-- Converter Dolly with Drawbar & Fifth-Wheel Turntable -->
        <line x1="${pup1End + 2}" y1="52" x2="${dollyAxle}" y2="52" stroke="#64748b" stroke-width="1.5"/>
        <path d="${dollyAxle - 4} 49 L${dollyAxle + 6} 49 L${dollyAxle + 4} 47 L${dollyAxle - 2} 47 Z" fill="#94a3b8"/>
        ${wheelSvg(dollyAxle, 54, 7.5)}

        <!-- Trailing Pup Semi-Trailer (28ft) -->
        <rect x="${pup2Start}" y="15" width="108" height="36" rx="2" fill="rgba(193,154,91,0.14)" stroke="${accentColor}" stroke-width="1.2"/>
        <text x="${pup2Start + 20}" y="24" font-size="5" font-weight="900" fill="${accentColor}" font-family="monospace">B-TRAIN LCV</text>
        ${wheelSvg(pup2End - 16, 54, 7.5)}
        ${wheelSvg(pup2End - 2, 54, 7.5)}
        <rect x="${pup2End + 1}" y="52" width="2" height="7" fill="#dc2626"/>
      `;
    }

    case 'carrier':
      return `
        <!-- Multi-Deck Auto Car Transporter Framework -->
        <!-- Main Chassis & Lower Deck -->
        <rect x="${startX - 6}" y="48" width="${trailerLen + 6}" height="3" fill="#334155" stroke="#64748b" stroke-width="1"/>
        
        <!-- Structural Vertical Posts -->
        ${[0.05, 0.25, 0.5, 0.75, 0.95].map(pct => {
          const x = Math.round(startX + trailerLen * pct);
          return `<rect x="${x}" y="18" width="2" height="32" fill="#475569" stroke="#64748b" stroke-width="0.5"/>`;
        }).join('')}

        <!-- Top Vehicle Deck (Angled Front for Aerodynamics) -->
        <path d="M${startX - 8} 24 L${startX + 15} 18 L${endX} 18 L${endX} 21 L${startX + 15} 21 L${startX - 8} 27 Z" fill="#334155" stroke="#64748b" stroke-width="1"/>

        <!-- Loaded Cars Silhouettes (Top Deck) -->
        <!-- Car 1 Top Front (Angled) -->
        <g transform="rotate(-12 ${startX + 10} 22)">
          <path d="M${startX + 10} 22 L${startX + 16} 16 L${startX + 34} 16 L${startX + 42} 22 Z" fill="#38bdf8" fill-opacity="0.4" stroke="#38bdf8" stroke-width="0.8"/>
          <circle cx="${startX + 18}" cy="22" r="2" fill="#0f172a"/>
          <circle cx="${startX + 34}" cy="22" r="2" fill="#0f172a"/>
        </g>
        <!-- Car 2 Top Rear -->
        <g>
          <path d="M${startX + 90} 18 L${startX + 96} 12 L${startX + 114} 12 L${startX + 122} 18 Z" fill="#eab308" fill-opacity="0.4" stroke="#eab308" stroke-width="0.8"/>
          <circle cx="${startX + 98}" cy="18" r="2" fill="#0f172a"/>
          <circle cx="${startX + 114}" cy="18" r="2" fill="#0f172a"/>
        </g>
        <!-- Car 3 Top End -->
        <g>
          <path d="M${startX + 145} 18 L${startX + 151} 12 L${startX + 169} 12 L${startX + 177} 18 Z" fill="#ef4444" fill-opacity="0.4" stroke="#ef4444" stroke-width="0.8"/>
          <circle cx="${startX + 153}" cy="18" r="2" fill="#0f172a"/>
          <circle cx="${startX + 169}" cy="18" r="2" fill="#0f172a"/>
        </g>

        <!-- Loaded Cars Silhouettes (Bottom Deck) -->
        <!-- Car 4 Bottom Middle -->
        <g>
          <path d="M${startX + 55} 48 L${startX + 61} 42 L${startX + 79} 42 L${startX + 87} 48 Z" fill="#10b981" fill-opacity="0.4" stroke="#10b981" stroke-width="0.8"/>
          <circle cx="${startX + 63}" cy="48" r="2" fill="#0f172a"/>
          <circle cx="${startX + 79}" cy="48" r="2" fill="#0f172a"/>
        </g>
        <!-- Car 5 Bottom Rear -->
        <g>
          <path d="M${startX + 110} 48 L${startX + 116} 42 L${startX + 134} 42 L${startX + 142} 48 Z" fill="#6366f1" fill-opacity="0.4" stroke="#6366f1" stroke-width="0.8"/>
          <circle cx="${startX + 118}" cy="48" r="2" fill="#0f172a"/>
          <circle cx="${startX + 134}" cy="48" r="2" fill="#0f172a"/>
        </g>

        <!-- Rear Loading Ramps (Folded) -->
        <line x1="${endX}" y1="48" x2="${endX + 6}" y2="35" stroke="#64748b" stroke-width="2"/>
        <line x1="${endX}" y1="18" x2="${endX + 6}" y2="28" stroke="#64748b" stroke-width="1.5"/>

        ${undercarriage}
      `;

    case 'box':
    default:
      return `
        <!-- Dry Freight Box Van Trailer Body -->
        <rect x="${startX - 10}" y="14" width="${trailerLen + 10}" height="37" rx="2" fill="rgba(255,255,255,0.06)" stroke="${accentColor}" stroke-width="1.5"/>
        <line x1="${startX - 10}" y1="46" x2="${endX}" y2="46" stroke="#475569" stroke-width="0.8"/>
        <!-- Rear Barn Doors -->
        <line x1="${endX - 3}" y1="16" x2="${endX - 3}" y2="50" stroke="#cbd5e1" stroke-width="1.2"/>
        ${undercarriage}
      `;
  }
}
