import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guard: username login is globally unique and fails closed on collisions.
const route=readFileSync(new URL('../src/app/api/auth/login/route.ts',import.meta.url),'utf8');
test('username login resolves normalized usernames and fails closed on collisions',()=>{
 assert.match(route,/username\.trim\(\)\.toLowerCase\(\)/);
 assert.match(route,/lower\(trim\(\$\{users\.username\}\)\)/);
 assert.match(route,/\.limit\(2\)/);
 assert.match(route,/rows\.length===1\?rows\[0\]:null/);
 assert.match(route,/!found\.active/);
});
test('username login keeps server-side anti-abuse and session guards',()=>{
 assert.match(route,/isTrustedOrigin\(/);
 assert.match(route,/enforceLoginRateLimit\(/);
 assert.match(route,/verifyPassword\(/);
 assert.match(route,/newSession\(/);
});
