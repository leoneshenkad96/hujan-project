import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync('src/app/api/invoices/[id]/payments/route.ts','utf8');
const profit=readFileSync('src/app/api/profitability/route.ts','utf8');
test('financial LOCK: payment writes are scoped and payment, balance and audit stay atomic',()=>{
 for(const marker of ["requirePermission('finance:write')",'eq(payments.organizationId,org)','UPDATE invoices','INSERT INTO invoice_payments','INSERT INTO audit_logs','idempotency-key','paid_amount+'])assert.ok(route.includes(marker),marker);
 assert.match(route,/AND organization_id=\$\{org\}::uuid/);
 assert.match(route,/paid_amount\+\$\{input.amount\}::numeric<=amount/);
 assert.match(route,/WITH updated AS[\s\S]*payment_created AS[\s\S]*logged AS/);
});
test('financial LOCK: profitability payment scope excludes both draft and voided invoices',()=>{
 assert.match(profit,/invoiceRows\.filter\(x=>x\.status!=='draft'&&x\.status!=='voided'\)\.map\(x=>x\.id\)/);
 assert.match(profit,/eq\(payments.organizationId,org\)/);
});
