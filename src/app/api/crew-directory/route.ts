import {NextResponse} from 'next/server';
import {and,asc,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{
  const auth=await requirePermission('tasks:write');
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.error==='unauthorized'?401:403});
  const rows=await getDatabase().select({id:users.id,name:users.name,role:users.role}).from(users).where(and(eq(users.organizationId,auth.user.organizationId),eq(users.active,true))).orderBy(asc(users.name)).limit(200);
  return NextResponse.json({items:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Crew directory unavailable'},{status:503})}
}
