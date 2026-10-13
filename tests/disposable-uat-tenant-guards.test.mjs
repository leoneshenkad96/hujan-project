import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('tenant ownership is mandatory for event creation and listing',()=>{
 const src=read('src/app/api/events/route.ts');
 assert.match(src,/eq\(events\.organizationId,organizationId\)/);
 assert.match(src,/eq\(clients\.organizationId,organizationId\)/);
});
test('quote cannot be created against an event in another organization',()=>{
 const src=read('src/app/api/quotations/route.ts');
 assert.match(src,/eq\(events\.organizationId,org\)/);
 assert.match(src,/eq\(quotations\.organizationId,org\)/);
});
test('contract and PO creation check tenant ownership of referenced records',()=>{
 const contract=read('src/app/api/contracts/route.ts');
 const po=read('src/app/api/purchase-orders/route.ts');
 assert.match(contract,/eq\(quotations\.organizationId,org\)/);
 assert.match(po,/eq\(events\.organizationId,org\)/);
 assert.match(po,/eq\(vendors\.organizationId,org\)/);
});
test('expense matching requires same event and tenant as linked PO',()=>{
 const src=read('src/app/api/budgets/expenses/route.ts');
 assert.match(src,/eq\(purchaseOrders\.organizationId,org\)/);
 assert.match(src,/eq\(purchaseOrders\.eventId,input\.eventId\)/);
 assert.match(src,/organization_id=\$\{org\}::uuid AND event_id=\$\{input.eventId\}::uuid/);
});
