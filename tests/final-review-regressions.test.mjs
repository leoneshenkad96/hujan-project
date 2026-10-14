import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('dashboard event counts use full SQL aggregates rather than displayed 200 row slice',()=>{
 const source=readFileSync('src/app/api/dashboard/route.ts','utf8');
 assert.match(source,/count\(\*\)::int AS total/);
 assert.match(source,/COALESCE\(round\(avg\(progress\)\),0\)::int/);
 assert.doesNotMatch(source,/events:portfolio\.length/);
 assert.doesNotMatch(source,/averageProgress:portfolio\.length/);
});
test('retired email activation is inaccessible and still enforces trusted origin',()=>{
 const source=readFileSync('src/app/api/auth/activation/request/route.ts','utf8');
 assert.match(source,/isTrustedOrigin\(/);
 assert.match(source,/status:410/);
 assert.doesNotMatch(source,/RESEND_API_KEY/);
});
