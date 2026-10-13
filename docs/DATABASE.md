# PR #03 — Neon PostgreSQL + Drizzle schema

## Target and isolation
- Neon project: `ERP-eventorganizer` (ID `fancy-cell-64250119`)
- Database: `eventorganizer`
- `production` branch (unchanged): `br-round-resonance-b33v746b`
- `development` branch: `br-muddy-leaf-b34gxxf2`
- Vercel project: `eo-erp`, team `kasapink` (separate from `kasapink-erp`)
- Environment `DATABASE_URL` is encrypted. Production points to production; Preview/Development points to development.

## Source schema and migration
- Canonical model definitions: `src/db/schema.ts`
- Canonical generated migration: `drizzle/0000_bizarre_senator_kelly.sql`
- Migration journal: `drizzle/meta/_journal.json`
- Drizzle snapshot: `drizzle/meta/0000_snapshot.json`
- Generation tested in GitHub Actions run `38363741111` (typecheck, lint, build, generate: passed).
- All monetary columns use `numeric(18,2)` so application code must handle values as decimal strings or a precise decimal type.
- The SQL migration has **not been applied to production** or development yet. The development database is reachable but still empty.

## Migration runbook (pending)
1. Review the generated SQL and constraints.
2. Confirm the target `DATABASE_URL` points to the **development branch**. Use a **direct** Neon connection for schema migrations; pooled connection for application queries.
3. Run `npm run db:migrate` using the verified development direct connection, then check tables.
4. Test `/api/db-health` in the protected preview and validate a sample transaction after real APIs are implemented.
5. Only with separate approval: apply reviewed migration to production.

Do not import Kasapink credentials or run migrations against Kasapink. Never commit credentials.

## Important future rules
- Organization ownership on all dependent rows must be enforced in API/services; foreign keys alone do not prevent cross-org references.
- Invoice payment totals must be validated atomically to prevent overpayment.
- PO commitments and actual costs must be reconciled to avoid double counting.
- Backend RBAC will be implemented in PR #04.
