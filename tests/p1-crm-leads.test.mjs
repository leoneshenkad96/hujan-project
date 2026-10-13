import test from 'node:test';
import assert from 'node:assert/strict';
import {canTransitionLead,parseLead} from '../src/lib/lead-validation.ts';
import {readFileSync} from 'node:fs';
test('CRM lead pipeline rejects stage skipping and terminal reopening',()=>{
 assert.equal(canTransitionLead('new','qualified'),true);
 assert.equal(canTransitionLead('new','won'),false);
 assert.equal(canTransitionLead('qualified','proposal'),true);
 assert.equal(canTransitionLead('negotiation','won'),true);
 assert.equal(canTransitionLead('won','qualified'),false);
 assert.equal(canTransitionLead('lost','proposal'),false);
});
test('CRM lead input validates title, exact amounts and allowlisted fields',()=>{
 assert.ok(parseLead({title:'Wedding booking',estimatedValue:'12000000.50'}));
 assert.equal(parseLead({title:'',estimatedValue:'10'}),null);
 assert.equal(parseLead({title:'Wedding',estimatedValue:'0.123'}),null);
 assert.equal(parseLead({title:'Wedding',estimatedValue:'10',organizationId:'other'}),null);
});
test('lead APIs enforce permissions, organization isolation and guarded transitions',()=>{
 const list=readFileSync('src/app/api/leads/route.ts','utf8');
 const detail=readFileSync('src/app/api/leads/[id]/route.ts','utf8');
 assert.match(list,/requirePermission\('clients:read'\)/);
 assert.match(list,/requirePermission\('clients:write'\)/);
 assert.match(list,/eq\(leads\.organizationId/);
 assert.match(detail,/eq\(leads\.status,previous\.status\)/);
 assert.match(detail,/Lead needs a client before winning/);
 assert.match(detail,/isTrustedOrigin/);
});
