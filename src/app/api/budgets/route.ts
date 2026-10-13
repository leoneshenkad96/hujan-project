import {NextRequest,NextResponse} from 'next/server';
import {and,eq,ne} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,eventCosts,purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {summarizeBudget,uuid} from '@/lib/budget-validation';
import {forecastCost} from '@/lib/forecast-cost';
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
 db.select({id:eventCosts.id,description:eventCosts.description,amount:eventCosts.amount,status:eventCosts.status,purchaseOrderId:eventCosts.purchaseOrderId}).from(eventCosts).where(and(eq(eventCosts.eventId,eventId),eq(eventCosts.organizationId,org))),
 db.select({id:purchaseOrders.id,number:purchaseOrders.number,description:purchaseOrders.description,amount:purchaseOrders.amount,matchedActual:purchaseOrders.matchedActual,status:purchaseOrders.status}).from(purchaseOrders).where(and(eq(purchaseOrders.eventId,eventId),eq(purchaseOrders.organizationId,org),ne(purchaseOrders.status,'cancelled')))
 ]);
 const actual=costs.filter(c=>c.status==='actual');
 const eligible=orders.filter(o=>o.status!=='draft');
 const summary=summarizeBudget(event.approvedBudget,actual.map(c=>c.amount),eligible.map(o=>o.amount));
 let forecast:null|ReturnType<typeof forecastCost>=null;
 let forecastStatus='unreconciled';
 try{
  const linked=new Map<string,string[]>();
  for(const cost of actual){if(cost.purchaseOrderId){const parts=linked.get(cost.purchaseOrderId)||[];parts.push(cost.amount);linked.set(cost.purchaseOrderId,parts)}}
  const allMatched=eligible.length>0&&actual.every(c=>c.purchaseOrderId!==null)&&[...linked.keys()].every(id=>eligible.some(o=>o.id===id));
  if(allMatched){
   const commitments=eligible.map(o=>({poAmount:o.amount,matchedActual:o.matchedActual}));
   forecast=forecastCost({approvedBudget:event.approvedBudget,actualExpenses:actual.map(c=>c.amount),commitments,otherForecastRemaining:[]});
   forecastStatus='partial_estimate';
  }
 }catch{forecast=null;forecastStatus='inconsistent_reconciliation'}
 return NextResponse.json({event,summary,forecast,forecastStatus,costs,purchaseOrders:orders,note:'Forecast is only a partial estimate when all actual costs are matched; unknown future costs are excluded. Gross PO totals are not reconciled outstanding liabilities.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Budget service unavailable',503)}
}
