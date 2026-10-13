# PR #03 — Neon PostgreSQL + Drizzle schema

## Target and isolation

- Neon project: `ERP-eventorganizer` (ID: `fancy-cell-64250119`)
- Database: `eventorganizer`
- Never connect to the Kasapink database.
- Production `DATABASE_URL` is already configured in Vercel `eo-erp`, encrypted.
- Preview and Development must use **separate Neon branches and URLs** before running migrations or seeding.

## Schema coverage

organizations, users, clients, leads, events, tasks, vendors, event_costs, invoices, invoice_payments, and audit_logs.

All financial amounts use `numeric(18,2)`, not floating point. Future PRs must add constraints and business services to prevent overpayments and double counting; schema alone is not an ERP accounting engine.

## Next operational steps (not executed by this PR)

1. Provision Neon development/preview branch isolated from production.
2. Configure preview/development `DATABASE_URL` and secure direct migration connection for branch-scoped migrations.
3. Generate migrations with `npm run db:generate` and review SQL in PR.
4. Run `npm run db:migrate` **only against verified Neon preview branch**, then query `/api/db-health` for connectivity.
5. Only after approval, apply reviewed migrations to production.

No production migration and no seed data in this PR.
