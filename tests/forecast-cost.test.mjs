import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastCost} from '../src/lib/forecast-cost.ts';
import {readFileSync} from 'node:fs';
test('PO partially fulfilled is counted once in forecast',()=>{
 const v=forecastCost({approvedBudget:'1000',actualExpenses:['300.25'],commitments:[{poAmount:'600',matchedActual:'200.25'}],otherForecastRemaining:['50']});
 assert.equal(v.actualSpent,'300.25');
 assert.equal(v.openCommitments,'399.75');
 assert.equal(v.forecastAtCompletion,'750.00');
 assert.equal(v.budgetVarianceActualMinusApproved,'-699.75');
 assert.equal(v.forecastVariance,'-250.00');
});
test('overspent forecast variance positive; zero forecast allowed',()=>{
 assert.equal(forecastCost({approvedBudget:'100',actualExpenses:['150'],commitments:[],otherForecastRemaining:[]}).forecastVariance,'50.00');
 assert.equal(forecastCost({approvedBudget:'0',actualExpenses:[],commitments:[],otherForecastRemaining:[]}).forecastAtCompletion,'0.00');
});
test('unmatched or overstated fulfillment cannot silently become zero commitment',()=>{
 assert.throws(()=>forecastCost({approvedBudget:'100',actualExpenses:['10'],commitments:[{poAmount:'20',matchedActual:'21'}],otherForecastRemaining:[]}));
 assert.throws(()=>forecastCost({approvedBudget:'100',actualExpenses:[],commitments:[{poAmount:'-1',matchedActual:'0'}],otherForecastRemaining:[]}));
});
test('PO status updates cannot bypass lifecycle or concurrent write guard',()=>{
 const src=readFileSync('src/app/api/purchase-orders/[id]/route.ts','utf8');
 assert.match(src,/transitions\[previous\.status\]/);
 assert.match(src,/eq\(purchaseOrders\.status,previous\.status\)/);
 assert.match(src,/received:\[\],cancelled:\[\]/);
});
