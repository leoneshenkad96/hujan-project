ALTER TABLE "events" ADD COLUMN "lead_id" uuid;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");
--> statement-breakpoint
CREATE UNIQUE INDEX "events_lead_unique_idx" ON "events" USING btree ("lead_id");
--> statement-breakpoint
CREATE FUNCTION vinca_guard_event_origin() RETURNS trigger LANGUAGE plpgsql AS $vinca$
BEGIN
 IF NEW.lead_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM leads l
  WHERE l.id=NEW.lead_id AND l.organization_id=NEW.organization_id
   AND l.client_id=NEW.client_id AND l.status='won'
 ) THEN RAISE EXCEPTION 'Event lead must be won and match organization and client' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$vinca$;
--> statement-breakpoint
CREATE TRIGGER events_origin_guard BEFORE INSERT OR UPDATE ON "events" FOR EACH ROW EXECUTE FUNCTION vinca_guard_event_origin();