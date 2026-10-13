import {NextRequest,NextResponse} from 'next/server';
import {and,eq,ne,inArray} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,eventCosts,invoices,payments,purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {profitability} from '@/lib/profitability';
import {uuid} from '@/lib/budget-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:NextRequest){
 try{
  const a=await requirePermission('finance:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const eventId=request.nextUrl.searchParams.get('eventId');
  if(!eventId||!uuid.test(eventId))return fail('Valid eventId required',400);
  const org=a.user.organizationId,db=getDatabase();
  const [event]=await db.select({id:events.id,title:events.title,contractValue:events.contractValue,approvedBudget:events.approvedBudget}).from(events).where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
  if(!event)return fail('Event not found',404);
  const [costRows,invoiceRows,poRows]=await Promise.all([
   db.select({amount:eventCosts.amount,status:eventCosts.status}).from(eventCosts).where(and(eq(eventCosts.eventId,eventId),eq(eventCosts.organizationId,org))),
   db.select({id:invoices.id,amount:invoices.amount,status:invoices.status}).from(invoices).where(and(eq(invoices.eventId,eventId),eq(invoices.organizationId,org))),
   db.select({amount:purchaseOrders.amount,status:purchaseOrders.status}).from(purchaseOrders).where(and(eq(purchaseOrders.eventId,eventId),eq(purchaseOrders.organizationId,org),ne(purchaseOrders.status,'cancelled')))
  ]);
  const invoiceIds=invoiceRows.filter(x=>x.status!=='voided').map(x=>x.id);
  const paymentRows=invoiceIds.length?await db.select({amount:payments.amount,invoiceId:payments.invoiceId}).from(payments).where(and(eq(payments.organizationId,org),inArray(payments.invoiceId,invoiceIds))):[]; 
  const invoiceSet=new Set(invoiceIds);
  const summary=profitability({
   contractValue:event.contractValue,approvedBudget:event.approvedBudget,
   invoiceAmounts:invoiceRows.filter(x=>x.status!=='draft'&&x.status!=='voided').map(x=>x.amount),
   receivedPayments:paymentRows.filter(x=>invoiceSet.has(x.invoiceId)).map(x=>x.amount),
   actualExpenses:costRows.filter(x=>x.status==='actual').map(x=>x.amount),
   committedPOs:poRows.filter(x=>x.status!=='draft').map(x=>x.amount)
  });
  return NextResponse.json({event,summary},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Profitability report unavailable',503)}
}
