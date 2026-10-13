# Final Integration & UAT — Vinca ERP

## Execution scope
Integration candidate: `integration/final-uat`, copied from `feature/16-release-readiness` (PR #16). **No merge to main, no Vercel deployment, no Neon production changes.**

### Verified by API/schema inspection
- [x] All 16 stacked PRs are open, not merged and marked ready for review.
- [x] Neon **development** migration ledger contains seven entries.
- [x] Neon **development** has 17 tables in `public`.
- [x] The `auth_sessions` and `invoice_payments` tables exist.
- [x] Canonical migrations `0000` to `0006` present on integration branch.
- [ ] Exact commit ancestry/merge-diff reconciliation and human PR approvals.

### Automated integration CI
- [ ] `npm ci` from reviewed lockfile
- [ ] TypeScript, ESLint, unit/security/finance tests
- [ ] Next.js production build, Drizzle schema check
- [ ] `npm audit --omit=dev --audit-level=high`
- [ ] Release preflight and integration-route static coverage

### Live UAT — **NOT TESTED**
These must run against a real authenticated dev runtime with disposable fixtures only, after setup approval.

| ID | Scenario | Required result |
|---|---|---|
| AUTH-01 | Owner login / logout / expiry | Sessions create, revoke and expire |
| AUTH-02 | Bad password, lockout, missing/cross Origin | 401, 429, 403 |
| RBAC-01 | Role matrix across all mutations | 403 where permission denied |
| TENANT-01 | Org A user requests Org B object UUID | 404 / no data disclosure |
| CRM-01 | Client + lead create/filter | Scope and values persist |
| EVT-01 | Event + PM / task / vendor / rundown | Correct associations, validation |
| PO-01 | Vendor PO state and commitment | PO does not post actual expense |
| RAB-01 | Expense and audit atomicity | Roll back together on failure |
| SALES-01 | Quote accepted -> draft contract | No unverified signature claim |
| FIN-01 | Invoice DP/cicilan/pelunasan | Correct balances and ledgers |
| FIN-02 | Concurrent overpayment attempts | At most outstanding amount posts |
| FIN-03 | Retry same payment after lost response | No duplicate postings (currently **known gap**: no idempotency key) |
| REPORT-01 | Dashboard / profitability reconciled with records | No PO double counting |
| UI-01 | Keyboard, mobile/tablet/desktop, long tables | No clipping or inaccessible dialogs |
| DR-01 | Backup and restore exercise on disposable Neon branch | Recovery verified |

### Blockers and decisions
**Current go/no-go: NO-GO.** Do not seed an owner in any existing shared database without approval. No live UAT has run yet. Before production release, implement payment idempotency and re-review mutating API tenant checks, audit completeness, trusted proxy configuration, finance permissions and customer approval semantics. Browser tests need a reachable authenticated test environment. Finance/contract controls and restore rehearsal remain outstanding.

### Release approval
A green GitHub integration check means code compiles and static tests pass. It is **not** proof of end-to-end behavior or authority to merge or deploy. Require explicit separate approvals for merging stacked PRs, Neon production migrations and Vercel deployment.
