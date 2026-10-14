import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const harness=readFileSync('scripts/uat-finance-concurrency.mjs','utf8');
test('concurrency UAT requires explicit disposable write approval and the two named fixture accounts',()=>{
 for(const key of ['UAT_FINANCE_WRITE_ACK','DISPOSABLE_UAT_ONLY','UAT_EXACT_ALLOWED_ORIGIN','UAT_PASSWORD_A','UAT_PASSWORD_B','uat_finance_a','uat_finance_b'])assert.ok(harness.includes(key));
 assert.match(harness,/JSON\.stringify\(\{username,password\}\)/);
 assert.match(harness,/userA\.organizationId,userB\.organizationId/);
 assert.match(harness,/body\.user\?\.role,'finance'/);
 assert.match(harness,/readPassword\(username\)/);
 assert.match(harness,/stdin\.isTTY/);
});
test('concurrency UAT rejects other host and protects production',()=>{
 assert.match(harness,/origin!==e\.UAT_EXACT_ALLOWED_ORIGIN/);
 assert.match(harness,/\.vercel\.app/);
 assert.match(harness,/kasapink-erp/);
 assert.match(harness,/localhost\|127/);
 assert.match(harness,/UAT_LOCAL_TARGET_TOKEN/);
 assert.ok(harness.indexOf('/api/uat/local-test-target')<harness.indexOf("readPassword('uat_finance_a')"));
});
test('local UAT identity endpoint is development-only, token-gated and pinned to the disposable branch',()=>{
 const target=readFileSync('src/app/api/uat/local-test-target/route.ts','utf8');
 assert.match(target,/process\.env\.NODE_ENV !== 'development'/);
 assert.match(target,/timingSafeEqual/);
 assert.match(target,/fancy-cell-64250119/);
 assert.match(target,/br-green-pine-b39zmics/);
 assert.match(target,/eventorganizer/);
 assert.match(target,/current_setting\('neon\.branch_id', true\)/);
 assert.doesNotMatch(target,/\b(?:UPDATE|DELETE|INSERT|ALTER|DROP|CREATE TABLE)\b/i);
});
test('concurrency UAT verifies two writes with same key only record one row',()=>{
 assert.match(harness,/Promise\.all\(\[post\(key\),post\(key\)\]\)/);
 assert.match(harness,/\[200,201\]/);
 assert.match(harness,/first\.body\.payment\.id,second\.body\.payment\.id/);
 assert.match(harness,/reference:'DIFFERENT REFERENCE'/);
 assert.match(harness,/cross\.status,404/);
 assert.match(harness,/crossWrite\.status,409/);
});
test('concurrency UAT proves fixture ownership and invoice-list isolation before writing',()=>{
 assert.match(harness,/const invoiceA=dataA\.items\.find/);
 assert.match(harness,/const invoiceB=dataB\.items\.find/);
 assert.match(harness,/!dataB\.items\.some\(x=>x\.id===invoiceA\.id\)/);
 assert.match(harness,/!dataA\.items\.some\(x=>x\.id===invoiceB\.id\)/);
 assert.ok(harness.indexOf('both authenticated accounts see only their own invoice fixtures')<harness.indexOf('const paymentPath='));
});
