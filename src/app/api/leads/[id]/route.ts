import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {isTrustedOrigin} from '@/lib/security';
import {getDatabase} from '@/db/client';
import {leads} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {canTransitionLead,LEAD_STATUSES,validLeadId} from '@/lib/lead-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function PATCH(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const auth=await requirePermission('clients:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
  const {id}=await params;if(!validLeadId(id))return fail('Invalid lead ID',400);
  if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
  const body=await req.json().catch(()=>null);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1)return fail('Invalid status update',400);
  const status=(body as {status?:unknown}).status;
  if(typeof status!=='string'||!LEAD_STATUSES.includes(status as typeof LEAD_STATUSES[number]))return fail('Invalid lead status',400);
  const db=getDatabase(),org=auth.user.organizationId;
  const [previous]=await db.select({status:leads.status,clientId:leads.clientId}).from(leads).where(and(eq(leads.id,id),eq(leads.organizationId,org))).limit(1);
  if(!previous)return fail('Lead not found',404);
  if(!canTransitionLead(previous.status,status as typeof previous.status))return fail('Invalid lead status transition',409);
  if(status==='won'&&!previous.clientId)return fail('Lead needs a client before winning',409);
  const [lead]=await db.update(leads).set({status:status as typeof previous.status}).where(and(eq(leads.id,id),eq(leads.organizationId,org),eq(leads.status,previous.status))).returning();
  if(!lead)return fail('Concurrent lead status update conflict',409);
  return NextResponse.json({lead},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Lead update unavailable',503)}
}
