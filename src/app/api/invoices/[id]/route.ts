import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {invoices} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {uuid} from '@/lib/invoice-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function PATCH(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('finance:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const x=await req.json().catch(()=>null);
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==1)return fail('Invalid payload',400);
 const status=(x as Record<string,unknown>).status;
 if(status!=='issued'&&status!=='voided')return fail('Invalid transition',400);
 const [invoice]=await getDatabase().update(invoices).set({status}).where(and(eq(invoices.id,id),eq(invoices.organizationId,auth.user.organizationId),eq(invoices.status,'draft'))).returning();
 if(!invoice)return fail('Invoice not found or no longer draft',409);
 return NextResponse.json({invoice},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Invoices unavailable',503)}
}
