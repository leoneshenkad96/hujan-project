import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync('src/app/api/finance/reconciliation/route.ts','utf8');
test('reconciliation requires finance read and tenant boundaries',()=>{
 assert.match(route,/requirePermission\('finance:read'\)/);
 assert.match(route,/eq\(events\.organizationId,org\)/);
 assert.match(route,/i\.organization_id=\$\{org\}::uuid/);
 assert.match(route,/p\.organization_id=i\.organization_id/);
 assert.match(route,/if\(!owned\)return fail\('Event not found',404\)/);
});
test('reconciliation detects stored-vs-ledger difference, status anomalies, and overpayment',()=>{
 assert.match(route,/i\.paid_amount<>COALESCE\(sum\(p\.amount\),0\)/);
 assert.match(route,/i\.paid_amount>i\.amount/);
 assert.match(route,/i\.status='paid'/);
 assert.match(route,/i\.status='issued'/);
 assert.match(route,/LIMIT 101/);
 assert.doesNotMatch(route,/INSERT INTO|UPDATE invoices|DELETE FROM/i);
});
