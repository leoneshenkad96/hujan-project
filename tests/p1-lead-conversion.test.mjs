import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Lead conversion requires Won status, matching client and single event',()=>{
 const route=readFileSync('src/app/api/leads/[id]/convert/route.ts','utf8');
 const migration=readFileSync('drizzle/0017_event_lead_conversion.sql','utf8');
 assert.match(route,/requirePermission\('events:write'\)/);
 assert.match(route,/lead\.status!=='won'/);
 assert.match(route,/input\.clientId!==lead\.clientId/);
 assert.match(route,/onConflictDoNothing\(\{target:events\.leadId\}\)/);
 assert.match(migration,/CREATE UNIQUE INDEX "events_lead_unique_idx"/);
 assert.match(migration,/l\.organization_id=NEW\.organization_id/);
 assert.match(migration,/l\.client_id=NEW\.client_id AND l\.status='won'/);
});
test('Event closure guards incomplete task and rundown rows',()=>{
 const route=readFileSync('src/app/api/events/[id]/route.ts','utf8');
 assert.match(route,/notExists\(db\.select\(\{id:tasks\.id\}\)/);
 assert.match(route,/notInArray\(tasks\.status,\['done'\]\)/);
 assert.match(route,/notExists\(db\.select\(\{id:rundownItems\.id\}\)/);
 assert.match(route,/notInArray\(rundownItems\.status,\['done','skipped'\]\)/);
});
test('conversion migration follows scheduling in journal',()=>{
 const entries=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
 assert.equal(entries.find(x=>x.idx===17)?.tag,'0017_event_lead_conversion');
});
