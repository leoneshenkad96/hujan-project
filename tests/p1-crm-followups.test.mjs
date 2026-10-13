import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('CRM follow-up route enforces permission and organization on reads and writes',()=>{
 const src=readFileSync('src/app/api/leads/[id]/follow-ups/route.ts','utf8');
 assert.match(src,/requirePermission\('clients:read'\)/);
 assert.match(src,/requirePermission\('clients:write'\)/);
 assert.match(src,/eq\(leadFollowUps\.organizationId,org\)/);
 assert.match(src,/isTrustedOrigin/);
 assert.match(src,/Closed lead cannot receive follow-up/);
});
test('CRM follow-up migration includes tenant ownership guard and indexes',()=>{
 const sql=readFileSync('drizzle/0015_lead_follow_ups.sql','utf8');
 assert.match(sql,/CREATE TRIGGER lead_follow_ups_tenant_guard/);
 assert.match(sql,/l.organization_id=NEW.organization_id/);
 assert.match(sql,/u.organization_id=NEW.organization_id/);
 assert.match(sql,/lead_follow_ups_lead_created_idx/);
 const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8'));
 assert.equal(journal.entries.find(x=>x.idx===15).tag,'0015_lead_follow_ups');
});
