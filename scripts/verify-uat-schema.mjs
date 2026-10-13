#!/usr/bin/env node
// Read-only verification before and after an authorized UAT Drizzle migration.
// Never runs SQL writes and refuses to target an unacknowledged environment.
import {neon} from '@neondatabase/serverless';
import {stderr,stdout} from 'node:process';
if(process.env.VINCA_UAT_VERIFY_ACK!=='ISOLATED_UAT_ONLY'||process.env.VINCA_UAT_BRANCH!=='br-long-wildflower-b3nsciay'||!process.env.DATABASE_URL){
 stderr.write('Refused: isolated UAT acknowledgement, explicit branch ID and DATABASE_URL required.\n');process.exit(1);
}
const sql=neon(process.env.DATABASE_URL);
try{
 const duplicates=await sql`SELECT count(*)::int AS n FROM (SELECT lower(trim(email)) AS email FROM users GROUP BY lower(trim(email)) HAVING count(*)>1) d`;
 const state=await sql`SELECT count(*)::int AS applied FROM drizzle.__drizzle_migrations`;
 const index=await sql`SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname='users_email_global_normalized_idx'`;
 const owners=await sql`SELECT count(*)::int AS n FROM users u JOIN organizations o ON o.id=u.organization_id WHERE o.slug='vinca-uat' AND u.role='owner'`;
 const dup=Number(duplicates[0].n),applied=Number(state[0].applied),hasIndex=Number(index[0].n)===1;
 stdout.write(JSON.stringify({normalizedEmailDuplicates:dup,appliedMigrations:applied,normalizedIndexInstalled:hasIndex,uatOwnerCount:Number(owners[0].n)})+'\n');
 if(dup!==0||Number(owners[0].n)!==1||!([9,10].includes(applied))||hasIndex!==(applied===10))process.exitCode=2;
}catch{stderr.write('UAT verification failed; check database selection privately.\n');process.exitCode=1}
