import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,asc,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,tasks,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {taskInput,uuidPattern} from '@/lib/task-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('events:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const eventId=req.nextUrl.searchParams.get('eventId');if(eventId&&!uuidPattern.test(eventId))return fail('Invalid event ID',400);
 const page=Number(req.nextUrl.searchParams.get('page')||'1'),limit=Number(req.nextUrl.searchParams.get('limit')||'50');
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
 if(eventId){const [owned]=await getDatabase().select({id:events.id}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,a.user.organizationId))).limit(1);if(!owned)return fail('Event not found',404)}
 const criteria=and(eq(tasks.organizationId,a.user.organizationId),eventId?eq(tasks.eventId,eventId):undefined);
 const rows=await getDatabase().select({id:tasks.id,title:tasks.title,eventId:tasks.eventId,ownerId:tasks.ownerId,status:tasks.status,dueDate:tasks.dueDate,createdAt:tasks.createdAt}).from(tasks).where(criteria).orderBy(asc(tasks.dueDate),asc(tasks.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Tasks unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{const a=await requirePermission('tasks:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const data=taskInput(await req.json().catch(()=>null));if(!data)return fail('Invalid task',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,data.eventId),eq(events.organizationId,org))).limit(1);if(!event)return fail('Event not found',404);
 if(data.ownerId){const [owner]=await db.select({id:users.id}).from(users).where(and(eq(users.id,data.ownerId),eq(users.organizationId,org),eq(users.active,true))).limit(1);if(!owner)return fail('Owner not found',404)}
 const [task]=await db.insert(tasks).values({...data,organizationId:org}).returning();
 return NextResponse.json({task},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Tasks unavailable',503)}
}
