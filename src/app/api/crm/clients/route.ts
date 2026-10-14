import { NextRequest,NextResponse } from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import { and,asc,eq,ilike,or } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { clients } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { cleanString,parseClient,parseLimit } from '@/lib/crm-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const response=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{
 const {user,error}=await requirePermission('clients:read');if(error)return response(error,error==='unauthorized'?401:403);
 const q=cleanString(req.nextUrl.searchParams.get('q')||'',100);
 const page=Number(req.nextUrl.searchParams.get('page')||'1');if(!Number.isSafeInteger(page)||page<1||page>10000)return response('Invalid page',400);
 const limit=parseLimit(req.nextUrl.searchParams.get('limit'));
 const filter=q?and(eq(clients.organizationId,user.organizationId),or(ilike(clients.name,'%'+q.replace(/[\\%_]/g,'\\$&')+'%'),ilike(clients.email,'%'+q.replace(/[\\%_]/g,'\\$&')+'%'))):eq(clients.organizationId,user.organizationId);
 const rows=await getDatabase().select({id:clients.id,name:clients.name,email:clients.email,phone:clients.phone,createdAt:clients.createdAt}).from(clients).where(filter).orderBy(asc(clients.name),asc(clients.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return response('CRM unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return response('Origin not allowed',403);
 try{
 const {user,error}=await requirePermission('clients:write');if(error)return response(error,error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return response('Expected JSON',415);
 const input=await req.json().catch(()=>null),data=parseClient(input);if(!data)return response('Invalid client',400);
 const [client]=await getDatabase().insert(clients).values({...data,organizationId:user.organizationId}).returning({id:clients.id,name:clients.name,email:clients.email,phone:clients.phone});
 return NextResponse.json({client},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return response('CRM unavailable',503)}
}
