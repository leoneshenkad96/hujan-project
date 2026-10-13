ALTER TABLE "purchase_orders" ADD COLUMN "matched_actual" numeric(18,2) DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "purchase_orders" p SET "matched_actual" = a.total
FROM (SELECT purchase_order_id, SUM(amount) AS total FROM "event_costs"
 WHERE purchase_order_id IS NOT NULL AND status='actual' GROUP BY purchase_order_id) a
WHERE p.id=a.purchase_order_id;
--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_matched_amount_valid" CHECK ("matched_actual" >= 0 AND "matched_actual" <= "amount");