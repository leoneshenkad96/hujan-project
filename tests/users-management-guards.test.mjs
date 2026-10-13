import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../src/app/api/users/route.ts',import.meta.url);
const detail=new URL('../src/app/api/users/[id]/route.ts',import.meta.url);
const list=readFileSync(root,'utf8'),update=readFileSync(detail,'utf8');
test('user provisioning requires server-side permission, organization scope, origin and password hashing',()=>{
 for(const marker of ['requirePermission(\'users:manage\')','isTrustedOrigin(','auth.user.organizationId','hashPassword(','Email already registered'])assert.ok(list.includes(marker),marker);
 assert.ok(!list.includes('passwordHash:users.passwordHash'));
});
test('admin edits are tenant-scoped and revoke prior sessions on credential or permission changes',()=>{
 for(const marker of ['requirePermission(\'users:manage\')','isTrustedOrigin(','users.organizationId,auth.user.organizationId','authSessions','revokedAt:new Date()','Only owner may manage owner accounts'])assert.ok(update.includes(marker),marker);
});
