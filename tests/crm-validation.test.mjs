import test from 'node:test';
import assert from 'node:assert/strict';
import {parseClient,parseLead,parseLimit,LEAD_STATES} from '../src/lib/crm-validation.ts';
test('client names normalized and emails canonicalized',()=>assert.deepEqual(parseClient({name:'  PT  Vinca  ',email:'ADMIN@EXAMPLE.COM'}),{name:'PT Vinca',email:'admin@example.com',phone:null}));
test('invalid client emails rejected',()=>assert.equal(parseClient({name:'Acme',email:'invalid'}),null));
test('lead money has two decimal precision and state validation',()=>{
 assert.equal(parseLead({title:' Wedding ',estimatedValue:'1200000.99',status:'qualified'})?.estimatedValue,'1200000.99');
 assert.equal(parseLead({title:'Wedding',estimatedValue:'1e9'}),null);
 assert.equal(parseLead({title:'Wedding',estimatedValue:'-100'}),null);
 assert.equal(parseLead({title:'Wedding',status:'unknown'}),null);
 assert.equal(LEAD_STATES.length,6);
});
test('pages are bounded',()=>{assert.equal(parseLimit('9000'),100);assert.equal(parseLimit('oops'),20)});
