#!/usr/bin/env node
/**
 * Integration smoke runner. Requires a dedicated UAT runtime and TWO isolated test accounts.
 * Does not execute with missing variables; never prints credentials or session cookies.
 * Designed exclusively for the disposable UAT database branch.
 */
import assert from 'node:assert/strict';
const env=process.env;
const required=['UAT_BASE_URL','UAT_ORG_A','UAT_EMAIL_A','UAT_PASSWORD_A','UAT_ORG_B','UAT_EMAIL_B','UAT_PASSWORD_B'];
const missing=required.filter(x=>!env[x]);
if(missing.length){console.error('UAT NOT RUN: missing required configuration:',missing.join(', '));process.exitCode=2}
else{
 const origin=new URL(env.UAT_BASE_URL).origin;
 if(!origin.startsWith('https://')&&!origin.startsWith('http://localhost:')){
  throw new Error('UAT URL must be HTTPS or localhost');
 }
 if(!/uat|preview|localhost/i.test(origin)||/kasapink/i.test(origin)){
  throw new Error('Refusing to test a non-UAT or Kasapink host');
 }
 const path=(p)=>origin+p;
 const read=async(url,cookie)=>fetch(path(url),{headers:cookie?{cookie}:undefined,redirect:'manual',cache:'no-store'});
 const attempt=async(url,cookie,method='GET',body)=>{
  const response=await fetch(path(url),{method,headers:{...(cookie?{cookie}:{}),origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',cache:'no-store'});
  return response;
 };
 const login=async(org,email,password)=>{
  const r=await attempt('/api/auth/login',undefined,'POST',{organization:org,email,password});
  assert.equal(r.status,200,'Login must succeed on UAT');
  const setCookie=r.headers.get('set-cookie')||'';
  const cookie=setCookie.split(';')[0];
  assert.match(cookie,/^vinca_session=/,'Authenticated session cookie expected');
  assert.match(setCookie,/httponly/i,'HttpOnly cookie required');
  return cookie;
 };
 const status=(label,value)=>console.log('PASS',label,'HTTP',value);
 const anonymous=await read('/api/invoices');
 assert.equal(anonymous.status,401,'Invoice list must not be public');status('anonymous finance denial',anonymous.status);
 const [cookieA,cookieB]=await Promise.all([login(env.UAT_ORG_A,env.UAT_EMAIL_A,env.UAT_PASSWORD_A),login(env.UAT_ORG_B,env.UAT_EMAIL_B,env.UAT_PASSWORD_B)]);
 console.log('PASS two isolated UAT sessions established');
 const [a,b]=await Promise.all([read('/api/events?limit=10',cookieA),read('/api/events?limit=10',cookieB)]);
 assert.equal(a.status,200);assert.equal(b.status,200);
 const dataA=await a.json(),dataB=await b.json();
 assert.ok(Array.isArray(dataA.items)&&Array.isArray(dataB.items),'Event responses need arrays');
 const bEvent=dataB.items[0]?.id;
 if(bEvent){
  const leak=await read('/api/events/'+bEvent,cookieA);
  assert.equal(leak.status,404,'Org A must not read Org B event');status('event cross-tenant isolation',leak.status);
 }else console.log('SKIP cross-tenant event ID check: no events in org B');
 const wrongOrigin=await fetch(path('/api/auth/logout'),{method:'POST',headers:{cookie:cookieA,origin:'https://wrong.example.org'},redirect:'manual'});
 assert.equal(wrongOrigin.status,403,'Cross-site logout must be rejected');status('CSRF cross-origin logout denied',wrongOrigin.status);
 const finances=await read('/api/invoices?limit=5',cookieA);
 assert.ok([200,403].includes(finances.status),'Finance access depends on test user role');
 status('finance permission response',finances.status);
 console.log('UAT smoke complete. This does NOT cover write/concurrency, visual or reconciliation UAT.');
}
