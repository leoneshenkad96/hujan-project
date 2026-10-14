import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {can,ROLES,PERMISSIONS} from '../src/lib/permissions.ts';
test('seven roles use a default-deny access matrix',()=>{
 assert.equal(ROLES.length,7);
 for(const name of Object.keys(PERMISSIONS)){
  assert.equal(can('unknown',name),false);
  assert.equal(can('owner',name),true);
 }
 for(const role of ['sales','production','crew','project_manager'])
  assert.equal(can(role,'finance:write'),false);
 assert.equal(can('finance','clients:write'),false);
});
test('payment and financial reports enforce server authorization',()=>{
 const paths=['src/app/api/invoices/[id]/payments/route.ts','src/app/api/profitability/route.ts','src/app/api/budgets/expenses/route.ts'];
 for(const path of paths){
  const src=readFileSync(path,'utf8');
  assert.match(src,/requirePermission\('finance:(read|write)'\)/);
  assert.match(src,/organizationId|organization_id/);
 }
});
