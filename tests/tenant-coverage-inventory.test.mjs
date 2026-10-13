import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('drizzle/0013_tenant_link_guards.sql','utf8');
test('P0 tenant-scope coverage inventory for pending remediation',()=>{
 const covered=['events','quotations','contracts','purchase_orders','event_costs','invoices','invoice_payments'];
 for(const table of covered)assert.match(source,new RegExp("CREATE TRIGGER "+table+"_tenant_guard"));
 const pending=['leads','event_tasks','rundown_items','auth_sessions','audit_logs'];
 for(const table of pending)assert.doesNotMatch(source,new RegExp("CREATE TRIGGER "+table+"_tenant_guard"));
});
test('P0 mandatory follow-up: event project manager tenant relation is currently unguarded',()=>{
 assert.doesNotMatch(source,/NEW\.project_manager_id/);
});
