import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, PERMISSIONS, can } from '../src/lib/permissions.ts';

test('all configured permissions refer to known roles', () => {
 for(const [permission,allowed] of Object.entries(PERMISSIONS)){
  assert.ok(allowed.length>0,permission);
  for(const role of allowed) assert.ok(ROLES.includes(role),permission+': '+role);
 }
});
test('no access for unknown or case-mismatched roles', () => {
 for(const permission of Object.keys(PERMISSIONS)){
  assert.equal(can('anonymous',permission),false);
  assert.equal(can('Owner',permission),false);
 }
});
test('only finance/admin/owner can access accounting', () => {
 for(const role of ROLES){
  assert.equal(can(role,'finance:write'),['owner','admin','finance'].includes(role),role);
 }
});
test('crew cannot modify event, customer, task or invoice records', () => {
 for(const p of ['events:write','clients:write','tasks:write','finance:write','users:manage']){
  assert.equal(can('crew',p),false,p);
 }
});
test('client viewers can only read the isolated client portal',()=>{
 assert.equal(can('client_viewer','client_portal:read'),true);
 for(const permission of Object.keys(PERMISSIONS).filter(p=>p!=='client_portal:read'))assert.equal(can('client_viewer',permission),false,permission);
});
test('owner has all internal permissions but not the client portal role', () => {
 for(const permission of Object.keys(PERMISSIONS).filter(p=>p!=='client_portal:read'))assert.equal(can('owner',permission),true,permission);
 assert.equal(can('owner','client_portal:read'),false);
});
