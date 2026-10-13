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
- Migration for `auth_sessions` must be generated, reviewed and tested on Neon development before session endpoints can work.
- Login rate limiting and brute-force protection must be installed before any public authentication endpoint or production release.
- Review session lifecycle: expiration, revocation, organization membership, and privilege changes.
- Roles are enforced in API/service layers; hidden UI alone is not authorization.
- Do not run auth migrations in production or add a default admin password.

## Planned roles
owner, admin, project_manager, sales, finance, production, crew.
