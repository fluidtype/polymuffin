import SearchBar from '@/components/SearchBar';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import EventsList from '@/components/EventsList';
import { RightColumn } from '@/components/RightColumn';
import TrendingTile from '@/components/TrendingTile';
import { withDashboardHeader } from '@/components/DashboardShell';
import { lastNDaysISO } from '@/lib/dates';

type TrendingItem = {
  keyword: string;
  total?: number;
  avg_tone?: number;
  temporal?: Record<string, number>;
  error?: string;
};

type TrendingResponse = {
  items?: TrendingItem[];
  error?: string;
};

const TREND_KEYWORDS = ['markets', 'oil', 'semiconductor', 'inflation', 'rates', 'bitcoin'];

function pctChangeFromTemporal(temporal: Record<string, number> = {}) {
  const entries = Object.entries(temporal).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length < 2) return 0;
  const half = Math.floor(entries.length / 2);
  const prev = entries.slice(0, half).reduce((sum, [, value]) => sum + value, 0) || 1;
  const curr = entries.slice(half).reduce((sum, [, value]) => sum + value, 0);
  return ((curr - prev) / prev) * 100;
}

function buildMockSeries() {
  return Array.from({ length: 30 }, (_, index) => ({
    date: `D${index + 1}`,
    value: 50 + Math.sin(index / 4) * 12 + (Math.random() * 4 - 2),
  }));
}

export default async function Home() {
  const { from, to } = lastNDaysISO(30);

  let trending: TrendingResponse = { items: [] };
  try {
    const res = await fetch(`/api/trending?from=${from}&to=${to}`, { cache: 'no-store' });
    trending = await res.json();
  } catch {
    trending = { items: [] };
  }

  const receivedItems = trending.items ?? [];
  const itemsByKeyword = new Map(receivedItems.map((item) => [item.keyword, item] as const));
  const tiles = TREND_KEYWORDS.map((keyword) =>
    itemsByKeyword.get(keyword) ?? { keyword, total: 0, avg_tone: 0, temporal: {} },
  );

  const sorted = [...tiles].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const main = sorted[0];

  const volumeSeries = buildMockSeries();
  const sentimentSeries = volumeSeries.map((point) => ({
    date: point.date,
    value: (point.value - 50) / 25 - 0.2,
  }));

  const events = [
    { date: '2025-09-27', title: 'Oil spikes on supply fears', tone: -1.2, impact: 2.1, source: 'https://example.com' },
    { date: '2025-09-26', title: 'Semiconductor rally continues', tone: 1.0, impact: 1.3, source: 'https://example.com' },
    { date: '2025-09-25', title: 'Rates hold steady', tone: 0.1, impact: 0.8, source: 'https://example.com' },
  ];

  const page = (
    <div className="space-y-6">
      <div className="space-y-2 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">Realtime Intelligence</div>
        <h1 className="text-2xl font-semibold">Prediction Market Command</h1>
        <p className="text-sm text-white/60">
          Trending narratives from the last 30 days across markets, commodities, macro and crypto.
        </p>
      </div>

      <SearchBar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((item) => (
          <TrendingTile
            key={item.keyword}
            keyword={item.keyword}
            total={item.total ?? 0}
            tone={item.avg_tone ?? 0}
            trend={pctChangeFromTemporal(item.temporal ?? {})}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Top Topic"
          value={main?.keyword ?? '—'}
          delta={main ? `${pctChangeFromTemporal(main.temporal ?? {}).toFixed(1)}% trend` : undefined}
        />
        <KpiCard
          label="Events (30d)"
          value={main ? Intl.NumberFormat().format(main.total ?? 0) : '—'}
        />
        <KpiCard
          label="Sentiment avg"
          value={main ? `${(main.avg_tone ?? 0) >= 0 ? '+' : ''}${(main.avg_tone ?? 0).toFixed(2)}` : '—'}
        />
        <KpiCard label="Signals" value="OK" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <ChartCard title="Daily volume (example)" data={volumeSeries} />
          <ChartCard
            title="Sentiment over time (example)"
            data={sentimentSeries}
            emptyHint="Sentiment preview based on demo data."
          />
          <EventsList rows={events} />
        </div>

        <RightColumn
          tweets={[
            { id: 't1', text: '[STUB] Top tweet su "prediction market"', author: '@stub', likes: 50 },
            { id: 't2', text: '[STUB] Oil vs semis narrative', author: '@bob', likes: 42 },
            { id: 't3', text: '[STUB] Risk sentiment cooling', author: '@alice', likes: 38 },
          ]}
          markets={[
            { id: 'm1', question: 'Bitcoin > $100k by 2025?', price: 0.42, volume: 125000 },
            { id: 'm2', question: 'US Election outcome?', price: 0.61, volume: 98000 },
            { id: 'm3', question: 'ETH ETF approved by Q4?', price: 0.35, volume: 56000 },
          ]}
        />
      </div>
    </div>
  );

  return withDashboardHeader(page, {
    title: 'Prediction Market Command',
    subtitle: `${from} → ${to}`,
  });
}
