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


## P0 Gate Tracker — 2026-10-13 (live status)

This section is the current release gate; earlier historical checkpoints above are retained for audit history.

**Release decision: NO-GO. Do not merge or deploy to production while unchecked blocking items remain.**

### Gate A — Integration and safe preview
- [x] Confirm integration branch `integration/final-uat` is ahead of `main` without being behind (251 commits ahead as checked).
- [x] GitHub PR #17 CI reports success in its last recorded run; passing CI is not equivalent to live UAT.
- [x] Vercel Preview deployment `dpl_3CbNJ1Y8SNVn2WHpxghj95MPvv6u`, commit `70db1de`, reached READY. This proves build readiness only.
- [ ] Re-run CI on the exact final tested commit and reconcile the stacked PR diff/reviews before merge.

### Gate B — Owner authentication (blocking)
- [x] Isolated UAT Neon branch has nine migrations, one organization, one inactive Owner, zero payments.
- [ ] Configure and verify preview-only `RESEND_API_KEY` and `ACTIVATION_FROM_EMAIL`; these were absent from the Vercel project environment variable listing.
- [ ] Verify preview deployment URL, `UAT_ACTIVATION_BASE_URL`, and `DATABASE_URL` refer to the intended isolated UAT environment, without exposing secrets.
- [ ] Send activation email and verify one-time expiry/consumption, then Owner login/logout and session expiration.

### Gate C — Access control / tenant isolation (blocking)
- [ ] Provision a second disposable organization and least-privilege accounts (UAT only).
- [ ] Execute authenticated cross-tenant and role-matrix HTTP tests, including 401/403/404, CSRF/Origin, brute-force throttling and IDOR.
- [ ] Inspect test logs and verify sensitive financial data is never returned to unauthorized roles.

### Gate D — Finance invariants (blocking)
- [ ] Create disposable invoices and payments in isolated UAT only.
- [ ] Execute concurrent payments, same-key retry, conflicting-key reuse, overpayment, rollback and reconciliation tests; confirm the persisted ledger matches invoice balances and audit rows.
- [ ] Review finance approval/contract semantics and resulting dashboard amounts.

### Gate E — Operational release safety (blocking)
- [ ] Run end-to-end CRM → Event → Vendor/PO → RAB → Rundown → Quotation/Contract → Invoice → Payment → Report test.
- [ ] Verify responsive iPhone/tablet/desktop flows and basic accessibility.
- [ ] Perform a disposable backup/restore drill, confirm production schema/migration plan and separate secrets.
- [ ] Explicit Owner signoff for PR merges, production Neon migration and Vercel production deployment.

**Non-goals:** no new functional modules, no production migrations, no production release until all gates are evidenced. Keep the ERP Vinca environment separate from Kasapink ERP.


### P0 activation diagnostics (2026-10-13, verified read-only)
- [x] Vercel Preview deployment for commit `70db1de` reached `READY` (build only).
- [x] Resend account has an API key listed, but **no verified sender domain**; API key metadata alone cannot provide the secret value to Vercel.
- [x] Branch-scoped Vercel activation configuration checked: `UAT_ACTIVATION_ENABLED` is not `true`, and `UAT_ACTIVATION_BASE_URL` does not match the tested deployment URL or branch alias.
- [ ] Set a verified sender (or an authorized Resend test sender for its permitted recipient), securely provision Resend sending key under Preview only; never write keys to GitHub.
- [ ] Configure a stable approved Preview origin, verify domain protection/access, set `UAT_ACTIVATION_ENABLED=true` **after** the email/URL/database checks, redeploy Preview, then test activation and login.
- [ ] Verify exact Neon branch target and proceed with multi-tenant and finance HTTP tests on disposable fixtures only.

No production configuration or database was changed by these diagnostics.


## P0 login simplification implementation checkpoint (2026-10-13)

- [x] Login screen now asks only for email and password, without organization slug.
- [x] Server continues validating same-origin requests, password hashes, per-IP/account rate limits, active status and revocable HttpOnly session cookies.
- [x] Email-only identity selection rejects email collisions across all tenants (fail-closed; generic 401). **Before onboarding multiple organizations, ensure unique email ownership or introduce an explicit secure account chooser.**
- [x] Legacy /activate page redirects to /login; obsolete Resend activation request/complete APIs return 410 with Origin validation retained.
- [ ] Admin-provisioned first Owner needs a securely generated password hash and explicit UAT-only update through an authorized secure channel. The existing Owner remains inactive/passwordless.
- [ ] Add/verify administrator-controlled account creation, reset password, role editing, invitation/change-password-on-first-login before general user onboarding.
- [ ] CI and runtime regression validation of the **new** login build, incorrect password, inactive account, cross-tenant duplicate email, rate limits, logout, session expiry.
- [ ] Check that Vercel Preview environment points to isolated Neon UAT (do not print the connection string) and redeploy latest integration commit for browser testing.
- [ ] Complete multi-tenant, finance and backup UAT before production.

This checkpoint replaces the old email-activation workflow: **Resend is not required to log in.** No default password, public registration endpoint, plaintext credential, database write, PR merge or production deployment was made by the login changes.
