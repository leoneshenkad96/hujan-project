import {NextRequest,NextResponse} from 'next/server';
import {and,asc,eq,ilike,or} from 'drizzle-orm';
import {isTrustedOrigin} from '@/lib/security';
import {getDatabase} from '@/db/client';
import {crewAssignments,events,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {validUuid} from '@/lib/rundown-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
  const a=await requirePermission('events:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const params=req.nextUrl.searchParams,eventId=params.get('eventId'),page=Number(params.get('page')||'1'),limit=Number(params.get('limit')||'50'),q=(params.get('q')||'').trim();
  if(!validUuid(eventId))return fail('Valid eventId required',400);
  if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100||q.length>100)return fail('Invalid crew filters',400);
  const org=a.user.organizationId,db=getDatabase();
  const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
  if(!event)return fail('Event not found',404);
  const escaped=q.replace(/[\\%_]/g,'\\$&');
  const items=await db.select({id:crewAssignments.id,userId:crewAssignments.userId,userName:users.name,role:crewAssignments.role,startAt:crewAssignments.startAt,endAt:crewAssignments.endAt})
   .from(crewAssignments).innerJoin(users,and(eq(users.id,crewAssignments.userId),eq(users.organizationId,crewAssignments.organizationId)))
   .where(and(eq(crewAssignments.organizationId,org),eq(crewAssignments.eventId,eventId),q?or(ilike(users.name,`%${escaped}%`),ilike(crewAssignments.role,`%${escaped}%`)):undefined))
   .orderBy(asc(crewAssignments.startAt),asc(crewAssignments.id)).limit(limit+1).offset((page-1)*limit);
  return NextResponse.json({items:items.slice(0,limit),page,limit,hasMore:items.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Crew schedule unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const a=await requirePermission('tasks:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
  const x=await req.json().catch(()=>null);
  if(!x||typeof x!=='object'||Array.isArray(x))return fail('Invalid assignment',400);
  const input=x as Record<string,unknown>;
  if(Object.keys(input).some(k=>!['eventId','userId','role','startAt','endAt'].includes(k)))return fail('Unsupported fields',400);
  const role=typeof input.role==='string'?input.role.trim():'';
  const parse=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v)?new Date(v):null;
  const startAt=parse(input.startAt),endAt=parse(input.endAt);
  if(!validUuid(input.eventId)||!validUuid(input.userId)||!role||role.length>100||!startAt||!endAt||!Number.isFinite(startAt.getTime())||!Number.isFinite(endAt.getTime())||startAt>=endAt)return fail('Invalid schedule or crew member',400);
  const db=getDatabase(),org=a.user.organizationId;
  const [event]=await db.select({id:events.id,status:events.status}).from(events).where(and(eq(events.id,input.eventId),eq(events.organizationId,org))).limit(1);
  if(!event||event.status==='completed'||event.status==='cancelled')return fail('Event cannot be scheduled',409);
  const [crew]=await db.select({id:users.id}).from(users).where(and(eq(users.id,input.userId),eq(users.organizationId,org),eq(users.active,true))).limit(1);
  if(!crew)return fail('Crew user not found',404);
  try{
   const [assignment]=await db.insert(crewAssignments).values({organizationId:org,eventId:input.eventId,userId:input.userId,role,startAt,endAt}).returning();
   return NextResponse.json({assignment},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){
   if(e&&typeof e==='object'&&('code'in e)&&e.code==='23514')return fail('Crew schedule conflicts with an active event or is invalid',409);
   throw e;
  }
 }catch{return fail('Crew assignment unavailable',503)}
}
