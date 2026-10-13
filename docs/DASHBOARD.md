# PR #14 — Dashboard & Reporting

Dashboard uses authenticated Neon-backed API data rather than the previously simulated browser-memory KPIs.

## Operational KPI
- Event portfolio (maximum 200 display rows), active status and average progress.
- Task counts: total, completed and blocked, filtered by selected event where applicable.
- Organization-wide CRM lead status counts shown only in the unfiltered view.

## Financial access boundary
- Finance summaries (invoiced, received payments, actual expenses and purchase order commitments) are included **only** for `finance:read` roles: owner, admin and finance.
- Project managers, sales and production can view permitted operational KPIs without receiving contract and RAB values from the dashboard API.
- Financial measures are **not additive**: PO commitments are not actual expenses, invoice amount is not cash, and receipts are not event profit.
- The finance values shown are accounting-system records rather than independently reconciled bank or statutory reports.

## Limitations and release gates
- Authenticated HTTP UAT for tenant scoping, filters, denial of unauthorized finance disclosure, and concurrency.
- Large-event pagination and consistency across aggregate reads. Portfolio display limits to 200 rows while totals for tasks and finances can cover more.
- Browser/mobile accessibility and performance checks.
- No new schema migration is needed; Neon production is unchanged. No Vercel deployment, no merge to main.
