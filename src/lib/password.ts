import 'server-only';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const SETTINGS={N:16384,r:8,p:1,maxmem:32*1024*1024};
export async function hashPassword(password:string) {
 if(password.length<12 || password.length>256) throw new Error('Password must be 12-256 characters');
 const salt=randomBytes(16);
 const hash=await scrypt(password,salt,64,SETTINGS) as Buffer;
 return 'scrypt$'+salt.toString('hex')+'$'+hash.toString('hex');
}
export async function verifyPassword(password:string,stored:string|null) {
 if(!stored || !/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(stored)) return false;
 const [,salt,hex]=stored.split('$');
 const expected=Buffer.from(hex,'hex');
 const actual=await scrypt(password,Buffer.from(salt,'hex'),64,SETTINGS) as Buffer;
 return timingSafeEqual(actual,expected);
}
