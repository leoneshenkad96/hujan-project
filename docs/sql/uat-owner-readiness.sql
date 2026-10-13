-- Vinca ERP: Owner activation readiness (READ ONLY)
-- Run on isolated UAT only, never infer that this activates a user.
SELECT current_setting('neon.branch_id', true) AS branch_id,
       (SELECT count(*) FROM drizzle.__drizzle_migrations) AS migration_count,
       (SELECT count(*) FROM organizations) AS organization_count,
       (SELECT count(*) FROM users WHERE role = 'owner') AS owner_count,
       (SELECT count(*) FROM users WHERE role = 'owner' AND active) AS active_owner_count,
       (SELECT count(*) FROM users WHERE role = 'owner' AND active AND password_hash IS NOT NULL) AS owner_with_password_count,
       (SELECT count(*) FROM users WHERE lower(trim(email)) = 'leoneshenkad@gmail.com') AS requested_login_identity_count,
       (SELECT count(*) FROM users WHERE lower(trim(email)) = 'leoneshenkad@gmail.com' AND role='owner' AND active AND password_hash IS NOT NULL) AS requested_login_ready_count;
-- Do not disclose password hashes, token material, or user identifiers in reports.
