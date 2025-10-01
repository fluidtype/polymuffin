import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.POLYMARKET_GAMMA ?? 'https://gamma-api.polymarket.com';

export const runtime = 'edge';

type PolymarketMarket = {
  question?: string;
  [key: string]: unknown;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').toLowerCase();
  try {
    const r = await fetch(`${BASE}/markets?limit=50&active=true`, { next: { revalidate: 30 } });
    if (!r.ok) return NextResponse.json({ error: `Polymarket ${r.status}` }, { status: 500 });
    const items = (await r.json()) as PolymarketMarket[];
    const filtered = q
      ? items.filter((market) => market.question?.toLowerCase().includes(q))
      : items;
    return NextResponse.json({ items: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
