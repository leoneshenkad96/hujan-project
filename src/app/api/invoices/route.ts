import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {randomUUID} from 'node:crypto';
import {and,desc,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,invoices} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {invoiceInput,uuid,invoiceBalance} from '@/lib/invoice-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
 const auth=await requirePermission('finance:read');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const eventId=req.nextUrl.searchParams.get('eventId');if(eventId&&!uuid.test(eventId))return fail('Invalid eventId',400);
 const page=Number(req.nextUrl.searchParams.get('page')||1),limit=Number(req.nextUrl.searchParams.get('limit')||20);
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
 const rows=await getDatabase().select().from(invoices).where(and(eq(invoices.organizationId,auth.user.organizationId),eventId?eq(invoices.eventId,eventId):undefined)).orderBy(desc(invoices.createdAt),desc(invoices.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit).map(x=>({...x,balance:invoiceBalance(x.amount,x.paidAmount)})),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Invoices unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('finance:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=invoiceInput(await req.json().catch(()=>null));if(!input)return fail('Invalid invoice',400);
 const org=auth.user.organizationId,db=getDatabase();
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,input.eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 const [invoice]=await db.insert(invoices).values({...input,organizationId:org,number:'INV-'+randomUUID(),status:'draft'}).returning();
 return NextResponse.json({invoice},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Invoices unavailable',503)}
}
