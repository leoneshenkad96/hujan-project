import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,asc,eq,ilike,max,or} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,rundownItems,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseRundown,validUuid} from '@/lib/rundown-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('events:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const params=req.nextUrl.searchParams,eventId=params.get('eventId'),page=Number(params.get('page')||'1'),limit=Number(params.get('limit')||'50'),q=(params.get('q')||'').trim(),status=params.get('status');
 if(!validUuid(eventId))return fail('Valid eventId required',400);
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100||q.length>100||status&&!['planned','standby','on_air','done','skipped'].includes(status))return fail('Invalid rundown filters',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 const escaped=q.replace(/[\\%_]/g,'\\$&');
 const items=await db.select().from(rundownItems).where(and(eq(rundownItems.organizationId,org),eq(rundownItems.eventId,eventId),status?eq(rundownItems.status,status as typeof rundownItems.$inferSelect.status):undefined,q?or(ilike(rundownItems.title,`%${escaped}%`),ilike(rundownItems.cue,`%${escaped}%`)):undefined)).orderBy(asc(rundownItems.position),asc(rundownItems.startTime),asc(rundownItems.id)).limit(limit+1).offset((page-1)*limit);
 const [lastPosition]=await db.select({value:max(rundownItems.position)}).from(rundownItems).where(and(eq(rundownItems.organizationId,org),eq(rundownItems.eventId,eventId)));
 return NextResponse.json({items:items.slice(0,limit),page,limit,hasMore:items.length>limit,nextPosition:(lastPosition?.value??0)+1},{headers:{'Cache-Control':'no-store'}});
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
