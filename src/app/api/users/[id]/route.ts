import { NextRequest, NextResponse } from 'next/server';
import { and,eq,sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { users } from '@/db/schema';
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
 // A single PostgreSQL statement makes user changes and session revocation atomic.
 // Recheck the owner's privilege against the current row to close a concurrent role-edit race.
 const changedName=update.name??null;
 const changedRole=update.role??null;
 const changedActive=update.active??null;
 const changedPassword=update.passwordHash??null;
 const mustRevoke=x.password!==undefined||x.active===false||x.role!==undefined;
 const result=await db.execute(sql`
 WITH changed AS (
  UPDATE users SET
   name=COALESCE(${changedName}::varchar,name),
   role=COALESCE(${changedRole}::varchar,role),
   active=COALESCE(${changedActive}::boolean,active),
   password_hash=COALESCE(${changedPassword}::text,password_hash)
  WHERE id=${id}::uuid AND organization_id=${auth.user.organizationId}::uuid
   AND (${auth.user.role==='owner'}::boolean OR role<>'owner')
  RETURNING id,name,email,role,active
 ), revoked AS (
  UPDATE auth_sessions SET revoked_at=NOW()
  WHERE user_id=${id}::uuid AND organization_id=${auth.user.organizationId}::uuid
   AND ${mustRevoke}::boolean AND EXISTS(SELECT 1 FROM changed)
  RETURNING id
 )
 SELECT c.id,c.name,c.email,c.role,c.active,(SELECT count(*) FROM revoked)::int AS revoked_count FROM changed c
 `);
 const changed=result.rows[0];
 if(!changed)return fail('User not found or no longer editable',409);
 return NextResponse.json({user:changed},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Cannot update user',503)}
}
