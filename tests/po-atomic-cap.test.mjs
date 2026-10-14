import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const endpoint=readFileSync('src/app/api/budgets/expenses/route.ts','utf8');
const report=readFileSync('src/app/api/budgets/route.ts','utf8');
const migration=readFileSync('drizzle/0012_po_match_balance.sql','utf8');
test('PO expense match uses atomic row-update constraint ahead of insert and audit',()=>{
 assert.match(endpoint,/UPDATE purchase_orders[\s\S]*matched_actual=matched_actual\+/);
 assert.match(endpoint,/matched_actual\+\$\{input.amount\}::numeric<=amount/);
 assert.match(endpoint,/WHERE \$\{input.purchaseOrderId\}::uuid IS NULL OR EXISTS \(SELECT 1 FROM reserved\)/);
 assert.match(endpoint,/INSERT INTO audit_logs/);
});
test('PO matched actuals are backfilled before strict amount constraint',()=>{
 assert.ok(migration.indexOf('UPDATE "purchase_orders"')<migration.indexOf('ADD CONSTRAINT'));
 assert.match(migration,/CHECK \("matched_actual" >= 0 AND "matched_actual" <= "amount"\)/);
});
test('RAB forecast uses persisted PO matched amount',()=>{
 assert.match(report,/matchedActual:purchaseOrders\.matchedActual/);
 assert.match(report,/matchedActual:o\.matchedActual/);
});
