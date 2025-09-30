import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({ error: 'Not implemented (BLOCK 0 stub)' }, { status: 501 });
}
