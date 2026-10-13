import { NextResponse } from 'next/server';
export const runtime='nodejs';
export async function POST(){
 return NextResponse.json({error:'Email activation retired; contact your administrator.'},{status:410,headers:{'Cache-Control':'no-store'}});
}
