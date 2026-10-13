import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('UAT runner requires two organizations and credentials',()=>{
 const x=readFileSync('scripts/uat-http-smoke.mjs','utf8');
 for(const key of ['UAT_BASE_URL','UAT_ORG_A','UAT_ORG_B','UAT_EMAIL_A','UAT_EMAIL_B','UAT_PASSWORD_A','UAT_PASSWORD_B'])assert.ok(x.includes(key));
});
test('UAT smoke script forbids production/Kasapink targets',()=>{
 const x=readFileSync('scripts/uat-http-smoke.mjs','utf8');
 assert.match(x,/kasapink/i);assert.match(x,/uat\|preview\|localhost/);
 assert.doesNotMatch(x,/process\.env\.DATABASE_URL/);
});
