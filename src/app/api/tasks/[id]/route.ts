import {NextRequest,NextResponse} from 'next/server';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {tasks,users} from '@/db/schema';
import {requirePermission} from '@/lib/auth';
import {taskPatch,uuidPattern} from '@/lib/task-validation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Context){
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Origin not allowed',403);
 try{const a=await requirePermission('tasks:write');if(a.error)return fail(a.error,a.error==='unauthorized'?401:403);
 const {id}=await params;if(!uuidPattern.test(id))return fail('Invalid task ID',400);
 if(!(req.headers.get('content-type')||'').includes('application/json'))return fail('Expected JSON',415);
 const patch=taskPatch(await req.json().catch(()=>null));if(!patch)return fail('Invalid update',400);
 const db=getDatabase(),org=a.user.organizationId;
 if(patch.ownerId){const [owner]=await db.select({id:users.id}).from(users).where(and(eq(users.id,patch.ownerId),eq(users.organizationId,org),eq(users.active,true))).limit(1);if(!owner)return fail('Owner not found',404)}
 const [task]=await db.update(tasks).set(patch).where(and(eq(tasks.id,id),eq(tasks.organizationId,org))).returning();
 if(!task)return fail('Task not found',404);
 return NextResponse.json({task},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Tasks unavailable',503)}
}
