import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVendor,parsePO,parsePOStatus} from '../src/lib/procurement-validation.ts';
const id='1187bd11-620f-4e82-8007-422b7e501e18';
test('vendor sanitization',()=>assert.equal(parseVendor({name:'  Stage  Pro '})?.name,'Stage Pro'));
test('vendor requires legal name',()=>assert.equal(parseVendor({name:''}),null));
test('purchase order validates references and money',()=>{
 assert.equal(parsePO({description:'Sound',eventId:id,vendorId:id,amount:'1500000.50'})?.amount,'1500000.50');
 assert.equal(parsePO({description:'Sound',eventId:id,vendorId:id,amount:'1e10'}),null);
 assert.equal(parsePO({description:'Sound',eventId:'bad',vendorId:id,amount:'100'}),null);
});
test('invalid status rejected',()=>{assert.equal(parsePOStatus('issued'),'issued');assert.equal(parsePOStatus('paid'),null)});
