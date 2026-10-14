# PR #10 — Rundown & Show Management

## Scope
- Event-specific segments with position, start/end clock time, cue note, optional user PIC, and state.
- API: `GET/POST /api/rundown`, `PATCH /api/rundown/[id]`.
- Reads require `events:read`; writes require `rundown:write`. All data is filtered by organization on the server, and event/PIC references are verified against the signed-in organization.
- Responsive Rundown workspace uses Neon-backed API; no hardcoded sample cues.

## Data and migration
- Canonical Drizzle migration: `drizzle/0004_pretty_korg.sql`.
- Applied **only** to Neon `ERP-eventorganizer` / `development` / `eventorganizer`.
- Development migration ledger: 5 entries, rundown table verified, 0 seeded segments.
- No production migration.

## Important limitations
- Clock times are `HH:mm` in one event-local day; overnight events and timezones require a subsequent redesign with day offsets or zoned timestamps.
- Position and time intervals are validated but overlapping segments or duplicate position numbers are not yet prevented by business rules.
- Status changes have RBAC enforcement but do not yet implement approval, immutable show logs, or real-time broadcasting.
- Browser/API end-to-end testing is deferred. Review live 401/403, tenant isolation, concurrent cue updates, and tablet/mobile layout before release.
