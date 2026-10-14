# Final UAT migration preflight — 2026-10-14

Scope: **read-only verification** of Neon UAT branch `br-long-wildflower-b3nsciay`. No migration applied, account activated, release merged, or Vercel deployment triggered.

## Confirmed results
- Branch identity from `current_setting('neon.branch_id',true)`: `br-long-wildflower-b3nsciay`.
- `drizzle.__drizzle_migrations`: **15** records.
- Neither `public.lead_follow_ups` nor `public.crew_assignments` exists.
- `public.events.lead_id`: absent.
- None of the new functions `vinca_guard_followups`, `vinca_guard_crew_assignment`, `vinca_guard_event_origin` exists.
- None of the triggers `lead_follow_ups_tenant_guard`, `crew_assignments_guard`, `events_origin_guard` exists.
- UAT contains one organization, zero active Owner users, and zero events.

## Previously validated on disposable branch
- `0015`: cross-tenant follow-up lead/user insert rejected.
- `0016`: overlapping crew assignment rejected.
- `0017`: duplicate Lead-to-Event and mismatched client rejected.
- Disposable branch has **18** migrations. This is not evidence that the UAT branch has been migrated.

## Migration launch checklist (not yet executed)
1. Confirm UAT branch ID and record restore point before any write.
2. Reconcile 0015–0017 SQL and Drizzle journal hashes against the intended migration runner.
3. Apply migrations in journal order on isolated UAT only, and verify indexes/triggers.
4. Provision/activate Owner through approved credentials/activation workflow; do not expose passwords or session tokens in logs.
5. Run authenticated UAT including CRM, crew conflicts, financial flows, Owner/RBAC and UI.
6. Review UAT results and PR #17. **Production remains NO-GO** until approved.

## Additional closing safeguard
- Event Closing UI now iterates Task pages until all are read.
- Rundown API now returns `hasMore` if 500 segments are exceeded and the UI refuses to unlock completion on a truncated list.
- DB remains authoritative for Event completion guards.
