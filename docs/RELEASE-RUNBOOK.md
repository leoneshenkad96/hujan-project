# Vinca Event Organizer ERP — Production Release Runbook

**Status: Release preparation only. Deployment prohibited until owner approval and all blocking UAT is complete.**

## 1. Change management and branch order
This repository is a **stack of pull requests**: PR #01 → #02 → ... → #16. Each PR targets its immediate predecessor, not `main`. GitHub CI success on a stacked PR **does not** guarantee the final combined `main` works after rebase/merge. Review in dependency order. Preserve the exact tested commit SHAs and rerun the full suite against a candidate merge commit before publishing.

Never modify the unrelated Kasapink ERP repository, Vercel project, or Neon database. Vinca resources only.

## 2. Release blockers (must all be signed off)
- [ ] PR #01–#16 code reviewed, dependency chain reconciled, final combined branch passes full CI
- [ ] Provision a first owner account securely; no login-ready seed admin currently exists
- [ ] Test at least two **isolated organizations** with different roles and fixtures in development
- [ ] HTTP UAT: authentication, permission 401/403, tenant isolation/IDOR, CSRF, session expiration and rate limiting
- [ ] Financial UAT: simultaneous invoice payments, overpayment prevention, retry idempotency, audit rollback and reconciliation
- [ ] Verify sales quote/contract approval and signature model does not misrepresent legal acceptance
- [ ] Verify budget/PO/expenses reports against manually reconciled ledgers
- [ ] Browser UAT on mobile/tablet/desktop including keyboard navigation, modal focus, screen readers, long tables
- [ ] Perform threat model, dependency vulnerability scan, security headers, CSP and production proxy/IP trust review
- [ ] Backup and restore drill, availability monitoring, secret rotation and incident response contacts
- [ ] Explicit written release approval **separate from approval to code review**

## 3. Prepare infrastructure, without deploying
- Use the isolated Vinca Event Organizer ERP GitHub repository, Neon `ERP-eventorganizer` production branch, and only the EO Vercel project.
- Verify project IDs/scope in providers at execution time rather than relying on names alone.
- Configure scoped environment variables: `DATABASE_URL` (different production and preview/dev URLs), `NODE_ENV=production` for production. Never copy production secrets to Preview.
- Production database SSL must be required; validate credential permissions and connection string role.
- Ensure database branch backups, point-in-time restore capability and backup retention satisfy the recovery plan.
- Do not expose DATABASE_URL in build logs, GitHub artifacts, screenshots, or source control.
- Run `node scripts/release-preflight.mjs` locally/CI. Passing is **not** deploy authorization.
- To use production preflight, the release executor needs both `RELEASE_ENV=production` and `RELEASE_APPROVED=YES` as an explicit control; these flags alone still do not authorize a deploy.

## 4. Migrations, only after approval
Seven canonical Drizzle migrations are committed: `0000` through `0006`. Development has 7 ledger entries. Production migration history may differ; inspect production **read-only** and compare `drizzle.__drizzle_migrations`, schema/table ownership and any existing customer data.

1. Before touching production, obtain owner authorization covering schema change and deployment separately.
2. Take a restore point or branch/snapshot and verify a restore in a disposable environment.
3. Run migrations first on a disposable clone of the production branch and regression-test data preservation.
4. Confirm correct DATABASE_URL points to EO production (not Kasapink).
5. Freeze writes, determine migration compatibility and acceptable downtime.
6. Apply reviewed migrations in order with `npm run db:migrate` on an **approved trusted release runner only**.
7. Verify schema and migration ledger, then perform smoke tests. Do not generate new SQL during deployment.
8. If a migration fails, stop deployment, investigate and restore only from an explicitly approved plan. Never issue a blind down migration against production data.

## 5. Deployment and verification, only after approval
- Deploy only the EO Vercel project from a fully tested merge candidate; inspect build logs and correct project/team scope.
- Ensure protection for preview environments and a separately configured production DATABASE_URL.
- Validate login/logout, health, RBAC, all finance endpoints, event operations and reports with a minimal authorized smoke-test account.
- Confirm cookies Secure, HttpOnly and SameSite, TLS, response security headers, no error stack leaks and no tenant data exposure.
- Monitor 4xx/5xx, latency, failed authentication rate, database errors and financial ledger invariants.
- Hold a go/no-go review with named owner signoff and rollback contact.

## 6. Rollback
Application rollback: redeploy prior verified app artifact, if schema is backward-compatible. Database rollback is **not** achieved by reverting code. For incompatible schema changes, stop writes and use verified PITR/snapshot restore after formal approval; preserve new legitimate data separately if recovery requires a restore.

## 7. Current release decision
**NO-GO for production**. Static CI and migration tests passed on feature branches, but live multi-tenant, finance concurrency and browser UAT, first owner provisioning, and production deployment approval are outstanding.
