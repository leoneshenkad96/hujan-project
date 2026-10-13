import {NextRequest,NextResponse} from 'next/server';
import {and,desc,eq,ilike,or} from 'drizzle-orm';
import {randomUUID} from 'node:crypto';
import {getDatabase} from '@/db/client';
import {events,clients,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseEvent,EVENT_STATUSES} from '@/lib/event-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
 const auth=await requirePermission('events:read');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {organizationId}=auth.user;
 const page=Number(req.nextUrl.searchParams.get('page')||1);
 const limit=Number(req.nextUrl.searchParams.get('limit')||10);
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
 const q=(req.nextUrl.searchParams.get('q')||'').trim();
 if(q.length>100)return fail('Search too long',400);
 const status=req.nextUrl.searchParams.get('status');
 if(status&&!EVENT_STATUSES.includes(status as typeof EVENT_STATUSES[number]))return fail('Invalid status',400);
 const criteria=and(eq(events.organizationId,organizationId),status?eq(events.status,status as typeof EVENT_STATUSES[number]):undefined,q?or(ilike(events.title,'%'+q.replace(/[\\%_]/g,'\\$&')+'%'),ilike(events.code,'%'+q.replace(/[\\%_]/g,'\\$&')+'%')):undefined);
 const rows=await getDatabase().select({id:events.id,code:events.code,title:events.title,eventDate:events.eventDate,type:events.type,venue:events.venue,status:events.status,progress:events.progress,contractValue:events.contractValue,approvedBudget:events.approvedBudget,clientId:events.clientId,projectManagerId:events.projectManagerId}).from(events).where(criteria).orderBy(desc(events.eventDate),desc(events.createdAt)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Event service unavailable',503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('events:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const payload=parseEvent(await req.json().catch(()=>null));if(!payload)return fail('Invalid event data',400);
 const {organizationId}=auth.user,db=getDatabase();
 const [client]=await db.select({id:clients.id}).from(clients).where(and(eq(clients.id,payload.clientId),eq(clients.organizationId,organizationId))).limit(1);
 if(!client)return fail('Client not found',404);
 if(payload.projectManagerId){
  const [manager]=await db.select({id:users.id,role:users.role}).from(users).where(and(eq(users.id,payload.projectManagerId),eq(users.organizationId,organizationId),eq(users.active,true))).limit(1);
  if(!manager||!['owner','admin','project_manager'].includes(manager.role))return fail('Invalid project manager',400);
 }
 // A UUID-derived code avoids non-atomic MAX+1 races and new sequence migrations.
 const code='EVT-'+randomUUID();
 const [event]=await db.insert(events).values({...payload,organizationId,code}).returning();
 return NextResponse.json({event},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Event service unavailable',503)}
}
