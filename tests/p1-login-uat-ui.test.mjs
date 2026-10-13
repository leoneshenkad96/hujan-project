import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('login UI identifies rate limits and outages without exposing registered accounts',()=>{
 const ui=readFileSync('src/app/login/page.tsx','utf8');
 assert.match(ui,/res.status===429/);
 assert.match(ui,/Retry-After/);
 assert.match(ui,/res.status===503/);
 assert.match(ui,/Login gagal\. Periksa email dan password/);
 assert.doesNotMatch(ui,/Email tidak terdaftar|Account does not exist/);
});
test('login endpoint keeps origin control, global throttle and private response',()=>{
 const code=readFileSync('src/app/api/auth/login/route.ts','utf8');
 assert.match(code,/isTrustedOrigin/);
 assert.match(code,/enforceLoginRateLimit/);
 assert.match(code,/status:429/);
 assert.match(code,/Cache-Control':'no-store'/);
});
