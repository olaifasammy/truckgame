# NexHaul Physics Overhaul: Implementation Roadmap

## Status: APPROVED
**Target:** Transition from Timer-Based to Distance/Physics-Based Simulation.

---

### Phase 1: The "Physics & Mechanical" Foundation (IN PROGRESS)
**Goal:** Create the stateless brain for performance calculations.
- [ ] Create `src/domain/simulation/physics.ts` to house the core formulas.
- [ ] Implement `calculateEffectiveTopSpeed(truck, cargoWeight, terrain)` logic.
- [ ] Link `engineHealth` and `tireHealth` to performance caps (Limp Mode).
- [ ] Implement Torque/Weight acceleration curves.

### Phase 2: The "Human & Environmental" Layer
**Goal:** Inject world factors and driver behavior.
- [ ] Implement Driver Traits: `Speed Demon`, `Eco-Driver`, `Careful`.
- [ ] Map Weather conditions to Traction and Friction coefficients.
- [ ] Link `driver.fatigue` to speed stability and focus.
- [ ] Define Road Surface impact (Asphalt vs. Unpaved).

### Phase 3: The "Odometer-Based" Heartbeat
**Goal:** The state shift from Timer to Distance.
- [ ] Migrate `ActiveJob` schema: Replace `start/end` timestamps with `kmTravelled/totalKm`.
- [ ] Update `simulation/engine.ts` to accumulate distance per tick: `kmTravelled += speed * dt`.
- [ ] Implement "Lively ETA": UI projections based on `remainingDistance / currentSpeed`.
- [ ] Hook Fuel/Wear burn rates to the instantaneous physical load.

### Phase 4: High-Fidelity Catch-Up (Offline Engine)
**Goal:** Realistic progression during player absence.
- [ ] Implement "Time Slicing": Replay offline time in 10-minute segments.
- [ ] Apply changing conditions (fatigue/weather) across slices during catch-up.
- [ ] Deterministic result generation for revenue, fuel, and wear after long absences.

---
*Plan saved to `.pi/plans/physics_overhaul.md` (conceptually) and in memory.*
