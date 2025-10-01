import { Suspense } from 'react';
import clsx from 'clsx';
import FadeIn from '@/components/motion/FadeIn';
import ChartCard from '@/components/ChartCard';
import EventsList from '@/components/EventsList';
import KpiCard from '@/components/KpiCard';
import { RightColumn } from '@/components/RightColumn';
import SectionTitle from '@/components/SectionTitle';
import Button from '@/components/ui/Button';
import { withDashboardHeader, type DashboardHeader } from '@/components/DashboardShell';
import TimeSeriesVisx from '@/components/charts/TimeSeriesVisx';
import LiveMiniChart from '@/components/charts/LiveMiniChart';

import { lastNDaysISO } from '@/lib/dates';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev, movingAverage, toSeries } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import type { GdeltResp, Market, Tweet } from '@/lib/types';

export const header: DashboardHeader = {
  title: 'Market pulse',
  subtitle: 'Global snapshot of prediction-market activity',
};

type TwitterResp = { data?: Tweet[] };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[] };

type EventRow = { date: string; title: string; tone?: number; impact?: number; source?: string };

const timeframes = [
  { label: '7d', active: false },
  { label: '30d', active: true },
  { label: '90d', active: false },
];

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

  const filters = (
    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-center">
      {timeframes.map(({ label, active }) => (
        <Button
          key={label}
          type="button"
          className={clsx(
            'px-3 py-1.5 text-xs uppercase tracking-wide',
            'border border-line-subtle/15 transition-colors',
            active
              ? 'bg-brand-red/20 text-white shadow-glowSm border-brand-red/40'
              : 'bg-white/5 text-text-secondary hover:bg-white/10'
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );

  const page = (
    <div className="space-y-6">
      <SectionTitle title="Market pulse" subtitle={`${from} → ${to}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <FadeIn>
            <ChartCard
              title="Daily volume (28d MA)"
              isEmpty={!hasVolumeSeries}
              emptyHint="We’ll chart volume once GDELT returns activity for this range."
            >
              <Suspense fallback={<div className="h-64 rounded-2xl bg-white/5 animate-pulse" />}>
                <TimeSeriesVisx series={[{ id: 'volume', data: volSeries }]} />
              </Suspense>
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.05}>
            <ChartCard
              title="Sentiment over time"
              isEmpty={!hasSentSeries}
              emptyHint="Sentiment data will appear as soon as we ingest events."
            >
              <Suspense fallback={<div className="h-64 rounded-2xl bg-white/5 animate-pulse" />}>
                <TimeSeriesVisx series={[{ id: 'sentiment', data: sentSeries }]} />
              </Suspense>
            </ChartCard>
          </FadeIn>
          <FadeIn delay={0.1}>
            <EventsList rows={events} />
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <RightColumn
            tweets={tweets}
            markets={markets}
            LiveChart={(
              <Suspense fallback={<div className="h-44 rounded-2xl bg-white/5 animate-pulse" />}>
                <LiveMiniChart />
              </Suspense>
            )}
          />
        </FadeIn>
      </div>
    </div>
  );

  return withDashboardHeader(page, {
    ...header,
    subtitle: `${from} → ${to}`,
    filters,
  });
}
