# PR #04 — Authentication and access control

## Security architecture
- Users are scoped by `organization_id`.
- Passwords are hashed with scrypt and random salt (no plaintext passwords in database).
- Login issues cryptographically random 256-bit session tokens.
- The session cookie is HttpOnly, Secure on HTTPS, SameSite=Lax, and expires after 12 hours.
- Only SHA-256 session token hashes are stored in PostgreSQL.
- Logout revokes the server-side session.
- Every authenticated database query must scope organization ID from the session, never from client-controlled request input.
- `/api/auth/me` returns the current user; `/api/auth/permissions` returns effective RBAC permission flags.
- `/api/erp/_example` demonstrates mandatory server-side finance authorization (401 unauthenticated, 403 insufficient role).
- The workspace root redirects to `/login` if no valid session.
- No demo credentials or public initial-admin setup API.

## Provision first owner (manual, development only)
A trusted operator must create an `organizations` row and initial `users` row, with `role='owner'`, using a secure admin connection to the **development branch only**. Create the password hash locally using:
```sh
VINCA_INITIAL_PASSWORD='a-long-random-password' npm run auth:hash
```
Do not paste credentials or password hashes in issues, pull requests, logs, or chat. Prefer a local secure terminal secret input; the command above is illustrative.
No account has been provisioned during PR #04.

## Pending gates
- Both `auth_sessions` and `auth_login_limits` migrations are generated and applied to Neon development. No initial owner has been provisioned.
- Login rate limiting is implemented using atomic PostgreSQL counters keyed by hashed IP and organization+email, 8 requests per 15-minute window. Migration `0002_known_smiling_tiger` has been applied to the **development** branch only. These controls still require adversarial integration tests before public release.
- Review session lifecycle: expiration, revocation, organization membership, and privilege changes.
- Roles are enforced in API/service layers; hidden UI alone is not authorization.
- Do not run auth migrations in production or add a default admin password.

## Planned roles
owner, admin, project_manager, sales, finance, production, crew.

## Verified engineering checks
- GitHub Actions includes TypeScript, lint, Next.js build, Drizzle schema check, and node-based RBAC unit tests.
- Database development migration ledger contains 3 entries, verified with SQL.
- Direct live login/invalid-login, 401/403, session revocation and browser tests remain pending; GitHub CI alone does not establish release readiness.
- Proxy-provided IP headers may depend on hosting trust boundaries; account-key limiting still enforces per-account throttling. Before production, validate trusted proxy configuration.
- Do not assume UI-only demo buttons are protected transaction endpoints. All future real write APIs must call `requirePermission` and derive `organizationId` from the active session.
