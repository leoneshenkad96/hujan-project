import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: 'not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const db = getDatabase();
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok', database: 'connected' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
