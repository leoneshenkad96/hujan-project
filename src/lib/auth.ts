import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { authSessions, users } from '@/db/schema';
import { can, type Permission } from './permissions';
export const COOKIE_NAME='vinca_session';
const SESSION_MS=1000*60*60*12;
const digest=(token:string)=>createHash('sha256').update(token).digest('hex');
export type CurrentUser={id:string;organizationId:string;email:string;name:string;role:string};
export async function newSession(user:CurrentUser){
 const token=randomBytes(32).toString('hex');
 await getDatabase().insert(authSessions).values({userId:user.id,organizationId:user.organizationId,tokenHash:digest(token),expiresAt:new Date(Date.now()+SESSION_MS)});
 (await cookies()).set(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_MS/1000});
}
export async function currentUser():Promise<CurrentUser|null>{
 const token=(await cookies()).get(COOKIE_NAME)?.value;
 if(!token||!/^[0-9a-f]{64}$/.test(token))return null;
 const db=getDatabase();
 const rows=await db.select({id:users.id,organizationId:users.organizationId,email:users.email,name:users.name,role:users.role})
 .from(authSessions).innerJoin(users,and(eq(authSessions.userId,users.id),eq(authSessions.organizationId,users.organizationId)))
 .where(and(eq(authSessions.tokenHash,digest(token)),isNull(authSessions.revokedAt),gt(authSessions.expiresAt,new Date()),eq(users.active,true))).limit(1);
 return rows[0]??null;
}
export async function revokeSession(){
 const store=await cookies();const token=store.get(COOKIE_NAME)?.value;
 if(token&&/^[0-9a-f]{64}$/.test(token)){
 await getDatabase().update(authSessions).set({revokedAt:new Date()}).where(eq(authSessions.tokenHash,digest(token)));
 }
 store.delete(COOKIE_NAME);
}
export async function requirePermission(permission:Permission){
 const user=await currentUser();
 if(!user)return {user:null,error:'unauthorized' as const};
 if(!can(user.role,permission))return {user:null,error:'forbidden' as const};
 return {user,error:null};
}
