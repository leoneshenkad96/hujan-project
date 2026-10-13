import {NextRequest,NextResponse} from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import {and,asc,eq,sql} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {invoices,payments} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {paymentInput,uuid,minor} from '@/lib/invoice-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(_req:NextRequest,{params}:Context){
 try{const auth=await requirePermission('finance:read');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid invoice ID',400);
 const db=getDatabase(),org=auth.user.organizationId;
 const [invoice]=await db.select({id:invoices.id}).from(invoices).where(and(eq(invoices.id,id),eq(invoices.organizationId,org))).limit(1);
 if(!invoice)return fail('Invoice not found',404);
 const rows=await db.select().from(payments).where(and(eq(payments.organizationId,org),eq(payments.invoiceId,id))).orderBy(asc(payments.paidAt));
 return NextResponse.json({items:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Payments unavailable',503)}
}
export async function POST(req:NextRequest,{params}:Context){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return fail('Origin not allowed',403);
 try{
 const auth=await requirePermission('finance:write');if(auth.error)return fail(auth.error,auth.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuid.test(id))return fail('Invalid invoice ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const input=paymentInput(await req.json().catch(()=>null));if(!input)return fail('Invalid payment',400);
 const key=req.headers.get('idempotency-key');
 if(!key||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return fail('Valid Idempotency-Key header required',400);
 const org=auth.user.organizationId,db=getDatabase();
 const findReplay=async()=>{const [existing]=await db.select().from(payments).where(and(eq(payments.organizationId,org),eq(payments.invoiceId,id),eq(payments.idempotencyKey,key))).limit(1);return existing};
 const replay=await findReplay();
 if(replay){if(minor(replay.amount)!==minor(input.amount)||replay.reference!==input.reference)return fail('Idempotency key used with different payment',409);return NextResponse.json({payment:replay,replayed:true},{status:200,headers:{'Cache-Control':'no-store'}})}
 // An UPDATE obtains an invoice row lock and conditionally increments its paid balance.
 // The payment row and audit record are created in the same statement; no overpayment race.
 let result;
 try{result=await db.execute(sql`
 WITH updated AS (
  UPDATE invoices
  SET paid_amount=paid_amount+${input.amount}::numeric,
      status=CASE WHEN paid_amount+${input.amount}::numeric=amount THEN 'paid'::invoice_status ELSE 'partially_paid'::invoice_status END
  WHERE id=${id}::uuid AND organization_id=${org}::uuid
    AND status IN ('issued'::invoice_status,'partially_paid'::invoice_status)
    AND paid_amount+${input.amount}::numeric<=amount
  RETURNING id,organization_id,paid_amount,amount,status
 ), payment_created AS (
  INSERT INTO invoice_payments (organization_id,invoice_id,amount,reference,idempotency_key)
  SELECT organization_id,id,${input.amount}::numeric,${input.reference},${key}
  FROM updated
  RETURNING id,invoice_id,amount,paid_at,reference,organization_id,idempotency_key
 ), logged AS (
  INSERT INTO audit_logs (organization_id,actor_id,action,resource_type,resource_id,details)
  SELECT p.organization_id,${auth.user.id}::uuid,'invoice.payment_recorded','invoice_payment',p.id,
         json_build_object('invoiceId',p.invoice_id,'amount',p.amount,'reference',p.reference)::text
  FROM payment_created p
  RETURNING id
 )
 SELECT p.id,p.invoice_id,p.amount,p.paid_at,p.reference,u.paid_amount,u.status
 FROM payment_created p
 JOIN updated u ON u.id=p.invoice_id
 JOIN logged l ON true
 `)}catch(error){
  const original=await findReplay();
  if(original){if(minor(original.amount)!==minor(input.amount)||original.reference!==input.reference)return fail('Idempotency key used with different payment',409);return NextResponse.json({payment:original,replayed:true},{status:200,headers:{'Cache-Control':'no-store'}})}
  throw error;
 }
 const payment=result.rows[0];
 if(!payment)return fail('Invoice is not issued, already paid, or payment exceeds outstanding balance',409);
 return NextResponse.json({payment},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Payments unavailable',503)}
}
