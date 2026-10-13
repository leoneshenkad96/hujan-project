import { NextRequest,NextResponse } from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
import { revokeSession } from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!isTrustedOrigin(req.headers.get('origin'),req.url,process.env.NODE_ENV==='production'))return NextResponse.json({error:'Origin not allowed'},{status:403});
 try{await revokeSession();return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Logout unavailable'},{status:503})}
}
