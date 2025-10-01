import FadeIn from '@/components/motion/FadeIn';
import ChartCard from '@/components/ChartCard';
import ErrorBanner from '@/components/ErrorBanner';
import EventsList from '@/components/EventsList';
import KpiCard from '@/components/KpiCard';
import SearchBar from '@/components/SearchBar';
import { RightColumn } from '@/components/RightColumn';
import SectionTitle from '@/components/SectionTitle';
import { withDashboardHeader, type DashboardHeader } from '@/components/DashboardShell';

import { parseQuery } from '@/lib/queryParser';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import type { GdeltResp, Market, Tweet } from '@/lib/types';
import { buildMainSeries, buildSentimentSeries, extractEvents, type EventRow } from '@/lib/gdeltTransforms';

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
  title: 'Search',
  subtitle: 'Investigate narratives across sources',
};

type TwitterResp = { data?: Tweet[] };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[] };

type SearchParams = Record<string, string | string[]>;
type SearchPageProps = { searchParams: SearchParams | Promise<SearchParams> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await Promise.resolve(searchParams);

  const q = (typeof params.q === 'string' ? params.q : params.q?.[0]) ?? '';
  const from = (typeof params.from === 'string' ? params.from : params.from?.[0])
    ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = (typeof params.to === 'string' ? params.to : params.to?.[0])
    ?? new Date().toISOString().slice(0, 10);
  const gran = ((typeof params.gran === 'string' ? params.gran : params.gran?.[0]) ?? 'auto') as 'auto' | 'daily' | 'monthly';
  const srcParam = (typeof params.src === 'string' ? params.src : params.src?.[0]) ?? 'gdelt,twitter,polymarket';
  const want = new Set(srcParam.split(',').filter(Boolean));
  const baseUrl = await getBaseUrl();

  const parsed = parseQuery(q);
  const mode = parsed.kind === 'bilateralDirectional' ? 'bbva'
    : parsed.kind === 'bilateral' ? 'bilateral'
      : 'context';

  const gdPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? fetchJson<GdeltResp>(
        `${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${from}&to=${to}&gran=${gran}&mode=${mode}`,
        { cache: 'no-store' },
      )
    : Promise.resolve(null);

  const twPromise: Promise<TwitterResp | null> = want.has('twitter')
    ? fetchJson<TwitterResp>(
        `${baseUrl}/api/twitter?q=${encodeURIComponent(q)}&from=${from}&to=${to}`,
        { cache: 'no-store' },
      )
    : Promise.resolve(null);

  const pmPromise: Promise<PolymarketResp | null> = want.has('polymarket')
    ? fetchJson<PolymarketResp>(
        `${baseUrl}/api/polymarket?q=${encodeURIComponent(q)}&open=true`,
        { next: { revalidate: 30 } },
      )
    : Promise.resolve(null);

  const gdPrevPromise: Promise<GdeltResp | null> = want.has('gdelt')
    ? (async () => {
        const pf = new Date(from); pf.setDate(pf.getDate() - 30);
        const pt = new Date(to); pt.setDate(pt.getDate() - 30);
        const f = pf.toISOString().slice(0, 10);
        const t = pt.toISOString().slice(0, 10);
        return fetchJson<GdeltResp>(
          `${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(q)}&from=${f}&to=${t}&gran=${gran}&mode=${mode}`,
          { cache: 'no-store' },
        );
      })()
    : Promise.resolve(null);

  const [gdResult, twResult, pmResult, gdPrevResult] = await Promise.allSettled([
    gdPromise,
    twPromise,
    pmPromise,
    gdPrevPromise,
  ]);

  let gdError: string | null = null;
  const gdRes: GdeltResp | null = gdResult.status === 'fulfilled' ? gdResult.value : null;
  const gdPrev: GdeltResp | null = gdPrevResult.status === 'fulfilled' ? gdPrevResult.value : null;
  const twRes: TwitterResp | null = twResult.status === 'fulfilled' ? twResult.value : null;
  const pmRes: PolymarketResp | null = pmResult.status === 'fulfilled' ? pmResult.value : null;

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

  const rows = !gdError && gdRes ? gdRes.data ?? [] : [];
  const prevRows = !gdError && gdPrev ? gdPrev.data ?? [] : [];

  const shouldComputeKpis = !gdError && want.has('gdelt');
  const metrics = shouldComputeKpis
    ? {
        volume: kpiVolume(rows),
        sentAvg: kpiSentimentAvg(rows),
        delta: kpiDeltaVsPrev(rows, prevRows),
      }
    : null;

  const mainSeries = shouldComputeKpis
    ? buildMainSeries(rows, gdRes?.action ?? mode, gdRes?.insights)
    : [];

  const sentSeries = shouldComputeKpis ? buildSentimentSeries(rows) : [];

  const events: EventRow[] = shouldComputeKpis ? extractEvents(gdRes?.insights) : [];

  const volumeValue = metrics ? Intl.NumberFormat().format(metrics.volume) : 'N/A';
  const volumeDelta = metrics ? `${(metrics.delta * 100).toFixed(1)}% vs prev` : '—';
  const sentAvgValue = metrics ? `${metrics.sentAvg >= 0 ? '+' : ''}${metrics.sentAvg.toFixed(2)}` : 'N/A';
  const changeValue = metrics ? `${(metrics.delta * 100).toFixed(1)}%` : 'N/A';
  const relCoverageValue = metrics && rows.length
    ? `${((rows[rows.length - 1]?.relative_coverage ?? 0) * 100).toFixed(2)}%`
    : 'N/A';
  const signalsValue = shouldComputeKpis ? 'OK' : 'N/A';
  const gdeltErrorMessage = gdError ? `Unable to load GDELT data: ${gdError}` : null;

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

  const page = (
    <div className="space-y-6">
      <SectionTitle
        title={`Results for “${q}”`}
        subtitle={`Range: ${from} → ${to} · gran: ${gran}`}
      />

      {gdeltErrorMessage && (
        <FadeIn>
          <ErrorBanner message={gdeltErrorMessage} />
        </FadeIn>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <FadeIn>
          <KpiCard label="Volume" value={volumeValue} delta={volumeDelta} />
        </FadeIn>
        <FadeIn delay={0.05}>
          <KpiCard label="Sentiment avg" value={sentAvgValue} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <KpiCard label="Change vs prev" value={changeValue} />
        </FadeIn>
        <FadeIn delay={0.15}>
          {mode === 'bbva'
            ? <KpiCard label="Rel. Coverage" value={relCoverageValue} />
            : <KpiCard label="Signals" value={signalsValue} />}
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <FadeIn>
            <ChartCard
              title={mode === 'bbva' ? 'Relative Coverage (daily)' : 'Daily Volume'}
              data={mainSeries}
              emptyHint="We couldn't load enough data for this chart. Try expanding the date range."
            />
          </FadeIn>
          <FadeIn delay={0.05}>
            <ChartCard
              title="Sentiment over time"
              data={sentSeries}
              emptyHint="Sentiment will appear once we have GDELT events for this search."
            />
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

  return withDashboardHeader(page, {
    ...header,
    subtitle: `“${q || 'all'}” · ${from} → ${to}`,
    filters: (
      <div className="w-full md:max-w-2xl">
        <SearchBar />
      </div>
    ),
  });
}