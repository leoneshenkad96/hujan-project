import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {uuid} from '@/lib/invoice-validation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
/** Reconcile invoices to their actual payment ledger, never to supplied client totals. */
export async function GET(req:NextRequest){
 try{
  const auth=await requirePermission('finance:read');
  if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
  const eventId=req.nextUrl.searchParams.get('eventId');
  if(eventId&&!uuid.test(eventId))return fail('Invalid event ID',400);
  const org=auth.user.organizationId,db=getDatabase();
  if(eventId){
   const [owned]=await db.select({id:events.id}).from(events)
     .where(and(eq(events.id,eventId),eq(events.organizationId,org))).limit(1);
   if(!owned)return fail('Event not found',404);
  }
  const {sql}=await import('drizzle-orm');
  const eventClause=eventId?sql`AND i.event_id=${eventId}::uuid`:sql``;
  const result=await db.execute(sql`
   SELECT i.id AS invoice_id,i.number,i.status,i.amount::text AS amount,
     i.paid_amount::text AS recorded_paid,
     COALESCE(sum(p.amount),0)::text AS ledger_paid,
     (i.paid_amount-COALESCE(sum(p.amount),0))::text AS variance,
     count(p.id)::int AS payment_count
   FROM invoices i
   LEFT JOIN invoice_payments p ON p.invoice_id=i.id AND p.organization_id=i.organization_id
   WHERE i.organization_id=${org}::uuid ${eventClause}
   GROUP BY i.id,i.number,i.status,i.amount,i.paid_amount
   HAVING i.paid_amount<>COALESCE(sum(p.amount),0)
      OR i.paid_amount>i.amount OR i.paid_amount<0
      OR (i.status='paid' AND i.paid_amount<>i.amount)
      OR (i.status IN ('draft','voided') AND i.paid_amount<>0)
      OR (i.status='partially_paid' AND (i.paid_amount=0 OR i.paid_amount=i.amount))
      OR (i.status='issued' AND i.paid_amount<>0)
   ORDER BY i.number,i.id
   LIMIT 101
  `);
  const rows=result.rows.slice(0,100);
  return NextResponse.json({items:rows,hasMore:result.rows.length>100,checkedScope:eventId?'event':'organization',
    note:'Read-only exception report; zero exceptions do not replace concurrency, tenant and audit testing.'},
    {headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Reconciliation unavailable',503)}
}
