import test from 'node:test';
import assert from 'node:assert/strict';
import {can} from '../src/lib/permissions.ts';
test('dashboard is visible to project manager without exposing finance role',()=>{assert.equal(can('project_manager','dashboard:read'),true);assert.equal(can('project_manager','finance:read'),false)});
test('only privileged accounting roles may view financial metrics',()=>{for(const role of ['owner','admin','finance'])assert.equal(can(role,'finance:read'),true);for(const role of ['sales','production','project_manager','crew'])assert.equal(can(role,'finance:read'),false)});
