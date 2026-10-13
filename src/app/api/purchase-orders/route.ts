import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {and,eq,desc} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,vendors,purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parsePO} from '@/lib/procurement-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('vendors:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const page=Number(req.nextUrl.searchParams.get('page')||'1'),limit=Number(req.nextUrl.searchParams.get('limit')||'25');
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
 const rows=await getDatabase().select().from(purchaseOrders).where(eq(purchaseOrders.organizationId,a.user.organizationId)).orderBy(desc(purchaseOrders.createdAt),desc(purchaseOrders.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Procurement unavailable',503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('vendors:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const payload=parsePO(await req.json().catch(()=>null));if(!payload)return fail('Invalid purchase order',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,payload.eventId),eq(events.organizationId,org))).limit(1);
 const [vendor]=await db.select({id:vendors.id}).from(vendors).where(and(eq(vendors.id,payload.vendorId),eq(vendors.organizationId,org))).limit(1);
 if(!event||!vendor)return fail('Event or vendor not found',404);
 const [po]=await db.insert(purchaseOrders).values({...payload,organizationId:org,number:'PO-'+randomUUID()}).returning();
 return NextResponse.json({purchaseOrder:po},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Procurement unavailable',503)}
}
