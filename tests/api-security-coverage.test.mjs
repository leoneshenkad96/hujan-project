import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

function routes(directory){
 const out=[];
 for(const child of readdirSync(directory,{withFileTypes:true})){
  const p=join(directory,child.name);
  if(child.isDirectory())out.push(...routes(p));
  else if(child.name==='route.ts')out.push(p);
 }
 return out;
}

test('every mutating API route enforces same-origin for session cookies',()=>{
 const paths=routes('src/app/api');
 const uncovered=paths.filter(path=>{
  const source=readFileSync(path,'utf8');
  return /export async function (POST|PATCH|PUT|DELETE)\(/.test(source)&&!source.includes('isTrustedOrigin(');
 });
 assert.deepEqual(uncovered,[],`Missing Origin validation: ${uncovered.join(', ')}`);
});

test('sensitive API routes consistently declare nodejs runtime',()=>{
 const paths=routes('src/app/api');
 const uncovered=paths.filter(p=>{
  const source=readFileSync(p,'utf8');
  return /export async function (POST|PATCH)\(/.test(source)&&!source.includes("runtime='nodejs'")&&!source.includes('runtime = \'nodejs\'');
 });
 assert.deepEqual(uncovered,[]);
});
