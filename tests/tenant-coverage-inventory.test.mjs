import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=readFileSync('drizzle/0013_tenant_link_guards.sql','utf8');
const completion=readFileSync('drizzle/0014_tenant_guard_completion.sql','utf8');
test('P0 all tenant link guards are tracked in append-only migrations',()=>{
 for(const name of ['events','quotations','contracts','purchase_orders','event_costs','invoices','invoice_payments'])
  assert.match(base,new RegExp('CREATE TRIGGER '+name+'_tenant_guard'));
 for(const name of ['leads','event_tasks','rundown_items','auth_sessions','audit_logs']){
  assert.match(completion,new RegExp("TG_TABLE_NAME='"+name+"'"));
  assert.match(completion,new RegExp('CREATE TRIGGER '+name+'_tenant_guard'));
 }
 assert.match(completion,/NEW\.project_manager_id/);
 assert.match(completion,/CREATE OR REPLACE FUNCTION vinca_guard_tenant_links/);
});
test('P0 tenant guards cover task and rundown assignees, session user and audit actor',()=>{
 for(const ref of ['NEW.owner_id','NEW.pic_id','NEW.user_id','NEW.actor_id','NEW.project_manager_id'])
  assert.ok(completion.includes(ref),ref);
});
