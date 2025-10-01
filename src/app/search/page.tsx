import SearchBar from '@/components/SearchBar';
import ChartCard from '@/components/ChartCard';
import KpiCard from '@/components/KpiCard';
import LineBasic from '@/components/charts/Line';
import EventsList from '@/components/EventsList';
import { RightColumn } from '@/components/RightColumn';

import { parseQuery } from '@/lib/queryParser';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev, toSeries, seriesCoverage } from '@/lib/stats';
import type { GdeltResp, Market, Tweet } from '@/lib/types';

type TwitterResp = { data?: Tweet[] };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[] };

type EventRow = { date: string; title: string; tone?: number; impact?: number; source?: string };

type SearchParams = Record<string, string | string[]>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (typeof searchParams.q === 'string' ? searchParams.q : searchParams.q?.[0]) ?? '';
  const from = (typeof searchParams.from === 'string' ? searchParams.from : searchParams.from?.[0])
    ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = (typeof searchParams.to === 'string' ? searchParams.to : searchParams.to?.[0])
    ?? new Date().toISOString().slice(0, 10);
  const gran = ((typeof searchParams.gran === 'string' ? searchParams.gran : searchParams.gran?.[0]) ?? 'auto') as 'auto' | 'daily' | 'monthly';
  const srcParam = (typeof searchParams.src === 'string' ? searchParams.src : searchParams.src?.[0]) ?? 'gdelt,twitter,polymarket';
  const want = new Set(srcParam.split(',').filter(Boolean));

  const parsed = parseQuery(q);
  const mode = parsed.kind === 'bilateralDirectional' ? 'bbva'
    : parsed.kind === 'bilateral' ? 'bilateral'
      : 'context';

  const gdPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? fetch(`/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${from}&to=${to}&gran=${gran}&mode=${mode}`, { cache: 'no-store' })
      .then(res => res.json() as Promise<GdeltResp>)
    : Promise.resolve(null);

  const twPromise: Promise<TwitterResp | null> = want.has('twitter')
    ? fetch(`/api/twitter?q=${encodeURIComponent(q)}&from=${from}&to=${to}`, { cache: 'no-store' })
      .then(res => res.json() as Promise<TwitterResp>)
    : Promise.resolve(null);

  const pmPromise: Promise<PolymarketResp | null> = want.has('polymarket')
    ? fetch(`/api/polymarket?q=${encodeURIComponent(q)}&open=true`, { next: { revalidate: 30 } })
      .then(res => res.json() as Promise<PolymarketResp>)
    : Promise.resolve(null);

  const gdPrevPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? (async () => {
      const pf = new Date(from); pf.setDate(pf.getDate() - 30);
      const pt = new Date(to); pt.setDate(pt.getDate() - 30);
      const f = pf.toISOString().slice(0, 10);
      const t = pt.toISOString().slice(0, 10);
      return fetch(`/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${f}&to=${t}&gran=${gran}&mode=${mode}`, { cache: 'no-store' })
        .then(res => res.json() as Promise<GdeltResp>);
    })()
    : Promise.resolve(null);

  const [gdRes, twRes, pmRes, gdPrev] = await Promise.all([gdPromise, twPromise, pmPromise, gdPrevPromise]);

  const rows = gdRes?.data ?? [];
  const prevRows = gdPrev?.data ?? [];

  const volume = kpiVolume(rows);
  const sentAvg = kpiSentimentAvg(rows);
  const delta = kpiDeltaVsPrev(rows, prevRows);

  const mainSeries = mode === 'bbva'
    ? seriesCoverage(rows)
    : toSeries(rows, 'interaction_count');

  const sentSeries = toSeries(rows, 'avg_sentiment');

  const events: EventRow[] = [];

  const tweets = (twRes?.data ?? []).map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    author: tweet.author ?? '@stub',
    likes: tweet.like_count,
  }));

  const markets = (pmRes?.items ?? []).slice(0, 6).map(market => ({
    id: market.id,
    question: market.question,
    price: market.outcomes?.[0]?.price,
    volume: market.volume,
  }));

  return (
    <div className="space-y-6">
      <div className="pt-6">
        <SearchBar />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Results for “{q}”</h1>
        <div className="text-xs text-white/60">Range: {from} → {to} · gran: {gran}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KpiCard label="Volume" value={Intl.NumberFormat().format(volume)} delta={`${(delta * 100).toFixed(1)}% vs prev`} />
        <KpiCard label="Sentiment avg" value={`${sentAvg >= 0 ? '+' : ''}${sentAvg.toFixed(2)}`} />
        <KpiCard label="Change vs prev" value={`${(delta * 100).toFixed(1)}%`} />
        {mode === 'bbva'
          ? <KpiCard label="Rel. Coverage" value={`${((rows?.[rows.length - 1]?.relative_coverage ?? 0) * 100).toFixed(2)}%`} />
          : <KpiCard label="Signals" value="OK" />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <ChartCard title={mode === 'bbva' ? 'Relative Coverage (daily)' : 'Daily Volume'}>
            <LineBasic data={mainSeries} />
          </ChartCard>
          <ChartCard title="Sentiment over time">
            <LineBasic data={sentSeries} color="#ff5a5a" />
          </ChartCard>
          <EventsList rows={events} />
        </div>

        <RightColumn tweets={tweets} markets={markets} />
      </div>
    </div>
  );
}
