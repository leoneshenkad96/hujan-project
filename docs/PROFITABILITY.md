# PR #13 — Event profitability

Reports distinguish **commercial contract value**, **issued invoices**, **verified payment records**, **actual recorded expenses** and **open PO commitments**.

- Estimated gross profit = agreed contract value - recorded actual event expenses.
- Estimated gross margin = gross profit / contract value, undefined if contract value is zero.
- Outstanding invoiced = issued invoiced amount - recorded payments.
- Cash-flow proxy = recorded payments - recorded actual expenses. It is **not bank-account cashflow**.
- PO commitments are disclosed separately, never added to actual expenses because these may relate to the same purchase.
- RAB variance after actual = approved budget - recorded actual expenses.
- Calculations use integer minor currency units to avoid floating point rounding.

These are **management indicators**, not GAAP-compliant accounting profit. Tax, overhead, accruals, refunds, credit notes, PO settlements and contract amendments are not yet modeled. Furthermore `events.contract_value` currently depends on event input and is not automatically reconciled to signed contracts. UI explicitly labels the number as *estimated*.

## Security and testing
- GET /api/profitability?eventId=<UUID> checks the logged-in organization and `finance:read` authorization.
- Unit tests cover decimal arithmetic, zero-revenue margin and separate invoice/PO/cash/profit measures.
- Before release, verify tenant isolation, huge collections, query consistency under concurrent writes, cross-checks against finance ledgers, HTTP 401/403 and responsive UI.
- No schema migration for this PR, no Neon production changes, no Vercel deployment.
