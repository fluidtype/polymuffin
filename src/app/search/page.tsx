import type { ReactNode } from 'react';

import SearchBar from '@/components/SearchBar';
import ChartCard from '@/components/ChartCard';
import EventsList from '@/components/EventsList';
import KpiCard from '@/components/KpiCard';
import { RightColumn } from '@/components/RightColumn';
import Banner from '@/components/Banner';
import { withDashboardHeader, type DashboardHeader } from '@/components/DashboardShell';

import { parseQuery } from '@/lib/queryParser';
import { suggestGranularity, daysDiff } from '@/lib/guards';
import { kpiVolume, kpiSentimentAvg, kpiDeltaVsPrev } from '@/lib/stats';
import { getBaseUrl } from '@/lib/urls';
import { lastNDaysISO, yyyymmddToIso } from '@/lib/dates';
import type { GdeltDaily, GdeltResp, Market, Tweet } from '@/lib/types';

const header: DashboardHeader = {
  title: 'Search',
  subtitle: 'Investigate narratives across sources',
};

type SearchParams = Record<string, string | string[]>;

type SearchPageProps = {
  searchParams: Promise<SearchParams>;
};

type TwitterResp = { data?: Tweet[]; error?: string };
type PolymarketOutcome = { price?: number };
type PolymarketMarket = Market & { outcomes?: PolymarketOutcome[] };
type PolymarketResp = { items?: PolymarketMarket[]; error?: string };

type FetchResult<T> = { data: T | null; error: string | null };

type GdeltRow = GdeltDaily & { MonthYear?: number; date?: string };

type Mode = 'context' | 'bilateral' | 'bbva';

function readParam(value: string | string[] | undefined) {
  if (typeof value === 'string') return value;
  return value?.[0];
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const detail = res.statusText || 'Request failed';
      return { data: null, error: `${res.status} ${detail}` };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

function monthYearToIso(monthYear: number | string) {
  const normalized = String(monthYear);
  if (normalized.includes('-')) {
    if (/^\d{4}-\d{2}$/.test(normalized)) return `${normalized}-01`;
    return normalized;
  }
  const digits = normalized.replace(/[^0-9]/g, '');
  const padded = digits.length >= 6 ? digits.slice(0, 6) : digits.padEnd(6, '0');
  const year = padded.slice(0, 4);
  const month = padded.slice(4, 6) || '01';
  return `${year}-${month}-01`;
}

function resolveDate(row: GdeltRow, index: number) {
  if (row.DayDate) return yyyymmddToIso(row.DayDate);
  if (row.date) return row.date;
  if (row.MonthYear) return monthYearToIso(row.MonthYear);
  return `${index}`;
}

function toSeries(rows: GdeltRow[] = [], key: keyof GdeltRow) {
  return rows.map((row, index) => ({
    date: resolveDate(row, index),
    value: Number((row as Record<string, unknown>)[key] ?? 0),
  }));
}

function coverageSeries(rows: GdeltRow[] = []) {
  return toSeries(rows, 'relative_coverage').map((point) => ({
    ...point,
    value: point.value * 100,
  }));
}

function previousRange(from: string, to: string, gran: 'daily' | 'monthly') {
  const offset = gran === 'daily' ? 30 : 31;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  fromDate.setDate(fromDate.getDate() - offset);
  toDate.setDate(toDate.getDate() - offset);
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

function deriveMode(q: string): Mode {
  const parsed = parseQuery(q);
  if (parsed.kind === 'bilateralDirectional') return 'bbva';
  if (parsed.kind === 'bilateral') return 'bilateral';
  return 'context';
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const qParam = readParam(params.q) ?? '';
  const fallbackRange = lastNDaysISO(30);
  const from = readParam(params.from) ?? fallbackRange.from;
  const to = readParam(params.to) ?? fallbackRange.to;
  const explicitGran = (readParam(params.gran) ?? 'auto') as 'auto' | 'daily' | 'monthly';
  const gran = explicitGran === 'auto' ? suggestGranularity(from, to) : explicitGran;
  const srcParam = readParam(params.src) ?? 'gdelt,twitter,polymarket';
  const want = new Set(srcParam.split(',').filter(Boolean));

  const mode = deriveMode(qParam);
  const baseUrl = await getBaseUrl();

  const gdeltPromise = want.has('gdelt')
    ? fetchJson<GdeltResp>(
        `${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(qParam)}&from=${from}&to=${to}&gran=${gran}&mode=${mode}`,
        { cache: 'no-store' },
      )
    : Promise.resolve<FetchResult<GdeltResp>>({ data: null, error: null });

  const twitterPromise = want.has('twitter')
    ? fetchJson<TwitterResp>(
        `${baseUrl}/api/twitter?q=${encodeURIComponent(qParam)}&from=${from}&to=${to}`,
        { cache: 'no-store' },
      )
    : Promise.resolve<FetchResult<TwitterResp>>({ data: null, error: null });

  const polymarketPromise = want.has('polymarket')
    ? fetchJson<PolymarketResp>(
        `${baseUrl}/api/polymarket?q=${encodeURIComponent(qParam)}&open=true`,
        { next: { revalidate: 30 } },
      )
    : Promise.resolve<FetchResult<PolymarketResp>>({ data: null, error: null });

  const prevRange = previousRange(from, to, gran);
  const gdeltPrevPromise = want.has('gdelt')
    ? fetchJson<GdeltResp>(
        `${baseUrl}/api/gdeltProxy?q=${encodeURIComponent(qParam)}&from=${prevRange.from}&to=${prevRange.to}&gran=${gran}&mode=${mode}`,
        { cache: 'no-store' },
      )
    : Promise.resolve<FetchResult<GdeltResp>>({ data: null, error: null });

  const [gdeltResult, twitterResult, polymarketResult, gdeltPrevResult] = await Promise.all([
    gdeltPromise,
    twitterPromise,
    polymarketPromise,
    gdeltPrevPromise,
  ]);

  let gdeltError: string | null = null;
  if (gdeltResult.error) {
    gdeltError = gdeltResult.error;
  } else if (gdeltResult.data?.status === 'error') {
    gdeltError = gdeltResult.data.error ?? 'Errore GDELT sconosciuto.';
  }

  if (!gdeltError) {
    if (gdeltPrevResult.error) {
      gdeltError = `Previous range: ${gdeltPrevResult.error}`;
    } else if (gdeltPrevResult.data?.status === 'error') {
      gdeltError = `Previous range: ${gdeltPrevResult.data.error ?? 'Errore GDELT sconosciuto.'}`;
    }
  }

  const rows = !gdeltError && gdeltResult.data?.status !== 'error' ? (gdeltResult.data?.data as GdeltRow[] | undefined) ?? [] : [];
  const prevRows =
    !gdeltError && gdeltPrevResult.data?.status !== 'error'
      ? (gdeltPrevResult.data?.data as GdeltRow[] | undefined) ?? []
      : [];

  const shouldComputeKpis = !gdeltError && want.has('gdelt');
  const volume = shouldComputeKpis ? kpiVolume(rows) : 0;
  const sentimentAvg = shouldComputeKpis ? kpiSentimentAvg(rows) : 0;
  const delta = shouldComputeKpis ? kpiDeltaVsPrev(rows, prevRows) : 0;

  const volumeValue = shouldComputeKpis ? Intl.NumberFormat().format(volume) : 'N/A';
  const volumeDelta = shouldComputeKpis ? `${(delta * 100).toFixed(1)}% vs prev` : '—';
  const sentimentValue = shouldComputeKpis
    ? `${sentimentAvg >= 0 ? '+' : ''}${sentimentAvg.toFixed(2)}`
    : 'N/A';
  const changeValue = shouldComputeKpis ? `${(delta * 100).toFixed(1)}%` : 'N/A';

  const mainSeries = shouldComputeKpis
    ? mode === 'bbva'
      ? coverageSeries(rows)
      : toSeries(rows, 'interaction_count')
    : [];

  const sentimentSeries = shouldComputeKpis ? toSeries(rows, 'avg_sentiment') : [];

  const autoMonthly = explicitGran === 'auto' && gran === 'monthly';
  const rangeTooWide = autoMonthly && daysDiff(from, to) > 365;

  const banners: ReactNode[] = [];
  if (mode === 'bbva') {
    banners.push(
      <Banner key="bbva">Modalità BBVA attiva (analisi direzionale “actor1 → actor2”).</Banner>,
    );
  }
  if (rangeTooWide) {
    banners.push(
      <Banner key="wide" kind="warn">
        Intervallo &gt; 365 giorni: granularità giornaliera non disponibile, uso automatico di monthly.
      </Banner>,
    );
  }
  if (gdeltError) {
    banners.push(
      <Banner key="gdelt-error" kind="error">
        {gdeltError}
      </Banner>,
    );
  }

  const tweets = (twitterResult.data?.data ?? []).map((tweet) => ({
    id: tweet.id,
    text: tweet.text,
    author: tweet.author ?? '@stub',
    likes: tweet.like_count,
  }));

  const markets = (polymarketResult.data?.items ?? [])
    .slice(0, 6)
    .map((market) => ({
      id: market.id,
      question: market.question,
      price: market.outcomes?.[0]?.price,
      volume: market.volume,
    }));

  const relCoverageValue = shouldComputeKpis && rows.length
    ? `${(((rows[rows.length - 1] as GdeltRow)?.relative_coverage ?? 0) * 100).toFixed(2)}%`
    : 'N/A';
  const signalsValue = shouldComputeKpis ? 'OK' : 'N/A';

  const page = (
    <div className="space-y-6">
      <div className="pt-6">
        <SearchBar />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-white">Results for “{qParam || '—'}”</h1>
        <div className="text-xs text-white/60">Range: {from} → {to} · gran: {gran}</div>
      </div>

      {banners.length > 0 && (
        <div className="space-y-3">{banners}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Volume" value={volumeValue} delta={volumeDelta} />
        <KpiCard label="Sentiment avg" value={sentimentValue} />
        <KpiCard label="Change vs prev" value={changeValue} />
        {mode === 'bbva'
          ? <KpiCard label="Rel. Coverage" value={relCoverageValue} />
          : <KpiCard label="Signals" value={signalsValue} />}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <ChartCard
            title={mode === 'bbva' ? 'Relative Coverage' : 'Daily Volume'}
            data={mainSeries}
            emptyHint="Non ci sono dati sufficienti per mostrare questa serie."
          />
          <ChartCard
            title="Sentiment over time"
            data={sentimentSeries}
            emptyHint="Il sentiment apparirà quando saranno disponibili eventi GDELT per questa ricerca."
          />
          <EventsList rows={[]} />
        </div>

        <RightColumn tweets={tweets} markets={markets} />
      </div>
    </div>
  );

  return withDashboardHeader(page, header);
}
