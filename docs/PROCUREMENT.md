# PR #08 — Vendor & Procurement

## Scope
- Vendor master: tenant-scoped list and create.
- Purchase Orders: draft/create, list and status updates.
- One PO belongs to an event and vendor from the same organization.
- Monetary amounts use decimal strings persisted as PostgreSQL `numeric(18,2)`.
- **Purchase order commitments are not actual expenses.** Actual disbursements will be handled separately in PR #13. Do not sum both to compute actual event costs.

## Development only
A Drizzle migration adds `purchase_orders` and `purchase_order_status` to Neon development after verification. No production migration is authorized. No default vendors or financial transactions are seeded.

## Tests and pending UAT
- Unit tests: vendor sanitization, PO references, money parsing, state validation.
- GitHub CI: TypeScript, ESLint, tests, Next.js build, Drizzle consistency.
- Still required before production: authenticated HTTP 401/403, tenant isolation, duplicate PO numbers, concurrent updates, state transition business rules, browser accessibility.

## Planned follow-ups
A purchase-order lifecycle needs approval checkpoints and audit logs, then goods/service receipt confirmation and eventual vendor payment reconciliation. This PR does not treat `received` as paid or claim finance reconciliation.
