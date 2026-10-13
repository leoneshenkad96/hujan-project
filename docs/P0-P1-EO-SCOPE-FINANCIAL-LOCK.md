# VINCA EO — P0/P1 scope & financial calculation contract (LOCKED baseline)

Status: **Specification LOCK**, not implementation certification. Work only in `integration/final-uat`; no Vercel, no main merge, no production Neon writes without explicit user direction.

## Business scope
Vinca operates a **service-company ERP** for client-commissioned weddings, reunions, corporate gatherings, birthday parties, and other hired events. Core chain: inquiry/lead -> client/brief -> quotation -> approved scope/contract -> event project -> tasks/crew/vendors/PO -> RAB and spend control -> production rundown -> client invoices and cash collection -> reconciliation and event closing. Registration, ticketing, attendee QR, sponsorship/exhibitors and public event pages are OUT OF SCOPE unless the company later specifically needs them.

## LOCKED financial rules — must pass tests before release
1. Every amount uses exact decimal NUMERIC or integer minor currency units (e.g. Rp cents) end-to-end; **never binary floating point for accounting**. Validate at input and DB; currency, tax treatment and rounding policy are explicit. No silent negative values or amounts beyond allowed precision.
2. Line subtotal = quantity × unit price using defined quantity precision and rounding; quotation subtotal = sum lines; commercial total = subtotal − discounts + separately defined taxes/fees. Modifying quantity/price/discount recalculates totals. Distinguish **markup** = (sell−cost)/cost and **gross margin** = (sell−cost)/sell, with safe zero denominator handling.
3. Approved RAB = sum approved expense-budget lines. Track **planned, committed, actual, remaining commitment, forecast at completion** separately. Do not sum full PO and its realized expenses: unfulfilled commitment = max(PO obligated value − matched received/actualized portion,0); forecast cost = actual cost + unfulfilled committed cost + uncommitted forecast-to-complete.
4. Variance convention is **actual (or forecast) minus approved budget**: positive = over budget; negative = under budget. If presenting 'remaining budget' it is approved − actual and clearly labeled, not called variance. Label all amounts by basis.
5. A contract total is not automatically recognized revenue, and an issued invoice is not the same as a payment. **Invoice outstanding** = total valid issued invoice amounts − allocated valid payments − valid credits/refunds adjustments according to documented treatment. Exclude drafts and voids; never subtract all event cash from a single invoice. Prevent cumulative payments > invoice due unless supported documented credit balance process.
6. All payment POSTs require organization-scope auth + idempotency; concurrent requests must not double-post or overpay. Invoice balance changes, payment ledger and audit records must remain atomic. Refunds, credit notes, cancellations and payment reversals need explicit workflow; **no destructive delete of posted money**.
7. **Cash flow** = actual cash received − actual cash disbursed during chosen period/event; do not treat accrued costs or outstanding POs as paid cash. A proxy based on recorded expenses must explicitly say 'proxy' and must never be labeled actual net cash.
8. **Estimated project gross profit** = defined contract/forecast revenue basis − actual direct costs − forecast remaining direct costs, clearly marked estimated. **Realized gross profit** requires consistent recognized revenue and incurred direct costs. **Net profit** also deducts allocated overhead, relevant taxes/fees and other expenses. Never present contracted−actual as certified net profit.
9. Percentages handle zero sales/cost safely; display cannot claim infinite/100% where denominator zero. Revenue, gross profit, gross margin and markup are different metrics. Approved prices, taxes, discounts, and contract changes must preserve revision/audit history.
10. All financial rows and joins must be tenant scoped; prevent cross-org references at API level and preferably at DB integrity level. Accounting adjustments should have actor/timestamp/reason and remain reconcilable to report totals. Period and as-of dates must be clear.
11. Guard calculations with deterministic test fixtures: partial payment, concurrent retry, overpayment, cancellation/void, fractional qty, discounts, tax-inclusive/exclusive assumptions, PO partially fulfilled, missing costs, zero revenue and negative project profit. Always distinguish **unit tests / SQL checks / authenticated end-to-end UAT**.
12. Existing Vinca values `estimatedGrossProfit = contractValue - recorded actualExpenses`, and `cashFlowProxy = received - recorded actualExpenses` must remain explicitly ESTIMATES/PROXIES until accrued commitments, payouts, revenue recognition and reconciliation are modeled. Do not silently reinterpret historical values.

## P0 — Release blockers
- [x] Source implementation: email/password auth, RBAC user routes, revocable sessions, tenant-scoped core APIs.
- [x] UAT Neon migration 10 and global normalized email uniqueness verified.
- [x] Remove in-memory demo state from main workspace; CI automated checks previously passed.
- [ ] **Phone / GitHub**: security review role boundaries, event/client/vendor/financial tenant references, regression tests; commit proven fixes, CI green.
- [ ] **Phone / GitHub**: financial invariants test suite for formulas, idempotent payments, overpayment, double-count and negative/zero edge cases; don't mark runtime tests passed merely because code compiles.
- [ ] **Phone / Neon read-only**: UAT schema/data integrity, migration ledger/index, backups feasibility, isolation checks without fabricating runtime validation.
- [ ] **Laptop/private terminal**: activate existing Owner via checked isolated UAT connection with hidden password; do not share credentials through chat/repo.
- [ ] **Laptop or authorized running UAT app**: authenticated login/logout/session, roles, and real two-organization IDOR tests; full event->expense->invoice->payment E2E incl parallel transactions.
- [ ] **UAT operations**: restore rehearsal, mobile/desktop QA, release runbook, sign-off. No production GO before all pass.

## P1 — Required before calling the first useful EO company ERP complete
- [ ] **Phone / GitHub**: CRM lead/brief/follow-up and client-conversion refinement; proper controls + validation and auditable edits.
- [ ] **Phone / GitHub**: quotation itemized qty/unit/price/discount/tax, revisions, approval, export PDF (subject to data definition); contract terms and payment schedule.
- [ ] **Phone / GitHub**: event scope, stage status and milestones; event tasks/PIC/due date, change history and safe archive/cancel.
- [ ] **Phone / GitHub**: vendor quotation comparison, PO approvals, expense matching, purchase and cost statuses; avoid duplicate RAB commitments.
- [ ] **Phone / GitHub**: granular production rundown position/time/PIC/cue and versioning, ready-for-show checklist.
- [ ] **Phone / GitHub**: crew assignment and schedule/conflict prevention for multiple concurrent client events.
- [ ] **Phone / GitHub**: accurate cost-control dashboard (approved, actual, open PO, forecast, variance) and estimated-vs-final profitability.
- [ ] **Phone / GitHub**: invoice terms/partial payment/receipt/credit or reversal treatment, basic export, event reconciliation and formal event closing.
- [ ] **Phone / GitHub**: granular Sales versus Finance permissions; table filter/sort/pagination, meaningful empty/loading/error states, unsaved-change prompt.
- [ ] **Laptop/runtime UAT**: validate complete workflows, PDFs/exports, numerical correctness, accessibility and responsive behavior at phone/tablet/desktop.

## Execution stages
0. Scope and financial formulas locked here; no attendee/ticketing features.
1. **Phone now:** source audit + targeted P0 bugfixes/tests + GitHub CI + Neon read-only validation.
2. **Phone next:** incremental P1 workflows in dependency order: itemized quotation/contract -> budget/PO reconciliation -> event/crew/rundown -> invoice/profitability/reporting -> UX; unit tests and CI each step.
3. **Laptop tomorrow:** private Owner provisioning and authenticated UAT environment, two-tenant isolation and end-to-end financial event scenarios.
4. **Phone + laptop:** final QA and release review. Production deploy only with explicit owner approval, not by GitHub branch commit.

## Release gate
A passing CI means source checks pass; it does NOT establish real transaction correctness, production readiness, or a successful deployment. Maintain separate status for `implemented`, `CI passed`, `UAT passed`, and `released`. 
