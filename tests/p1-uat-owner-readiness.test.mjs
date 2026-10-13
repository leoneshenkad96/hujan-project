import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('UAT Owner bootstrap checks exact database and full migration readiness before reading credentials',()=>{
 const source=readFileSync('scripts/bootstrap-uat-owner.mjs','utf8');
 assert.match(source,/scope\[0\]\.project_id!=='fancy-cell-64250119'/);
 assert.match(source,/scope\[0\]\.branch_id!=='br-long-wildflower-b3nsciay'/);
 assert.match(source,/migration_count\)!==18/);
 assert.match(source,/has_followups/);
 assert.match(source,/has_crew/);
 assert.match(source,/lead_columns\)!==1/);
 assert.match(source,/guard_triggers\)!==3/);
 assert.ok(source.indexOf('const ready=await db')<source.indexOf('const password=await readSecret()'));
 assert.match(source,/password_hash IS NULL RETURNING id/);
 assert.match(source,/!stdin\.isTTY/);
});
