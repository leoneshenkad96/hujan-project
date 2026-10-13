import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
const password=process.env.VINCA_INITIAL_PASSWORD;
if(!password || password.length<12 || password.length>256){
 console.error('Set VINCA_INITIAL_PASSWORD (12-256 chars) in a local environment. Do not put passwords in arguments or GitHub.');
 process.exit(1);
}
const salt=randomBytes(16);
const hash=scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024});
console.log('scrypt$'+salt.toString('hex')+'$'+hash.toString('hex'));
