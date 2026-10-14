import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {contracts} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseContractStatus,uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
 const input=await req.json().catch(()=>null),status=parseContractStatus(input&&typeof input==='object'&&!Array.isArray(input)?(input as {status?:unknown}).status:null);
 if(!status||!['signed','terminated'].includes(status))return fail('Invalid status',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [previous]=await db.select({status:contracts.status}).from(contracts).where(and(eq(contracts.id,id),eq(contracts.organizationId,org))).limit(1);
 if(!previous)return fail('Contract not found',404);
 if(!((previous.status==='draft'&&status==='signed')||(previous.status==='signed'&&status==='terminated')))return fail('Invalid contract transition',409);
 const [contract]=await db.update(contracts).set({status,...status==='signed'?{signedAt:new Date()}:{}}).where(and(eq(contracts.id,id),eq(contracts.organizationId,org),eq(contracts.status,previous.status))).returning();
 if(!contract)return fail('Concurrent update conflict',409);
 return NextResponse.json({contract},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Contracts unavailable',503)}
}
