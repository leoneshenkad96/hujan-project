import {NextRequest,NextResponse} from 'next/server';
import {and,eq,sql} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,leads} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {can} from '@/lib/permissions';
import {uuid} from '@/lib/budget-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
  const a=await requirePermission('dashboard:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const org=a.user.organizationId,raw=req.nextUrl.searchParams.get('eventId');
  if(raw&&!uuid.test(raw))return fail('Invalid event ID',400);
  const db=getDatabase();
  const eventFilter=and(eq(events.organizationId,org),raw?eq(events.id,raw):undefined);
  if(raw){const [found]=await db.select({id:events.id}).from(events).where(eventFilter).limit(1);if(!found)return fail('Event not found',404)}
  const portfolio=await db.select({id:events.id,title:events.title,eventDate:events.eventDate,progress:events.progress,status:events.status}).from(events).where(eventFilter).orderBy(events.eventDate,events.id).limit(200);
  const scoped=raw?sql` AND event_id=${raw}::uuid`:sql``;
  const [eventStats,taskStats,leadStats]=await Promise.all([
   db.execute(sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE status NOT IN ('completed','cancelled'))::int AS active, COALESCE(round(avg(progress)),0)::int AS average_progress FROM events WHERE organization_id=${org}::uuid ${raw?sql`AND id=${raw}::uuid`:sql``}`),
   db.execute(sql`SELECT count(*)::int as total, count(*) FILTER (WHERE status='done')::int as done, count(*) FILTER (WHERE status='blocked')::int as blocked FROM event_tasks WHERE organization_id=${org}::uuid ${scoped}`),
   db.select({status:leads.status,count:sql<number>`count(*)::int`}).from(leads).where(eq(leads.organizationId,org)).groupBy(leads.status)
  ]);
  const financialAllowed=can(a.user.role,'finance:read');
  let financial:null|Record<string,string>=null;
  if(financialAllowed){
   const [inv,cost,po]=await Promise.all([
    db.execute(sql`SELECT COALESCE(sum(amount) FILTER (WHERE status NOT IN ('draft','voided')),0)::text AS invoiced,COALESCE(sum(paid_amount),0)::text AS received FROM invoices WHERE organization_id=${org}::uuid ${scoped}`),
    db.execute(sql`SELECT COALESCE(sum(amount) FILTER (WHERE status='actual'),0)::text AS actual FROM event_costs WHERE organization_id=${org}::uuid ${scoped}`),
    db.execute(sql`SELECT COALESCE(sum(amount) FILTER (WHERE status NOT IN ('draft','cancelled')),0)::text AS commitments FROM purchase_orders WHERE organization_id=${org}::uuid ${scoped}`)
   ]);
   financial={invoiced:String(inv.rows[0]?.invoiced??'0'),received:String(inv.rows[0]?.received??'0'),actualExpenses:String(cost.rows[0]?.actual??'0'),poCommitments:String(po.rows[0]?.commitments??'0')};
  }
  return NextResponse.json({scope:raw?'event':'organization',eventId:raw||null,portfolio,summary:{events:Number(eventStats.rows[0]?.total??0),activeEvents:Number(eventStats.rows[0]?.active??0),averageProgress:Number(eventStats.rows[0]?.average_progress??0),tasks:taskStats.rows[0]??{total:0,done:0,blocked:0},leads:raw?null:leadStats},financial,notes:{financial:'Issued invoices, cash received, actual expenses and PO commitments are separate measures; not additive.',scope:'Portfolio display limited to 200 events; KPI totals and averages cover the full selected scope.'}},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Dashboard unavailable',503)}
}
