import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQuote,parseQuoteStatus,parseContractStatus} from '../src/lib/quotation-validation.ts';
const id='1187bd11-620f-4e82-8007-422b7e501e18';
test('quote accepts positive decimal amount',()=>assert.equal(parseQuote({eventId:id,title:'Wedding',amount:'50000000.25'})?.amount,'50000000.25'));
test('rejects bad amount and event',()=>{assert.equal(parseQuote({eventId:id,title:'A',amount:'1e10'}),null);assert.equal(parseQuote({eventId:'bad',title:'A',amount:'10'}),null)});
test('rejects invalid validUntil date',()=>assert.equal(parseQuote({eventId:id,title:'A',amount:'10',validUntil:'2026-02-30'}),null));
test('statuses are enumerated',()=>{assert.equal(parseQuoteStatus('accepted'),'accepted');assert.equal(parseContractStatus('signed'),'signed');assert.equal(parseContractStatus('void'),null)});
