import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_GDELT_BASE || 'https://my-search-proxy.ew.r.appspot.com/gdelt';
const THEMES = ['markets', 'oil', 'semiconductor', 'inflation', 'rates', 'bitcoin'];

export const runtime = 'edge';

type TemporalDistribution = Record<string, number>;

type TrendingItem = {
  keyword: string;
  total: number;
  avg_tone: number;
  temporal: TemporalDistribution;
  error?: string;
};

export async function GET(req: NextRequest) {
  const to = (req.nextUrl.searchParams.get('to') ?? new Date().toISOString().slice(0, 10)).replaceAll('-', '');
  const from = (req.nextUrl.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).replaceAll('-', '');

  try {
    const items: TrendingItem[] = [];

    for (const keyword of THEMES) {
      const url = `${BASE}/v2?action=context&date_start=${from}&date_end=${to}&keywords=${encodeURIComponent(keyword)}&include_insights=true`;
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        items.push({ keyword, total: 0, avg_tone: 0, temporal: {}, error: `${response.status}` });
        continue;
      }

      const json = await response.json();
      items.push({
        keyword,
        total: json?.insights?.total_events ?? 0,
        avg_tone: json?.insights?.sentiment_analysis?.avg_tone ?? 0,
        temporal: json?.insights?.temporal_distribution ?? {},
      });
    }

    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'trending failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
