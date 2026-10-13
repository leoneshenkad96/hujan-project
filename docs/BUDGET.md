# PR #09 — Budget & RAB

## Accounting boundary
- The event `approved_budget` is the approved budget baseline.
- `event_costs` with status `actual` represents recorded actual expenses.
- Purchase orders with statuses `issued`, `partially_received`, and `received` are shown as committed procurement amounts, **not** actual expenditures. Draft and cancelled POs are excluded.
- **Do not add PO commitment totals to actual expense totals** until there is an explicit PO-to-expense reconciliation mechanism. Their amounts might describe the same purchase.
- Remaining budget **after actual expenses** = approved budget - actual expense total. This is **not** an available-to-spend commitment-adjusted balance.
- An additional "remaining after commitments only" metric is computed for comparison; it also must never be interpreted as net available budget.
- All financial summation uses integer minor currency units (BigInt), not floating-point math. Database amounts are `numeric(18,2)`.

## Implemented
- Authenticated `GET /api/budgets?eventId=...`: per-organization summary and separate ledgers.
- `POST /api/budgets/expenses` permits Finance/Owner/Admin only and records expense **and audit entry atomically** using one SQL statement.
- Expense mutations are append-only here; no deletion or settlement of PO.
- Budget/RAB UI reads the summary and lists each ledger independently.
- Validation tests cover decimal precision, overspend, negative remaining and no double counting.

## Still required before production
- Integration tests of the SQL CTE write, including audit rollback on failure and tenant isolation.
- Reconciliation and approval workflow for purchase orders, vendor invoices, partial settlements, credit notes and actual expenses.
- Business permissions review; budget approval lifecycle and amendment audit history.
- Browser/HTTP accessibility and authenticated UAT.
- No production database changes or deployment are authorized.
