import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('drizzle/0013_tenant_link_guards.sql','utf8');
const tables=['events','quotations','contracts','purchase_orders','event_costs','invoices','invoice_payments'];
test('financial LOCK: tenant guards cover financial and source document references',()=>{
 for(const name of tables){
  assert.match(source,new RegExp("TG_TABLE_NAME='"+name+"'"),name+' guard missing');
  assert.match(source,new RegExp('CREATE TRIGGER '+name+'_tenant_guard BEFORE INSERT OR UPDATE ON '+name),name+' update guard missing');
 }
 assert.match(source,/Cross-organization reference rejected/);
 assert.match(source,/RETURN NEW/);
});
test('invoice payment and PO tenant guards require corresponding parent organization',()=>{
 assert.match(source,/TG_TABLE_NAME='invoice_payments'[\s\S]*i.organization_id=NEW.organization_id/);
 assert.match(source,/TG_TABLE_NAME='invoices'[\s\S]*e.organization_id=NEW.organization_id/);
 assert.match(source,/TG_TABLE_NAME='purchase_orders'[\s\S]*v.organization_id=NEW.organization_id/);
 assert.match(source,/p.event_id=NEW.event_id/);
});
test('tenant migration is tracked but never automatically deployed from CI',()=>{
 const entries=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
 assert.equal(entries.at(-3)?.tag,'0013_tenant_link_guards');
 assert.equal(entries.at(-2)?.tag,'0014_tenant_guard_completion');
 assert.equal(entries.at(-3)?.idx,13);
 assert.equal(entries.at(-2)?.idx,14);
 const workflow=readFileSync('.github/workflows/final-integration.yml','utf8');
 assert.doesNotMatch(workflow,/\bnpm run db:migrate\b|vercel deploy/);
});
