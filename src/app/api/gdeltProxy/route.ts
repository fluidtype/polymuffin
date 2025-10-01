import { NextRequest, NextResponse } from 'next/server';
import { fetchGdelt } from '@/lib/gdelt';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const from = req.nextUrl.searchParams.get('from') ?? '';
  const to = req.nextUrl.searchParams.get('to') ?? '';
  const gran = (req.nextUrl.searchParams.get('gran') ?? 'auto') as 'auto' | 'daily' | 'monthly';
  const rawMode = req.nextUrl.searchParams.get('mode');
  const allowedModes = ['context', 'search', 'bilateral', 'bbva'] as const;
  const mode = allowedModes.includes(rawMode as (typeof allowedModes)[number])
    ? (rawMode as (typeof allowedModes)[number])
    : 'context';

  try {
    const data = await fetchGdelt({ q, from, to, gran, mode });
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
