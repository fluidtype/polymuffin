import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET() {
  const base = process.env.NEXT_PUBLIC_GDELT_BASE || 'MISSING';
  return NextResponse.json({ ok: true, base });
}
