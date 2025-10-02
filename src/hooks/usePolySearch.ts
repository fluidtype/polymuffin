'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PolyMarket, PolyToken } from '@/types';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import type { UseQueryOptionsWithSignal } from './useGdeltContext';

export type PolySearchSort = 'volume24h' | 'liquidity' | 'endDate';

export interface UsePolySearchParams {
  q: string;
  active?: boolean;
  limit?: number;
  category?: string;
  sort?: PolySearchSort;
}

export interface PolySearchResult {
  markets: PolyMarket[];
  raw: unknown;
}

const ensureNumber = (value: unknown) => {
  const next = typeof value === 'string' ? Number(value) : value;
  return typeof next === 'number' && !Number.isNaN(next) ? next : 0;
};

export type RawPolyMarket = Record<string, unknown>;
type RawPolyToken = Record<string, unknown>;

const normalizeToken = (token: RawPolyToken): PolyToken => ({
  id: String(token?.id ?? token?.token_id ?? ''),
  outcome: String(token?.outcome ?? '').toUpperCase() === 'NO' ? 'NO' : 'YES',
  price: token?.price !== undefined ? Number(token.price) : undefined,
});

export const normalizeMarket = (market: RawPolyMarket): PolyMarket => {
  const tokensSource = Array.isArray(market?.tokens) ? (market.tokens as RawPolyToken[]) : [];
  const tokens = tokensSource.map(normalizeToken);
  const yesToken = tokens.find((token) => token.outcome === 'YES');
  const noToken = tokens.find((token) => token.outcome === 'NO');
  const endDateRaw = market?.endDate ?? market?.end_date ?? null;
  const endDate = typeof endDateRaw === 'string'
    ? endDateRaw
    : endDateRaw
    ? new Date(endDateRaw).toISOString()
    : null;
  const statusRaw = market?.status;
  const titleRaw = market?.title ?? market?.question ?? '';

  return {
    id: String(market?.id ?? market?.market_id ?? ''),
    title: typeof titleRaw === 'string' ? titleRaw : String(titleRaw ?? ''),
    endDate,
    volume24h: ensureNumber(market?.volume24h ?? market?.volume_24h ?? market?.volume),
    liquidity: ensureNumber(market?.liquidity),
    status: typeof statusRaw === 'string' ? statusRaw : String(statusRaw ?? ''),
    category: market?.category ?? undefined,
    tokens,
    priceYes: yesToken?.price,
    priceNo: noToken?.price,
  };
};

const buildPolySearchParams = (params: UsePolySearchParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('q', params.q);
  searchParams.set('active', String(params.active ?? true));
  searchParams.set('limit', String(params.limit ?? 30));
  if (params.category) {
    searchParams.set('category', params.category);
  }
  searchParams.set('sort', params.sort ?? 'volume24h');
  return searchParams;
};

export const fetchPolySearchData = async (
  params: UsePolySearchParams,
  signal?: AbortSignal,
): Promise<PolySearchResult> => {
  const searchParams = buildPolySearchParams(params);
  const response = await fetch(`/api/poly?${searchParams.toString()}`, { signal });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Service unavailable');
    }

    const message = await response.text();
    throw new Error(message || 'Failed to fetch PolyMarket search data');
  }

  const payload = await response.json();
  const marketsSource = Array.isArray(payload?.data)
    ? (payload.data as RawPolyMarket[])
    : Array.isArray(payload?.markets)
    ? (payload.markets as RawPolyMarket[])
    : [];

  const markets = marketsSource.map(normalizeMarket);

  return {
    markets,
    raw: payload,
  };
};

export const usePolySearch = (params: UsePolySearchParams) => {
  const signal = useAbortSignal();
  const normalizedParams = useMemo(
    () => ({
      ...params,
      active: params.active ?? true,
      limit: params.limit ?? 30,
      sort: params.sort ?? 'volume24h',
    }),
    [params],
  );

  return useQuery<PolySearchResult>({
    queryKey: ['poly', 'search', normalizedParams],
    queryFn: ({ signal: querySignal }) => fetchPolySearchData(normalizedParams, querySignal ?? signal),
    enabled: Boolean(normalizedParams.q),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<PolySearchResult>);
};
