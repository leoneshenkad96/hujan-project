ALTER TABLE "quotations" ADD COLUMN "line_items" jsonb;
ALTER TABLE "quotations" ADD COLUMN "discount_amount" numeric(18,2) DEFAULT 0 NOT NULL;
ALTER TABLE "quotations" ADD COLUMN "tax_rate_percent" numeric(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE "quotations" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;
ALTER TABLE "quotations" ADD COLUMN "previous_quotation_id" uuid;