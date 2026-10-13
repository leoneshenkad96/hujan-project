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
| FIN-03 | Retry same payment after lost response | No duplicate postings (idempotency key implemented; live concurrent UAT pending) |
| REPORT-01 | Dashboard / profitability reconciled with records | No PO double counting |
| UI-01 | Keyboard, mobile/tablet/desktop, long tables | No clipping or inaccessible dialogs |
| DR-01 | Backup and restore exercise on disposable Neon branch | Recovery verified |

### Blockers and decisions
**Current go/no-go: NO-GO.** Do not seed an owner in any existing shared database without approval. No live UAT has run yet. Before production release, verify payment idempotency under real concurrent load and re-review mutating API tenant checks, audit completeness, trusted proxy configuration, finance permissions and customer approval semantics. Browser tests need a reachable authenticated test environment. Finance/contract controls and restore rehearsal remain outstanding.

### Release approval
A green GitHub integration check means code compiles and static tests pass. It is **not** proof of end-to-end behavior or authority to merge or deploy. Require explicit separate approvals for merging stacked PRs, Neon production migrations and Vercel deployment.

## Isolated Neon UAT branch — prepared
- Neon project: `fancy-cell-64250119` (Vinca only).
- Parent: development `br-muddy-leaf-b34gxxf2`.
- Disposable UAT branch: `br-long-wildflower-b3nsciay` (`uat-isolated-2026-10-13`).
- Read-only verification on isolated branch: **7 migrations, 0 organizations, 0 users, 0 payments**.
- No UAT accounts, invoices, vendor payments, or customer records created. **Do not mistake an empty UAT branch for a successful live UAT.**

## Live smoke runner
`node scripts/uat-http-smoke.mjs` requires `UAT_BASE_URL` and distinct `UAT_ORG_A/UAT_EMAIL_A/UAT_PASSWORD_A` and `UAT_ORG_B/UAT_EMAIL_B/UAT_PASSWORD_B` supplied securely at runtime, not committed to GitHub. It checks anonymous invoice denial, isolated login, event read, optional IDOR across tenant events, invalid-origin logout, and finance access.

- The script refuses hosts that do not indicate UAT/preview/localhost and rejects Kasapink.
- Never connect a UAT website to the Vinca production Neon branch.
- UAT URL, user credentials and server runtime have not been provisioned.
- This smoke script makes no application mutations other than login sessions, and therefore **does not verify money writes or concurrency**. Those require isolated test fixture accounts, a separate transaction test plan and observed database ledger invariants.

## Latest checkpoint (2026-10-13)
- **Nine** canonical migrations (0000–0008) now recorded on isolated Neon UAT; development baseline above describes the earlier seven migrations.
- UAT DB latest read-only inspection: one organization, one inactive/passwordless Owner, zero activation tokens. Org B creation was attempted but blocked by connector safety controls; **do not claim two-org UAT completed**.
- HTTP runner and opt-in finance concurrency runner prepared, not executed with authenticated fixtures.
- Finance reconciliation read-only endpoint and regressions passed CI, but there are no test invoices/payments to assess.
- GitHub README refreshed with setup, modules, environment safety, UAT gates, and production NO-GO.
- Email sender/Preview activation flow still blocked until configuration and Vercel Preview redeploy; no actual activation email sent.
