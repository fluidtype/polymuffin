'use client';

import { useQuery } from '@tanstack/react-query';
import type { PolyMarket } from '@/types';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import type { UseQueryOptionsWithSignal } from './useGdeltContext';
import { normalizeMarket, type RawPolyMarket } from './usePolySearch';

export interface UsePolyMarketDetailsParams {
  id: string;
}

export interface PolyMarketDetailsResult {
  market: PolyMarket | null;
  raw: unknown;
}

const extractMarketPayload = (payload: unknown): RawPolyMarket | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const container = payload as Record<string, unknown>;
  const marketValue = container.market;
  const dataValue = container.data;

  if (Array.isArray(marketValue) && marketValue.length > 0) {
    return marketValue[0] as RawPolyMarket;
  }

  if (marketValue && typeof marketValue === 'object') {
    return marketValue as RawPolyMarket;
  }

  if (Array.isArray(dataValue) && dataValue.length > 0) {
    return dataValue[0] as RawPolyMarket;
  }

  if (dataValue && typeof dataValue === 'object') {
    return dataValue as RawPolyMarket;
  }

  return container as RawPolyMarket;
};

export const fetchPolyMarketDetails = async (
  params: UsePolyMarketDetailsParams,
  signal?: AbortSignal,
): Promise<PolyMarketDetailsResult> => {
  const response = await fetch(`/api/poly/market?id=${params.id}`, { signal });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Service unavailable');
    }

    const message = await response.text();
    throw new Error(message || 'Failed to fetch PolyMarket details');
  }

  const payload = await response.json();
  const marketPayload = extractMarketPayload(payload);
  const market = marketPayload ? normalizeMarket(marketPayload) : null;

  return {
    market,
    raw: payload,
  };
};

export const usePolyMarketDetails = (params: UsePolyMarketDetailsParams) => {
  const signal = useAbortSignal();

  return useQuery<PolyMarketDetailsResult>({
    queryKey: ['poly', 'market', params.id],
    queryFn: ({ signal: querySignal }) => fetchPolyMarketDetails(params, querySignal ?? signal),
    enabled: Boolean(params.id),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<PolyMarketDetailsResult>);
};
