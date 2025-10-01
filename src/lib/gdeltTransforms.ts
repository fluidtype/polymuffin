import { yyyymmddToIso } from './dates';
import { toSeries } from './stats';
import type { GdeltDaily } from './types';

export type ChartDatum = { date: string; value: number };
export type EventRow = { date: string; title: string; tone?: number; impact?: number; source?: string };

type ModeHint = 'context' | 'bilateral' | 'bbva' | 'bilateral_conflict_coverage' | 'search' | undefined;
type NormalizedMode = 'context' | 'bilateral' | 'bbva';

type AnyRecord = Record<string, unknown>;

const METRIC_PRIORITY: Record<NormalizedMode, (keyof GdeltDaily)[]> = {
  context: ['interaction_count', 'total_daily_articles', 'conflict_events', 'relative_coverage'],
  bilateral: ['conflict_events', 'interaction_count', 'total_daily_articles'],
  bbva: ['relative_coverage', 'conflict_events', 'interaction_count'],
};

const VALUE_KEYS = [
  'value',
  'Value',
  'count',
  'Count',
  'volume',
  'Volume',
  'mentions',
  'Mentions',
  'articles',
  'Articles',
  'total',
  'Total',
  'interaction_count',
  'conflict_events',
  'total_daily_articles',
  'relative_coverage',
] as const;

export function normalizeMode(mode?: ModeHint): NormalizedMode {
  if (mode === 'bilateral' || mode === 'bbva') {
    return mode;
  }
  if (mode === 'bilateral_conflict_coverage') {
    return 'bbva';
  }
  return 'context';
}

export function selectMetricKey(rows: GdeltDaily[] = [], mode?: ModeHint): keyof GdeltDaily {
  const normalized = normalizeMode(mode);
  const priorities = METRIC_PRIORITY[normalized];
  const fallbacks: (keyof GdeltDaily)[] = ['interaction_count', 'total_daily_articles', 'conflict_events', 'relative_coverage'];
  const ordered = [...priorities, ...fallbacks];

  const candidate = ordered.find((key) => rows.some((row) => Number(row[key] ?? 0) !== 0));
  return candidate ?? priorities[0] ?? 'interaction_count';
}

export function buildMainSeries(rows: GdeltDaily[] = [], mode?: ModeHint, insights?: unknown): ChartDatum[] {
  const key = selectMetricKey(rows, mode);
  const series = rows.length ? toSeries(rows, key) : [];

  const hasSignal = series.some((point) => Number(point.value) !== 0);
  if (hasSignal || !insights) {
    return series;
  }

  const fromInsights = extractTemporalSeries(insights);
  return fromInsights.length ? fromInsights : series;
}

export function buildSentimentSeries(rows: GdeltDaily[] = []): ChartDatum[] {
  const keys: (keyof GdeltDaily)[] = ['avg_sentiment', 'avg_impact'];
  const key = keys.find((candidate) => rows.some((row) => Number(row[candidate] ?? 0) !== 0));
  return key ? toSeries(rows, key) : [];
}

export function extractEvents(insights: unknown, limit = 20): EventRow[] {
  if (!insights) return [];

  const events = new Map<string, EventRow>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const event = parseEvent(entry);
        if (event) {
          const key = `${event.date}|${event.source ?? event.title}`;
          if (!events.has(key)) {
            events.set(key, event);
            if (events.size >= limit) {
              return;
            }
          }
        }
        if (isRecord(entry)) {
          visit(entry);
          if (events.size >= limit) {
            return;
          }
        }
      }
      return;
    }

    if (isRecord(value)) {
      for (const entry of Object.values(value)) {
        visit(entry);
        if (events.size >= limit) {
          return;
        }
      }
    }
  };

  visit(insights);

  return Array.from(events.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

function extractTemporalSeries(insights: unknown): ChartDatum[] {
  const points = new Map<string, number>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const datum = parseTimelineDatum(entry);
        if (datum) {
          points.set(datum.date, (points.get(datum.date) ?? 0) + datum.value);
          continue;
        }
        if (isRecord(entry)) {
          visit(entry);
        }
      }
      return;
    }

    if (isRecord(value)) {
      for (const nested of Object.values(value)) {
        visit(nested);
      }
    }
  };

  visit(insights);

  return Array.from(points.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

function parseTimelineDatum(value: unknown): ChartDatum | null {
  if (!isRecord(value)) return null;

  const rawDate = value.SQLDATE ?? value.date ?? value.Date ?? value.DayDate ?? value.Day;
  const date = parseDate(rawDate);
  if (!date) return null;

  for (const key of VALUE_KEYS) {
    if (key in value) {
      const num = toNumber(value[key]);
      if (num != null) {
        return { date, value: num };
      }
    }
  }

  return null;
}

function parseEvent(value: unknown): EventRow | null {
  if (!isRecord(value)) return null;

  const rawDate = value.SQLDATE ?? value.date ?? value.Date ?? value.DayDate ?? value.Day;
  const date = parseDate(rawDate);
  if (!date) return null;

  const source = firstString(value, ['SOURCEURL', 'sourceUrl', 'source_url', 'DocumentIdentifier']);
  if (!source) return null;

  const title =
    firstString(value, [
      'DocumentTitle',
      'EventTitle',
      'title',
      'Title',
      'NormalizedTitle',
      'EnglishTitle',
      'SourceCommonName',
    ]) ?? fallbackTitleFromSource(source);

  const tone = toNumber(
    value.V2Tone ?? value.Tone ?? value.avg_sentiment ?? value.AvgTone ?? value.AvgSentiment,
  );
  const impact = toNumber(value.GoldsteinScale ?? value.avg_impact ?? value.AvgGoldstein);

  return { date, title, tone, impact, source };
}

function fallbackTitleFromSource(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

function parseDate(value: unknown): string | null {
  if (typeof value === 'number') {
    return yyyymmddToIso(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{8}$/.test(trimmed)) {
      return yyyymmddToIso(trimmed);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  return null;
}

function firstString(record: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
