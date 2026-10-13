import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { organizations, users } from '@/db/schema';
import { newSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 const type=request.headers.get('content-type')||'';
 if(!type.includes('application/json'))return NextResponse.json({error:'Expected JSON'},{status:415});
 const origin=request.headers.get('origin');
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:'Origin not allowed'},{status:403});
 let input:unknown;
 try{input=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!input||typeof input!=='object')return NextResponse.json({error:'Invalid input'},{status:400});
 const {email,password,organization} = input as Record<string,unknown>;
 if(typeof email!=='string'||typeof password!=='string'||typeof organization!=='string'||email.length>254||password.length>256||password.length===0||organization.length>80)
 return NextResponse.json({error:'Invalid credentials'},{status:401});
 try{
  const db=getDatabase();
  const rows=await db.select({id:users.id,organizationId:users.organizationId,email:users.email,name:users.name,role:users.role,hash:users.passwordHash})
  .from(users).innerJoin(organizations,eq(users.organizationId,organizations.id))
  .where(and(eq(users.email,email.toLowerCase().trim()),eq(organizations.slug,organization.trim()),eq(users.active,true))).limit(1);
  const found=rows[0];
  const valid=await verifyPassword(password,found?.hash??null);
  if(!found||!valid)return NextResponse.json({error:'Invalid credentials'},{status:401,headers:{'Cache-Control':'no-store'}});
  await newSession(found);
  return NextResponse.json({user:{id:found.id,email:found.email,name:found.name,role:found.role}},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Authentication unavailable'},{status:503})}
}
