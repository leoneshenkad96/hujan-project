import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {randomUUID} from 'node:crypto';
import {and,eq,desc,ilike,or} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {contracts,events,quotations} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {uuid} from '@/lib/quotation-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('clients:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const params=req.nextUrl.searchParams,page=Number(params.get('page')||'1'),limit=Number(params.get('limit')||'20'),q=(params.get('q')||'').trim(),status=params.get('status');
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100||q.length>100||status&&!['draft','signed','terminated'].includes(status))return fail('Invalid contract filters',400);
 const org=a.user.organizationId,escaped=q.replace(/[\\%_]/g,'\\$&');
 const rows=await getDatabase().select({id:contracts.id,number:contracts.number,eventId:contracts.eventId,quotationId:contracts.quotationId,amount:contracts.amount,status:contracts.status,createdAt:contracts.createdAt,quotationNumber:quotations.number,eventTitle:events.title})
  .from(contracts).innerJoin(quotations,and(eq(quotations.id,contracts.quotationId),eq(quotations.organizationId,contracts.organizationId)))
  .innerJoin(events,and(eq(events.id,contracts.eventId),eq(events.organizationId,contracts.organizationId)))
  .where(and(eq(contracts.organizationId,org),status?eq(contracts.status,status as typeof contracts.$inferSelect.status):undefined,q?or(ilike(contracts.number,`%${escaped}%`),ilike(quotations.number,`%${escaped}%`),ilike(events.title,`%${escaped}%`)):undefined))
  .orderBy(desc(contracts.createdAt),desc(contracts.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Contracts unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
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
