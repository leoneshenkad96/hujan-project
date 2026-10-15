import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ROLES,PERMISSIONS,can} from '../src/lib/permissions.ts';

const read=path=>readFileSync(path,'utf8');

test('client viewer role has no internal ERP permissions',()=>{
 assert.ok(ROLES.includes('client_viewer'));
 assert.deepEqual(PERMISSIONS['client_portal:read'],['client_viewer']);
 for(const [permission,roles] of Object.entries(PERMISSIONS)){
  if(permission!=='client_portal:read')assert.equal(roles.includes('client_viewer'),false,permission);
 }
 assert.equal(can('client_viewer','events:read'),false);
 assert.equal(can('client_viewer','finance:read'),false);
 assert.equal(can('client_viewer','users:manage'),false);
});

test('client access is tied to one event and protected by organization-composite foreign keys',()=>{
 const migration=read('drizzle/0019_client_event_access.sql');
 assert.match(migration,/client_event_access_user_org_fk[\s\S]*organization_id.*,.*user_id[\s\S]*users/);
 assert.match(migration,/client_event_access_event_org_fk[\s\S]*organization_id.*,.*event_id[\s\S]*events/);
 assert.match(migration,/client_event_access_user_idx/);
 const journal=JSON.parse(read('drizzle/meta/_journal.json'));
 assert.equal(journal.entries.at(-1).tag,'0019_client_event_access');
 assert.ok(existsSync('drizzle/0019_client_event_access.sql'));
});

test('client account creation requires a same-organization event and provisions access in one statement',()=>{
 const route=read('src/app/api/users/route.ts');
 for(const marker of ["'username','name','email','role','password','eventId'","role==='client_viewer'","Choose one event for the client account",'organization_id=${auth.user.organizationId}::uuid','INSERT INTO client_event_access','WITH eligible_event'])assert.ok(route.includes(marker),marker);
});

test('client portal returns only curated fields from the assigned event',()=>{
 const page=read('src/app/client-portal/page.tsx'),root=read('src/app/page.tsx');
 for(const field of ['events.title','events.type','events.eventDate','events.venue','events.status','events.progress'])assert.ok(page.includes(field),field);
 assert.ok(page.includes('clientEventAccess.userId,user.id'));
 assert.ok(page.includes('clientEventAccess.organizationId,user.organizationId'));
 assert.match(root,/client_viewer.*redirect\('\/client-portal'\)/);
 assert.doesNotMatch(page,/eventCosts|purchaseOrders|contractValue|approvedBudget|invoice/i);
});

test('larger operational lists use server pagination and search/status filters',()=>{
 for(const path of ['src/app/api/quotations/route.ts','src/app/api/contracts/route.ts','src/app/api/rundown/route.ts','src/app/api/crew-assignments/route.ts','src/app/api/users/route.ts']){
  const source=read(path);assert.match(source,/(?:searchParams|params)\.get\('page'\)/,path);assert.match(source,/(?:searchParams|params)\.get\('limit'\)/,path);
  assert.match(source,/hasMore/,path);
 }
 for(const path of ['src/app/sales-documents.tsx','src/app/rundown-workspace.tsx','src/app/crew-workspace.tsx','src/app/users-settings.tsx']){
  const source=read(path);assert.match(source,/placeholder=.*[Cc]ari|aria-label=.*[Cc]ari/,path);assert.match(source,/Halaman|pagination/i,path);
 }
});

test('password visibility toggle is accessible and used in login and password forms',()=>{
 const control=read('src/app/password-input.tsx');
 assert.match(control,/type=\{visible\?'text':'password'\}/);
 assert.match(control,/aria-pressed=\{visible\}/);
 assert.match(control,/Tampilkan password/);
 assert.ok(read('src/app/login/page.tsx').includes('<PasswordInput'));
 assert.ok(read('src/app/users-settings.tsx').includes('<PasswordInput'));
 assert.ok(read('src/app/owner-setup/page.tsx').includes('<PasswordInput'));
});
