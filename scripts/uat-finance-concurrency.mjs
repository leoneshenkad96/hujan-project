#!/usr/bin/env node
// DESTRUCTIVE TEST HARNESS: only runs on a disposable, explicitly allowlisted UAT host.
// Uses the two dedicated UAT Finance accounts and discovers their invoice fixtures after login.
// NEVER scheduled or executed by CI; a payment is written only after the disposable DB target is verified and is not auto-cleaned up.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {emitKeypressEvents} from 'node:readline';
import {stdin,stdout} from 'node:process';
import {minor} from '../src/lib/invoice-validation.ts';

const e=process.env;
const required=['UAT_FINANCE_WRITE_ACK','UAT_BASE_URL','UAT_EXACT_ALLOWED_ORIGIN'];
const missing=required.filter(k=>!e[k]);
if(missing.length||e.UAT_FINANCE_WRITE_ACK!=='DISPOSABLE_UAT_ONLY'){
 console.error('NOT RUN: explicit disposable UAT write approval and isolated fixtures required:',missing.join(', '));process.exit(2);
}
const origin=new URL(e.UAT_BASE_URL).origin;
const isLocalOrigin=/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const isPreviewOrigin=origin.startsWith('https://')&&origin.endsWith('.vercel.app')&&/^https:\/\/eo-/.test(origin)&&!/kasapink-erp|erp\.kasapink/i.test(origin);
if(origin!==e.UAT_EXACT_ALLOWED_ORIGIN||(!isLocalOrigin&&!isPreviewOrigin)){
 throw new Error('Refusing unapproved origin; only exact localhost or Vinca Preview origins are supported');
}
if(isLocalOrigin&&(!e.UAT_LOCAL_TARGET_TOKEN||e.UAT_LOCAL_TARGET_TOKEN.length<32)){
 throw new Error('Local UAT requires a private target-verification token of at least 32 characters');
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const formatted=n=>(n/100n).toString()+'.'+(n%100n).toString().padStart(2,'0');
const fetchApi=(path,options={})=>fetch(origin+path,{redirect:'manual',cache:'no-store',...options});
if(isLocalOrigin){
 const target=await fetchApi('/api/uat/local-test-target',{headers:{authorization:'Bearer '+e.UAT_LOCAL_TARGET_TOKEN}});
 assert.equal(target.status,200,'Local app must prove it is connected to the disposable Neon branch before credentials or writes');
 const proof=await target.json();
 assert.deepEqual(proof,{verified:true,target:'disposable-uat'});
 console.log('PASS local app verified against the disposable UAT database');
}
async function readPassword(username){
 if(!stdin.isTTY||!stdin.setRawMode)throw new Error('Enter UAT passwords as environment variables or run this script in a private interactive terminal');
 emitKeypressEvents(stdin);stdin.setRawMode(true);stdout.write('Password for '+username+' (hidden): ');
 try{return await new Promise((resolve,reject)=>{
  let value='';
  function onKey(str,key){
   if(key?.name==='return'||key?.name==='enter'){stdin.off('keypress',onKey);stdout.write('\n');resolve(value);return}
   if(key?.ctrl&&key.name==='c'){stdin.off('keypress',onKey);reject(new Error('Cancelled'));return}
   if(key?.name==='backspace'){value=value.slice(0,-1);return}
   if(str&&!key?.ctrl&&!key?.meta&&str>=' '&&value.length<512)value+=str;
  }
  stdin.on('keypress',onKey);
 })}finally{stdin.setRawMode(false)}
}
const passwordA=e.UAT_PASSWORD_A??await readPassword('uat_finance_a');
const passwordB=e.UAT_PASSWORD_B??await readPassword('uat_finance_b');
stdin.pause();
async function login(username,password){
 const response=await fetchApi('/api/auth/login',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({username,password})});
 assert.equal(response.status,200,'UAT login required');
 const cookie=(response.headers.get('set-cookie')||'').split(';')[0];
 assert.match(cookie,/^vinca_session=/);
 return cookie;
}
const [cookieA,cookieB]=await Promise.all([
 login('uat_finance_a',passwordA),
 login('uat_finance_b',passwordB)
]);
async function profile(cookie){
 const response=await fetchApi('/api/auth/me',{headers:{cookie}});
 assert.equal(response.status,200,'Test account profile required');
 const body=await response.json();
 assert.equal(body.user?.role,'finance','Both disposable test accounts must have Finance role');
 assert.match(body.user?.organizationId||'',uuid,'Organization identity must be present');
 return body.user;
}
const [userA,userB]=await Promise.all([profile(cookieA),profile(cookieB)]);
assert.notEqual(userA.id,userB.id,'Finance fixtures must use distinct accounts');
assert.notEqual(userA.organizationId,userB.organizationId,'Finance fixtures must belong to distinct organizations');
const [listA,listB]=await Promise.all([
 fetchApi('/api/invoices?limit=100',{headers:{cookie:cookieA}}),
 fetchApi('/api/invoices?limit=100',{headers:{cookie:cookieB}})
]);
assert.equal(listA.status,200,'Org A must be able to list its invoice fixtures');
assert.equal(listB.status,200,'Org B must be able to list its invoice fixtures');
const [dataA,dataB]=await Promise.all([listA.json(),listB.json()]);
const invoiceA=dataA.items.find(x=>x.organizationId===userA.organizationId&&uuid.test(x.id)&&typeof x.balance?.outstanding==='string'&&minor(x.balance.outstanding)>=200n);
const invoiceB=dataB.items.find(x=>x.organizationId===userB.organizationId&&uuid.test(x.id));
assert.ok(invoiceA,'Org A needs an invoice with at least 2.00 outstanding');
assert.ok(invoiceB,'Org B needs a tenant-owned invoice fixture');
assert.ok(!dataB.items.some(x=>x.id===invoiceA.id),'Org B invoice list must not expose Org A invoice');
assert.ok(!dataA.items.some(x=>x.id===invoiceB.id),'Org A invoice list must not expose Org B invoice');
const amount=minor(invoiceA.balance.outstanding);
assert.ok(amount>=200n,'Invoice fixture needs at least 2.00 outstanding');
console.log('PASS both authenticated accounts see only their own invoice fixtures');
const paymentPath='/api/invoices/'+invoiceA.id+'/payments';
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
console.log('PASS payment row persisted once');

// Two different requests each try to settle the same remaining balance. Row locking must allow only one.
const remaining=amount-half;
assert.ok(remaining>0n,'Fixture needs a positive balance after the idempotent payment');
const overpayPayload={amount:formatted(remaining),reference:'UAT-OVERPAY-'+randomUUID().slice(0,8)};
const overpayKeys=[randomUUID(),randomUUID()];
const [overpayA,overpayB]=await Promise.all([
 post(overpayKeys[0],overpayPayload),
 post(overpayKeys[1],{...overpayPayload,reference:'UAT-OVERPAY-'+randomUUID().slice(0,8)})
]);
assert.deepEqual([overpayA.status,overpayB.status].sort((a,b)=>a-b),[201,409],'Concurrent different-key attempts must not overpay');
console.log('PASS concurrent different-key attempts cannot exceed the outstanding balance');
const [finalList,finalHistory]=await Promise.all([
 fetchApi('/api/invoices?limit=100',{headers:{cookie:cookieA}}),
 fetchApi(paymentPath,{headers:{cookie:cookieA}})
]);
assert.equal(finalList.status,200);assert.equal(finalHistory.status,200);
const finalData=await finalList.json(),finalLedger=await finalHistory.json();
const finalInvoice=finalData.items.find(x=>x.id===invoiceA.id);
assert.ok(finalInvoice,'Paid invoice remains visible to its owning tenant');
assert.equal(minor(finalInvoice.balance.outstanding),0n,'Invoice must settle exactly without a negative balance');
assert.equal(finalLedger.items.filter(x=>x.id===first.body.payment.id).length,1);
if(invoiceA.eventId){assert.match(invoiceA.eventId,uuid);const reconcile=await fetchApi('/api/finance/reconciliation?eventId='+invoiceA.eventId,{headers:{cookie:cookieA}});assert.equal(reconcile.status,200);const details=await reconcile.json();assert.ok(!details.items.some(x=>x.invoice_id===invoiceA.id),'No payment discrepancy expected')}
console.log('PASS persisted ledger reconciles to a zero invoice balance');
