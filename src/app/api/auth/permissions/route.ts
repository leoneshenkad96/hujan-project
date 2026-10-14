import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { can,PERMISSIONS } from '@/lib/permissions';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{const user=await currentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
 return NextResponse.json({role:user.role,permissions:Object.fromEntries(Object.keys(PERMISSIONS).map(p=>[p,can(user.role,p as keyof typeof PERMISSIONS)]))},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Service unavailable'},{status:503})}
}
