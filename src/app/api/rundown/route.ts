import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,asc,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,rundownItems,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseRundown,validUuid} from '@/lib/rundown-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('events:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const eventId=req.nextUrl.searchParams.get('eventId');if(!validUuid(eventId))return fail('Valid eventId required',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 const items=await db.select().from(rundownItems).where(and(eq(rundownItems.organizationId,org),eq(rundownItems.eventId,eventId))).orderBy(asc(rundownItems.position),asc(rundownItems.startTime),asc(rundownItems.id)).limit(501);
 return NextResponse.json({items:items.slice(0,500),hasMore:items.length>500},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Rundown unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{const a=await requirePermission('rundown:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const data=parseRundown(await req.json().catch(()=>null));if(!data)return fail('Invalid segment',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,data.eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 if(data.picId){const [pic]=await db.select({id:users.id}).from(users).where(and(eq(users.id,data.picId),eq(users.organizationId,org),eq(users.active,true))).limit(1);if(!pic)return fail('PIC not found',404)}
 const [item]=await db.insert(rundownItems).values({...data,organizationId:org}).returning();
 return NextResponse.json({item},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Rundown unavailable',503)}
}
