#!/usr/bin/env node
// DESTRUCTIVE TEST HARNESS: only runs on a disposable, explicitly allowlisted UAT host.
// Requires existing dedicated UAT invoice fixtures and two distinct tenant accounts.
// NEVER scheduled or executed by CI; no test records are created or cleaned up automatically.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {minor} from '../src/lib/invoice-validation.ts';

const e=process.env;
const required=['UAT_FINANCE_WRITE_ACK','UAT_BASE_URL','UAT_EXACT_ALLOWED_ORIGIN','UAT_ORG_A','UAT_EMAIL_A','UAT_PASSWORD_A','UAT_ORG_B','UAT_EMAIL_B','UAT_PASSWORD_B','UAT_INVOICE_A','UAT_INVOICE_B','UAT_EXPECTED_OUTSTANDING_A'];
const missing=required.filter(k=>!e[k]);
if(missing.length||e.UAT_FINANCE_WRITE_ACK!=='DISPOSABLE_UAT_ONLY'){
 console.error('NOT RUN: explicit disposable UAT write approval and isolated fixtures required:',missing.join(', '));process.exit(2);
}
const origin=new URL(e.UAT_BASE_URL).origin;
if(origin!==e.UAT_EXACT_ALLOWED_ORIGIN||!origin.startsWith('https://')||!origin.endsWith('.vercel.app')||!/^https:\/\/eo-/.test(origin)||/kasapink-erp|erp\.kasapink/i.test(origin)){
 throw new Error('Refusing unapproved/non-HTTPS/non-UAT origin');
}
if(e.UAT_ORG_A===e.UAT_ORG_B||e.UAT_INVOICE_A===e.UAT_INVOICE_B){
 throw new Error('Fixture organizations and invoices must differ');
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
for(const id of [e.UAT_INVOICE_A,e.UAT_INVOICE_B])assert.match(id,uuid);
const amount=minor(e.UAT_EXPECTED_OUTSTANDING_A);
assert.ok(amount>=200n,'Invoice fixture needs at least 2.00 outstanding');
const formatted=n=>(n/100n).toString()+'.'+(n%100n).toString().padStart(2,'0');
const fetchApi=(path,options={})=>fetch(origin+path,{redirect:'manual',cache:'no-store',...options});
async function login(organization,email,password){
 const response=await fetchApi('/api/auth/login',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({organization,email,password})});
 assert.equal(response.status,200,'UAT login required');
 const cookie=(response.headers.get('set-cookie')||'').split(';')[0];
 assert.match(cookie,/^vinca_session=/);
 return cookie;
}
const [cookieA,cookieB]=await Promise.all([
 login(e.UAT_ORG_A,e.UAT_EMAIL_A,e.UAT_PASSWORD_A),
 login(e.UAT_ORG_B,e.UAT_EMAIL_B,e.UAT_PASSWORD_B)
]);
const paymentPath='/api/invoices/'+e.UAT_INVOICE_A+'/payments';
const cross=await fetchApi(paymentPath,{headers:{cookie:cookieB}});
assert.equal(cross.status,404,'Org B must not read Org A payment ledger');
const crossWrite=await fetchApi(paymentPath,{method:'POST',headers:{cookie:cookieB,origin,'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify({amount:'1.00',reference:'IDOR UAT rejection'})});
assert.equal(crossWrite.status,409,'Org B must not alter Org A invoice');
console.log('PASS cross-tenant invoice read/write denied');
const key=randomUUID(),half=amount/2n,payload={amount:formatted(half),reference:'UAT-CONCURRENCY-'+key.slice(0,8)};
async function post(k,body=payload){
 const r=await fetchApi(paymentPath,{method:'POST',headers:{cookie:cookieA,origin,'Content-Type':'application/json','Idempotency-Key':k},body:JSON.stringify(body)});
 return {status:r.status,body:await r.json().catch(()=>null)};
}
const [first,second]=await Promise.all([post(key),post(key)]);
assert.deepEqual([first.status,second.status].sort((a,b)=>a-b),[200,201],'Same logical concurrent payment must be recorded once');
assert.equal(first.body.payment.id,second.body.payment.id,'Retry must identify the same recorded row');
console.log('PASS concurrent same-key retry recorded once');
const conflict=await post(key,{...payload,reference:'DIFFERENT REFERENCE'});
assert.equal(conflict.status,409,'Same key + different payload must conflict');
console.log('PASS idempotency key cannot be reused for changed payload');
const history=await fetchApi(paymentPath,{headers:{cookie:cookieA}});
assert.equal(history.status,200);
const ledger=await history.json();
assert.equal(ledger.items.filter(x=>x.id===first.body.payment.id).length,1);
if(e.UAT_EVENT_A){assert.match(e.UAT_EVENT_A,uuid);const reconcile=await fetchApi('/api/finance/reconciliation?eventId='+e.UAT_EVENT_A,{headers:{cookie:cookieA}});assert.equal(reconcile.status,200);const details=await reconcile.json();assert.ok(!details.items.some(x=>x.invoice_id===e.UAT_INVOICE_A),'No payment discrepancy expected')}
console.log('PASS payment row persisted once; additional credit and audit scenarios require separately prepared fixtures');
