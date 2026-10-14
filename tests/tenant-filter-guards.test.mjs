import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const routes=[
 'src/app/api/tasks/route.ts',
 'src/app/api/invoices/route.ts'
];
for(const file of routes){
 test(file+' rejects unowned event filters with 404',()=>{
  const source=readFileSync(file,'utf8');
  const get=source.slice(source.indexOf('export async function GET'),source.indexOf('export async function POST'));
  assert.match(get,/eq\(events\.id,eventId\)/);
  assert.match(get,/eq\(events\.organizationId,(a|auth)\.user\.organizationId\)/);
  assert.match(get,/if\(!owned\)return fail\('Event not found',404\)/);
 });
}
test('event and financial entity reads require organization scope',()=>{
 for(const file of ['src/app/api/events/[id]/route.ts','src/app/api/invoices/[id]/payments/route.ts','src/app/api/profitability/route.ts','src/app/api/budgets/route.ts']){
  const source=readFileSync(file,'utf8');
  assert.match(source,/organizationId/,file);
  assert.match(source,/requirePermission\(/,file);
 }
});
