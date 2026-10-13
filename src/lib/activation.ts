import 'server-only';
import {createHash,randomBytes} from 'node:crypto';
export const digestToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export const newActivationToken=()=>randomBytes(32).toString('hex');
export function validActivationToken(token:unknown):token is string{
 return typeof token==='string'&&/^[0-9a-f]{64}$/.test(token);
}
export function validActivationRequest(input:unknown):input is {organization:string;email:string}{
 if(!input||typeof input!=='object'||Array.isArray(input))return false;
 const x=input as Record<string,unknown>;
 return typeof x.organization==='string'&&/^[a-z0-9][a-z0-9-]{2,79}$/.test(x.organization)&&typeof x.email==='string'&&x.email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email);
}
