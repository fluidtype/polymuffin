import { NextRequest, NextResponse } from 'next/server';
import { fetchGdelt } from '@/lib/gdelt';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const from = req.nextUrl.searchParams.get('from') ?? '';
  const to = req.nextUrl.searchParams.get('to') ?? '';
  const gran = (req.nextUrl.searchParams.get('gran') ?? 'auto') as 'auto'|'daily'|'monthly';
  const modeParam = req.nextUrl.searchParams.get('mode');
  const mode = modeParam === 'search' || modeParam === 'bilateral' || modeParam === 'bbva'
    ? modeParam
    : 'context';

  const data = await fetchGdelt({ q, from, to, gran, mode });
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
}
