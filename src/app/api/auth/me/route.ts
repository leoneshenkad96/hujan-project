import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{const user=await currentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
 return NextResponse.json({user},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Service unavailable'},{status:503})}
}
