CREATE FUNCTION vinca_guard_tenant_links() RETURNS trigger LANGUAGE plpgsql AS $vinca$
BEGIN
 IF TG_TABLE_NAME='events' THEN
  IF NOT EXISTS (SELECT 1 FROM clients c WHERE c.id=NEW.client_id AND c.organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'Cross-organization reference rejected in %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
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
 END IF;
 RETURN NEW;
END;
$vinca$;
--> statement-breakpoint
CREATE TRIGGER events_tenant_guard BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER quotations_tenant_guard BEFORE INSERT OR UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER contracts_tenant_guard BEFORE INSERT OR UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER purchase_orders_tenant_guard BEFORE INSERT OR UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER event_costs_tenant_guard BEFORE INSERT OR UPDATE ON event_costs FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER invoices_tenant_guard BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();
--> statement-breakpoint
CREATE TRIGGER invoice_payments_tenant_guard BEFORE INSERT OR UPDATE ON invoice_payments FOR EACH ROW EXECUTE FUNCTION vinca_guard_tenant_links();