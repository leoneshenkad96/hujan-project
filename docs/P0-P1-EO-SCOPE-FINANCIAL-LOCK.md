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


## P1 quotation implementation checkpoint — 2026-10-13
- [x] New quote stores an itemized breakdown (description, unit, quantity, unit price, rounded line subtotal), discount amount, explicitly entered tax rate, revision number, predecessor quote ID; previous total-only quotes remain supported.
- [x] API recomputes quote amount server-side with exact integer-minor-unit calculation; never trusts a browser-submitted `amount` when lines are provided.
- [x] Interactive quotation form supports adding/removing items, units, qty, unit price, discount, tax rate and live summary.
- [x] Revision API creates a new draft record rather than modifying the existing quote; it refuses revisions of sent/accepted quotations. Contract creation still requires an accepted quotation and snapshots its amount.
- [x] Drizzle migration `0010_quotation_line_items` and corresponding schema snapshot authored on the integration branch.
- [x] Source checks for server calculations, tenant filters, immutable revision and contract amount relation added.
- [ ] Apply migration only to **isolated Neon UAT** after canonical migration CI passes and explicit scope/backup decision; until then UAT table does NOT have the new columns and new app code must not be pointed at that database.
- [ ] Prove runtime create/list/revision/contract, report consistency and UI responsiveness using an authenticated isolated UAT app.
- [ ] Full granular versioned approvals, quote PDF export, PO-to-expense matching and forecast RAB are separate P1 work, not certified as completed here.

**Accounting boundary:** Quotation total is a commercial selling price; approved RAB is a project budget (expected cost), PO commitment and actual expense are separate. Creating or approving a quote must not automatically count its amount as direct expense or overwrite approved RAB. Applicable tax configuration is operator-entered, not inferred from Indonesian tax law.


## Isolated Neon UAT migration checkpoint — 2026-10-13
- [x] Project `fancy-cell-64250119`, branch `br-long-wildflower-b3nsciay`, database `eventorganizer` verified **at the server** before write.
- [x] Three append-only schema migrations `0010`–`0012` applied in one atomic database transaction; Drizzle ledger now **13** records, with SHA-256 hashes derived from the exact committed SQL migration files.
- [x] Read-back confirmed all 5 quotation columns, the expense-to-PO FK, matched PO balance, and `purchase_orders_matched_amount_valid` check constraint.
- [x] Before migration: 0 quotation records, 0 purchase orders, 0 expenses; therefore there were no pre-existing financial transactions to reconcile.
- [ ] Real write-path tests, concurrent expense-to-PO test, quotation creation/revision, authenticated multi-tenant flows: **NOT YET VERIFIED**.
- [ ] Owner first-login bootstrap remains blocked until private password provisioning. No UAT server URL available for authenticated E2E.
- [ ] No Vercel calls, `main` merge, production database mutation, or release deployment.


## Disposable Neon financial-transaction UAT — 2026-10-13
- Disposable **child** of isolated UAT: `br-hidden-snow-b3vbe1y4` (`vinca-finance-disposable-uat-20261013`). It does **not** target production or the original UAT Owner's environment.
- Fixture: 2 organizations, 2 clients, 2 events (wedding and reunion), vendor, quote, PO, invoice. **Direct SQL exercises database constraints; it is not an authenticated API test.**
- **1 Quote line items:** PASS: itemized quotation persisted in PostgreSQL JSONB.
- **2 Financial arithmetic:** PASS on fixture: subtotal 42,000,000; discount 2,000,000; tax 4,400,000; total 44,400,000. Tax 11% is arbitrary test input, not a tax-law assumption. Pure TypeScript quotation calculator also protected by regression tests.
- **3 Revision & contract references:** PASS at SQL relationship level: new revision row linked to predecessor; contract snapshots accepted quote amount. Endpoint permission/status lifecycle not proven by this SQL test.
- **4 PO and actual expense:** PASS: 4,000,000 expense created with explicit PO relation and audit.
- **5 Partial payment:** PASS: payment 20,000,000; invoice 44,400,000; outstanding 24,400,000; payment ledger equals invoice paid amount. HTTP idempotency is not proven here.
- **6 PO overspend:** PASS: check constraint rejects update to matched_actual=12,000,000 for a 10,000,000 PO.
- **7 Concurrency:** PASS on disposable branch: simultaneous 4,000,000 expense attempts with 6,000,000 PO capacity remaining resulted in exactly one new expense/audit; PO final matched balance 8,000,000 and remaining 2,000,000. This confirms SQL row-guard behavior for tested workload, not every production load.
- **8 Tenant isolation:** **FAIL initially, FIXED and PASS on retest.** Raw SQL could insert an invoice for organization B against organization A's event. Migration `0013_tenant_link_guards` adds DB triggers guarding cross-org references for events, quotations, contracts, POs, expenses, invoices and payments. Retest of cross-org invoice, PO/vendor and payment all rejected; no invalid new records persisted.
- The disposable test branch has **14 applied migration records** including `0013`; main isolated UAT `br-long-wildflower-b3nsciay` remains **13** until this new migration is separately authorized/applied. Source migration and regression tests committed on `integration/final-uat`.
- All results are *database/SQL UAT*. **Authenticated API UAT, owner onboarding, browser UX, email delivery, multi-client load testing, and production sign-off remain pending.**
- Keep disposable branch for evidence and follow-up. Do not delete without explicit permission.


## Disposable UAT eight-scenario verification — 2026-10-13
**Isolation:** Neon project `fancy-cell-64250119`, disposable child branch `br-hidden-snow-b3vbe1y4` of isolated UAT. These are **SQL-layer checks**, not authenticated HTTP API/UI UAT. Do not treat these as production sign-off.

| # | Test | Observed result | Scope |
|---|---|---|---|
| 1 | Itemized wedding quote saved with 2 lines | PASS, 2-line JSON data present and amount Rp44,400,000 | SQL persistence |
| 2 | Exact subtotal, discount, simulated 11% tax | PASS: Rp42,000,000 − Rp2,000,000 + Rp4,400,000 = Rp44,400,000 | SQL arithmetic + existing unit tests |
| 3 | Quote revision and accepted quote -> contract | PASS: independent revision 2, one contract linked to original accepted quote | SQL relationships |
| 4 | PO and matched actual expense | PASS: 2 expense rows, Rp8,000,000 matched against Rp10,000,000 PO | SQL write + ledger |
| 5 | Partial invoice payment | PASS: Rp20,000,000 paid, Rp24,400,000 due; payment ledger agrees | SQL write + ledger |
| 6 | PO amount cap | PASS: direct over-limit UPDATE rejected by CHECK; conditional match refuses over-cap | DB constraint / guarded SQL |
| 7 | Parallel PO consumption | PASS in tested race: two parallel Rp4,000,000 attempts with Rp6,000,000 available -> 1 inserted, 1 rejected | Concurrent SQL statements |
| 8 | Cross-org references | **FAIL originally, FIXED and retested PASS**: wrong-org invoice, vendor PO, payment now rejected by DB trigger | DB relationship guards |

**Fix:** New append-only `0013_tenant_link_guards` adds triggers for events, quotations, contracts, purchase_orders, event_costs, invoices, invoice_payments. Applied only to disposable branch, where migration count is now **14**. Main UAT still has 13 and should receive 0013 only after separate review; production untouched.

**Remaining gaps:** authenticated RBAC/IDOR API tests, UI workflows, login activation, actual HTTP idempotency/concurrent payment tests, database restore rehearsal. No full ERP GO sign-off. Test fixture kept on disposable branch for repeatability; branch may be deleted after owner authorization.


## Tenant guard completion (2026-10-13)
Migration `0014_tenant_guard_completion` protects the six previously missing relationships: leads/client, tasks/event and assignee, rundown/event and PIC, session/user, audit/actor, and event/project manager. Applied only on disposable branch `br-hidden-snow-b3vbe1y4` (now 15 ledger entries); all eight attempted cross-organization mutations were rejected. Main isolated UAT remains at 13 migrations; production unchanged. This is DB-layer verification, not an authenticated HTTP or full ERP release sign-off.


## Main isolated UAT security migration checkpoint — 2026-10-13
- [x] Applied reviewed migrations `0013_tenant_link_guards` and `0014_tenant_guard_completion` transactionally on branch `br-long-wildflower-b3nsciay` only, after checking branch and previous ledger count. Original data counts for events and costs were zero.
- [x] Verified 15 Drizzle migration ledger entries and 12 active tenant guard triggers. UAT login-ready users: 0.
- [x] Updated read-only UAT verification script to expect 15 migrations.
- [ ] Authenticated multi-role HTTP authorization and Owner login remain unverified; full release remains blocked.
- [ ] Additional regression probes against new main UAT guards (no mock business fixtures there) remain distinct from successful disposable-branch tests.
No production database mutation or deployment.


## P0 mobile-only audit checkpoint — 2026-10-13
- [x] Main isolated Neon UAT: all fifteen committed migrations and twelve tenant-relationship triggers verified. Owner login-ready accounts remain zero.
- [x] Source review: `src/lib/permissions.ts` implements seven default-deny roles; finance read/write require finance-scoped grants; invoice payment, profitability, and expense routes use server-side `requirePermission` with organization binding.
- [x] Source review: payment POST requires an idempotency key, replays an identical invoice-scoped request, rejects reuse with different amount/reference, and combines conditional paid balance, payment ledger, and audit log in one SQL statement. Further authenticated HTTP concurrency testing is mandatory for release.
- [x] Added `tests/p0-financial-rbac.test.mjs` and `tests/p0-payment-atomic-guards.test.mjs` to prevent regressions; GitHub CI successful on integration branch.
- [ ] Comprehensive verification of every non-finance endpoint and role-specific application UI requires additional endpoint inventory / authenticated tests. The scoped source audit must not be called full application RBAC certification.
- [ ] Owner bootstrap, live HTTP session/cookie/CSRF, payment replay and concurrency via actual API, event E2E and screenshot checks remain pending because no authenticated UAT app is running.
**Release status: NO-GO** until those runtime checks are complete. No Vercel, merge, production changes, or deployment.
