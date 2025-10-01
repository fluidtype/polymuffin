import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import ChartCard from '@/components/ChartCard';
import KpiCard from '@/components/KpiCard';
import EventsList from '@/components/EventsList';
import { RightColumn } from '@/components/RightColumn';
import FadeIn from '@/components/motion/FadeIn';
import SectionTitle from '@/components/SectionTitle';

import { parseQuery } from '@/lib/queryParser';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev, toSeries, seriesCoverage } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import type { GdeltResp, Market, Tweet } from '@/lib/types';

const TimeSeriesVisx = dynamic(() => import('@/components/charts/TimeSeriesVisx'), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />,
});

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
  const baseUrl = await getBaseUrl();

  const parsed = parseQuery(q);
  const mode = parsed.kind === 'bilateralDirectional' ? 'bbva'
    : parsed.kind === 'bilateral' ? 'bilateral'
      : 'context';

  const gdPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? fetch(`${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${from}&to=${to}&gran=${gran}&mode=${mode}`, { cache: 'no-store' })
      .then(res => res.json() as Promise<GdeltResp>)
    : Promise.resolve(null);

  const twPromise: Promise<TwitterResp | null> = want.has('twitter')
    ? fetch(`${baseUrl}/api/twitter?q=${encodeURIComponent(q)}&from=${from}&to=${to}`, { cache: 'no-store' })
      .then(res => res.json() as Promise<TwitterResp>)
    : Promise.resolve(null);

  const pmPromise: Promise<PolymarketResp | null> = want.has('polymarket')
    ? fetch(`${baseUrl}/api/polymarket?q=${encodeURIComponent(q)}&open=true`, { next: { revalidate: 30 } })
      .then(res => res.json() as Promise<PolymarketResp>)
    : Promise.resolve(null);

  const gdPrevPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? (async () => {
      const pf = new Date(from); pf.setDate(pf.getDate() - 30);
      const pt = new Date(to); pt.setDate(pt.getDate() - 30);
      const f = pf.toISOString().slice(0, 10);
      const t = pt.toISOString().slice(0, 10);
      return fetch(`${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${f}&to=${t}&gran=${gran}&mode=${mode}`, { cache: 'no-store' })
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
  const mainSeriesId = mode === 'bbva' ? 'coverage' : 'volume';

  const sentSeries = toSeries(rows, 'avg_sentiment');
  const hasMainSeries = mainSeries.length > 0;
  const hasSentSeries = sentSeries.length > 0;

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

      <SectionTitle
        title={`Results for “${q}”`}
        subtitle={`Range: ${from} → ${to} · gran: ${gran}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <FadeIn>
          <KpiCard label="Volume" value={Intl.NumberFormat().format(volume)} delta={`${(delta * 100).toFixed(1)}% vs prev`} />
        </FadeIn>
        <FadeIn delay={0.05}>
          <KpiCard label="Sentiment avg" value={`${sentAvg >= 0 ? '+' : ''}${sentAvg.toFixed(2)}`} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <KpiCard label="Change vs prev" value={`${(delta * 100).toFixed(1)}%`} />
        </FadeIn>
        <FadeIn delay={0.15}>
          {mode === 'bbva'
            ? <KpiCard label="Rel. Coverage" value={`${((rows?.[rows.length - 1]?.relative_coverage ?? 0) * 100).toFixed(2)}%`} />
            : <KpiCard label="Signals" value="OK" />}
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <FadeIn>
            <ChartCard
              title={mode === 'bbva' ? 'Relative Coverage (daily)' : 'Daily Volume'}
              isEmpty={!hasMainSeries}
              emptyHint="We couldn’t load enough data for this chart. Try expanding the date range."
            >
              <TimeSeriesVisx series={[{ id: mainSeriesId, data: mainSeries }]} />
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.05}>
            <ChartCard
              title="Sentiment over time"
              isEmpty={!hasSentSeries}
              emptyHint="Sentiment will appear once we have GDELT events for this search."
            >
              <TimeSeriesVisx series={[{ id: 'sentiment', data: sentSeries }]} />
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.1}>
            <EventsList rows={events} />
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <RightColumn tweets={tweets} markets={markets} />
        </FadeIn>
      </div>
    </div>
  );
}
