import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../scripts/audit-uat-integrity.mjs',import.meta.url),'utf8');
test('integrity auditor is isolated and read only',()=>{
 for(const marker of ['VINCA_UAT_VERIFY_ACK','br-long-wildflower-b3nsciay','neon.branch_id','cross_tenant_payment','invalid_invoice_balance'])assert.ok(src.includes(marker),marker);
 assert.doesNotMatch(src,/\b(?:DELETE FROM|UPDATE\s+users|INSERT INTO|DROP TABLE|ALTER TABLE)\b/i);
});
test('empty UAT fixture cannot be misrepresented as successful end-to-end UAT',()=>{
 assert.match(src,/events_total/);
 assert.match(src,/payments_total/);
 assert.match(src,/login_ready/);
});
