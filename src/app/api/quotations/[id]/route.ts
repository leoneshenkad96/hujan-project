import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {quotations} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseQuoteStatus,uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type C={params:Promise<{id:string}>};
const transitions:Record<string,string[]>={draft:['sent'],sent:['accepted','rejected','expired'],accepted:[],rejected:[],expired:[]};
export async function PATCH(req:NextRequest,{params}:C){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 const input=await req.json().catch(()=>null);if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1)return fail('Invalid update',400);
 const status=parseQuoteStatus((input as {status?:unknown}).status);if(!status)return fail('Invalid status',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [existing]=await db.select({status:quotations.status}).from(quotations).where(and(eq(quotations.id,id),eq(quotations.organizationId,org))).limit(1);
 if(!existing)return fail('Quotation not found',404);
 if(!transitions[existing.status].includes(status))return fail('Invalid status transition',409);
 const [quote]=await db.update(quotations).set({status,updatedAt:new Date()}).where(and(eq(quotations.id,id),eq(quotations.organizationId,org),eq(quotations.status,existing.status))).returning();
 if(!quote)return fail('Concurrent update conflict',409);
 return NextResponse.json({quotation:quote},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Quotation service unavailable',503)}
}
