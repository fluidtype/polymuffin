import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import ChartCard from '@/components/ChartCard';
import KpiCard from '@/components/KpiCard';
import EventsList from '@/components/EventsList';
import { RightColumn } from '@/components/RightColumn';
import FadeIn from '@/components/motion/FadeIn';
import SectionTitle from '@/components/SectionTitle';

import { lastNDaysISO } from '@/lib/dates';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev, movingAverage, toSeries } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import type { GdeltResp, Market, Tweet } from '@/lib/types';

const TimeSeriesVisx = dynamic(() => import('@/components/charts/TimeSeriesVisx'), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />,
});

const LiveMiniChart = dynamic(() => import('@/components/charts/LiveMiniChart'), {
  ssr: false,
  loading: () => <div className="h-44 bg-white/5 rounded-2xl animate-pulse" />,
});

type TwitterResp = { data?: Tweet[] };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[] };

type EventRow = { date: string; title: string; tone?: number; impact?: number; source?: string };

export default async function Home() {
  const { from, to } = lastNDaysISO(30);
  const baseUrl = await getBaseUrl();

  const gdPromise = fetch(`${baseUrl}/api/gdeltProxy?q=prediction%20market&from=${from}&to=${to}&gran=auto&mode=context`, { cache: 'no-store' })
    .then(res => res.json() as Promise<GdeltResp>);
  const twPromise = fetch(`${baseUrl}/api/twitter?q=prediction%20market&from=${from}&to=${to}`, { cache: 'no-store' })
    .then(res => res.json() as Promise<TwitterResp>);
  const pmPromise = fetch(`${baseUrl}/api/polymarket?open=true`, { next: { revalidate: 30 } })
    .then(res => res.json() as Promise<PolymarketResp>);
  const prevPromise = (async () => {
    const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 30);
    const prevTo = new Date(to); prevTo.setDate(prevTo.getDate() - 30);
    const f = prevFrom.toISOString().slice(0, 10);
    const t = prevTo.toISOString().slice(0, 10);
    return fetch(`${baseUrl}/api/gdeltProxy?q=prediction%20market&from=${f}&to=${t}&gran=auto&mode=context`, { cache: 'no-store' })
      .then(res => res.json() as Promise<GdeltResp>);
  })();

  const [gdRes, twRes, pmRes, gdPrev] = await Promise.all([gdPromise, twPromise, pmPromise, prevPromise]);

  const rows = gdRes.data ?? [];
  const prevRows = gdPrev.data ?? [];
  const volume = kpiVolume(rows);
  const sentAvg = kpiSentimentAvg(rows);
  const delta = kpiDeltaVsPrev(rows, prevRows);

  const volSeries = movingAverage(toSeries(rows, 'interaction_count'), 28);
  const sentSeries = toSeries(rows, 'avg_sentiment');
  const hasVolumeSeries = volSeries.length > 0;
  const hasSentSeries = sentSeries.length > 0;

  const events: EventRow[] = [];

  const tweets = (twRes.data ?? []).map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    author: tweet.author ?? '@stub',
    likes: tweet.like_count,
  }));

  const markets = (pmRes.items ?? []).slice(0, 6).map(market => ({
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

      <SectionTitle title="Market pulse" subtitle={`${from} → ${to}`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <FadeIn>
          <KpiCard
            label="Volume (30d)"
            value={Intl.NumberFormat().format(volume)}
            delta={`${(delta * 100).toFixed(1)}% vs prev`}
          />
        </FadeIn>
        <FadeIn delay={0.05}>
          <KpiCard label="Sentiment avg" value={`${sentAvg >= 0 ? '+' : ''}${sentAvg.toFixed(2)}`} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <KpiCard label="Change vs prev" value={`${(delta * 100).toFixed(1)}%`} />
        </FadeIn>
        <FadeIn delay={0.15}>
          <KpiCard label="Signals" value="OK" />
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <FadeIn>
            <ChartCard
              title="Daily volume (28d MA)"
              isEmpty={!hasVolumeSeries}
              emptyHint="We’ll chart volume once GDELT returns activity for this range."
            >
              <TimeSeriesVisx series={[{ id: 'volume', data: volSeries }]} />
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.05}>
            <ChartCard
              title="Sentiment over time"
              isEmpty={!hasSentSeries}
              emptyHint="Sentiment data will appear as soon as we ingest events."
            >
              <TimeSeriesVisx series={[{ id: 'sentiment', data: sentSeries }]} />
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.1}>
            <EventsList rows={events} />
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <RightColumn tweets={tweets} markets={markets} LiveChart={<LiveMiniChart />} />
        </FadeIn>
      </div>
    </div>
  );
}
