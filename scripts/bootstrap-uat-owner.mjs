#!/usr/bin/env node
// One-time, opt-in UAT bootstrap. Run on a trusted machine with an isolated UAT Neon connection.
// This script does not run on import, during CI or during deployment.
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';
import { randomBytes, scryptSync } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
const uri=process.env.DATABASE_URL;
const branch=process.env.VINCA_BOOTSTRAP_BRANCH;
if(process.env.VINCA_BOOTSTRAP_ACK!=='ISOLATED_UAT_ONLY'||branch!=='br-long-wildflower-b3nsciay'||!uri){
 stderr.write('Refusing bootstrap: explicit isolated UAT acknowledgement, branch and DATABASE_URL are required.\n');process.exit(1);
}
const rl=createInterface({input:stdin,output:stdout,terminal:true});
try{
 const password=await rl.question('New Owner password (12-256 chars; input is visible; use a private terminal): ');
 if(password.length<12||password.length>256)throw Error('Password length invalid');
 const salt=randomBytes(16);
 const hash='scrypt$'+salt.toString('hex')+'$'+scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024}).toString('hex');
 const db=neon(uri);
 const identity=await db`SELECT u.id,u.active,u.password_hash FROM users u JOIN organizations o ON o.id=u.organization_id WHERE o.slug='vinca-uat' AND lower(trim(u.email))='leoneshenkad@gmail.com' AND u.role='owner' LIMIT 2`;
 if(identity.length!==1)throw Error('Expected exactly one UAT Owner');
 if(identity[0].active||identity[0].password_hash)throw Error('Owner already provisioned');
 const result=await db`UPDATE users SET password_hash=${hash},active=true WHERE id=${identity[0].id}::uuid AND active=false AND password_hash IS NULL RETURNING id`;
 if(result.length!==1)throw Error('Owner was changed concurrently; no credentials overwritten');
 stdout.write('UAT Owner activated. Validate login only against isolated UAT environment.\n');
}catch(error){stderr.write('Bootstrap failed: '+(error instanceof Error?error.message:'unknown')+'\n');process.exitCode=1}
finally{rl.close()}
