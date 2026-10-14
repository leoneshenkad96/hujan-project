CREATE TABLE "crew_assignments" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "organization_id" uuid NOT NULL,
 "event_id" uuid NOT NULL,
 "user_id" uuid NOT NULL,
 "role" varchar(100) NOT NULL,
 "start_at" timestamp with time zone NOT NULL,
 "end_at" timestamp with time zone NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "crew_assignments_time_valid" CHECK ("start_at" < "end_at")
);
--> statement-breakpoint
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");
--> statement-breakpoint
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");
--> statement-breakpoint
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
--> statement-breakpoint
CREATE INDEX "crew_assignments_user_time_idx" ON "crew_assignments" ("organization_id","user_id","start_at");
--> statement-breakpoint
CREATE INDEX "crew_assignments_event_idx" ON "crew_assignments" ("organization_id","event_id");
--> statement-breakpoint
CREATE FUNCTION vinca_guard_crew_assignment() RETURNS trigger LANGUAGE plpgsql AS $vinca$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,0));
 IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id AND e.status NOT IN ('completed','cancelled'))
 OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.user_id AND u.organization_id=NEW.organization_id AND u.active=true)
 THEN RAISE EXCEPTION 'Invalid tenant, inactive crew member or closed event' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM crew_assignments a JOIN events e ON e.id=a.event_id
 WHERE a.organization_id=NEW.organization_id AND a.user_id=NEW.user_id
 AND a.id<>NEW.id AND a.start_at<NEW.end_at AND a.end_at>NEW.start_at
 AND e.status NOT IN ('cancelled','completed'))
 THEN RAISE EXCEPTION 'Crew schedule conflict' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$vinca$;
--> statement-breakpoint
CREATE TRIGGER crew_assignments_guard BEFORE INSERT OR UPDATE ON "crew_assignments" FOR EACH ROW EXECUTE FUNCTION vinca_guard_crew_assignment();