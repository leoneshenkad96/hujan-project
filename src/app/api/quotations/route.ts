import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {randomUUID} from 'node:crypto';
import {and,eq,desc} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,quotations} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseQuote,uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('clients:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const eventId=req.nextUrl.searchParams.get('eventId');if(eventId&&!uuid.test(eventId))return fail('Invalid event ID',400);
 const org=a.user.organizationId;
 const rows=await getDatabase().select().from(quotations).where(and(eq(quotations.organizationId,org),eventId?eq(quotations.eventId,eventId):undefined)).orderBy(desc(quotations.createdAt),desc(quotations.id)).limit(100);
 return NextResponse.json({items:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Quotations unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const data=parseQuote(await req.json().catch(()=>null));if(!data)return fail('Invalid quotation',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id,clientId:events.clientId}).from(events).where(and(eq(events.id,data.eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 const [quotation]=await db.insert(quotations).values({...data,organizationId:org,clientId:event.clientId,number:'QUO-'+randomUUID()}).returning();
 return NextResponse.json({quotation},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Quotations unavailable',503)}
}
