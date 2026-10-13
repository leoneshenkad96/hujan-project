import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {and,eq} from 'drizzle-orm';
import {isTrustedOrigin} from '@/lib/security';
import {getDatabase} from '@/db/client';
import {events,leads,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseEvent} from '@/lib/event-validation';
import {validLeadId} from '@/lib/lead-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const a=await requirePermission('events:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const {id}=await params;if(!validLeadId(id))return fail('Invalid lead ID',400);
  if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
  const input=parseEvent(await req.json().catch(()=>null));if(!input)return fail('Invalid event',400);
  const org=a.user.organizationId,db=getDatabase();
  const [lead]=await db.select({id:leads.id,clientId:leads.clientId,status:leads.status}).from(leads).where(and(eq(leads.id,id),eq(leads.organizationId,org))).limit(1);
  if(!lead)return fail('Lead not found',404);
  if(lead.status!=='won'||!lead.clientId)return fail('Lead must be Won and linked to a client',409);
  if(input.clientId!==lead.clientId)return fail('Client mismatch',409);
  if(input.projectManagerId){
   const [manager]=await db.select({id:users.id,role:users.role}).from(users).where(and(eq(users.id,input.projectManagerId),eq(users.organizationId,org),eq(users.active,true))).limit(1);
   if(!manager||!['owner','admin','project_manager'].includes(manager.role))return fail('Invalid project manager',400);
  }
  const [event]=await db.insert(events).values({...input,organizationId:org,leadId:id,code:'EVT-'+randomUUID()}).onConflictDoNothing({target:events.leadId}).returning();
  if(!event)return fail('Lead has already been converted',409);
  return NextResponse.json({event},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Lead conversion unavailable',503)}
}
