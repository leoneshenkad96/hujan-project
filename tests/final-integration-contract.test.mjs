import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const routes=['/api/auth/login','/api/auth/logout','/api/auth/me','/api/crm/clients','/api/crm/leads','/api/events','/api/tasks','/api/vendors','/api/purchase-orders','/api/budgets','/api/rundown','/api/quotations','/api/contracts','/api/invoices','/api/profitability','/api/dashboard'];
test('every integrated ERP module has a committed API route',()=>{
 for(const route of routes)assert.ok(existsSync('src/app'+route+'/route.ts'),route);
});
test('all ten canonical schema migrations are present and ordered',()=>{
 const entries=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
 assert.equal(entries.length,10);
 assert.deepEqual(entries.map(x=>Number(x.tag.substring(0,4))),[0,1,2,3,4,5,6,7,8]);
});
test('release CI has neither production deployment nor database write action',()=>{
 const content=readFileSync('.github/workflows/release-readiness.yml','utf8');
 assert.doesNotMatch(content,/npm run db:migrate|vercel deploy|neonctl branch|RELEASE_APPROVED=YES/);
});
