import { Suspense } from 'react';
import clsx from 'clsx';
import FadeIn from '@/components/motion/FadeIn';
import ChartCard from '@/components/ChartCard';
import ErrorBanner from '@/components/ErrorBanner';
import EventsList from '@/components/EventsList';
import KpiCard from '@/components/KpiCard';
import { RightColumn } from '@/components/RightColumn';
import SectionTitle from '@/components/SectionTitle';
import Button from '@/components/ui/Button';
import { withDashboardHeader, type DashboardHeader } from '@/components/DashboardShell';
import LiveMiniChart from '@/components/charts/LiveMiniChart';

import { lastNDaysISO } from '@/lib/dates';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import type { GdeltResp, Market, Tweet } from '@/lib/types';

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let detail: string | null = null;
    try {
      detail = await res.text();
    } catch {
      detail = null;
    }
    const message = detail?.trim()?.length
      ? detail.trim()
      : res.statusText || 'Request failed';
    throw new Error(`Request failed with status ${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

export const header: DashboardHeader = {
  title: 'Market pulse',
  subtitle: 'Global snapshot of prediction-market activity',
};

type TwitterResp = { data?: Tweet[] };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[] };

type EventRow = { date: string; title: string; tone?: number; impact?: number; source?: string };

const demoChartData = [
  { date: '2025-01-01', value: 120 },
  { date: '2025-01-02', value: 98 },
  { date: '2025-01-03', value: 135 },
  { date: '2025-01-04', value: 110 },
  { date: '2025-01-05', value: 142 },
  { date: '2025-01-06', value: 128 },
  { date: '2025-01-07', value: 150 },
  { date: '2025-01-08', value: 170 },
];

const timeframes = [
  { label: '7d', active: false },
  { label: '30d', active: true },
  { label: '90d', active: false },
];

export default async function Home() {
  const { from, to } = lastNDaysISO(30);
  const baseUrl = await getBaseUrl();

  const gdPromise = fetchJson<GdeltResp>(
    `${baseUrl}/api/gdeltProxy?q=prediction%20market&from=${from}&to=${to}&gran=auto&mode=context`,
    { cache: 'no-store' },
  );
  const twPromise = fetchJson<TwitterResp>(
    `${baseUrl}/api/twitter?q=prediction%20market&from=${from}&to=${to}`,
    { cache: 'no-store' },
  );
  const pmPromise = fetchJson<PolymarketResp>(
    `${baseUrl}/api/polymarket?open=true`,
    { next: { revalidate: 30 } },
  );
  const prevPromise = (async () => {
    const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 30);
    const prevTo = new Date(to); prevTo.setDate(prevTo.getDate() - 30);
    const f = prevFrom.toISOString().slice(0, 10);
    const t = prevTo.toISOString().slice(0, 10);
    return fetchJson<GdeltResp>(
      `${baseUrl}/api/gdeltProxy?q=prediction%20market&from=${f}&to=${t}&gran=auto&mode=context`,
      { cache: 'no-store' },
    );
  })();

  const [gdResult, twResult, pmResult, gdPrevResult] = await Promise.allSettled([
    gdPromise,
    twPromise,
    pmPromise,
    prevPromise,
  ]);

  let gdError: string | null = null;
  const gdRes: GdeltResp | null = gdResult.status === 'fulfilled' ? gdResult.value : null;
  const gdPrev: GdeltResp | null = gdPrevResult.status === 'fulfilled' ? gdPrevResult.value : null;
  const twRes: TwitterResp = twResult.status === 'fulfilled' ? twResult.value : { data: [] };
  const pmRes: PolymarketResp = pmResult.status === 'fulfilled' ? pmResult.value : { items: [] };

  if (gdResult.status === 'rejected') {
    gdError = toErrorMessage(gdResult.reason);
  }
  if (!gdError && gdPrevResult.status === 'rejected') {
    gdError = `Previous range: ${toErrorMessage(gdPrevResult.reason)}`;
  }
  if (!gdError && gdRes?.status === 'error') {
    gdError = gdRes.error ?? 'Unknown GDELT error';
  }
  if (!gdError && gdPrev?.status === 'error') {
    gdError = `Previous range: ${gdPrev.error ?? 'Unknown GDELT error'}`;
  }

  const rows = !gdError ? gdRes?.data ?? [] : [];
  const prevRows = !gdError ? gdPrev?.data ?? [] : [];
  const metrics = !gdError
    ? {
        volume: kpiVolume(rows),
        sentAvg: kpiSentimentAvg(rows),
        delta: kpiDeltaVsPrev(rows, prevRows),
      }
    : null;

  const volumeValue = metrics ? Intl.NumberFormat().format(metrics.volume) : 'N/A';
  const volumeDelta = metrics ? `${(metrics.delta * 100).toFixed(1)}% vs prev` : '—';
  const sentAvgValue = metrics ? `${metrics.sentAvg >= 0 ? '+' : ''}${metrics.sentAvg.toFixed(2)}` : 'N/A';
  const changeValue = metrics ? `${(metrics.delta * 100).toFixed(1)}%` : 'N/A';
  const signalsValue = gdError ? 'N/A' : 'OK';
  const gdeltErrorMessage = gdError ? `Unable to load GDELT data: ${gdError}` : null;

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

      {gdeltErrorMessage && (
        <FadeIn>
          <ErrorBanner message={gdeltErrorMessage} />
        </FadeIn>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <FadeIn>
          <KpiCard
            label="Volume (30d)"
            value={volumeValue}
            delta={volumeDelta}
          />
        </FadeIn>
        <FadeIn delay={0.05}>
          <KpiCard label="Sentiment avg" value={sentAvgValue} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <KpiCard label="Change vs prev" value={changeValue} />
        </FadeIn>
        <FadeIn delay={0.15}>
          <KpiCard label="Signals" value={signalsValue} />
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <FadeIn>
            <ChartCard
              title="Daily Events & Trend"
              data={demoChartData}
              emptyHint="We’ll render the trend once fresh events arrive."
            />
          </FadeIn>
          <FadeIn delay={0.05}>
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
