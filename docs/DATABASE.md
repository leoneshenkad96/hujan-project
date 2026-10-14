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
- **Development migration APPLIED and verified** on Neon branch `br-muddy-leaf-b34gxxf2` (11 ERP tables and `drizzle.__drizzle_migrations`; migration hash matches the checked-in SQL). No seed data was inserted.
- **Production migration NOT RUN**. The production database remains unchanged.

## Verified development migration
- [x] Schema reviewed and generated from `src/db/schema.ts` in GitHub Actions
- [x] Applied initial schema as one atomic transaction to the **development branch only**
- [x] Migration ledger created and SHA-256 hash matched
- [x] All expected 11 ERP tables found in development database
- [ ] Direct HTTP `/api/db-health` test on protected Vercel Preview
- [ ] Controlled application CRUD/UAT (will require API implementation)

## Production rollout (not authorized yet)
Use a **direct** Neon connection for `npm run db:migrate` and verify the target project, branch and database first. Do not run against `production` without approval; never migrate the Kasapink project.

Do not import Kasapink credentials or run migrations against Kasapink. Never commit credentials.

## Important future rules
- Organization ownership on all dependent rows must be enforced in API/services; foreign keys alone do not prevent cross-org references.
- Invoice payment totals must be validated atomically to prevent overpayment.
- PO commitments and actual costs must be reconciled to avoid double counting.
- Backend RBAC will be implemented in PR #04.
