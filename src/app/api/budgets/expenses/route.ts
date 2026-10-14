import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq,sql} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,vendors,purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseExpense} from '@/lib/budget-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const a=await requirePermission('finance:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=parseExpense(await req.json().catch(()=>null));if(!input)return fail('Invalid expense',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,input.eventId),eq(events.organizationId,org))).limit(1);if(!event)return fail('Event not found',404);
 if(input.vendorId){const [vendor]=await db.select({id:vendors.id}).from(vendors).where(and(eq(vendors.id,input.vendorId),eq(vendors.organizationId,org))).limit(1);if(!vendor)return fail('Vendor not found',404)}
 if(input.purchaseOrderId){
  const [po]=await db.select({id:purchaseOrders.id,vendorId:purchaseOrders.vendorId,status:purchaseOrders.status}).from(purchaseOrders).where(and(eq(purchaseOrders.id,input.purchaseOrderId),eq(purchaseOrders.organizationId,org),eq(purchaseOrders.eventId,input.eventId))).limit(1);
  if(!po||po.status==='draft'||po.status==='cancelled'||(input.vendorId&&po.vendorId!==input.vendorId))return fail('Invalid purchase order match',409);
 }
 // A conditional UPDATE is the row-level concurrency gate. The expense and audit are
 // written in the same SQL statement, so a failed insert rolls back the reservation.
 const result=await db.execute(sql`
  WITH reserved AS (
   UPDATE purchase_orders
   SET matched_actual=matched_actual+${input.amount}::numeric
   WHERE id=${input.purchaseOrderId}::uuid
     AND organization_id=${org}::uuid AND event_id=${input.eventId}::uuid
     AND status NOT IN ('draft','cancelled')
     AND matched_actual+${input.amount}::numeric<=amount
   RETURNING id
  ), inserted AS (
   INSERT INTO event_costs (organization_id,event_id,vendor_id,purchase_order_id,description,amount,status)
   SELECT ${org}::uuid,${input.eventId}::uuid,${input.vendorId}::uuid,${input.purchaseOrderId}::uuid,${input.description},${input.amount}::numeric,'actual'
   WHERE ${input.purchaseOrderId}::uuid IS NULL OR EXISTS (SELECT 1 FROM reserved)
   RETURNING id,event_id,vendor_id,purchase_order_id,description,amount,status,created_at
  ), logged AS (
   INSERT INTO audit_logs (organization_id,actor_id,action,resource_type,resource_id,details)
   SELECT ${org}::uuid,${a.user.id}::uuid,'expense.created','event_cost',inserted.id,
          json_build_object('eventId',inserted.event_id,'amount',inserted.amount,'purchaseOrderId',inserted.purchase_order_id)::text
   FROM inserted RETURNING id
  )
  SELECT inserted.* FROM inserted CROSS JOIN logged
 `);
 const expense=result.rows[0];
 if(!expense)return fail('Purchase order limit exceeded or expense could not be recorded',409);
 return NextResponse.json({expense},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Expense service unavailable',503)}
}
