import test from 'node:test';
import assert from 'node:assert/strict';
import {invoiceInput,paymentInput,invoiceBalance} from '../src/lib/invoice-validation.ts';
const eventId='1187bd11-620f-4e82-8007-422b7e501e18';
test('invoice amount and date are validated',()=>{assert.equal(invoiceInput({eventId,amount:'1500000.75',dueDate:'2026-11-05'})?.amount,'1500000.75');assert.equal(invoiceInput({eventId,amount:'-4'}),null);assert.equal(invoiceInput({eventId,amount:'2',dueDate:'2026-02-30'}),null)});
test('reject zero and imprecise payments',()=>{assert.equal(paymentInput({amount:'0'}),null);assert.equal(paymentInput({amount:'50.001'}),null);assert.equal(paymentInput({amount:'250000.00',reference:'DP'})?.amount,'250000.00')});
test('outstanding uses integer decimal precision',()=>{assert.deepEqual(invoiceBalance('1000.10','300.05'),{amount:'1000.10',paidAmount:'300.05',outstanding:'700.05',fullyPaid:false});assert.equal(invoiceBalance('1000','1000').fullyPaid,true)});

test('financial LOCK: partial payments preserve exact precision and never silently round',()=>{
 assert.equal(invoiceBalance('100000000.10','25000000.05').outstanding,'75000000.05');
 for(const value of ['0','0.00','-10','1e4','1.001','100.999'])assert.equal(paymentInput({amount:value}),null);
 assert.equal(paymentInput({amount:'0.01'})?.amount,'0.01');
});
