import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({ status: 'ok', service: 'vinca-event-organizer-erp', version: '0.1.0' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
