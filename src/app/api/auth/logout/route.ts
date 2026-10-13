import { NextRequest,NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Origin not allowed'},{status:403});
 try{await revokeSession();return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Logout unavailable'},{status:503})}
}
