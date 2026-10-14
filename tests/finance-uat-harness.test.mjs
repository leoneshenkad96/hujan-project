import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const harness=readFileSync('scripts/uat-finance-concurrency.mjs','utf8');
test('concurrency UAT requires explicit disposable write approval, distinct organizations, fixture invoices',()=>{
 for(const key of ['UAT_FINANCE_WRITE_ACK','DISPOSABLE_UAT_ONLY','UAT_EXACT_ALLOWED_ORIGIN','UAT_INVOICE_A','UAT_INVOICE_B','UAT_ORG_A','UAT_ORG_B','UAT_USERNAME_A','UAT_USERNAME_B'])assert.ok(harness.includes(key));
 assert.match(harness,/JSON\.stringify\(\{username,password\}\)/);
 assert.match(harness,/UAT_ORG_A===e\.UAT_ORG_B/);
 assert.match(harness,/UAT_INVOICE_A===e\.UAT_INVOICE_B/);
});
test('concurrency UAT rejects other host and protects production',()=>{
 assert.match(harness,/origin!==e\.UAT_EXACT_ALLOWED_ORIGIN/);
 assert.match(harness,/\.vercel\.app/);
 assert.match(harness,/kasapink-erp/);
});
test('concurrency UAT verifies two writes with same key only record one row',()=>{
 assert.match(harness,/Promise\.all\(\[post\(key\),post\(key\)\]\)/);
 assert.match(harness,/\[200,201\]/);
 assert.match(harness,/first\.body\.payment\.id,second\.body\.payment\.id/);
 assert.match(harness,/reference:'DIFFERENT REFERENCE'/);
 assert.match(harness,/cross\.status,404/);
 assert.match(harness,/crossWrite\.status,409/);
});
