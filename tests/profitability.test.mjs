import test from 'node:test';
import assert from 'node:assert/strict';
import {profitability,cents,money} from '../src/lib/profitability.ts';
test('exact money arithmetic preserves cents',()=>{assert.equal(cents('100.10')-cents('0.09'),10001n);assert.equal(money(-2007n),'-20.07')});
test('profit and cash are distinct, PO not counted twice',()=>{
 const s=profitability({contractValue:'1000.00',approvedBudget:'600',invoiceAmounts:['700'],receivedPayments:['250','150'],actualExpenses:['100.20','200.30'],committedPOs:['450']});
 assert.equal(s.estimatedGrossProfit,'699.50');assert.equal(s.actualExpenses,'300.50');assert.equal(s.poCommitments,'450.00');assert.equal(s.invoiceOutstanding,'300.00');assert.equal(s.cashFlowProxy,'99.50');assert.equal(s.estimatedGrossMarginPercent,69.95);
});
test('zero contracted revenue has undefined margin',()=>{const s=profitability({contractValue:'0',approvedBudget:'0',invoiceAmounts:[],receivedPayments:[],actualExpenses:['15'],committedPOs:[]});assert.equal(s.estimatedGrossMarginPercent,null);assert.equal(s.estimatedGrossProfit,'-15.00')});

test('financial LOCK: variance is actual minus approved, negative means under budget',()=>{
 const s=profitability({contractValue:'100.00',approvedBudget:'50.00',invoiceAmounts:['70.00'],receivedPayments:['20.00'],actualExpenses:['60.00'],committedPOs:[]});
 assert.equal(s.budgetVarianceActualMinusApproved,'10.00');
 assert.equal(s.budgetVarianceAfterActual,'-10.00');
 assert.equal(s.invoiceOutstanding,'50.00');
 assert.equal(s.estimatedGrossProfit,'40.00');
});
test('financial LOCK: losses and zero denominators never produce misleading margin',()=>{
 const base={approvedBudget:'10.00',invoiceAmounts:[],receivedPayments:[],actualExpenses:['12.00'],committedPOs:['30.00']};
 assert.equal(profitability({...base,contractValue:'10.00'}).estimatedGrossProfit,'-2.00');
 assert.equal(profitability({...base,contractValue:'0.00'}).estimatedGrossMarginPercent,null);
});
