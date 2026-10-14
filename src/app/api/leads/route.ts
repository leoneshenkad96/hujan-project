import {NextRequest,NextResponse} from 'next/server';
import {isTrustedOrigin} from '@/lib/security';
import {and,desc,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {leads,clients} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseLead,LEAD_STATUSES,validLeadId} from '@/lib/lead-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
  const a=await requirePermission('clients:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const page=Number(req.nextUrl.searchParams.get('page')||'1'),limit=Number(req.nextUrl.searchParams.get('limit')||'20');
  if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
  const status=req.nextUrl.searchParams.get('status');
  if(status&&!LEAD_STATUSES.includes(status as typeof LEAD_STATUSES[number]))return fail('Invalid lead status',400);
  const rows=await getDatabase().select().from(leads).where(and(eq(leads.organizationId,a.user.organizationId),status?eq(leads.status,status as typeof LEAD_STATUSES[number]):undefined)).orderBy(desc(leads.createdAt),desc(leads.id)).limit(limit+1).offset((page-1)*limit);
  return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Leads unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
  const input=parseLead(await req.json().catch(()=>null));if(!input)return fail('Invalid lead',400);
  const db=getDatabase(),org=a.user.organizationId;
  if(input.clientId){if(!validLeadId(input.clientId))return fail('Invalid client',400);const [c]=await db.select({id:clients.id}).from(clients).where(and(eq(clients.id,input.clientId),eq(clients.organizationId,org))).limit(1);if(!c)return fail('Client not found',404)}
  const [lead]=await db.insert(leads).values({...input,organizationId:org,status:'new'}).returning();
  return NextResponse.json({lead},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Lead creation unavailable',503)}
}
