import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {rundownItems} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseRundownPatch,validUuid} from '@/lib/rundown-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function PATCH(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{const a=await requirePermission('rundown:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const {id}=await params;if(!validUuid(id))return fail('Invalid ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const update=parseRundownPatch(await req.json().catch(()=>null));if(!update)return fail('Invalid update',400);
 const [item]=await getDatabase().update(rundownItems).set({...update,updatedAt:new Date()}).where(and(eq(rundownItems.id,id),eq(rundownItems.organizationId,a.user.organizationId))).returning();
 if(!item)return fail('Segment not found',404);
 return NextResponse.json({item},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Rundown unavailable',503)}
}
