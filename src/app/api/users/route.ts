import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { users } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { ROLES } from '@/lib/permissions';
import { isTrustedOrigin } from '@/lib/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 try{
 const auth=await requirePermission('users:manage');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const rows=await getDatabase().select({id:users.id,username:users.username,name:users.name,email:users.email,role:users.role,active:users.active,createdAt:users.createdAt}).from(users).where(eq(users.organizationId,auth.user.organizationId)).orderBy(users.createdAt).limit(200);
 return NextResponse.json({items:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Users unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('users:manage');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const body=await req.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return fail('Invalid user',400);
 const x=body as Record<string,unknown>;
 if(Object.keys(x).some(k=>!['username','name','email','role','password'].includes(k)))return fail('Unsupported fields',400);
 const username=typeof x.username==='string'?x.username.trim().toLowerCase():'';
 const name=typeof x.name==='string'?x.name.trim():'';
 const email=typeof x.email==='string'?x.email.trim().toLowerCase():'';
 const role=x.role;
 if(!/^[a-z0-9._-]{3,64}$/.test(username)||name.length<2||name.length>150||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof role!=='string'||!ROLES.includes(role as typeof ROLES[number])||typeof x.password!=='string'||x.password.length<12||x.password.length>256)return fail('Invalid user',400);
 if(role==='owner'&&auth.user.role!=='owner')return fail('Only owner may grant owner role',403);
 const db=getDatabase();
 // Username and email are globally unique across organizations.
 const duplicate=await db.select({id:users.id}).from(users).where(sql`lower(trim(${users.email})) = ${email}`).limit(1);
 if(duplicate.length)return fail('Email already registered',409);
 const existingUsername=await db.select({id:users.id}).from(users).where(sql`lower(trim(${users.username})) = ${username}`).limit(1);
 if(existingUsername.length)return fail('Username already registered',409);
 const passwordHash=await hashPassword(x.password);
 const [created]=await db.insert(users).values({organizationId:auth.user.organizationId,username,name,email,role,passwordHash,active:true}).returning({id:users.id,username:users.username,name:users.name,email:users.email,role:users.role,active:users.active});
 return NextResponse.json({user:created},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){
 // A concurrent duplicate must not be treated as successful.
 if(e&&typeof e==='object'&&'code' in e&&(e as {code?:string}).code==='23505')return fail('Username or email already registered',409);
 return fail('Cannot create user',503);
 }
}
