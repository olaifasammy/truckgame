# Sam Logistics — Ultra-Realism & Modular Architecture Guidelines

## Core Development Rules
1. **Zero Stubs / Zero Placeholders:** Every feature, calculation, view, and system must be fully implemented with real logic, physics, and data. No "coming soon" or dummy states.
2. **Anti-God-File Principle:** No monolithic files. Every domain, subsystem, and sub-view must reside in its own dedicated, single-responsibility module and be imported cleanly.
3. **Strict Modularity:** Code is organized by domain business logic under `src/domain/` and UI under `src/views/` & `src/components/`, ensuring clear separation of concerns.
4. **Ultra-Realism:** Economic, physical, mechanical, and logistical systems (fuel consumption, part wear, driver fatigue/skill, depreciation, route topography, cargo compatibility) must mirror real-world trucking operations.
5. **Type Safety & Build Integrity:** 100% TypeScript (`.ts`), enforcing strict compilation and zero build errors (`npm run build`).
