import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {events,eventCosts,vendors,auditLogs} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseExpense} from '@/lib/budget-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{
 const a=await requirePermission('finance:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=parseExpense(await req.json().catch(()=>null));if(!input)return fail('Invalid expense',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [event]=await db.select({id:events.id}).from(events).where(and(eq(events.id,input.eventId),eq(events.organizationId,org))).limit(1);if(!event)return fail('Event not found',404);
 if(input.vendorId){const [vendor]=await db.select({id:vendors.id}).from(vendors).where(and(eq(vendors.id,input.vendorId),eq(vendors.organizationId,org))).limit(1);if(!vendor)return fail('Vendor not found',404)}
 // This ledger is independent of PO commitments. No inference that an actual expense settles a PO.
 const [cost]=await db.insert(eventCosts).values({...input,organizationId:org,status:'actual'}).returning();
 await db.insert(auditLogs).values({organizationId:org,actorId:a.user.id,action:'expense.created',resourceType:'event_cost',resourceId:cost.id,details:JSON.stringify({eventId:cost.eventId,amount:cost.amount})});
 return NextResponse.json({expense:cost},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Expense service unavailable',503)}
}
