import 'server-only';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
const SETTINGS={N:16384,r:8,p:1,maxmem:32*1024*1024};
function derive(password:string,salt:Buffer):Promise<Buffer>{
 return new Promise((resolve,reject)=>scryptCallback(password,salt,64,SETTINGS,(error,derived)=>error?reject(error):resolve(derived)));
}
export async function hashPassword(password:string){
 if(password.length<12||password.length>256)throw new Error('Password must be 12-256 characters');
 const salt=randomBytes(16);const hash=await derive(password,salt);
 return 'scrypt$'+salt.toString('hex')+'$'+hash.toString('hex');
}
export async function verifyPassword(password:string,stored:string|null){
 if(!stored||!/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(stored))return false;
 const [,salt,hex]=stored.split('$');
 const expected=Buffer.from(hex,'hex');const actual=await derive(password,Buffer.from(salt,'hex'));
 return timingSafeEqual(actual,expected);
}
