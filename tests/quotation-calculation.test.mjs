import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateQuote,calculateMarkupAndMargin} from '../src/lib/quotation-calculation.ts';
test('locked quotation item totals, absolute discount and exclusive percentage tax',()=>{
 const v=calculateQuote([{description:'Catering',quantity:'300',unitPrice:'100000.00'},{description:'Sound',quantity:'1',unitPrice:'12000000'}],'2000000','11');
 assert.equal(v.subtotal,'42000000.00');assert.equal(v.taxableBase,'40000000.00');assert.equal(v.tax,'4400000.00');assert.equal(v.total,'44400000.00');
});
test('fractional quantities round half-up per line without float errors',()=>{
 const r=calculateQuote([{description:'Fabric',quantity:'0.125',unitPrice:'0.20'},{description:'Cable',quantity:'0.125',unitPrice:'0.20'}]);
 assert.equal(r.lines[0].subtotal,'0.03');assert.equal(r.total,'0.06');
});
test('reject negative, imprecise, oversized and invalid quotation inputs',()=>{
 const l=[{description:'Stage',quantity:'1',unitPrice:'100'}];
 for(const q of ['-1','0','1.0001','1e2'])assert.throws(()=>calculateQuote([{...l[0],quantity:q}]));
 for(const p of ['-5','1.999','1e3'])assert.throws(()=>calculateQuote([{...l[0],unitPrice:p}]));
 assert.throws(()=>calculateQuote(l,'101'));assert.throws(()=>calculateQuote(l,'0','100.01'));
 assert.throws(()=>calculateQuote([]));
});
test('markup and margin distinct; zero denominator has undefined percentage',()=>{
 const r=calculateMarkupAndMargin('100.00','75.00');
 assert.equal(r.grossMarginPercent,25);assert.equal(r.markupPercent,33.33);
 assert.equal(calculateMarkupAndMargin('0','0').grossMarginPercent,null);
 assert.equal(calculateMarkupAndMargin('100','0').markupPercent,null);
 assert.equal(calculateMarkupAndMargin('50','75').grossMarginPercent,-50);
});
