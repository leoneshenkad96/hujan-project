import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync('src/app/api/events/[id]/route.ts','utf8');
test('event closing is blocked for unfinished tasks and rundown cues',()=>{
 assert.match(route,/status==='completed'\?notExists\(db\.select\(\{id:tasks\.id\}\)/);
 assert.match(route,/notInArray\(tasks\.status,\['done'\]\)/);
 assert.match(route,/status==='completed'\?notExists\(db\.select\(\{id:rundownItems\.id\}\)/);
 assert.match(route,/notInArray\(rundownItems\.status,\['done','skipped'\]\)/);
 assert.match(route,/eq\(events\.status,existing\.status\)/);
});
test('event detail returns 404 for non-existent event',()=>{
 assert.match(route,/if\(!event\)return fail\('Event not found',404\)/);
});
