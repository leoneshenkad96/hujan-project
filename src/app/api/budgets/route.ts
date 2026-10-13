import {NextRequest,NextResponse} from 'next/server';
import {and,eq,ne} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,eventCosts,purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {summarizeBudget,uuid} from '@/lib/budget-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
 const a=await requirePermission('finance:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const eventId=req.nextUrl.searchParams.get('eventId');if(!eventId||!uuid.test(eventId))return fail('Valid eventId required',400);
 const org=a.user.organizationId,db=getDatabase();
 const [event]=await db.select({id:events.id,title:events.title,approvedBudget:events.approvedBudget,contractValue:events.contractValue}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
 if(!event)return fail('Event not found',404);
 const [costs,orders]=await Promise.all([
 db.select({id:eventCosts.id,description:eventCosts.description,amount:eventCosts.amount,status:eventCosts.status}).from(eventCosts).where(and(eq(eventCosts.eventId,eventId),eq(eventCosts.organizationId,org))),
 db.select({id:purchaseOrders.id,number:purchaseOrders.number,description:purchaseOrders.description,amount:purchaseOrders.amount,status:purchaseOrders.status}).from(purchaseOrders).where(and(eq(purchaseOrders.eventId,eventId),eq(purchaseOrders.organizationId,org),ne(purchaseOrders.status,'cancelled')))
 ]);
 const summary=summarizeBudget(event.approvedBudget,costs.filter(c=>c.status==='actual').map(c=>c.amount),orders.filter(o=>o.status!=='draft').map(o=>o.amount));
 return NextResponse.json({event,summary,costs,purchaseOrders:orders,note:'Actual expenses and PO commitments are separate measures, never additive until reconciled.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Budget service unavailable',503)}
}
