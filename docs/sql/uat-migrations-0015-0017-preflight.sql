-- Vinca ERP — UAT migration preflight (READ ONLY)
-- Run ONLY against database eventorganizer on branch br-long-wildflower-b3nsciay.
-- A mismatch means STOP. This script never changes schema or data.
SELECT
  current_setting('neon.branch_id',true) AS actual_branch,
  CASE WHEN current_setting('neon.branch_id',true)='br-long-wildflower-b3nsciay'
    THEN 'PASS' ELSE 'STOP: WRONG BRANCH' END AS target_guard,
  (SELECT count(*) FROM drizzle.__drizzle_migrations) AS migration_count,
  (SELECT count(*) FROM users WHERE role='owner' AND active=true) AS active_owner_count,
  to_regclass('public.lead_follow_ups') AS follow_up_table,
  to_regclass('public.crew_assignments') AS crew_assignment_table,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema='public'
      AND table_name='events' AND column_name='lead_id') AS lead_id_columns,
  (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal
      AND tgname IN ('lead_follow_ups_tenant_guard','crew_assignments_guard','events_origin_guard')) AS new_trigger_count;
-- Before migration expect 15 migrations, no new tables/columns/triggers.
-- After migration expect 18 migrations, both tables, lead_id_columns=1 and new_trigger_count=3.
-- Passing preflight DOES NOT replace an independently verified restore point or authenticated UAT.
