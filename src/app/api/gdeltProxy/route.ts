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
    if (data.status === 'error') {
      const message = data.error ?? 'Unknown error';
      const statusCode = classifyError(message);
      return NextResponse.json(
        { status: 'error', error: message },
        { status: statusCode, headers: { 'cache-control': 'no-store' } },
      );
    }
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = classifyError(message);
    return NextResponse.json(
      { status: 'error', error: message },
      { status: statusCode, headers: { 'cache-control': 'no-store' } },
    );
  }
}

function classifyError(message: string): number {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid') || normalized.includes('missing') || normalized.includes('parameter')) {
    return 400;
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 429;
  }
  return 502;
}
