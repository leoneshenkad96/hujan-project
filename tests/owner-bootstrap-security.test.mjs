import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../scripts/bootstrap-uat-owner.mjs',import.meta.url),'utf8');
test('Owner bootstrap requires explicit isolated UAT selection and cannot run without interactive TTY',()=>{
 assert.match(script,/VINCA_BOOTSTRAP_ACK/);
 assert.match(script,/br-long-wildflower-b3nsciay/);
 assert.match(script,/stdin\.isTTY/);
 assert.match(script,/setRawMode\(true\)/);
 assert.match(script,/current_setting\('neon\.branch_id',true\)/);
 assert.match(script,/current_setting\('neon\.project_id',true\)/);
 assert.match(script,/Connection is not the expected isolated Vinca UAT database/);
});
test('Owner password is entered hidden and not printed in logs or CLI arguments',()=>{
 assert.doesNotMatch(script,/rl\.question/);
 assert.match(script,/emitKeypressEvents/);
 assert.match(script,/setRawMode\(false\)/);
 assert.match(script,/active=false AND password_hash IS NULL/);
 assert.match(script,/Confirm Owner password/);
 assert.match(script,/password!==confirmation/);
});
