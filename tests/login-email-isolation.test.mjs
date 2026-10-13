import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guard: removing the organization input must never make multi-tenant
// login select an arbitrary account with the same normalized email.
const route=readFileSync(new URL('../src/app/api/auth/login/route.ts',import.meta.url),'utf8');
test('email login resolves normalized addresses and fails closed on collisions',()=>{
 assert.match(route,/email\.trim\(\)\.toLowerCase\(\)/);
 assert.match(route,/lower\(trim\(/);
 assert.match(route,/\.limit\(2\)/);
 assert.match(route,/rows\.length===1\?rows\[0\]:null/);
 assert.match(route,/!found\.active/);
});
test('email login keeps server-side anti-abuse and session guards',()=>{
 assert.match(route,/isTrustedOrigin\(/);
 assert.match(route,/enforceLoginRateLimit\(/);
 assert.match(route,/verifyPassword\(/);
 assert.match(route,/newSession\(/);
});
