import test from 'node:test';
import assert from 'node:assert/strict';
import {profitability,cents,money} from '../src/lib/profitability.ts';
test('exact money arithmetic preserves cents',()=>{assert.equal(cents('100.10')-cents('0.09'),10001n);assert.equal(money(-2007n),'-20.07')});
test('profit and cash are distinct, PO not counted twice',()=>{
 const s=profitability({contractValue:'1000.00',approvedBudget:'600',invoiceAmounts:['700'],receivedPayments:['250','150'],actualExpenses:['100.20','200.30'],committedPOs:['450']});
 assert.equal(s.estimatedGrossProfit,'699.50');assert.equal(s.actualExpenses,'300.50');assert.equal(s.poCommitments,'450.00');assert.equal(s.invoiceOutstanding,'300.00');assert.equal(s.cashFlowProxy,'99.50');assert.equal(s.estimatedGrossMarginPercent,69.95);
});
test('zero contracted revenue has undefined margin',()=>{const s=profitability({contractValue:'0',approvedBudget:'0',invoiceAmounts:[],receivedPayments:[],actualExpenses:['15'],committedPOs:[]});assert.equal(s.estimatedGrossMarginPercent,null);assert.equal(s.estimatedGrossProfit,'-15.00')});
