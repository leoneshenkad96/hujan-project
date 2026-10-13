import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {activationTokens,organizations,users} from '@/db/schema';
import {isTrustedOrigin} from '@/lib/security';
import {enforceLoginRateLimit} from '@/lib/login-rate-limit';
import {digestToken,newActivationToken,validActivationRequest} from '@/lib/activation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const generic=()=>NextResponse.json({message:'Jika akun tersedia dan belum aktif, email aktivasi akan dikirim.'},{headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return NextResponse.json({error:'Origin not allowed'},{status:403});
 if(!(req.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Expected JSON'},{status:415});
 const data=await req.json().catch(()=>null);if(!validActivationRequest(data))return NextResponse.json({error:'Invalid request'},{status:400});
 // Only disposable UAT deployments may issue first-owner activation challenges.
 if(process.env.UAT_ACTIVATION_ENABLED!=='true'||!process.env.RESEND_API_KEY||!process.env.ACTIVATION_FROM_EMAIL||!process.env.UAT_ACTIVATION_BASE_URL)return NextResponse.json({error:'Activation is not configured'},{status:503});
 const origin=new URL(process.env.UAT_ACTIVATION_BASE_URL).origin;
 if(origin!==req.nextUrl.origin||!origin.startsWith('https://')||!new URL(origin).hostname.endsWith('.vercel.app'))return NextResponse.json({error:'UAT origin configuration mismatch'},{status:503});
 try{
 const ip=req.headers.get('x-real-ip')||'unknown';
 if(!await enforceLoginRateLimit(ip,'activation:'+data.organization,data.email))return NextResponse.json({error:'Too many attempts'},{status:429});
 const db=getDatabase();
 const [account]=await db.select({id:users.id,organizationId:users.organizationId}).from(users).innerJoin(organizations,eq(users.organizationId,organizations.id)).where(and(eq(organizations.slug,data.organization),eq(users.email,data.email.toLowerCase()),eq(users.active,false))).limit(1);
 if(!account)return generic();
 const token=newActivationToken(),tokenHash=digestToken(token);
 await db.insert(activationTokens).values({organizationId:account.organizationId,userId:account.id,tokenHash,expiresAt:new Date(Date.now()+15*60_000)});
 const link=origin+'/activate?token='+encodeURIComponent(token);
 const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.ACTIVATION_FROM_EMAIL,to:[data.email.toLowerCase()],subject:'Aktivasi akun Vinca ERP UAT',text:'Gunakan tautan ini untuk mengaktifkan akun UAT (berlaku 15 menit): '+link})});
 if(!sent.ok)return NextResponse.json({error:'Email activation unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 return generic();
 }catch{return NextResponse.json({error:'Activation unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
