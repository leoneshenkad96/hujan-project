import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../scripts/verify-uat-schema.mjs',import.meta.url),'utf8');
test('UAT verifier is explicitly scoped and read only',()=>{
 assert.match(src,/VINCA_UAT_VERIFY_ACK/);
 assert.match(src,/br-long-wildflower-b3nsciay/);
 assert.match(src,/current_setting\('neon\.branch_id',true\)/);
 assert.match(src,/current_setting\('neon\.project_id',true\)/);
 assert.match(src,/Wrong UAT database/);
 assert.match(src,/SELECT count\(\*\)/);
 assert.doesNotMatch(src,/\b(?:UPDATE|DELETE|INSERT|ALTER|DROP|CREATE TABLE)\b/i);
});
test('migration ledger and normalized index status must agree',()=>{
 assert.match(src,/normalizedEmailDuplicates/);
 assert.match(src,/expectedMigrations=journal\.entries\.length/);
 assert.match(src,/applied!==expectedMigrations\|\|!hasIndex/);
});
