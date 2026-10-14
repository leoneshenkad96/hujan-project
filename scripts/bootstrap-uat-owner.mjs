#!/usr/bin/env node
// One-time, opt-in UAT bootstrap. Run on a trusted machine with an isolated UAT Neon connection.
// This script does not run on import, during CI or during deployment.
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout, stderr } from 'node:process';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
const migrationJournal=JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
const expectedMigrationCount=migrationJournal.entries.length;
const uri=process.env.DATABASE_URL;
const branch=process.env.VINCA_BOOTSTRAP_BRANCH;
if(process.env.VINCA_BOOTSTRAP_ACK!=='ISOLATED_UAT_ONLY'||branch!=='br-long-wildflower-b3nsciay'||!uri){
 stderr.write('Refusing bootstrap: explicit isolated UAT acknowledgement, branch and DATABASE_URL are required.\n');process.exit(1);
}
if(!stdin.isTTY||!stdin.setRawMode){stderr.write('Bootstrap requires a private interactive terminal.\n');process.exit(1)}
async function readSecret(prompt='New Owner password (hidden, 12-256 chars): '){
 emitKeypressEvents(stdin);stdin.setRawMode(true);stdout.write(prompt);
 try{return await new Promise((resolve,reject)=>{
  let secret='';
  function onKey(str,key){
   if(key?.name==='return'||key?.name==='enter'){stdin.off('keypress',onKey);stdout.write('\n');resolve(secret);return}
   if(key?.ctrl&&key.name==='c'){stdin.off('keypress',onKey);reject(new Error('Cancelled'));return}
   if(key?.name==='backspace'){secret=secret.slice(0,-1);return}
   if(str&&!key?.ctrl&&!key?.meta&&str>=' '&&secret.length<256)secret+=str;
  }
  stdin.on('keypress',onKey);
 })}finally{stdin.setRawMode(false)}
}
try{
 const db=neon(uri);
 const scope=await db`SELECT current_setting('neon.project_id',true) AS project_id,current_setting('neon.branch_id',true) AS branch_id,current_database() AS database_name`;
 if(scope.length!==1||scope[0].project_id!=='fancy-cell-64250119'||scope[0].branch_id!=='br-long-wildflower-b3nsciay'||scope[0].database_name!=='eventorganizer')throw Error('Connection is not the expected isolated Vinca UAT database');
 // Never request or handle a password until the target database is migration-ready.
 const ready=await db`SELECT
  (SELECT count(*)::int FROM drizzle.__drizzle_migrations) AS migration_count,
  to_regclass('public.users_username_global_normalized_idx') IS NOT NULL AS has_username_index,
  (SELECT count(*)::int FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='username') AS username_columns,
  to_regclass('public.lead_follow_ups') IS NOT NULL AS has_followups,
  to_regclass('public.crew_assignments') IS NOT NULL AS has_crew,
  (SELECT count(*)::int FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='lead_id') AS lead_columns,
  (SELECT count(*)::int FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('lead_follow_ups_tenant_guard','crew_assignments_guard','events_origin_guard')) AS guard_triggers`;
 if(ready.length!==1||Number(ready[0].migration_count)!==expectedMigrationCount||!ready[0].has_username_index||Number(ready[0].username_columns)!==1||!ready[0].has_followups||!ready[0].has_crew||Number(ready[0].lead_columns)!==1||Number(ready[0].guard_triggers)!==3)
  throw Error('UAT schema is not at the checked-in migration version; refusing Owner activation');
 const password=await readSecret();
 if(password.length<12||password.length>256)throw Error('Password length invalid');
 const confirmation=await readSecret('Confirm Owner password (hidden): ');
 if(password!==confirmation)throw Error('Password confirmation does not match');
 const salt=randomBytes(16);
 const hash='scrypt$'+salt.toString('hex')+'$'+scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024}).toString('hex');
 const identity=await db`SELECT u.id,u.active,u.password_hash FROM users u JOIN organizations o ON o.id=u.organization_id WHERE o.slug='vinca-uat' AND lower(trim(u.email))='leoneshenkad@gmail.com' AND u.role='owner' LIMIT 2`;
 if(identity.length!==1)throw Error('Expected exactly one UAT Owner');
 if(identity[0].active||identity[0].password_hash)throw Error('Owner already provisioned');
 const result=await db`UPDATE users SET password_hash=${hash},active=true WHERE id=${identity[0].id}::uuid AND active=false AND password_hash IS NULL RETURNING id`;
 if(result.length!==1)throw Error('Owner was changed concurrently; no credentials overwritten');
 stdout.write('UAT Owner activated. Validate login only against isolated UAT environment.\n');
}catch(error){stderr.write('Bootstrap failed: '+(error instanceof Error?error.message:'unknown')+'\n');process.exitCode=1}
finally{stdin.pause()}
