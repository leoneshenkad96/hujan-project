import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {purchaseOrders} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parsePOStatus,uuid} from '@/lib/procurement-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Context){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('vendors:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=await req.json().catch(()=>null);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1)return fail('Invalid update',400);
 const status=parsePOStatus((input as {status?:unknown}).status);if(!status)return fail('Invalid status',400);
 const [po]=await getDatabase().update(purchaseOrders).set({status,updatedAt:new Date()}).where(and(eq(purchaseOrders.id,id),eq(purchaseOrders.organizationId,a.user.organizationId))).returning();
 if(!po)return fail('Purchase order not found',404);
 return NextResponse.json({purchaseOrder:po},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Procurement unavailable',503)}
}
