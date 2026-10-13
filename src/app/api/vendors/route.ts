import {NextRequest,NextResponse} from 'next/server';
import {eq,asc} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {vendors} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {parseVendor} from '@/lib/procurement-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 try{const a=await requirePermission('vendors:read');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const page=Number(req.nextUrl.searchParams.get('page')||'1'),limit=Number(req.nextUrl.searchParams.get('limit')||'25');
 if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)return fail('Invalid pagination',400);
 const rows=await getDatabase().select().from(vendors).where(eq(vendors.organizationId,a.user.organizationId)).orderBy(asc(vendors.name),asc(vendors.id)).limit(limit+1).offset((page-1)*limit);
 return NextResponse.json({items:rows.slice(0,limit),page,limit,hasMore:rows.length>limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Vendors unavailable',503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('vendors:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const data=parseVendor(await req.json().catch(()=>null));if(!data)return fail('Invalid vendor',400);
 const [vendor]=await getDatabase().insert(vendors).values({...data,organizationId:a.user.organizationId}).returning();
 return NextResponse.json({vendor},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Vendors unavailable',503)}
}
