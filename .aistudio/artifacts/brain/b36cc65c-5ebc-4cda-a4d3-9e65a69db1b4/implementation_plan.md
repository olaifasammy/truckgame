# Implementation Plan: Authentic Vector SVGs for Job Types

## Overview
Replaced all generic icons and wireframes with 25 authentic, multi-layer vector SVGs covering every cargo and contract classification across NexHaul Logistics.

## 1. Vector SVG Artistry (`src/domain/freight/cargo/cargo-svgs.ts`)
- **Dry Freight & Consumer Goods**:
  - `electronics`: Server blades with LED status lights and PCB copper traces.
  - `furniture`: Solid hardwood credenza / executive desk with brass pulls.
  - `clothing`: Textile rolls & palletized garments with fabric weave patterns.
  - `general_freight`: Reinforced wooden intermodal cargo crate with steel corner brackets.
- **Cold Chain (Reefer)**:
  - `frozen_fish`: Cryogenic seafood container with ice crystal lattices.
  - `vaccines`: Clinical temperature-monitored pharmaceutical vial inside cold-storage chamber.
  - `produce`: Farm-fresh agro crate with leaves and temperature badge.
- **Heavy Machinery & Industrial (Flatbed / Lowboy)**:
  - `excavator`: Tracked heavy-duty excavator with hydraulic arm and tooth bucket.
  - `steel_pipes`: Heavy industrial bundled steel tubes with strapping bands.
  - `wind_blade`: Aerodynamic composite wind turbine rotor blade with transit mount.
  - `heavy_transformer`: High-voltage electrical substation transformer with cooling radiators.
  - `aerospace_turbine`: Commercial jet airliner turbofan engine nacelle on transport cradle.
- **Hazmat & Tanker (ADR)**:
  - `gasoline`: Flammable petroleum tanker trailer with hazmat placard 1203.
  - `liquid_oxy`: Cryogenic liquid oxygen pressurized vessel with frost/insulation bands.
  - `toxic_waste`: Industrial biohazard drum with radioactive / toxic symbol and warning stripes.
  - `nuclear_isotopes`: Reinforced class-7 radioactive containment flask with radiation warning insignia.
- **Bulk Aggregates & Tipper**:
  - `aggregate_gravel`: Reinforced heavy-duty quarry tipper loaded with crushed aggregate.
  - `mined_bauxite`: Aluminum ore hopper with raw mineral rocks.
- **Multi-Trailer & Containers**:
  - `consumer_lcv`: Double-trailer road-train (LCV) configuration.
  - `intermodal_box`: Standard ISO shipping container with corrugated steel ribs and corner twist-locks.
- **High-Value Specialized & Auction Contracts**:
  - `lithium_packs`: High-energy EV battery module with electrical terminals.
  - `bullion_vault`: Stack of heavy 999.9 fine gold bars stamped with mint seals.
  - `quantum_mainframe`: Cryogenic dilution refrigerator quantum computing tower.
  - `auction_won`: Gavel of victory with gold laurel wreath badge.
  - `corporate_tender`: Official wax-sealed logistics charter parchment.

## 2. UI Integration
- **Marketplace Job Cards** (`src/views/home/job-card.ts`): 38px multi-layer badge for available contracts and expanded details.
- **Auction Bidding Cards** (`src/views/home/auction-card.ts`): 28px specialized vector badge on live tender cards.
- **Auction Bidding Room Modal** (`src/views/home/auction-modal.ts`): 44px prominent glowing badge on tender header.
- **Garage Truck Assignment** (`src/views/garage/job-selector.ts`): 34px cargo badge replacing the previous wireframe icon.
- **Dispatch Tractor Selector** (`src/views/home/truck-selector.ts`): 44px cargo badge in modal dispatch header.
- **AI Dispatch Market Bulletin** (`src/views/dispatch.ts`): 28px cargo badge alongside neural fit percentage.
- **Fleet Transit Overview** (`src/views/company.ts`): 30px cargo badge on active fleet dispatches in transit.

## 3. Compliance & Line Counts
- All files strictly adhere to `RULE[AGENTS_md]` (under 1,200 physical lines each).
- Clean TypeScript compilation verified via `compile_applet`.
