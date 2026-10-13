import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
test('Drizzle journal tracks all nine migrations and matching SQL',()=>{
 const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8'));
 assert.equal(journal.entries.length,9);
 for(const entry of journal.entries)assert.equal(existsSync(join('drizzle',entry.tag+'.sql')),true);
});
test('no workflow performs unapproved production migration',()=>{
 const files=['.github/workflows/release-readiness.yml'];
 for(const file of files){const contents=readFileSync(file,'utf8');assert.doesNotMatch(contents,/db:migrate|vercel deploy|neonctl.*(migrate|branch)/i)}
});
test('release preflight never prints DATABASE_URL',()=>{
 const source=readFileSync('scripts/release-preflight.mjs','utf8');
 assert.doesNotMatch(source,/console\.log\(process\.env\.DATABASE_URL\)/);
});
