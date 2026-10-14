-- Usernames are globally unique because login does not require an organization slug.
ALTER TABLE "users" ADD COLUMN "username" varchar(64);
--> statement-breakpoint
-- Preserve existing users with a deterministic unique username derived from their email prefix.
-- Existing UAT Owner becomes leoneshenkad; suffix handles any duplicate prefixes.
UPDATE "users" u SET "username" = left(regexp_replace(lower(split_part(u."email",'@',1)), '[^a-z0-9._-]', '-', 'g'),48) || CASE WHEN x.rn > 1 THEN '-' || x.rn::text ELSE '' END
FROM (SELECT id,row_number() OVER (PARTITION BY lower(split_part(email,'@',1)) ORDER BY created_at,id) AS rn FROM "users") x
WHERE u.id=x.id;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_global_normalized_idx" ON "users" (lower(trim("username")));
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_format_check" CHECK ("username" ~ '^[a-z0-9._-]{3,64}$');