import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseEventStatus,parseProgress} from '@/lib/event-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type Context={params:Promise<{id:string}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(_req:NextRequest,{params}:Context){
 try{
 const auth=await requirePermission('events:read');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 const [event]=await getDatabase().select().from(events).where(and(eq(events.id,id),eq(events.organizationId,auth.user.organizationId))).limit(1);
 if(!event)return fail('Event not found',404);
 return NextResponse.json({event},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Event service unavailable',503)}
}
export async function PATCH(req:NextRequest,{params}:Context){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('events:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const body=await req.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return fail('Invalid update',400);
 const x=body as Record<string,unknown>;
 if(Object.keys(x).length<1||Object.keys(x).some(k=>!['status','progress'].includes(k)))return fail('Unsupported update',400);
 const status=x.status===undefined?undefined:parseEventStatus(x.status);
 const progress=x.progress===undefined?undefined:parseProgress(x.progress);
 if(status===null||progress===null)return fail('Invalid status or progress',400);
 const [event]=await getDatabase().update(events).set({...status?{status}:{},...progress!==undefined?{progress}:{},updatedAt:new Date()}).where(and(eq(events.id,id),eq(events.organizationId,auth.user.organizationId))).returning();
 if(!event)return fail('Event not found',404);
 return NextResponse.json({event},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Event service unavailable',503)}
}
