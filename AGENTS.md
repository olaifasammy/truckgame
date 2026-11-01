# NexHaul Logistics — Engineering Constitution
Version: 2.0
Scope: Entire repository
Audience: AI agents, human developers, reviewers, and automated coding tools.

---

# 1. MISSION AND ENGINEERING STANDARD

NexHaul is a realistic, progressive trucking, freight, and logistics
management simulation.

Every change MUST preserve architectural integrity, gameplay consistency,
economic correctness, type safety, and maintainability.

The objective is not merely to make the application work.
The objective is to build a complete, coherent, modular logistics simulation.

These rules apply to all new code, modifications, refactors, and integrations.

## 1.1 Mandatory Principles

1. No fabricated functionality.
2. No placeholder implementations.
3. No silent failure.
4. No unnecessary architectural duplication.
5. No monolithic modules.
6. No business logic embedded in presentation components.
7. No unexplained magic numbers.
8. No unvalidated external data.
9. No unverified completion claims.
10. No changes that bypass established domain rules.

Existing functionality MUST be preserved unless its replacement is explicitly
required by the task.

When a requirement cannot be implemented correctly with available information,
inspect the existing architecture and identify the missing requirements before
making assumptions.

Never invent project requirements, silently change gameplay rules, or replace
existing implementations with simplified substitutes.

---

# 2. ABSOLUTE FILE SIZE LIMIT

NO SOURCE FILE MAY EXCEED 1,200 LINES.

This is a hard architectural limit, not a stylistic recommendation.

Applies to:
- TypeScript and TSX
- JavaScript and JSX
- CSS and other source files
- Tests
- Configuration modules containing application logic

For this rule, count physical lines, including blank lines and comments.

Generated files, dependency directories, build artifacts, and vendored code
are excluded from this source-file limit.

## 2.1 Proactive Enforcement

Before modifying a file, inspect its current size.

If the proposed changes could push it beyond 1,200 lines:

1. Identify the responsibilities that should be separated.
2. Create appropriate dedicated modules.
3. Extract cohesive logic into those modules.
4. Update imports and exports.
5. Preserve existing behavior.
6. Verify the affected functionality.
7. Confirm that every resulting source file is below the limit.

Do not wait until a file exceeds the limit before addressing its structure.

## 2.2 File Size Does Not Define Good Modularity

A file with 1,100 lines can still violate the architecture if it contains
multiple unrelated responsibilities.

Prefer modules with one clear purpose.

Use substantially smaller modules whenever that improves cohesion,
testability, readability, or independent changeability.

Do not split files mechanically just to satisfy a line count.

## 2.3 Oversized Existing Files

If an existing file already exceeds the limit:

- Do not make the problem worse.
- Do not perform an unrelated, risky rewrite.
- Extract the smallest cohesive responsibility necessary to reduce its size.
- Preserve public interfaces and runtime behavior.
- Run the relevant validation commands.

If the task cannot safely bring the file below the limit, report the remaining
violation explicitly. Never claim that the repository is compliant when it is not.

## 2.4 Continuous Enforcement

Every completed task MUST include a source-file line-count check.

The repository SHOULD have an automated check that fails when a non-exempt
source file exceeds 1,200 lines.

Documentation and generated output may use separate policies.

---

# 3. MODULAR ARCHITECTURE

Architecture is organized around domain responsibilities, not screen size
or the convenience of the developer.

Separate business rules, state management, infrastructure, and presentation.

## 3.1 Target Architecture

src/
├── app/
│   ├── App.tsx
│   ├── providers/
│   ├── routing/
│   └── bootstrap/
│
├── domain/
│   ├── auth/
│   ├── company/
│   ├── geography/
│   ├── hubs/
│   ├── terminals/
│   ├── routes/
│   ├── fleet/
│   ├── vehicles/
│   ├── trailers/
│   ├── drivers/
│   ├── freight/
│   ├── contracts/
│   ├── dispatch/
│   ├── simulation/
│   ├── economy/
│   ├── finance/
│   ├── maintenance/
│   ├── weather/
│   ├── competitors/
│   └── progression/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── workflows/
│   └── services/
│
├── infrastructure/
│   ├── persistence/
│   ├── external-apis/
│   ├── telemetry/
│   └── adapters/
│
├── views/
│   ├── dashboard/
│   ├── fleet/
│   ├── freight/
│   ├── routes/
│   ├── hubs/
│   ├── finance/
│   └── maintenance/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── hooks/
├── types/
├── utils/
└── test/

This is the target architecture, not permission to reorganize the entire
repository without a task-specific reason.

Inspect the existing repository before creating, moving, or renaming files.
Reuse established modules when they already satisfy the required responsibility.

Migrate incrementally, preserving compatibility with existing saves,
imports, application behavior, and user workflows.

## 3.2 Domain Responsibilities

Each domain owns its business rules, types, validation, and calculations.

Examples:

- geography: countries, regions, cities, coordinates, geographic relationships
- hubs: ownership, unlocking, purchasing, capacity, and hub progression
- terminals: repair facilities, fuel facilities, warehouses, and staffing
- routes: connectivity, distance, road characteristics, tolls, and restrictions
- vehicles: specifications, fuel consumption, wear, depreciation, and capability
- drivers: qualifications, fatigue, rest, skill, and employment
- freight: cargo properties, handling requirements, compatibility, and weight
- contracts: market supply, demand, pricing, eligibility, and lifecycle
- dispatch: assignment, departure validation, travel, delivery, and return
- maintenance: component condition, repair costs, and service requirements
- economy: operating costs, market prices, revenue, and profitability

A domain MUST NOT depend on React components or UI-specific modules.

## 3.3 Application Layer

The application layer coordinates domain operations into complete workflows.

Examples:

- registering a company
- starting a new game
- purchasing a hub
- activating a route
- purchasing a vehicle
- assigning a driver
- accepting a contract
- dispatching a truck
- completing a delivery

Application services coordinate operations but MUST NOT duplicate domain
calculations.

## 3.4 Presentation Layer

Views and components are responsible for presentation and user interaction.

They MAY:
- render domain and application state
- collect user input
- display validation errors
- trigger application commands
- present loading, success, and failure states

They MUST NOT independently calculate authoritative:
- contract eligibility
- vehicle operating costs
- route profitability
- fuel consumption
- vehicle wear
- driver fatigue
- financial transactions
- dispatch legality

Move such calculations into their responsible domain modules.

## 3.5 Dependency Direction

Use this dependency direction:

Presentation → Application → Domain
Infrastructure → Application/Domain interfaces

The domain MUST remain independent of React, browser storage, HTTP clients,
UI components, and external service implementations.

Avoid circular dependencies.

Share contracts through explicit types and interfaces rather than importing
internal implementation details across unrelated domains.

---

# 4. SINGLE RESPONSIBILITY AND MODULE COHESION

Every module MUST have one primary reason to change.

Examples of acceptable modules:

- fuelConsumption.ts
- depreciation.ts
- driverFatigue.ts
- cargoCompatibility.ts
- routeDistance.ts
- routeProfitability.ts
- dispatchEligibility.ts
- contractGeneration.ts
- hubCapacity.ts
- maintenanceCost.ts

Avoid modules such as:

- everything.ts
- helpers.ts containing unrelated business rules
- gameLogic.ts containing multiple domains
- useGame.ts coordinating the entire simulation
- App.tsx implementing the entire application

Generic utility modules are acceptable only for genuinely generic operations.

Do not place domain-specific business logic into a generic utility simply
because it is used in several places.

When a module becomes difficult to understand, test, or change independently,
evaluate whether it contains multiple responsibilities.

---

# 5. ZERO STUBS AND ZERO PLACEHOLDERS

Production functionality MUST have a real implementation.

Prohibited in production paths:

- TODO implementations presented as complete
- FIXME implementations presented as complete
- empty business functions
- hardcoded fake success responses
- fabricated simulation results
- dummy economic calculations
- arbitrary fallback values that conceal missing data
- buttons that appear functional but do nothing
- fake persistence
- silently ignored errors
- mock data used as live production data without explicit configuration

Mocks and fixtures ARE permitted in automated tests.

Seed data IS permitted when it represents a deliberate, documented initial
game state rather than a substitute for actual runtime behavior.

If a feature cannot be implemented completely within the current task:

1. Implement the correct, well-defined portion.
2. Preserve existing behavior.
3. Surface genuine limitations explicitly.
4. Do not disguise an incomplete feature as a completed implementation.

Do not create unnecessary abstractions or entire subsystems without a
requirement that justifies them.

---

# 6. ULTRA-REALISTIC SIMULATION

All simulation systems MUST use coherent domain models, explicit units,
validated inputs, and reproducible calculations.

Realism means internally consistent simulation rules grounded in real-world
operating constraints, not arbitrary complexity.

## 6.1 Physical and Mechanical Models

Where applicable, account for:

- vehicle mass and gross combination weight
- payload and axle-weight constraints
- engine and drivetrain characteristics
- fuel consumption and fuel capacity
- road gradient and elevation changes
- vehicle speed and traffic conditions
- rolling resistance and aerodynamic drag
- braking, acceleration, and idling
- tire and component wear
- maintenance condition
- weather and road surface
- trailer and cargo compatibility

Do not introduce simplified formulas that contradict existing, validated
domain behavior without documenting and testing the replacement.

Use appropriate approximations when full physical modeling is impractical.
Document their assumptions and limitations.

## 6.2 Driver Simulation

Model relevant factors such as:

- qualification and license class
- cargo-specific skills
- driving experience
- fatigue accumulation
- legally required rest
- working-hour restrictions where modeled
- driving behavior
- performance and safety
- employment and wage costs

Do not treat driver fatigue, skill, and availability as interchangeable
variables.

## 6.3 Economic Simulation

All financial calculations MUST use a consistent accounting model.

Where relevant, account for:

- revenue and contract payment terms
- fuel expenditure
- tolls and permits
- driver wages
- maintenance and repairs
- depreciation
- insurance
- financing and interest
- terminal operating expenses
- taxes and jurisdiction-specific costs

Distinguish revenue, operating expenses, operating profit, cash flow,
assets, liabilities, and debt.

Do not subtract the same expense twice or treat non-cash depreciation
as an immediate cash payment.

Use integer minor currency units or an established decimal-money abstraction
for monetary accounting. Do not use floating-point equality for money.

## 6.4 Logistics and Dispatch

A contract MUST be checked against actual operational eligibility.

Validate applicable requirements such as:

- company operating region
- owned or authorized origin and destination hubs
- active route connectivity
- vehicle availability
- vehicle and trailer compatibility
- payload and weight restrictions
- cargo handling requirements
- driver qualifications and availability
- terminal and route capacity
- dispatch and return conditions

A truck MUST NOT accept an assignment that violates mandatory operational
constraints.

Contract generation MUST reflect the company's actual capabilities without
making every generated contract automatically eligible.

## 6.5 Units and Numerical Integrity

Use explicit units and consistent conversion boundaries.

Examples:

- distance: meters or kilometers internally, consistently defined
- mass: kilograms
- volume: liters or cubic meters
- time: seconds or another explicitly defined simulation unit
- speed: meters per second or kilometers per hour
- fuel economy: a documented, consistent representation
- money: integer minor units or a documented decimal representation

Never silently mix miles and kilometers, gallons and liters, or different
currency denominations.

Avoid unexplained magic numbers. Put tunable simulation parameters in
typed configuration modules with documented units.

## 6.6 Determinism and Reproducibility

Keep domain calculations deterministic wherever practical.

Inject random-number generators, clocks, and external market inputs into
the relevant systems instead of directly coupling calculations to global
randomness or the current wall-clock time.

This enables repeatable tests, debugging, and reproducible simulation results.

---

# 7. STRICT TYPESCRIPT AND TYPE SAFETY

TypeScript is mandatory for application source code.

Use `.ts` for non-UI TypeScript modules and `.tsx` for React components.

The project MUST NOT introduce new JavaScript application modules when
equivalent TypeScript implementation is appropriate.

## 7.1 Type Rules

- Avoid `any`.
- Prefer `unknown` for untrusted values and narrow it through validation.
- Do not use `@ts-ignore` to conceal errors.
- Avoid unnecessary type assertions.
- Do not use non-null assertions to bypass missing-data handling.
- Define explicit domain types and function contracts.
- Use discriminated unions for mutually exclusive states.
- Use branded types where they materially prevent unit or identifier mistakes.
- Validate external data at runtime.
- Keep compiler strictness enabled.

Do not disable strict compiler settings merely to make a build pass.

Do not weaken types to accommodate an incorrect implementation.

## 7.2 State Integrity

Represent invalid states explicitly and reject impossible transitions.

For example, dispatching a truck MUST require a valid available vehicle,
eligible driver, accepted contract, and valid route.

Avoid maintaining multiple independent copies of authoritative business state.

Use a clear source of truth and derive dependent values from it where practical.

---

# 8. STATE, PERSISTENCE, AND SAVE COMPATIBILITY

Persistent game state is a domain boundary and MUST be treated carefully.

Before changing persisted data:

1. Inspect the existing save schema.
2. Identify all consumers and migration requirements.
3. Define the intended schema change.
4. Implement validation and migration where required.
5. Preserve existing user saves whenever practical.
6. Test loading, saving, and migration behavior.

Never silently discard unknown or existing save data without a justified
compatibility strategy.

Validate loaded state before allowing it to affect gameplay.

Keep persistence mechanics out of domain calculations.

Do not allow UI components to independently modify persisted data in ways
that bypass application workflows and domain invariants.

---

# 9. ERROR HANDLING AND EXTERNAL INTEGRATIONS

External APIs, storage, imported data, and asynchronous operations can fail.

Implement appropriate:

- runtime validation
- timeout handling
- retry policies where justified
- error classification
- user-visible failure reporting
- safe recovery
- logging without sensitive information

Never silently replace failed real-world data with fabricated live values.

Fallback behavior MUST be explicit, documented, and appropriate to the
domain.

Do not allow external API failure to corrupt core game state.

Prevent duplicate financial transactions and repeated command execution
where retries could produce harmful side effects.

Use idempotency or equivalent safeguards where necessary.

---

# 10. TESTING REQUIREMENTS

Tests MUST verify behavior, domain invariants, and regression safety.

Prioritize testing for:

- authentication and company initialization
- new-game creation and save loading
- hub ownership and progression
- route activation and connectivity
- vehicle purchases and availability
- driver qualification and fatigue
- cargo compatibility
- contract eligibility
- dispatch restrictions
- fuel consumption and operating costs
- route profitability
- maintenance and component wear
- financial transactions
- persistence migrations
- simulation time progression

## 10.1 Testing Rules

- Test important business rules independently of React.
- Test boundary conditions and invalid inputs.
- Test both successful and failed operations.
- Test financial and physical invariants.
- Add regression tests for repaired defects.
- Use deterministic fixtures for simulation tests.
- Do not change a failing test merely to conceal a real defect.
- Do not claim a test passed unless it was actually executed.

When a calculation changes, test its inputs, outputs, units, and relevant
boundary conditions.

When an application workflow changes, test the complete workflow and its
failure paths where practical.

---

# 11. UI AND ACCESSIBILITY

The UI MUST reflect actual application and domain state.

Every interactive control MUST have a defined behavior.

Forms MUST validate input and communicate errors.

Loading, empty, success, and failure states MUST reflect real conditions,
not fabricated success.

Preserve the established design system unless a visual change is required.

Use accessible labels, keyboard interaction, appropriate semantic elements,
and clear status feedback.

Do not duplicate business calculations inside visual components.

A screen is not complete merely because it renders without errors.

---

# 12. CHANGE MANAGEMENT

Before implementing a task:

1. Identify the exact requested outcome.
2. Inspect the relevant files and existing implementations.
3. Trace the affected domain, application workflow, persistence, and UI.
4. Identify dependencies and invariants that must be preserved.
5. Define the smallest complete implementation.
6. Determine which tests or validation steps are necessary.

Do not perform broad audits or unrelated refactors unless the task requires
them or they are necessary to make the requested change safe.

## 12.1 Minimal, Complete Changes

Prefer the smallest change that correctly solves the complete requested problem.

Do not:
- rewrite unrelated modules
- create duplicate systems
- introduce unnecessary frameworks
- rename files without a clear benefit
- replace working implementations with simpler but less capable versions
- change unrelated gameplay or visual behavior

A small patch is not automatically correct, and a large patch is not
automatically thorough.

The scope MUST be justified by the requirement.

## 12.2 Refactoring

Refactoring MUST preserve observable behavior unless behavior changes are
explicitly required.

Before replacing an existing implementation, identify its callers, state
dependencies, and externally visible behavior.

Move cohesive responsibilities into dedicated modules.

Update imports, tests, and affected integration points.

Remove obsolete code only after confirming that it is no longer required.

Do not retain competing implementations of the same authoritative rule.

## 12.3 No Destructive Repository Operations

Do not overwrite, reset, delete, or discard unrelated user changes.

Inspect the working tree before risky operations.

Preserve existing user modifications.

