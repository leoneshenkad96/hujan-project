import test from 'node:test';
import assert from 'node:assert/strict';
import {taskInput,taskPatch} from '../src/lib/task-validation.ts';
const id='1187bd11-620f-4e82-8007-422b7e501e18';
test('task create validates event association',()=>{assert.equal(taskInput({eventId:id,title:' Check stage ',dueDate:'2026-11-20'})?.title,'Check stage');assert.equal(taskInput({eventId:'wrong',title:'Task'}),null)});
test('task rejects fake dates',()=>assert.equal(taskInput({eventId:id,title:'Task',dueDate:'2026-02-30'}),null));
test('status transition accepts documented states',()=>{assert.deepEqual(taskPatch({status:'done'}),{status:'done'});assert.equal(taskPatch({status:'unknown'}),null)});
test('PATCH cannot change event ID',()=>assert.equal(taskPatch({eventId:id}),null));
test('null assignee and due date supported',()=>assert.deepEqual(taskPatch({ownerId:null,dueDate:null}),{ownerId:null,dueDate:null}));
