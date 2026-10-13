import { NextRequest, NextResponse } from 'next/server';
import { isTrustedOrigin } from '@/lib/security';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!isTrustedOrigin(request.headers.get('origin'),request.url,process.env.NODE_ENV==='production')){
  return NextResponse.json({error:'Origin not allowed'},{status:403,headers:{'Cache-Control':'no-store'}});
 }
 return NextResponse.json({error:'Email activation retired; contact your administrator.'},{status:410,headers:{'Cache-Control':'no-store'}});
}
