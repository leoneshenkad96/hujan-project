import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {and,eq,desc} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {contracts,quotations} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 try{const a=await requirePermission('clients:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const rows=await getDatabase().select().from(contracts).where(eq(contracts.organizationId,a.user.organizationId)).orderBy(desc(contracts.createdAt)).limit(100);
 return NextResponse.json({items:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Contracts unavailable',503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const input=await req.json().catch(()=>null);const quoteId=input&&typeof input==='object'&&!Array.isArray(input)?(input as {quotationId?:unknown}).quotationId:null;
 if(!uuid.test(String(quoteId)))return fail('Invalid quotation ID',400);
 const db=getDatabase(),org=a.user.organizationId;
 const [quote]=await db.select().from(quotations).where(and(eq(quotations.id,quoteId as string),eq(quotations.organizationId,org),eq(quotations.status,'accepted'))).limit(1);
 if(!quote)return fail('Accepted quotation not found',404);
 const [contract]=await db.insert(contracts).values({organizationId:org,eventId:quote.eventId,quotationId:quote.id,amount:quote.amount,number:'CTR-'+randomUUID(),status:'draft'}).onConflictDoNothing({target:contracts.quotationId}).returning();
 if(!contract)return fail('Contract already exists for quotation',409);
 return NextResponse.json({contract},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Contracts unavailable',503)}
}
