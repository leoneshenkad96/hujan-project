import {NextRequest,NextResponse} from 'next/server';
import {and,desc,eq} from 'drizzle-orm';
import {isTrustedOrigin} from '@/lib/security';
import {getDatabase} from '@/db/client';
import {leads,leadFollowUps} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {validLeadId} from '@/lib/lead-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest,{params}:Context){
 try{
  const auth=await requirePermission('clients:read');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
  const {id}=await params;if(!validLeadId(id))return fail('Invalid lead ID',400);
  const db=getDatabase(),org=auth.user.organizationId;
  const [lead]=await db.select({id:leads.id}).from(leads).where(and(eq(leads.id,id),eq(leads.organizationId,org))).limit(1);
  if(!lead)return fail('Lead not found',404);
  const page=Number(req.nextUrl.searchParams.get('page')||'1');
  if(!Number.isSafeInteger(page)||page<1||page>10000)return fail('Invalid page',400);
  const limit=20;
  const rows=await db.select().from(leadFollowUps).where(and(eq(leadFollowUps.organizationId,org),eq(leadFollowUps.leadId,id))).orderBy(desc(leadFollowUps.createdAt),desc(leadFollowUps.id)).limit(limit+1).offset((page-1)*limit);
  return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Follow-up history unavailable',503)}
}
export async function POST(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const auth=await requirePermission('clients:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
  const {id}=await params;if(!validLeadId(id))return fail('Invalid lead ID',400);
  if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
  const body=await req.json().catch(()=>null);
  if(!body||typeof body!=='object'||Array.isArray(body))return fail('Invalid follow-up',400);
  const x=body as Record<string,unknown>;
  if(Object.keys(x).some(k=>!['note','nextContactAt'].includes(k)))return fail('Unsupported fields',400);
  const note=typeof x.note==='string'?x.note.trim():'';
  if(!note||note.length>2000)return fail('Invalid note',400);
  let nextContactAt:Date|null=null;
  if(x.nextContactAt!==undefined&&x.nextContactAt!==null&&x.nextContactAt!==''){
   if(typeof x.nextContactAt!=='string'||!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$/.test(x.nextContactAt))return fail('Invalid next contact date',400);
   nextContactAt=new Date(x.nextContactAt);
   if(Number.isNaN(nextContactAt.getTime()))return fail('Invalid next contact date',400);
  }
  const db=getDatabase(),org=auth.user.organizationId;
  const [lead]=await db.select({id:leads.id,status:leads.status}).from(leads).where(and(eq(leads.id,id),eq(leads.organizationId,org))).limit(1);
  if(!lead)return fail('Lead not found',404);
  if(lead.status==='lost'||lead.status==='won')return fail('Closed lead cannot receive follow-up',409);
  const [activity]=await db.insert(leadFollowUps).values({organizationId:org,leadId:id,actorId:auth.user.id,note,nextContactAt}).returning();
  return NextResponse.json({activity},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Follow-up creation unavailable',503)}
}
