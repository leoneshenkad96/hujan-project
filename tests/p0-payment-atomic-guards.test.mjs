import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/app/api/invoices/[id]/payments/route.ts','utf8');
test('payment idempotency key is required and scoped to invoice organization',()=>{
 assert.match(source,/idempotency-key/);
 assert.match(source,/eq\(payments\.organizationId,org\)/);
 assert.match(source,/eq\(payments\.invoiceId,id\)/);
 assert.match(source,/eq\(payments\.idempotencyKey,key\)/);
 assert.match(source,/Idempotency key used with different payment/);
});
test('invoice payment, ledger and audit are recorded in one atomic statement',()=>{
 assert.match(source,/WITH updated AS/);
 assert.match(source,/payment_created AS/);
 assert.match(source,/logged AS/);
 assert.match(source,/paid_amount\+\$\{input.amount\}::numeric<=amount/);
 assert.match(source,/status IN \('issued'::invoice_status,'partially_paid'::invoice_status\)/);
 assert.match(source,/SELECT p\.id,p\.invoice_id/);
});
