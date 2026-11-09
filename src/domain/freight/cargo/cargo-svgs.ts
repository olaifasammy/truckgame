/**
 * NexHaul Logistics - Cargo & Freight Job Type Vector SVGs
 * Realistic, domain-authentic, multi-layered vector illustrations for every freight type in the simulation.
 * 
 * Following NexHaul Engineering Constitution Sections 1.1, 6.1, 6.4, and Frontend Design Constitution.
 */

export interface CargoSvgOptions {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * High-fidelity, hand-crafted SVG definitions for all cargo and contract job types.
 * Standardized on 32x32 viewBox for sharp rendering across mobile and desktop displays.
 */
export const CARGO_SVGS: Record<string, string> = {
  // 1. High-End Electronics (Palletized servers, microchips & circuit traces)
  electronics: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <rect x="5" y="5" width="22" height="22" rx="3" fill="#0c1729" stroke="#38bdf8" stroke-width="1.5"/>
      <rect x="10" y="10" width="12" height="12" rx="1.5" fill="#0369a1" stroke="#7dd3fc" stroke-width="1.2"/>
      <circle cx="16" cy="16" r="2.5" fill="#38bdf8"/>
      <!-- Trace pins -->
      <path d="M12 2v3M16 2v3M20 2v3M12 27v3M16 27v3M20 27v3M2 12h3M2 16h3M2 20h3M27 12h3M27 16h3M27 20h3" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="1" fill="#38bdf8"/>
      <circle cx="24" cy="8" r="1" fill="#38bdf8"/>
      <circle cx="8" cy="24" r="1" fill="#38bdf8"/>
      <circle cx="24" cy="24" r="1" fill="#38bdf8"/>
    </svg>
  `,

  // 2. Commercial Office Furniture (Executive modular desk & ergonomic task chair)
  furniture: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Desk top -->
      <path d="M3 13h26v2.5H3V13z" fill="#f59e0b"/>
      <!-- Desk frame & drawers -->
      <path d="M5 15.5v10.5h2v-9h18v9h2v-10.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="19" y="16" width="7" height="8" rx="1" fill="#1e293b" stroke="#f59e0b" stroke-width="1"/>
      <line x1="21" y1="18.5" x2="24" y2="18.5" stroke="#f59e0b" stroke-width="1" stroke-linecap="round"/>
      <line x1="21" y1="21.5" x2="24" y2="21.5" stroke="#f59e0b" stroke-width="1" stroke-linecap="round"/>
      <!-- Ergonomic chair back & seat -->
      <rect x="10" y="5" width="7" height="6" rx="2" fill="#d97706"/>
      <path d="M8.5 11h10v2h-10z" fill="#f59e0b"/>
    </svg>
  `,

  // 3. Apparel & Textiles (Fabric rolls & designer garment hanger)
  clothing: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Coat hanger -->
      <path d="M16 6a2 2 0 10-2 2c1.5 0 2 1 2 2l-9 4.5a1 1 0 00-.5.9v1.6h23V15.4a1 1 0 00-.5-.9L16 10" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Garment drape / folded textile bales -->
      <path d="M8 17h16l-1.5 9h-13L8 17z" fill="#581c87" stroke="#c084fc" stroke-width="1.4"/>
      <path d="M11 21h10M12 24h8" stroke="#e9d5ff" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="4" y="27" width="24" height="2.5" rx="1" fill="#7e22ce"/>
    </svg>
  `,

  // 4. Frozen Seafood (Deep ocean fish in insulated cryogenic cold-storage crate)
  frozen_fish: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Cold container -->
      <rect x="4" y="6" width="24" height="20" rx="3" fill="#082f49" stroke="#38bdf8" stroke-width="1.4"/>
      <!-- Ice frost lines -->
      <path d="M6 10h20M6 22h20" stroke="#0284c7" stroke-width="1" stroke-dasharray="2 2"/>
      <!-- Streamlined fish silhouette -->
      <path d="M7 16c3-3 8-4.5 13-3l5-3v12l-5-3c-5 1.5-10 0-13-3z" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="10" cy="15" r="1" fill="#ffffff"/>
      <!-- Snowflake frost emblem -->
      <path d="M22 8l2 2m0-2l-2 2M22 22l2 2m0-2l-2 2" stroke="#bae6fd" stroke-width="1" stroke-linecap="round"/>
    </svg>
  `,

  // 5. Medical Supplies & Vaccines (Cryogenic cold-chain vial with cross & thermal seal)
  vaccines: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Shield backdrop -->
      <path d="M16 3l11 4v9c0 6-4.5 11.5-11 13C9.5 27.5 5 22 5 16V7l11-4z" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
      <!-- Medical cross -->
      <path d="M13.5 11h5v3.5H22v5h-3.5V23h-5v-3.5H10v-5h3.5V11z" fill="#10b981" stroke="#a7f3d0" stroke-width="1"/>
      <!-- Vaccine liquid level indicator -->
      <line x1="12" y1="16" x2="20" y2="16" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,

  // 6. Fresh Vegetables & Agricultural Produce (Wooden farm harvest crate with carrots & greens)
  produce: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Wooden slatted crate -->
      <path d="M4 14h24v13a2 2 0 01-2 2H6a2 2 0 01-2-2V14z" fill="#3f2e18" stroke="#a16207" stroke-width="1.5"/>
      <line x1="4" y1="18" x2="28" y2="18" stroke="#ca8a04" stroke-width="1.2"/>
      <line x1="4" y1="23" x2="28" y2="23" stroke="#ca8a04" stroke-width="1.2"/>
      <line x1="10" y1="14" x2="10" y2="29" stroke="#713f12" stroke-width="1.2"/>
      <line x1="22" y1="14" x2="22" y2="29" stroke="#713f12" stroke-width="1.2"/>
      <!-- Fresh produce tops (leafy greens & carrots) -->
      <circle cx="10" cy="11" r="3.5" fill="#22c55e"/>
      <circle cx="16" cy="9" r="4" fill="#16a34a"/>
      <circle cx="22" cy="11" r="3.5" fill="#4ade80"/>
      <!-- Carrots peaking out -->
      <path d="M14 12l2 4 2-4" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 7. Heavy Excavator / Caterpillar 320 (Tracked hydraulic excavator with boom, arm, and bucket)
  excavator: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Continuous crawler tracks -->
      <rect x="4" y="22" width="20" height="6" rx="3" fill="#18181b" stroke="#71717a" stroke-width="1.4"/>
      <circle cx="7" cy="25" r="1.5" fill="#a1a1aa"/>
      <circle cx="11" cy="25" r="1.5" fill="#a1a1aa"/>
      <circle cx="15" cy="25" r="1.5" fill="#a1a1aa"/>
      <circle cx="19" cy="25" r="1.5" fill="#a1a1aa"/>
      <line x1="5" y1="25" x2="21" y2="25" stroke="#52525b" stroke-width="1"/>
      <!-- Rotating superstructure & cab -->
      <path d="M6 16h10v6H6z" fill="#ca8a04"/>
      <path d="M8 12h7l2 4v6H8v-10z" fill="#eab308" stroke="#713f12" stroke-width="1"/>
      <rect x="10" y="13.5" width="4" height="4" rx="0.5" fill="#0284c7"/>
      <!-- Hydraulic articulated boom and bucket -->
      <path d="M15 17L21 8l5 6-3 4" stroke="#ca8a04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M23 18l3 2-2 3-3-2z" fill="#52525b" stroke="#27272a" stroke-width="1"/>
    </svg>
  `,

  // 8. Structural Steel & Industrial Pipes (Heavy steel I-beams & strapped tubular cylinders)
  steel_pipes: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Strapped cylindrical pipes in triangle stack -->
      <!-- Bottom row -->
      <circle cx="9" cy="20" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="9" cy="20" r="2.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="16" cy="20" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="16" cy="20" r="2.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="23" cy="20" r="4.5" fill="#334155" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="23" cy="20" r="2.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <!-- Top row -->
      <circle cx="12.5" cy="12" r="4.5" fill="#475569" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="12.5" cy="12" r="2.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="19.5" cy="12" r="4.5" fill="#475569" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="19.5" cy="12" r="2.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <!-- High-tensile steel tie-down bands -->
      <path d="M4 25L13 7l15 18" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="2 1"/>
    </svg>
  `,

  // 9. Massive Wind Turbine Blade (Aerodynamic airfoil blade secured on transport cradles)
  wind_blade: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Lowboy transport bolsters / support frames -->
      <rect x="4" y="21" width="5" height="6" rx="1" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
      <rect x="23" y="21" width="5" height="6" rx="1" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
      <!-- Long aerodynamic turbine blade profile -->
      <path d="M3 20c8-4 18-9 26-11-2 4-10 11-26 13v-2z" fill="#0284c7" stroke="#38bdf8" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Flange root circle -->
      <ellipse cx="4.5" cy="21" rx="1.5" ry="2" fill="#0369a1" stroke="#bae6fd" stroke-width="1"/>
      <path d="M9 18l1.5-2M18 14.5l1.5-2" stroke="#bae6fd" stroke-width="1" stroke-linecap="round"/>
    </svg>
  `,

  // 10. Premium Petroleum Gasoline (ADR Class 3 Tanker with flammable hazard placard)
  gasoline: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Cylindrical liquid tanker body -->
      <rect x="3" y="10" width="22" height="13" rx="6.5" fill="#450a0a" stroke="#f87171" stroke-width="1.5"/>
      <ellipse cx="6" cy="16.5" rx="2" ry="5.5" fill="#7f1d1d" stroke="#fca5a5" stroke-width="1"/>
      <!-- Top manhole hatches -->
      <rect x="10" y="8" width="4" height="2" rx="0.5" fill="#991b1b"/>
      <rect x="17" y="8" width="4" height="2" rx="0.5" fill="#991b1b"/>
      <!-- ADR Class 3 Diamond Placard -->
      <g transform="translate(19, 13) rotate(45)">
        <rect x="0" y="0" width="8" height="8" rx="1" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/>
      </g>
      <!-- Flame icon inside placard -->
      <path d="M23 15.5c-.5-.8-1-1.2-1-2 .8 0 1.5.8 1.5 2z" fill="#ffffff"/>
      <path d="M5 26h22" stroke="#71717a" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  // 11. Cryogenic Liquid Oxygen (High-pressure insulated vacuum vessel with vapor frost)
  liquid_oxy: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- High pressure bullet vessel -->
      <rect x="5" y="10" width="22" height="12" rx="6" fill="#082f49" stroke="#38bdf8" stroke-width="1.5"/>
      <!-- Cooling rings -->
      <line x1="12" y1="10" x2="12" y2="22" stroke="#0284c7" stroke-width="1.2"/>
      <line x1="16" y1="10" x2="16" y2="22" stroke="#0284c7" stroke-width="1.2"/>
      <line x1="20" y1="10" x2="20" y2="22" stroke="#0284c7" stroke-width="1.2"/>
      <!-- Pressure relief valve -->
      <rect x="14" y="6" width="4" height="4" rx="1" fill="#0284c7" stroke="#7dd3fc" stroke-width="1"/>
      <path d="M16 6V4M14 4h4" stroke="#7dd3fc" stroke-width="1" stroke-linecap="round"/>
      <!-- Frost cryo plumes -->
      <path d="M23 8c1-1 3-1 4 0M25 6v3" stroke="#bae6fd" stroke-width="1" stroke-linecap="round"/>
    </svg>
  `,

  // 12. Industrial Hazardous Chemical Waste (Corrosive toxic drum with warning placard)
  toxic_waste: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Chemical drum -->
      <rect x="7" y="6" width="18" height="21" rx="2" fill="#14532d" stroke="#84cc16" stroke-width="1.5"/>
      <!-- Reinforcing drum ribs -->
      <line x1="7" y1="11" x2="25" y2="11" stroke="#84cc16" stroke-width="1.2"/>
      <line x1="7" y1="16" x2="25" y2="16" stroke="#84cc16" stroke-width="1.2"/>
      <line x1="7" y1="21" x2="25" y2="21" stroke="#84cc16" stroke-width="1.2"/>
      <!-- Biohazard / Toxic Skull Warning Glyph -->
      <circle cx="16" cy="16" r="3.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
      <circle cx="15" cy="15" r="0.8" fill="#000000"/>
      <circle cx="17" cy="15" r="0.8" fill="#000000"/>
      <path d="M15 17.5h2" stroke="#000000" stroke-width="0.8" stroke-linecap="round"/>
    </svg>
  `,

  // 13. Quarry Granite & Crushed Gravel (Faceted aggregate pile in heavy dump tipper)
  aggregate_gravel: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Tipper dump bed outline -->
      <path d="M4 21l2 6h20l2-6H4z" fill="#27272a" stroke="#71717a" stroke-width="1.5"/>
      <!-- Mounded pile of crushed faceted rocks -->
      <path d="M5 21L12 11l4 2 5-5 7 13H5z" fill="#52525b" stroke="#a1a1aa" stroke-width="1.4"/>
      <!-- Facet cut lines -->
      <path d="M12 11l3 7M16 13l2 8M21 8l1 9M8 18l4-2" stroke="#71717a" stroke-width="1"/>
      <circle cx="10" cy="23" r="1.5" fill="#a1a1aa"/>
      <circle cx="17" cy="23" r="2" fill="#d4d4d8"/>
      <circle cx="23" cy="23" r="1.5" fill="#a1a1aa"/>
    </svg>
  `,

  // 14. Raw Bauxite & Mineral Ore (Faceted crystalline metallic ore chunks)
  mined_bauxite: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Large faceted geological ore cluster -->
      <path d="M7 23l4-12 9-3 6 7-3 10-10 2L7 23z" fill="#7c2d12" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Internal crystalline facet edges -->
      <path d="M11 11l9 4-4 9-5-13z" fill="#9a3412" stroke="#fb923c" stroke-width="1.2"/>
      <path d="M20 8l-4 7 7 2" stroke="#fdba74" stroke-width="1"/>
      <path d="M7 23l9-8" stroke="#fdba74" stroke-width="1"/>
    </svg>
  `,

  // 15. FMCG Retail Freight LCV (Double trailer linehaul road train with packaged goods)
  consumer_lcv: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Lead trailer box -->
      <rect x="2" y="9" width="13" height="13" rx="1.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.4"/>
      <circle cx="5" cy="24" r="2" fill="#38bdf8"/>
      <circle cx="11" cy="24" r="2" fill="#38bdf8"/>
      <!-- Dolly converter hitch -->
      <line x1="15" y1="18" x2="17" y2="18" stroke="#f59e0b" stroke-width="1.5"/>
      <!-- Pup trailer box -->
      <rect x="17" y="9" width="13" height="13" rx="1.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.4"/>
      <circle cx="21" cy="24" r="2" fill="#38bdf8"/>
      <circle cx="27" cy="24" r="2" fill="#38bdf8"/>
      <!-- Retail barcode badge -->
      <line x1="5" y1="14" x2="5" y2="18" stroke="#ffffff" stroke-width="1"/>
      <line x1="7" y1="14" x2="7" y2="18" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="10" y1="14" x2="10" y2="18" stroke="#ffffff" stroke-width="1"/>
      <line x1="20" y1="14" x2="20" y2="18" stroke="#ffffff" stroke-width="1"/>
      <line x1="23" y1="14" x2="23" y2="18" stroke="#ffffff" stroke-width="1.5"/>
    </svg>
  `,

  // 16. Intermodal 40ft Maritime Container (Corrugated ISO container with twist-lock corner castings)
  intermodal_box: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Container frame -->
      <rect x="3" y="9" width="26" height="15" rx="1.5" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
      <!-- Vertical corrugated ribs -->
      <line x1="7" y1="11" x2="7" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="10" y1="11" x2="10" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="13" y1="11" x2="13" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="16" y1="11" x2="16" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="19" y1="11" x2="19" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="22" y1="11" x2="22" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <line x1="25" y1="11" x2="25" y2="22" stroke="#60a5fa" stroke-width="1.2"/>
      <!-- Corner casting twistlocks -->
      <rect x="3.5" y="9.5" width="2.5" height="2.5" fill="#ffffff"/>
      <rect x="26" y="9.5" width="2.5" height="2.5" fill="#ffffff"/>
      <rect x="3.5" y="21" width="2.5" height="2.5" fill="#ffffff"/>
      <rect x="26" y="21" width="2.5" height="2.5" fill="#ffffff"/>
    </svg>
  `,

  // 17. 45-Tonne Electrical Substation Transformer (Heavy transformer core with porcelain radiator bushings)
  heavy_transformer: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Main heavy tank core -->
      <rect x="6" y="12" width="20" height="15" rx="2" fill="#18181b" stroke="#f59e0b" stroke-width="1.5"/>
      <!-- Cooling radiator fins -->
      <line x1="9" y1="14" x2="9" y2="25" stroke="#eab308" stroke-width="1.2"/>
      <line x1="12" y1="14" x2="12" y2="25" stroke="#eab308" stroke-width="1.2"/>
      <line x1="20" y1="14" x2="20" y2="25" stroke="#eab308" stroke-width="1.2"/>
      <line x1="23" y1="14" x2="23" y2="25" stroke="#eab308" stroke-width="1.2"/>
      <!-- High-voltage porcelain insulator bushings -->
      <path d="M10 12V6M16 12V4M22 12V6" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="10" cy="5" r="1.5" fill="#fef08a"/>
      <circle cx="16" cy="3.5" r="1.8" fill="#fef08a"/>
      <circle cx="22" cy="5" r="1.5" fill="#fef08a"/>
      <!-- High voltage lightning bolt -->
      <path d="M17 16l-3 4h3l-1 4 4-5h-3z" fill="#f59e0b"/>
    </svg>
  `,

  // 18. Aerospace Turbofan Jet Engine (Engine nacelle with concentric titanium fan blades in transport rig)
  aerospace_turbine: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Transport ground cradle -->
      <path d="M4 27h24M8 24v3M24 24v3" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Outer titanium nacelle cowl -->
      <circle cx="16" cy="15" r="10.5" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5"/>
      <!-- Spinner cone center -->
      <circle cx="16" cy="15" r="3" fill="#3b82f6" stroke="#93c5fd" stroke-width="1"/>
      <path d="M16 13.5a1.5 1.5 0 011.5 1.5c0 .8-.7 1.5-1.5 1.5" stroke="#ffffff" stroke-width="0.8"/>
      <!-- Concentric curved titanium fan blades -->
      <path d="M16 4.5v7.5M16 18v7.5M5.5 15H13M19 15h7.5M8.5 7.5L14 13M18 17l5.5 5.5M7.5 22.5L13 17M19 13l5.5-5.5" stroke="#93c5fd" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,

  // 19. Solid-State Battery Modules (Modular high-density battery cell stack with gold contacts)
  lithium_packs: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Battery module enclosure -->
      <rect x="5" y="8" width="22" height="18" rx="2" fill="#064e3b" stroke="#22c55e" stroke-width="1.5"/>
      <!-- Dual battery terminals (+ / -) -->
      <rect x="8" y="5" width="4" height="3" rx="1" fill="#f59e0b"/>
      <rect x="20" y="5" width="4" height="3" rx="1" fill="#94a3b8"/>
      <!-- Internal prism cell partitions -->
      <line x1="12" y1="8" x2="12" y2="26" stroke="#16a34a" stroke-width="1"/>
      <line x1="16" y1="8" x2="16" y2="26" stroke="#16a34a" stroke-width="1"/>
      <line x1="20" y1="8" x2="20" y2="26" stroke="#16a34a" stroke-width="1"/>
      <!-- High energy voltage charge symbol -->
      <path d="M17 12l-3 4h3l-1 5 4-6h-3z" fill="#22c55e" stroke="#86efac" stroke-width="0.5"/>
      <text x="8.5" y="14" fill="#f59e0b" font-size="5" font-weight="bold">+</text>
      <text x="21" y="14" fill="#94a3b8" font-size="5" font-weight="bold">-</text>
    </svg>
  `,

  // 20. Central Bank Gold Bullion Vault (Pyramid of 999.9 pure gold ingots in armored transport)
  bullion_vault: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Armored security palette base -->
      <rect x="3" y="24" width="26" height="3" rx="1" fill="#451a03" stroke="#78350f" stroke-width="1"/>
      <!-- Bottom tier gold bars (trapezoids) -->
      <path d="M4 24l2-6h8l2 6H4z" fill="#f59e0b" stroke="#fde047" stroke-width="1"/>
      <path d="M16 24l2-6h8l2 6H16z" fill="#f59e0b" stroke="#fde047" stroke-width="1"/>
      <!-- Top tier gold bar -->
      <path d="M10 18l2-6h8l2 6H10z" fill="#fbbf24" stroke="#fef08a" stroke-width="1.2"/>
      <!-- 999.9 Purity stamp lines -->
      <line x1="13" y1="15" x2="19" y2="15" stroke="#b45309" stroke-width="1" stroke-linecap="round"/>
      <circle cx="16" cy="14" r="0.8" fill="#b45309"/>
      <!-- Sparkle gleam -->
      <path d="M24 10l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fef08a"/>
    </svg>
  `,

  // 21. Cryogenic Quantum Mainframe (Cylindrical dilution refrigerator chandelier with gold plating)
  quantum_mainframe: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Top cryogenic mounting stage -->
      <rect x="6" y="4" width="20" height="3" rx="1" fill="#7e22ce" stroke="#c084fc" stroke-width="1"/>
      <!-- Hanging gold cooling stages -->
      <rect x="8" y="10" width="16" height="2" fill="#fbbf24"/>
      <rect x="10" y="16" width="12" height="2" fill="#fbbf24"/>
      <rect x="12" y="22" width="8" height="2" fill="#fbbf24"/>
      <!-- Vertical coaxial signal lines -->
      <line x1="9" y1="7" x2="9" y2="24" stroke="#a855f7" stroke-width="1"/>
      <line x1="14" y1="7" x2="14" y2="26" stroke="#c084fc" stroke-width="1.2"/>
      <line x1="18" y1="7" x2="18" y2="26" stroke="#c084fc" stroke-width="1.2"/>
      <line x1="23" y1="7" x2="23" y2="24" stroke="#a855f7" stroke-width="1"/>
      <!-- Quantum processor core chip -->
      <rect x="13.5" y="25" width="5" height="5" rx="1" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>
      <circle cx="16" cy="27.5" r="1" fill="#ffffff"/>
    </svg>
  `,

  // 22. Radiopharmaceutical Nuclear Isotopes (Heavy lead transport cask with trefoil radiation hazard)
  nuclear_isotopes: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Heavy lead shielded cask -->
      <path d="M8 8h16l2 18H6L8 8z" fill="#1f2937" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="6" y="5" width="20" height="3" rx="1.5" fill="#374151" stroke="#f59e0b" stroke-width="1"/>
      <rect x="12" y="2" width="8" height="3" rx="1" fill="#4b5563"/>
      <!-- Radiation Trefoil Emblem -->
      <circle cx="16" cy="18" r="6" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
      <circle cx="16" cy="18" r="1.5" fill="#000000"/>
      <!-- 3 Trefoil blades -->
      <path d="M16 16.5L14 13h4zM14.5 19L11 21l1-3.5zM17.5 19l3.5 2-1-3.5z" fill="#000000"/>
    </svg>
  `,

  // 23. Secured Charter Contract Won (Official green/gold transport seal with ribbon)
  auction_won: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Certificate ribbon tails -->
      <path d="M12 20l-4 9 8-3 8 3-4-9" fill="#15803d" stroke="#22c55e" stroke-width="1.2"/>
      <!-- Circular official contract medallion -->
      <circle cx="16" cy="14" r="10" fill="#052e16" stroke="#22c55e" stroke-width="1.5"/>
      <circle cx="16" cy="14" r="8" stroke="#16a34a" stroke-dasharray="2 2" stroke-width="1"/>
      <!-- Checkmark of charter fulfillment -->
      <path d="M11 14.5l3.5 3.5 7-7" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // 24. Multi-Load Dedicated Corporate Tender (Linehaul corporate contract portfolio)
  corporate_tender: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Corporate linehaul clipboard -->
      <rect x="6" y="5" width="20" height="23" rx="2.5" fill="#0c1a30" stroke="#38bdf8" stroke-width="1.5"/>
      <!-- Top binding clip -->
      <rect x="11" y="3" width="10" height="4" rx="1.5" fill="#0284c7" stroke="#7dd3fc" stroke-width="1"/>
      <!-- Contract text line manifests -->
      <line x1="10" y1="12" x2="22" y2="12" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="10" y1="16" x2="19" y2="16" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="10" y1="20" x2="22" y2="20" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Transport seal badge -->
      <circle cx="21" cy="22" r="3.5" fill="#0369a1" stroke="#38bdf8" stroke-width="1"/>
      <path d="M19.5 22l1 1 2-2" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
    </svg>
  `,

  // 25. General Freight (Standard palletized commercial shipping crate with steel banding)
  general_freight: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="cargo-svg">
      <!-- Heavy wooden EUR pallet base -->
      <rect x="3" y="24" width="26" height="3" rx="1" fill="#451a03" stroke="#78350f" stroke-width="1.2"/>
      <rect x="6" y="27" width="4" height="2" fill="#78350f"/>
      <rect x="14" y="27" width="4" height="2" fill="#78350f"/>
      <rect x="22" y="27" width="4" height="2" fill="#78350f"/>
      <!-- Corrugated shipping container box -->
      <rect x="5" y="7" width="22" height="17" rx="1.5" fill="#1e293b" stroke="#f59e0b" stroke-width="1.4"/>
      <!-- Steel packing bands -->
      <line x1="12" y1="7" x2="12" y2="24" stroke="#94a3b8" stroke-width="1.2"/>
      <line x1="20" y1="7" x2="20" y2="24" stroke="#94a3b8" stroke-width="1.2"/>
      <line x1="5" y1="15" x2="27" y2="15" stroke="#94a3b8" stroke-width="1.2"/>
      <!-- Shipping fragile glass stamp -->
      <path d="M15 10v2a1 1 0 001 1h0a1 1 0 001-1v-2h-2z" fill="#f59e0b"/>
      <line x1="16" y1="13" x2="16" y2="14" stroke="#f59e0b" stroke-width="1"/>
    </svg>
  `
};

/**
 * Returns raw standalone SVG markup for a given cargo ID or job classification.
 */
export function getCargoSvg(cargoIdOrType: string, options?: CargoSvgOptions): string {
  const normalized = (cargoIdOrType || '').toLowerCase().trim();
  const rawSvg = CARGO_SVGS[normalized] || CARGO_SVGS['general_freight'];
  
  const size = options?.size || 24;
  const className = options?.className || 'cargo-icon-svg';

  // Inject width, height and classes smoothly
  return rawSvg
    .replace('<svg ', `<svg width="${size}" height="${size}" class="${className}" style="display:block; flex-shrink:0;" `);
}

/**
 * Renders a full luxury transport badge tile for job cards, auctions, and telemetry.
 */
export function renderCargoBadge(
  cargoIdOrType: string, 
  options?: { 
    size?: number; 
    isAuctionWon?: boolean; 
    isTender?: boolean; 
    isHazmat?: boolean;
    trailer?: string;
  }
): string {
  const size = options?.size || 38;
  const isAuctionWon = !!options?.isAuctionWon;
  const isTender = !!options?.isTender;

  // Resolve SVG key
  let svgKey = cargoIdOrType || 'general_freight';
  if (isAuctionWon) svgKey = 'auction_won';
  else if (isTender) svgKey = 'corporate_tender';

  const borderColor = isAuctionWon 
    ? 'var(--grn)' 
    : isTender 
    ? '#38bdf8' 
    : 'rgba(193,154,91,0.35)';

  const glowShadow = isAuctionWon
    ? '0 2px 10px rgba(34,197,94,0.2)'
    : isTender
    ? '0 2px 10px rgba(56,189,248,0.2)'
    : '0 2px 8px rgba(0,0,0,0.4)';

  const innerSvgSize = Math.round(size * 0.65);

  return `
    <div class="cargo-badge-tile" style="width:${size}px; height:${size}px; background:radial-gradient(circle at 50% 30%, #151d30 0%, #080c16 100%); border:1px solid ${borderColor}; border-radius:8px; display:grid; place-items:center; flex-shrink:0; box-shadow:${glowShadow}; position:relative;">
      ${getCargoSvg(svgKey, { size: innerSvgSize })}
    </div>
  `;
}
