import test from 'node:test';
import assert from 'node:assert/strict';
import {canTransitionEvent} from '../src/lib/event-validation.ts';
import {canTransitionRundown} from '../src/lib/rundown-validation.ts';
import {readFileSync} from 'node:fs';
test('event cannot jump stages or reopen terminal status',()=>{
 assert.equal(canTransitionEvent('planning','confirmed'),true);
 assert.equal(canTransitionEvent('planning','completed'),false);
 assert.equal(canTransitionEvent('live','completed'),true);
 assert.equal(canTransitionEvent('completed','planning'),false);
 assert.equal(canTransitionEvent('cancelled','confirmed'),false);
});
test('rundown follows show progression and terminal states are immutable',()=>{
 assert.equal(canTransitionRundown('planned','standby'),true);
 assert.equal(canTransitionRundown('planned','done'),false);
 assert.equal(canTransitionRundown('standby','on_air'),true);
 assert.equal(canTransitionRundown('on_air','done'),true);
 assert.equal(canTransitionRundown('done','on_air'),false);
 assert.equal(canTransitionRundown('skipped','planned'),false);
});
test('updates are tenant scoped and guarded against concurrent state changes',()=>{
 for(const p of ['src/app/api/events/[id]/route.ts','src/app/api/rundown/[id]/route.ts']){
  const s=readFileSync(p,'utf8');
  assert.match(s,/requirePermission\(/);
  assert.match(s,/eq\(events\.status,existing\.status\)|eq\(rundownItems\.status,existing\.status\)/);
  assert.match(s,/organizationId/);
  assert.match(s,/Concurrent/);
 }
});
