import { NextRequest,NextResponse } from 'next/server';
import { and,asc,eq,ilike } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { clients,leads } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { cleanString,parseLead,parseLimit,LEAD_STATES } from '@/lib/crm-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
 const {user,error}=await requirePermission('clients:read');if(error)return fail(error,error==='unauthorized'?401:403);
 const q=cleanString(req.nextUrl.searchParams.get('q')||'',100);
 const status=req.nextUrl.searchParams.get('status');
 if(status&&!LEAD_STATES.includes(status as typeof LEAD_STATES[number]))return fail('Invalid status',400);
 const page=Number(req.nextUrl.searchParams.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>10000)return fail('Invalid page',400);
 const limit=parseLimit(req.nextUrl.searchParams.get('limit'));
 const filter=and(eq(leads.organizationId,user.organizationId),q?ilike(leads.title,'%'+q.replace(/[\\%_]/g,'\\$&')+'%'):undefined,status?eq(leads.status,status as typeof LEAD_STATES[number]):undefined);
 const rows=await getDatabase().select({id:leads.id,title:leads.title,status:leads.status,clientId:leads.clientId,estimatedValue:leads.estimatedValue,createdAt:leads.createdAt}).from(leads).where(filter).orderBy(asc(leads.createdAt),asc(leads.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('CRM unavailable',503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{
 const {user,error}=await requirePermission('clients:write');if(error)return fail(error,error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const data=parseLead(await req.json().catch(()=>null));if(!data)return fail('Invalid lead',400);
 const db=getDatabase();
 if(data.clientId){const [client]=await db.select({id:clients.id}).from(clients).where(and(eq(clients.id,data.clientId),eq(clients.organizationId,user.organizationId))).limit(1);if(!client)return fail('Client not found',404)}
 const [lead]=await db.insert(leads).values({...data,organizationId:user.organizationId}).returning({id:leads.id,title:leads.title,status:leads.status,estimatedValue:leads.estimatedValue});
 return NextResponse.json({lead},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('CRM unavailable',503)}
}
