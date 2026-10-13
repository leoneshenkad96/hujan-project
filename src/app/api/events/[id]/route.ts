import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq,notExists,notInArray} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,tasks,rundownItems} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseEventStatus,parseProgress,canTransitionEvent} from '@/lib/event-validation';
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
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
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
 const db=getDatabase(),org=auth.user.organizationId;
 const [existing]=await db.select({status:events.status,progress:events.progress}).from(events).where(and(eq(events.id,id),eq(events.organizationId,org))).limit(1);
 if(!existing)return fail('Event not found',404);
 if(status!==undefined&&status!==existing.status&&!canTransitionEvent(existing.status,status))return fail('Invalid event status transition',409);
 if(existing.status==='completed'||existing.status==='cancelled')return fail('Closed event cannot be modified',409);
 if(status==='completed'&&progress!==undefined&&progress!==100)return fail('Completed event must have 100% progress',400);
 const update={...(status!==undefined?{status}:{}),...(progress!==undefined?{progress}:{}),...(status==='completed'?{progress:100}:{}),updatedAt:new Date()};
 const [event]=await db.update(events).set(update).where(and(eq(events.id,id),eq(events.organizationId,org),eq(events.status,existing.status),status==='completed'?notExists(db.select({id:tasks.id}).from(tasks).where(and(eq(tasks.organizationId,org),eq(tasks.eventId,id),notInArray(tasks.status,['done'])))):undefined,status==='completed'?notExists(db.select({id:rundownItems.id}).from(rundownItems).where(and(eq(rundownItems.organizationId,org),eq(rundownItems.eventId,id),notInArray(rundownItems.status,['done','skipped'])))):undefined)).returning();
 if(!event)return fail('Event update conflict or incomplete tasks/rundown',409);
 return NextResponse.json({event},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Event service unavailable',503)}
}
