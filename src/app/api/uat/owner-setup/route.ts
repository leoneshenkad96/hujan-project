import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { users, organizations } from '@/db/schema';
import { hashPassword } from '@/lib/password';
import { enforceLoginRateLimit } from '@/lib/login-rate-limit';
import { isTrustedOrigin } from '@/lib/security';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
const EXPECTED_NEON_PROJECT = 'fancy-cell-64250119';
const EXPECTED_NEON_BRANCH = 'br-long-wildflower-b3nsciay';
const EXPECTED_DATABASE = 'eventorganizer';
export async function POST(request: NextRequest) {
 if (process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== 'integration/final-uat' || process.env.VINCA_UAT_OWNER_SETUP_ENABLED !== 'true')
  return NextResponse.json({ error: 'Unavailable' }, { status: 404, headers });
 if (!isTrustedOrigin(request.headers.get('origin'),request.url,true))
  return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
 if (!(request.headers.get('content-type')||'').includes('application/json'))
  return NextResponse.json({ error: 'Expected JSON' }, { status: 415, headers });
 let body: Record<string,unknown>;
 try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers }); }
 if (!body || typeof body !== 'object' || Array.isArray(body) || body.username !== 'leoneshenkad' ||
     typeof body.setupCode !== 'string' || typeof body.password !== 'string' ||
     body.setupCode.length > 256 || body.password.length < 12 || body.password.length > 256)
  return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers });
 const expected=process.env.VINCA_UAT_OWNER_SETUP_CODE;
 if (!expected || expected.length < 32) return NextResponse.json({ error:'Unavailable' }, {status:503,headers});
 const digest=(v:string)=>createHash('sha256').update(v).digest();
 if (!timingSafeEqual(digest(body.setupCode),digest(expected)))
  return NextResponse.json({ error: 'Invalid setup details' }, { status: 401, headers });
 try {
  const db=getDatabase();
  const scope=await db.execute(sql`SELECT
   current_setting('neon.project_id',true) AS project_id,
   current_setting('neon.branch_id',true) AS branch_id,
   current_database() AS database_name`);
  const identity=scope.rows[0] as {project_id?:string;branch_id?:string;database_name?:string}|undefined;
  if(identity?.project_id!==EXPECTED_NEON_PROJECT||identity.branch_id!==EXPECTED_NEON_BRANCH||identity.database_name!==EXPECTED_DATABASE)
   return NextResponse.json({error:'Unavailable'},{status:503,headers});
  const ip=request.headers.get('x-real-ip')??request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()??'unknown';
  if (!await enforceLoginRateLimit(ip,'owner-setup','vinca-uat'))
   return NextResponse.json({ error: 'Try later' }, { status: 429, headers: {...headers,'Retry-After':'900'} });
  const records=await db.select({id:users.id}).from(users).innerJoin(organizations,eq(users.organizationId,organizations.id))
   .where(and(eq(users.username,'leoneshenkad'),eq(users.role,'owner'),eq(organizations.slug,'vinca-uat'),eq(users.active,false),isNull(users.passwordHash))).limit(2);
  if(records.length!==1)return NextResponse.json({error:'Already provisioned or unavailable'},{status:409,headers});
  const passwordHash=await hashPassword(body.password);
  const updated=await db.update(users).set({passwordHash,active:true})
   .where(and(eq(users.id,records[0].id),eq(users.active,false),isNull(users.passwordHash))).returning({id:users.id});
  if(updated.length!==1)return NextResponse.json({error:'Already provisioned'},{status:409,headers});
  return NextResponse.json({ok:true},{headers});
 }catch {return NextResponse.json({error:'Unavailable'},{status:503,headers});}
}
