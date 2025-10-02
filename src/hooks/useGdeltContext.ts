'use client';

import { useMemo } from 'react';
import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import type { GdeltEvent, GdeltInsights, GdeltSeriesPoint } from '@/types';
import { useGlobalFilters, type GlobalFiltersState } from './useGlobalFilters';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import { normalizeGdeltDate } from './gdeltUtils';

export interface UseGdeltContextParams {
  keywords: string[];
  dateStart: string;
  dateEnd: string;
  limit?: number;
  includeInsights?: boolean;
}

export interface GdeltContextData {
  series: GdeltSeriesPoint[];
  events: GdeltEvent[];
  insights: GdeltInsights;
}

export type UseQueryOptionsWithSignal<TData, TError = Error, TQueryKey extends QueryKey = QueryKey> = UseQueryOptions<
  TData,
  TError,
  TData,
  TQueryKey
> & { signal: AbortSignal };

const DEFAULT_CONTEXT_DATA: GdeltContextData = {
  series: [],
  events: [],
  insights: {},
};

const buildContextSearchParams = (params: UseGdeltContextParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('action', 'context');
  searchParams.set('mode', 'artlist');
  searchParams.set('format', 'json');
  searchParams.set('keywords', params.keywords.join(','));
  searchParams.set('date_start', params.dateStart);
  searchParams.set('date_end', params.dateEnd);
  searchParams.set('include_insights', String(params.includeInsights ?? true));
  searchParams.set('limit', String(params.limit ?? 500));
  return searchParams;
};

const MOCK_CONTEXT_DATA: GdeltContextData = {
  series: [
    {
      date: '2025-10-01',
      conflict_events: 100,
    },
  ],
  events: [],
  insights: {},
};

type RawGdeltRow = Record<string, unknown>;

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const normalizeContextSeries = (data: RawGdeltRow[]): GdeltSeriesPoint[] =>
  data.map((item) => {
    const row = item ?? {};
    const dayDateValue =
      ((row as { DayDate?: string | number }).DayDate ??
        (row as { date?: string | number }).date ??
        (row as { SQLDATE?: string | number }).SQLDATE ??
        '') as string | number;

    return {
      date: normalizeGdeltDate(dayDateValue),
      conflict_events: toOptionalNumber(row['conflict_events']),
      avg_sentiment: toOptionalNumber(row['avg_sentiment']),
      avg_impact: toOptionalNumber(row['avg_impact']),
      interaction_count: toOptionalNumber(row['interaction_count']),
      relative_coverage: toOptionalNumber(row['relative_coverage']),
    };
  });

const normalizeContextEvents = (data: RawGdeltRow[]): GdeltEvent[] =>
  data.map((item) => {
    const row = item ?? {};
    const typedRow = row as {
      SQLDATE?: string | number;
      SOURCEURL?: string;
    } & RawGdeltRow;
    const { SQLDATE = '', SOURCEURL = '', ...rest } = typedRow;
    return {
      SQLDATE,
      SOURCEURL,
      ...rest,
    } as GdeltEvent;
  });

export const fetchGdeltContextData = async (
  params: UseGdeltContextParams,
  signal?: AbortSignal,
): Promise<GdeltContextData> => {
  const searchParams = buildContextSearchParams(params);
  const response = await fetch(`/api/gdelt?${searchParams.toString()}`, { signal });

  if (response.status === 503) {
    console.warn('GDELT service unavailable, using mock data');
    return MOCK_CONTEXT_DATA;
  }

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'GDELT error';
    throw new Error(message);
  }

  const dataRows = Array.isArray(payload?.data) ? payload.data : [];
  const insights = (payload?.insights ?? {}) as GdeltInsights;

  return {
    series: normalizeContextSeries(dataRows),
    events: normalizeContextEvents(dataRows),
    insights,
  };
};

const mergeWithGlobalFilters = (
  params: UseGdeltContextParams,
  filters: GlobalFiltersState,
): UseGdeltContextParams => {
  const keywords = params.keywords.length ? params.keywords : filters.keywords;
  const dateStart = params.dateStart || filters.dateStart;
  const dateEnd = params.dateEnd || filters.dateEnd;

  return {
    keywords,
    dateStart,
    dateEnd,
    includeInsights: params.includeInsights ?? true,
    limit: params.limit ?? 500,
  };
};

export const useGdeltContext = (params: UseGdeltContextParams) => {
  const filters = useGlobalFilters();
  const mergedParams = useMemo(() => mergeWithGlobalFilters(params, filters), [params, filters]);
  const signal = useAbortSignal();

  const query = useQuery<GdeltContextData>({
    queryKey: ['gdelt', 'context', mergedParams],
    queryFn: ({ signal: querySignal }) => fetchGdeltContextData(mergedParams, querySignal ?? signal),
    enabled: Boolean(mergedParams.keywords.length && mergedParams.dateStart && mergedParams.dateEnd),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<GdeltContextData>);

  const data = query.data ?? DEFAULT_CONTEXT_DATA;

  return {
    ...query,
    data,
    series: data.series,
    events: data.events,
    insights: data.insights,
  };
};
