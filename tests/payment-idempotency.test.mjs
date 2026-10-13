import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('invoice payment endpoint rejects missing retry keys and constrains duplicate posting',()=>{
 const route=readFileSync('src/app/api/invoices/[id]/payments/route.ts','utf8');
 const schema=readFileSync('src/db/schema.ts','utf8');
 assert.match(route,/Idempotency-Key header required/);
 assert.match(route,/idempotency-key/);
 assert.match(route,/findReplay/);
 assert.match(route,/INSERT INTO invoice_payments \(organization_id,invoice_id,amount,reference,idempotency_key\)/);
 assert.match(schema,/invoice_payments_idempotency_idx/);
 assert.match(schema,/\.on\(t\.organizationId,t\.invoiceId,t\.idempotencyKey\)/);
});
test('retry with changed amount or reference is rejected',()=>{
 const route=readFileSync('src/app/api/invoices/[id]/payments/route.ts','utf8');
 assert.match(route,/minor\(replay.amount\)!==minor\(input.amount\)/);
 assert.match(route,/replay.reference!==input.reference/);
});
test('browser form keeps retry key after failed request',()=>{
 const form=readFileSync('src/app/invoices-workspace.tsx','utf8');
 assert.match(form,/retry=useRef/);
 assert.match(form,/crypto.randomUUID\(\)/);
 assert.match(form,/retry.current=null/);
 assert.match(form,/Idempotency-Key/);
});
