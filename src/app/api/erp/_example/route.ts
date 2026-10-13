import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{const {user,error}=await requirePermission('finance:read');
 if(error)return NextResponse.json({error},{status:error==='unauthorized'?401:403,headers:{'Cache-Control':'no-store'}});
 return NextResponse.json({ok:true,role:user.role,organizationId:user.organizationId},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Service unavailable'},{status:503})}
}
