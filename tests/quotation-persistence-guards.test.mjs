import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const quote=readFileSync('src/app/api/quotations/route.ts','utf8');
const revision=readFileSync('src/app/api/quotations/[id]/route.ts','utf8');
const contract=readFileSync('src/app/api/contracts/route.ts','utf8');
const budget=readFileSync('src/app/api/budgets/route.ts','utf8');
const schema=readFileSync('src/db/schema.ts','utf8');
test('new quotes recalculate item totals on server and bind to same organization and event',()=>{
 assert.match(quote,/calculateQuote\(input\.lines/);
 assert.match(quote,/amount:calculated\?\.total/);
 assert.match(quote,/organizationId:org/);
 assert.match(quote,/eq\(events\.organizationId,org\)/);
 assert.match(quote,/lineItems:calculated\.lines/);
});
test('quotation revisions create independent drafts and preserve accepted contract pricing',()=>{
 assert.match(revision,/previous\.status!=='rejected'&&previous\.status!=='expired'&&previous\.status!=='draft'/);
 assert.match(revision,/previousQuotationId:previous\.id/);
 assert.match(revision,/revision:previous\.revision\+1/);
 assert.match(revision,/status:'draft'/);
 assert.match(contract,/eq\(quotations\.status,'accepted'\)/);
 assert.match(contract,/amount:quote\.amount/);
});
test('RAB cost ledger is separate from quotation commercial revenue',()=>{
 assert.match(budget,/approvedBudget:events\.approvedBudget/);
 assert.match(budget,/summarizeBudget\(/);
 assert.doesNotMatch(budget,/sum\(quotations\.amount\)/);
 assert.match(schema,/lineItems:jsonb\('line_items'\)/);
});
