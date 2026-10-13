#!/usr/bin/env node
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const errors=[];
function check(name,ok,help=''){process.stdout.write((ok?'PASS':'FAIL')+' '+name+(help?' — '+help:'')+'\n');if(!ok)errors.push(name)}
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
check('Node >=22',Number(process.versions.node.split('.')[0])>=22,'Found '+process.version);
check('Next.js dependency pinned',/^\d+\.\d+\.\d+$/.test(pkg.dependencies.next));
check('Database migration config present',existsSync(resolve(root,'drizzle.config.ts')));
check('Migration journal present',existsSync(resolve(root,'drizzle/meta/_journal.json')));
const journal=JSON.parse(readFileSync(resolve(root,'drizzle/meta/_journal.json'),'utf8'));
check('Eight reviewed migrations present',journal.entries.length===8);
for(const entry of journal.entries)check('Migration '+entry.tag,existsSync(resolve(root,'drizzle',entry.tag+'.sql')));
check('No environment secret file tracked in this preflight',!existsSync(resolve(root,'.env.production')));
if(process.env.RELEASE_ENV==='production'){
 check('Explicit production release approval',process.env.RELEASE_APPROVED==='YES');
 check('Database URL available',Boolean(process.env.DATABASE_URL));
 if(process.env.DATABASE_URL){
  try{const u=new URL(process.env.DATABASE_URL);
   check('PostgreSQL connection URI',u.protocol==='postgresql:'||u.protocol==='postgres:');
   check('TLS required for database',u.searchParams.get('sslmode')==='require'||u.searchParams.get('sslmode')==='verify-full');
  }catch{check('Valid DATABASE_URL',false)}
 }
}else process.stdout.write('INFO Release approval and production credentials intentionally not validated for local/CI dry run.\n');
if(errors.length){process.stderr.write('Release preflight failed: '+errors.join(', ')+'\n');process.exitCode=1}
else process.stdout.write('Preflight checks passed. This is NOT authorization to migrate or deploy.\n');
