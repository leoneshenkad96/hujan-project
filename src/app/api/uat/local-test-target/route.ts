import { timingSafeEqual } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDatabase } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const expectedProject = 'fancy-cell-64250119';
const expectedBranch = 'br-green-pine-b39zmics';
const expectedDatabase = 'eventorganizer';

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unavailable' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const expectedToken = process.env.UAT_LOCAL_TARGET_TOKEN ?? '';
  const suppliedToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const expectedBytes = Buffer.from(expectedToken);
  const suppliedBytes = Buffer.from(suppliedToken);
  if (expectedBytes.length < 32 || suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const db = getDatabase();
    const result = await db.execute(sql`SELECT
      current_setting('neon.project_id', true) AS project_id,
      current_setting('neon.branch_id', true) AS branch_id,
      current_database() AS database_name`);
    const identity = result.rows[0] as { project_id?: string; branch_id?: string; database_name?: string } | undefined;
    if (identity?.project_id !== expectedProject || identity.branch_id !== expectedBranch || identity.database_name !== expectedDatabase) {
      return NextResponse.json({ error: 'Wrong local database target' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ verified: true, target: 'disposable-uat' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
