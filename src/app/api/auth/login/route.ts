import { NextRequest, NextResponse } from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { users } from '@/db/schema';
import { newSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { enforceLoginRateLimit } from '@/lib/login-rate-limit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 const type=request.headers.get('content-type')||'';
 if(!type.includes('application/json'))return NextResponse.json({error:'Expected JSON'},{status:415});
 if(!isTrustedOrigin(request.headers.get('origin'),request.url,process.env.NODE_ENV==='production'))return NextResponse.json({error:'Origin not allowed'},{status:403});
 let input:unknown;
 try{input=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!input||typeof input!=='object'||Array.isArray(input))return NextResponse.json({error:'Invalid input'},{status:400});
 const {email,password} = input as Record<string,unknown>;
 if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>256||password.length===0||!email.includes('@'))
 return NextResponse.json({error:'Invalid credentials'},{status:401});
 const normalizedEmail=email.trim().toLowerCase();
 try{
  const ip=request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ?? 'unknown';
  // Global account throttle prevents bypass by changing organization input.
  const allowed=await enforceLoginRateLimit(ip,'email-login',normalizedEmail);
  if(!allowed)return NextResponse.json({error:'Too many attempts. Try again later.'},{status:429,headers:{'Cache-Control':'no-store','Retry-After':'900'}});
  const db=getDatabase();
  // Email-only login MUST fail closed for duplicate active identities across tenants.
  // An administrator must resolve duplicates before this login method can be used.
  const rows=await db.select({id:users.id,organizationId:users.organizationId,email:users.email,name:users.name,role:users.role,hash:users.passwordHash,active:users.active})
   .from(users).where(sql`lower(trim(${users.email})) = ${normalizedEmail}`).limit(2);
  const found=rows.length===1?rows[0]:null;
  const valid=await verifyPassword(password,found?.hash??null);
  if(!found||!valid)return NextResponse.json({error:'Invalid credentials'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(!found.active)return NextResponse.json({error:'Invalid credentials'},{status:401,headers:{'Cache-Control':'no-store'}});
  await newSession(found);
  return NextResponse.json({user:{id:found.id,email:found.email,name:found.name,role:found.role}},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Authentication unavailable'},{status:503})}
}
