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
test('owner has the complete documented permission matrix', () => {
 for(const permission of Object.keys(PERMISSIONS))assert.equal(can('owner',permission),true,permission);
});
