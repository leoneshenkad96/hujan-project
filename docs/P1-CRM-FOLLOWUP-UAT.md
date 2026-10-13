# P1 CRM Lead Follow-up — UAT Checkpoint

**Implementation:** branch `integration/final-uat`. **Release status:** not yet deploy-ready.

## Delivered
- Tenant-scoped lead list with status filter and pagination, lead creation and controlled lead stage transitions.
- Follow-up timeline via `GET /api/leads/:id/follow-ups?page=1` (20 per page).
- Record a follow-up with `POST /api/leads/:id/follow-ups`, JSON `{"note":"Called client","nextContactAt":"2026-11-01T09:00:00Z"}`; `nextContactAt` optional.
- Server-side authentication and `clients:read` / `clients:write` authorization; trusted-origin checks for writes.
- Tenant-scoped FK and trigger preventing a follow-up from attaching a lead or actor in another organization.
- Closed leads (Won/Lost) cannot be followed up via the API.
- Append-only Drizzle migration `0015_lead_follow_ups` with schema snapshot and journal.

## Evidence
- GitHub Actions CI run `38477610224`: PASS (including migration generation and automated tests).
- Neon *disposable* branch `br-hidden-snow-b3vbe1y4`: 16 migrations.
  - Valid follow-up insert: PASS (one test record).
  - Wrong organization -> lead: blocked by DB trigger.
  - Wrong organization -> actor: blocked by DB trigger.
- Neon primary *UAT* branch `br-long-wildflower-b3nsciay` remains **15 migrations**. Do not claim this feature is deployed there.
- Production branch and default GitHub branch unchanged; no Vercel deployment or merge.

## Remaining
- Full UI for CRM pipeline and follow-ups; notification/reminder delivery is not implemented.
- Authenticated HTTP/UAT test including session, RBAC, and activity creation.
- Review and apply migration 0015 to main UAT only when coordinated for full runtime testing.
- Crew/resource scheduling and cross-event conflict controls remain separate P1 work.
