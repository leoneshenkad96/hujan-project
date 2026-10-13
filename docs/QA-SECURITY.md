# PR #15 — QA and Security hardening

## Findings and remediations
- **CSRF**: cookie-authenticated mutation routes formerly accepted a missing Origin header. Introduced `isTrustedOrigin` helper and applied it to mutation routes. In production, missing, malformed or cross-origin requests are denied. Development allows missing Origin for local automated tests.
- **Financial reporting**: reports must never equate PO commitments with actual costs; existing unit tests keep them separate.
- **Multi-tenancy**: server access must obtain `organizationId` from authenticated session and scope every resource. Direct URL and UUID guessing must not expose another tenant's data.
- **Payment integrity**: invoice paid-balance update uses conditional PostgreSQL UPDATE under row lock; ledger/audit SQL remains one transaction statement.

## Automated gates
- TypeScript, ESLint, Node regression tests, Next.js build, Drizzle consistency.
- Added security tests for origin validation and redaction.
- No production secrets, test users or finance records are seeded.

## Still **not verified**, blocking production
- End-to-end authenticated HTTP tests including 401/403, CSRF, tenant isolation, invoice concurrency, and audit rollback.
- Simulated user accounts across at least two organizations for IDOR and permission matrix tests.
- Browser accessibility, mobile/tablet layout, real payment reconciliation.
- Invoicing idempotency to avoid duplicate records on network retries.
- Finance and contract approval authority, database constraints on cross-tenant references, reporting consistency under concurrent writes.
- Penetration testing and secret/dependency audits.

GitHub code review and CI success **do not constitute** completion of these production gates.
