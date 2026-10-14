import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,eq} from 'drizzle-orm';
import {randomUUID} from 'node:crypto';
import {calculateQuote,type QuotationLine} from '@/lib/quotation-calculation';
import {getDatabase} from '@/db/client';
import {quotations} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseQuoteStatus,uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type C={params:Promise<{id:string}>};
const transitions:Record<string,string[]>={draft:['sent'],sent:['accepted','rejected','expired'],accepted:[],rejected:[],expired:[]};
export async function PATCH(req:NextRequest,{params}:C){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
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

export async function POST(req:NextRequest,{params}:C){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
  const a=await requirePermission('clients:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
  const {id}=await params;if(!uuid.test(id))return fail('Invalid ID',400);
  const raw=await req.json().catch(()=>null);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail('Invalid revision',400);
  const x=raw as Record<string,unknown>;
  if(!Array.isArray(x.lines)||typeof x.title!=='string'||x.title.trim().length<1||x.title.length>200)return fail('Invalid revision',400);
  let computed:ReturnType<typeof calculateQuote>;
  try{computed=calculateQuote(x.lines as QuotationLine[],String(x.discount??'0'),String(x.taxRatePercent??'0'))}catch{return fail('Invalid quotation calculation',400)}
  const org=a.user.organizationId,db=getDatabase();
  const [previous]=await db.select().from(quotations).where(and(eq(quotations.id,id),eq(quotations.organizationId,org))).limit(1);
  if(!previous)return fail('Quotation not found',404);
  if(previous.status!=='rejected'&&previous.status!=='expired'&&previous.status!=='draft')return fail('Accepted or sent quotation cannot be revised',409);
  const [revision]=await db.insert(quotations).values({organizationId:org,eventId:previous.eventId,clientId:previous.clientId,number:'QUO-'+randomUUID(),title:x.title.trim(),amount:computed.total,lineItems:computed.lines,discountAmount:computed.discount,taxRatePercent:computed.taxRatePercent,revision:previous.revision+1,previousQuotationId:previous.id,notes:previous.notes,validUntil:previous.validUntil,status:'draft'}).returning();
  return NextResponse.json({quotation:revision},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Quotation revision unavailable',503)}
}
