# Artimex Bakery OS

Premium interactive React demo for bakery planning, recipes, production, quality, traceability and B2B shipping. The demo uses local sample data and simulated adapters; it does not connect to Restaurant365, Toast or Olivia Python.

See [CODEX_BRIEF.md](./CODEX_BRIEF.md) for the product boundary, completed demo scope and remaining integrations.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Demo validation

```bash
npm test
npm run lint
```

The demo includes an incremental Gallo Giro concha scenario, shared schedule state, forecast filters, order and recipe views, lot lookup, quality release confirmation, an R365 adapter simulation with idempotency keys, a local Reset demo action, and shared English/Spanish UI switching from the top bar.

Remaining production work: connect a backend and audit store, replace sample data with approved master data, implement the R365 adapter after endpoint validation, and connect Olivia through server-side read-only tools with explicit human approvals.
