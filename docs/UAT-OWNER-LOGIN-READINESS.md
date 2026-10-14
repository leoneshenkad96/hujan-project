# Vinca Owner Login — UAT Readiness

Status: **NOT ACTIVATED / NO AUTHENTICATED UAT** (2026-10-14).

## Confirmed implementation
- Login API `POST /api/auth/login` expects JSON email/password, enforces origin check, rate limit, normalized email identity and active user status.
- Password verifier uses scrypt and checks `password_hash`; passwords are never stored in plaintext.
- Login form exists at `/login`. A passing build is **not** a working hosted UAT login.
- Requested Owner email: `leoneshenkad@gmail.com`. No password or token should be included in GitHub issues, commits, chat, or SQL reports.

## Preconditions
1. UAT restore point explicitly approved and verified; apply migrations 0015–0017 on UAT only.
2. UAT environment with application URL and database branch configured separately from production.
3. Run `docs/sql/uat-owner-readiness.sql` read-only. Exactly one email identity must exist; the owner must be active and have a valid stored password hash before password login can succeed.
4. Any activation credential must be generated and transmitted using an approved, private flow; do not generate or publicize fixed default passwords.
5. Test login, wrong password, login rate limiting, logout, session expiry, RBAC and tenant isolation using real authenticated HTTP requests.

## Gap
A reviewed, secure Owner activation workflow has not yet been identified in the current integration branch. The hash helper `scripts/hash-password.mjs` only generates a hash locally; it does not provision or activate a user. No activation was performed in this work. Do not assume login is ready.

## Production gate
Merge, deployments and writes to production remain prohibited without explicit sign-off.
