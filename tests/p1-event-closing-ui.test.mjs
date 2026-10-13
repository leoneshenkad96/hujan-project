import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Event Closing UI verifies task and rundown before enabling completion',()=>{
 const code=readFileSync('src/app/event-closing.tsx','utf8');
 assert.match(code,/\/api\/tasks\?eventId=/);
 assert.match(code,/\/api\/rundown\?eventId=/);
 assert.match(code,/for\(let page=1;page<=10000;page\+\+\)/);
 assert.match(code,/if\(!data\.hasMore\)return all/);
 assert.match(code,/if\(cueData\.hasMore\)throw new Error/);
 assert.match(code,/pendingTasks\.length===0&&pendingCues\.length===0/);
 assert.match(code,/status==='live'/);
 assert.match(code,/window\.confirm/);
 assert.match(code,/status:'completed',progress:100/);
 assert.match(code,/disabled=\{!ready\|\|saving\}/);
});
test('CRM and Event creation forms protect unsaved changes',()=>{
 for(const path of ['src/app/crm-workspace.tsx','src/app/event-projects.tsx']){
  const src=readFileSync(path,'utf8');
  assert.match(src,/formDirty/);
  assert.match(src,/Perubahan form belum disimpan/);
  assert.match(src,/onChange=\{\(\)=>setFormDirty\(true\)\}/);
 }
});
test('operation views provide mobile and keyboard-focused controls',()=>{
 const css=readFileSync('src/app/workspace.css','utf8');
 assert.match(css,/eo-closing-grid/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/max-width:680px/);
 assert.match(css,/prefers-reduced-motion/);
});
