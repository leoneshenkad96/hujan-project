import { NextRequest, NextResponse } from 'next/server';
import { and,eq,sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { events,users } from '@/db/schema';
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
 if(Object.keys(x).length===0||Object.keys(x).some(k=>!['name','role','active','password','eventId'].includes(k)))return fail('Unsupported update',400);
 if(x.eventId!==undefined&&x.eventId!==null&&typeof x.eventId!=='string')return fail('Invalid event selection',400);
 const update:Partial<typeof users.$inferInsert>={};
 if(x.name!==undefined){if(typeof x.name!=='string'||x.name.trim().length<2||x.name.trim().length>150)return fail('Invalid name',400);update.name=x.name.trim()}
 if(x.role!==undefined){if(typeof x.role!=='string'||!ROLES.includes(x.role as typeof ROLES[number]))return fail('Invalid role',400);update.role=x.role}
 if(x.active!==undefined){if(typeof x.active!=='boolean')return fail('Invalid status',400);update.active=x.active}
 if(x.password!==undefined){if(typeof x.password!=='string'||x.password.length<12||x.password.length>256)return fail('Invalid password',400);update.passwordHash=await hashPassword(x.password)}
 const db=getDatabase();
 const [target]=await db.select({id:users.id,role:users.role}).from(users).where(and(eq(users.id,id),eq(users.organizationId,auth.user.organizationId))).limit(1);
 if(!target)return fail('User not found',404);
 const effectiveRole=update.role??target.role;
 const eventId=x.eventId===undefined?null:typeof x.eventId==='string'?x.eventId:null;
 if(effectiveRole==='client_viewer'){
  if(!eventId||!uuid.test(eventId))return fail('Choose one event for the client account',400);
  const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,auth.user.organizationId))).limit(1);
  if(!event)return fail('Event not found in this organization',404);
 }else if(eventId!==null)return fail('Event access is only valid for client viewer accounts',400);
 if((target.role==='owner'||update.role==='owner')&&auth.user.role!=='owner')return fail('Only owner may manage owner accounts',403);
 if(target.role==='owner'&&(update.active===false||(update.role!==undefined&&update.role!=='owner')))return fail('Owner accounts cannot be deactivated or demoted',409);
 if(id===auth.user.id&&(update.active===false||(update.role!==undefined&&update.role!==auth.user.role)))return fail('Cannot revoke your own account or role',409);
 // A single PostgreSQL statement keeps the user, shared-event grant, and session revocation atomic.
 // Recheck the owner's privilege against the current row to close a concurrent role-edit race.
 const changedName=update.name??null;
 const changedRole=update.role??null;
 const changedActive=update.active??null;
 const changedPassword=update.passwordHash??null;
 const mustRevoke=x.password!==undefined||x.active===false||x.role!==undefined;
 const sharedEventId=effectiveRole==='client_viewer'?eventId:null;
 const result=await db.execute(sql`
 WITH changed AS (
  UPDATE users SET
   name=COALESCE(${changedName}::varchar,name),
   role=COALESCE(${changedRole}::varchar,role),
   active=COALESCE(${changedActive}::boolean,active),
   password_hash=COALESCE(${changedPassword}::text,password_hash)
  WHERE id=${id}::uuid AND organization_id=${auth.user.organizationId}::uuid
   AND (${auth.user.role==='owner'}::boolean OR role<>'owner')
   AND (role<>'owner' OR (${changedActive}::boolean IS DISTINCT FROM false AND (${changedRole}::varchar IS NULL OR ${changedRole}::varchar='owner')))
  RETURNING id,name,email,role,active
 ), revoked AS (
  UPDATE auth_sessions SET revoked_at=NOW()
  WHERE user_id=${id}::uuid AND organization_id=${auth.user.organizationId}::uuid
   AND ${mustRevoke}::boolean AND EXISTS(SELECT 1 FROM changed)
  RETURNING id
 ), cleared AS (
  DELETE FROM client_event_access
  WHERE user_id=${id}::uuid AND organization_id=${auth.user.organizationId}::uuid
   AND EXISTS(SELECT 1 FROM changed WHERE changed.role<>'client_viewer')
  RETURNING user_id
 ), granted AS (
  INSERT INTO client_event_access (organization_id,user_id,event_id)
  SELECT ${auth.user.organizationId}::uuid,changed.id,${sharedEventId}::uuid
  FROM changed WHERE changed.role='client_viewer'
  ON CONFLICT (user_id) DO UPDATE SET organization_id=EXCLUDED.organization_id,event_id=EXCLUDED.event_id
  RETURNING user_id
 )
 SELECT c.id,c.name,c.email,c.role,c.active,(SELECT count(*) FROM revoked)::int AS revoked_count FROM changed c
 `);
 const changed=result.rows[0];
 if(!changed)return fail('User not found or no longer editable',409);
 return NextResponse.json({user:changed},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Cannot update user',503)}
}
