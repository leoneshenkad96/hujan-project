import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExpense,parseMoney,summarizeBudget} from '../src/lib/budget-validation.ts';
const id='1187bd11-620f-4e82-8007-422b7e501e18';
test('decimal validation rejects exponent and negative',()=>{assert.equal(parseMoney('1e9'),null);assert.equal(parseMoney('-2'),null);assert.equal(parseMoney('200.25'),'200.25')});
test('money summary does not double count PO and actual costs',()=>{const s=summarizeBudget('1000.00',['200.25','100.75'],['450.00']);assert.equal(s.actualSpent,'301.00');assert.equal(s.openCommitments,'450.00');assert.equal(s.remainingAfterActual,'699.00');assert.equal(s.remainingAfterCommitmentsOnly,'550.00')});
test('negative remaining allowed when overspent',()=>assert.equal(summarizeBudget('100.00',['130.00'],[]).remainingAfterActual,'-30.00'));
test('expense requires matching-style UUID and positive amount',()=>{assert.equal(parseExpense({eventId:id,description:'Stage setup',amount:'200.00'})?.amount,'200.00');assert.equal(parseExpense({eventId:id,description:'Stage',amount:'0'}),null);assert.equal(parseExpense({eventId:'bad',description:'Stage',amount:'10'}),null)});

test('financial LOCK: decimals are exact and remaining budget is not called variance',()=>{
 const r=summarizeBudget('100.10',['50.05','25.05'],['20.15']);
 assert.equal(r.actualSpent,'75.10');assert.equal(r.remainingAfterActual,'25.00');
 assert.equal(r.openCommitments,'20.15');assert.equal(r.remainingAfterCommitmentsOnly,'79.95');
});
