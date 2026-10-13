CREATE TABLE "lead_follow_ups" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "organization_id" uuid NOT NULL,
 "lead_id" uuid NOT NULL,
 "actor_id" uuid NOT NULL,
 "note" text NOT NULL,
 "next_contact_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lead_follow_ups_lead_created_idx" ON "lead_follow_ups" USING btree ("lead_id","created_at");
--> statement-breakpoint
CREATE INDEX "lead_follow_ups_org_idx" ON "lead_follow_ups" USING btree ("organization_id");
--> statement-breakpoint
CREATE FUNCTION vinca_guard_followups() RETURNS trigger LANGUAGE plpgsql AS $vinca$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM leads l WHERE l.id=NEW.lead_id AND l.organization_id=NEW.organization_id)
 OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.actor_id AND u.organization_id=NEW.organization_id)
 THEN RAISE EXCEPTION 'Cross-organization follow-up reference rejected' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$vinca$;
--> statement-breakpoint
CREATE TRIGGER lead_follow_ups_tenant_guard BEFORE INSERT OR UPDATE ON lead_follow_ups FOR EACH ROW EXECUTE FUNCTION vinca_guard_followups();