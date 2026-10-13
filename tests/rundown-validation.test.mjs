import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRundown,parseRundownPatch} from '../src/lib/rundown-validation.ts';
const eventId='1187bd11-620f-4e82-8007-422b7e501e18';
const valid={eventId,position:1,title:'Opening',startTime:'09:00',endTime:'09:20',cue:'Cue music'};
test('accepts valid cue segment',()=>assert.equal(parseRundown(valid)?.title,'Opening'));
test('rejects impossible times',()=>{assert.equal(parseRundown({...valid,startTime:'24:00'}),null);assert.equal(parseRundown({...valid,endTime:'08:00'}),null)});
test('rejects bad PIC or position',()=>{assert.equal(parseRundown({...valid,picId:'bad'}),null);assert.equal(parseRundown({...valid,position:0}),null)});
test('only status patches accepted',()=>{assert.deepEqual(parseRundownPatch({status:'on_air'}),{status:'on_air'});assert.equal(parseRundownPatch({title:'hack'}),null)});
