# Artimex Bakery OS — Codex continuation brief

## Product boundary

This application replaces GlobalBake's bakery operations workflow. It does **not** replace Restaurant365.

- Bakery OS owns demand planning, recipes/formulas, production scheduling, batches, lots, quality, traceability and approved operational movements.
- R365 remains the system of record for accounting, vendor/item master, inventory valuation and financial reporting.
- Olivia is a separate Python/FastAPI service that provides recommendations and explanations. Human approval remains required for quality release, recipe changes and recalls.

## Current demo

V2 adds `app/decision-studio.tsx`, styled by `app/premium.css` and `app/readability.css`.
The landing screen is an interactive incremental-order simulator with three alternatives,
deterministic contribution calculations, and a schematic production schedule. All numbers,
capacity, pricing, overtime and changeover assumptions are illustrative. Scheduling is not
an optimizer; do not treat fixed display times as computed production feasibility.
Keep R365 as the inventory AND accounting system of record, not merely valuation.
Before a pilot, replace all simulated connection/quality states with explicit backend states.

The interactive React demo contains:

1. Command center
2. Demand and forecast studio
3. Production board
4. Batch traceability
5. Quality control
6. R365 synchronization
7. Olivia production-intelligence drawer
8. Orders & shipping
9. Recipes & batches

The Gallo Giro concha scenario recalculates modeled revenue, variable cost, contribution, contribution percentage and overtime from 5,000 to 40,000 units. Accepted scenarios are shared with the production board and can be undone. Line-changeover capacity can show a non-feasible scenario. Forecast filters, batch lookup, quality release with reason, local reset and R365 event replay are interactive.

All content is realistic demo data held in the React application. No production API, R365 endpoint, Toast connection or Olivia Python service is connected.

## Demonstrated simulations and limits

- Decision Studio uses illustrative assumptions, not an optimizer or a net-profit calculation.
- Demand and forecast separates confirmed orders from modeled forecast; no forecast accuracy rate is claimed without validation history.
- Production, batches, recipes, quality, orders and shipments use local sample identifiers and do not create operational records.
- Traceability resolves the sample batch identifiers shown in the UI and explicitly reports unknown identifiers.
- Quality release and R365 replay write only to local demo state; release reasons are shown as a local audit entry.
- The R365 screen shows source identifiers, an idempotency key and simulated pending/success/error states. It does not invent an endpoint.
- Olivia is labeled as a demo assistant and cannot approve or mutate operations.

## Stack

- Next.js / Vinext
- React 19 + TypeScript
- Tailwind CSS
- Shadcn primitives
- Recharts
- Lucide icons

## Main files

- `app/page.tsx`: interactive product mockup and demo data
- `app/globals.css`: Artimex visual system and responsive layouts
- `app/layout.tsx`: page metadata and typography

## Run locally

```bash
npm install
npm run dev
```

## Recommended implementation sequence

1. Split each screen into `components/bakery/*`.
2. Define the PostgreSQL schema for item mappings, formulas, formula versions, production lines, work orders, batches, ingredient lots, consumption, quality checks, holds, shipments and integration events.
3. Add API endpoints with audit logs and role-based permissions.
4. Build the R365 adapter behind an interface; verify the customer's enabled endpoints before implementing writes.
5. Connect Olivia through server-side tools with read-only defaults and explicit approval actions.
6. Import a limited set of real SKUs, formulas and historical orders for a controlled pilot.
7. Add offline sync, barcode/label support and recall exercises only after the core data model is validated.

## Non-negotiable safeguards

- Never maintain two financial inventory ledgers.
- Use idempotency keys for all R365 writes.
- Preserve unit-of-measure conversions and source identifiers.
- Version recipes and quality specifications; never overwrite history.
- Record actor, timestamp, source and reason for every release, hold and override.
- Keep Olivia recommendations separate from approved production transactions.
