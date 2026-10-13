# UAT Migration 0015–0017 — Execution Gate

Date: 2026-10-14. **Status: BLOCKED — no writes to primary UAT.**

## Verified UAT target (read-only)
- Neon project: `fancy-cell-64250119`
- Isolated UAT: `br-long-wildflower-b3nsciay`; primary=false, default=false, protected=false.
- Database: `eventorganizer`; current branch ID confirmed by `current_setting('neon.branch_id',true)`.
- Migration ledger: 15 entries.
- Missing as expected: `lead_follow_ups`, `crew_assignments`, `events.lead_id`.
- No active Owner account.

## Backup gate — not met
- Neon `create_snapshot` failed with `not allowed to snapshot non-root branch`.
- Attempt to create a no-compute child branch restore point was blocked by connector safety checks.
- **Neither backup nor migrations were created on the UAT target.** Do not work around the safety block by issuing SQL writes or targetting another branch.
- Next action: create/approve an authorized UAT restore point through supported Neon controls, confirm its branch identifier and recoverability, then explicitly resume the UAT migration procedure.

## Release guardrails
- CI workflow `.github/workflows/final-integration.yml` contains read-only release preflight, typecheck, lint, tests, build, drizzle check and dependency audit; it does not call `db:migrate` or deploy.
- Migration order: `0015_lead_follow_ups` -> `0016_crew_assignments` -> `0017_event_lead_conversion`.
- Each migration has been applied and tested in the prior **disposable** Neon environment, not this target.
- Do not activate or publish Owner credentials until the target is migration-ready and an authenticated UAT runtime is available.
- Do not merge or deploy without user authorization.

## Required post-migration checks
1. Migration ledger count becomes 18 with canonical hash and journal ordering.
2. New tables, unique index `events_lead_unique_idx`, tenant guard triggers, and column are present.
3. Owner activation and role-scoped HTTP UAT, CRM lead conversion, Crew Scheduling, and Closing flow all pass.
4. Finalize review of PR #17; production remains NO-GO until signed off.
