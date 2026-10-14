import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { clientEventAccess, events, users } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { ROLES } from '@/lib/permissions';
import { isTrustedOrigin } from '@/lib/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req:NextRequest){
 try{
 const auth=await requirePermission('users:manage');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const page=Number(req.nextUrl.searchParams.get('page')||'1'),limit=Number(req.nextUrl.searchParams.get('limit')||'25');
 const q=(req.nextUrl.searchParams.get('q')||'').trim(),role=req.nextUrl.searchParams.get('role');
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100||q.length>100||(role&&!ROLES.includes(role as typeof ROLES[number])))return fail('Invalid user filters',400);
 const escaped=q.replace(/[\\%_]/g,'\\$&');
 const db=getDatabase();
 const rows=await db.select({id:users.id,username:users.username,name:users.name,email:users.email,role:users.role,active:users.active,createdAt:users.createdAt,eventId:clientEventAccess.eventId,eventTitle:events.title})
  .from(users).leftJoin(clientEventAccess,and(eq(clientEventAccess.userId,users.id),eq(clientEventAccess.organizationId,users.organizationId)))
  .leftJoin(events,and(eq(events.id,clientEventAccess.eventId),eq(events.organizationId,clientEventAccess.organizationId)))
  .where(and(eq(users.organizationId,auth.user.organizationId),role?eq(users.role,role):undefined,q?or(ilike(users.name,`%${escaped}%`),ilike(users.username,`%${escaped}%`),ilike(users.email,`%${escaped}%`)):undefined))
  .orderBy(desc(users.createdAt),asc(users.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Users unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('users:manage');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const body=await req.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return fail('Invalid user',400);
 const x=body as Record<string,unknown>;
 if(Object.keys(x).some(k=>!['username','name','email','role','password','eventId'].includes(k)))return fail('Unsupported fields',400);
 const username=typeof x.username==='string'?x.username.trim().toLowerCase():'';
 const name=typeof x.name==='string'?x.name.trim():'';
 const email=typeof x.email==='string'?x.email.trim().toLowerCase():'';
 const role=x.role;
 if(!/^[a-z0-9._-]{3,64}$/.test(username)||name.length<2||name.length>150||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof role!=='string'||!ROLES.includes(role as typeof ROLES[number])||typeof x.password!=='string'||x.password.length<12||x.password.length>256)return fail('Invalid user',400);
 if(x.eventId!==undefined&&x.eventId!==null&&typeof x.eventId!=='string')return fail('Invalid event selection',400);
 if(role==='owner'&&auth.user.role!=='owner')return fail('Only owner may grant owner role',403);
 const eventId=x.eventId===undefined?null:typeof x.eventId==='string'?x.eventId:null;
 if(role==='client_viewer'&&(!eventId||!uuid.test(eventId)))return fail('Choose one event for the client account',400);
 if(role!=='client_viewer'&&eventId!==null)return fail('Event access is only valid for client viewer accounts',400);
 const db=getDatabase();
 // Username and email are globally unique across organizations.
 const duplicate=await db.select({id:users.id}).from(users).where(sql`lower(trim(${users.email})) = ${email}`).limit(1);
 if(duplicate.length)return fail('Email already registered',409);
 const existingUsername=await db.select({id:users.id}).from(users).where(sql`lower(trim(${users.username})) = ${username}`).limit(1);
 if(existingUsername.length)return fail('Username already registered',409);
 const passwordHash=await hashPassword(x.password);
 let created;
 if(role==='client_viewer'){
  const result=await db.execute(sql`
   WITH eligible_event AS (
    SELECT id FROM events WHERE id=${eventId}::uuid AND organization_id=${auth.user.organizationId}::uuid
   ), created AS (
    INSERT INTO users (organization_id,username,name,email,role,password_hash,active)
    SELECT ${auth.user.organizationId}::uuid,${username},${name},${email},'client_viewer',${passwordHash},true FROM eligible_event
    RETURNING id,username,name,email,role,active
   ), granted AS (
    INSERT INTO client_event_access (organization_id,user_id,event_id)
    SELECT ${auth.user.organizationId}::uuid,created.id,eligible_event.id FROM created CROSS JOIN eligible_event
    RETURNING user_id
   ) SELECT created.* FROM created INNER JOIN granted ON granted.user_id=created.id
  `);
  created=result.rows[0];
  if(!created)return fail('Event not found in this organization',404);
 }else{
  const [row]=await db.insert(users).values({organizationId:auth.user.organizationId,username,name,email,role,passwordHash,active:true}).returning({id:users.id,username:users.username,name:users.name,email:users.email,role:users.role,active:users.active});
  created=row;
 }
 return NextResponse.json({user:created},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){
 // A concurrent duplicate must not be treated as successful.
 if(e&&typeof e==='object'&&'code' in e&&(e as {code?:string}).code==='23505')return fail('Username or email already registered',409);
 return fail('Cannot create user',503);
 }
}
