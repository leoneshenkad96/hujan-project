CREATE UNIQUE INDEX IF NOT EXISTS "users_org_id_pair_idx" ON "users" ("organization_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_org_id_pair_idx" ON "events" ("organization_id", "id");
--> statement-breakpoint
CREATE TABLE "client_event_access" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_event_access_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade,
	CONSTRAINT "client_event_access_user_org_fk" FOREIGN KEY ("organization_id", "user_id") REFERENCES "public"."users"("organization_id", "id") ON DELETE cascade,
	CONSTRAINT "client_event_access_event_org_fk" FOREIGN KEY ("organization_id", "event_id") REFERENCES "public"."events"("organization_id", "id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "client_event_access_user_idx" ON "client_event_access" ("user_id");
--> statement-breakpoint
CREATE INDEX "client_event_access_event_idx" ON "client_event_access" ("organization_id", "event_id");
