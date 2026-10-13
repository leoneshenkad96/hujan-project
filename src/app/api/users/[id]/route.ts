import { NextRequest, NextResponse } from 'next/server';
import { and,eq } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { users,authSessions } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { ROLES } from '@/lib/permissions';
import { isTrustedOrigin } from '@/lib/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function PATCH(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('users:manage');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=await req.json().catch(()=>null);if(!input||typeof input!=='object'||Array.isArray(input))return fail('Invalid update',400);
 const x=input as Record<string,unknown>;
 if(Object.keys(x).length===0||Object.keys(x).some(k=>!['name','role','active','password'].includes(k)))return fail('Unsupported update',400);
 const update:Partial<typeof users.$inferInsert>={};
 if(x.name!==undefined){if(typeof x.name!=='string'||x.name.trim().length<2||x.name.trim().length>150)return fail('Invalid name',400);update.name=x.name.trim()}
 if(x.role!==undefined){if(typeof x.role!=='string'||!ROLES.includes(x.role as typeof ROLES[number]))return fail('Invalid role',400);update.role=x.role}
 if(x.active!==undefined){if(typeof x.active!=='boolean')return fail('Invalid status',400);update.active=x.active}
 if(x.password!==undefined){if(typeof x.password!=='string'||x.password.length<12||x.password.length>256)return fail('Invalid password',400);update.passwordHash=await hashPassword(x.password)}
 const db=getDatabase();
 const [target]=await db.select({id:users.id,role:users.role}).from(users).where(and(eq(users.id,id),eq(users.organizationId,auth.user.organizationId))).limit(1);
 if(!target)return fail('User not found',404);
 if((target.role==='owner'||update.role==='owner')&&auth.user.role!=='owner')return fail('Only owner may manage owner accounts',403);
 if(id===auth.user.id&&(update.active===false||(update.role!==undefined&&update.role!==auth.user.role)))return fail('Cannot revoke your own account or role',409);
 const [changed]=await db.update(users).set(update).where(and(eq(users.id,id),eq(users.organizationId,auth.user.organizationId))).returning({id:users.id,name:users.name,email:users.email,role:users.role,active:users.active});
 if(x.password!==undefined||x.active===false||x.role!==undefined){await db.update(authSessions).set({revokedAt:new Date()}).where(and(eq(authSessions.userId,id),eq(authSessions.organizationId,auth.user.organizationId)));}
 return NextResponse.json({user:changed},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Cannot update user',503)}
}
