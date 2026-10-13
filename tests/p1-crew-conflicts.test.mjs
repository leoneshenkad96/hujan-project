import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('crew schedule migration serializes concurrent assignments and checks overlaps',()=>{
 const sql=readFileSync('drizzle/0016_crew_assignments.sql','utf8');
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/a\.start_at<NEW\.end_at AND a\.end_at>NEW\.start_at/);
 assert.match(sql,/Crew schedule conflict/);
 assert.match(sql,/e\.status NOT IN \('cancelled','completed'\)/);
 assert.match(sql,/crew_assignments_time_valid/);
 assert.match(sql,/organization_id=NEW\.organization_id/);
});
test('crew API verifies permissions, tenant scope and time ordering',()=>{
 const source=readFileSync('src/app/api/crew-assignments/route.ts','utf8');
 assert.match(source,/requirePermission\('tasks:write'\)/);
 assert.match(source,/requirePermission\('events:read'\)/);
 assert.match(source,/eq\(crewAssignments\.organizationId,org\)/);
 assert.match(source,/startAt>=endAt/);
 assert.match(source,/isTrustedOrigin/);
});
test('crew migration is appended after lead follow-ups',()=>{
 const entries=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
 assert.equal(entries.find(x=>x.idx===16)?.tag,'0016_crew_assignments');
 assert.equal(entries.find(x=>x.idx===15)?.tag,'0015_lead_follow_ups');
});
