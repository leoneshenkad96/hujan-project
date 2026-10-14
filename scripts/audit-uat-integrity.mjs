#!/usr/bin/env node
// Read-only UAT integrity checks; never creates or modifies records.
import {neon} from '@neondatabase/serverless';
import {stderr,stdout} from 'node:process';
if(process.env.VINCA_UAT_VERIFY_ACK!=='ISOLATED_UAT_ONLY'||process.env.VINCA_UAT_BRANCH!=='br-long-wildflower-b3nsciay'||!process.env.DATABASE_URL){
 stderr.write('Refusing UAT integrity audit without isolated branch configuration.\n');process.exit(1);
}
try{
 const db=neon(process.env.DATABASE_URL);
 const [scope]=await db`SELECT current_setting('neon.project_id',true) AS project_id,current_setting('neon.branch_id',true) AS branch_id,current_database() AS dbname`;
 if(scope?.project_id!=='fancy-cell-64250119'||scope?.branch_id!=='br-long-wildflower-b3nsciay'||scope?.dbname!=='eventorganizer')throw Error('Wrong database');
 const [checks]=await db`
 SELECT
  (SELECT count(*)::int FROM users u LEFT JOIN organizations o ON o.id=u.organization_id WHERE o.id IS NULL) AS orphan_users,
  (SELECT count(*)::int FROM events e JOIN clients c ON c.id=e.client_id WHERE e.organization_id<>c.organization_id) AS cross_tenant_event_client,
  (SELECT count(*)::int FROM invoices i JOIN events e ON e.id=i.event_id WHERE i.organization_id<>e.organization_id) AS cross_tenant_invoice_event,
  (SELECT count(*)::int FROM invoice_payments p JOIN invoices i ON i.id=p.invoice_id WHERE p.organization_id<>i.organization_id) AS cross_tenant_payment,
  (SELECT count(*)::int FROM invoices WHERE paid_amount<0 OR paid_amount>amount OR amount<=0) AS invalid_invoice_balance,
  (SELECT count(*)::int FROM invoice_payments WHERE amount<=0) AS invalid_payment_amount,
  (SELECT count(*)::int FROM users WHERE active AND password_hash IS NOT NULL) AS login_ready,
  (SELECT count(*)::int FROM events) AS events_total,
  (SELECT count(*)::int FROM invoice_payments) AS payments_total`;
 const metrics=Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,Number(v)]));
 stdout.write(JSON.stringify(metrics)+'\n');
 if(Object.entries(metrics).some(([k,v])=>k!=='login_ready'&&k!=='events_total'&&k!=='payments_total'&&v!==0))process.exitCode=2;
}catch{stderr.write('Integrity audit failed. Verify UAT branch and connectivity privately.\n');process.exitCode=1}
