CREATE OR REPLACE FUNCTION vinca_guard_tenant_links() RETURNS trigger LANGUAGE plpgsql AS $vinca$
BEGIN
 IF TG_TABLE_NAME='events' THEN
  IF NOT EXISTS (SELECT 1 FROM clients c WHERE c.id=NEW.client_id AND c.organization_id=NEW.organization_id) OR (NEW.project_manager_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.project_manager_id AND u.organization_id=NEW.organization_id)) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='quotations' THEN
  IF NOT EXISTS (SELECT 1 FROM events e JOIN clients c ON c.id=NEW.client_id AND c.id=e.client_id WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id AND c.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='contracts' THEN
  IF NOT EXISTS (SELECT 1 FROM quotations q WHERE q.id=NEW.quotation_id AND q.event_id=NEW.event_id AND q.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='purchase_orders' THEN
  IF NOT EXISTS (SELECT 1 FROM events e JOIN vendors v ON v.id=NEW.vendor_id WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id AND v.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='event_costs' THEN
  IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id) OR (NEW.vendor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id=NEW.vendor_id AND v.organization_id=NEW.organization_id)) OR (NEW.purchase_order_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id=NEW.purchase_order_id AND p.organization_id=NEW.organization_id AND p.event_id=NEW.event_id AND (NEW.vendor_id IS NULL OR p.vendor_id=NEW.vendor_id))) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='invoices' THEN
  IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='invoice_payments' THEN
  IF NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id=NEW.invoice_id AND i.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='leads' THEN
  IF NEW.client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id=NEW.client_id AND c.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='event_tasks' THEN
  IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id) OR (NEW.owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.owner_id AND u.organization_id=NEW.organization_id)) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='rundown_items' THEN
  IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id=NEW.event_id AND e.organization_id=NEW.organization_id) OR (NEW.pic_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.pic_id AND u.organization_id=NEW.organization_id)) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='auth_sessions' THEN
  IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.user_id AND u.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='audit_logs' THEN
  IF NEW.actor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id=NEW.actor_id AND u.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$vinca$;
--> statement-breakpoint
CREATE TRIGGER leads_tenant_guard BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER event_tasks_tenant_guard BEFORE INSERT OR UPDATE ON event_tasks FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER rundown_items_tenant_guard BEFORE INSERT OR UPDATE ON rundown_items FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER auth_sessions_tenant_guard BEFORE INSERT OR UPDATE ON auth_sessions FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER audit_logs_tenant_guard BEFORE INSERT OR UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();