import {NextRequest,NextResponse} from 'next/server';
import {sql} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {hashPassword} from '@/lib/password';
import {validActivationToken,digestToken} from '@/lib/activation';
import {isTrustedOrigin} from '@/lib/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return NextResponse.json({error:'Origin not allowed'},{status:403});
 if(process.env.UAT_ACTIVATION_ENABLED!=='true')return NextResponse.json({error:'Activation disabled'},{status:503});
 if(!(req.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Expected JSON'},{status:415});
 const data=await req.json().catch(()=>null);
 if(!data||!validActivationToken(data.token)||typeof data.password!=='string'||data.password.length<12||data.password.length>256)return NextResponse.json({error:'Invalid activation information'},{status:400});
 try{
 const hash=await hashPassword(data.password);
 // Atomic token consumption + user activation. An expired/used token updates nothing.
 const result=await getDatabase().execute(sql`
  WITH claimed AS (
   UPDATE auth_activation_tokens SET consumed_at=NOW()
   WHERE token_hash=${digestToken(data.token)} AND consumed_at IS NULL AND expires_at>NOW()
   RETURNING user_id,organization_id
  ), activated AS (
   UPDATE users SET password_hash=${hash},active=true
   WHERE id IN (SELECT user_id FROM claimed)
     AND organization_id IN (SELECT organization_id FROM claimed)
     AND active=false
   RETURNING id
  )
  SELECT id FROM activated
 `);
 if(result.rows.length!==1)return NextResponse.json({error:'Link invalid or expired'},{status:400});
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Activation unavailable'},{status:503})}
}
