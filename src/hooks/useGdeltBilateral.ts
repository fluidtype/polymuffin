'use client';

import { useQuery } from '@tanstack/react-query';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import type { UseQueryOptionsWithSignal } from './useGdeltContext';

export interface UseGdeltBilateralParams {
  country1: string;
  country2: string;
  dateStart: string;
  dateEnd: string;
}

export type GdeltBilateralData = Record<string, unknown>;

const buildBilateralSearchParams = (params: UseGdeltBilateralParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('action', 'bilateral');
  searchParams.set('mode', 'artlist');
  searchParams.set('format', 'json');
  searchParams.set('country1', params.country1);
  searchParams.set('country2', params.country2);
  searchParams.set('date_start', params.dateStart);
  searchParams.set('date_end', params.dateEnd);
  searchParams.set('granularity', 'daily');
  return searchParams;
};

export const fetchGdeltBilateralData = async (
  params: UseGdeltBilateralParams,
  signal?: AbortSignal,
): Promise<GdeltBilateralData> => {
  const searchParams = buildBilateralSearchParams(params);
  const response = await fetch(`/api/gdelt?${searchParams.toString()}`, { signal });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Service unavailable');
    }

    const message = await response.text();
    throw new Error(message || 'Failed to fetch GDELT bilateral data');
  }

  return (await response.json()) as GdeltBilateralData;
};

export const useGdeltBilateral = (params: UseGdeltBilateralParams) => {
  const signal = useAbortSignal();

  return useQuery<GdeltBilateralData>({
    queryKey: ['gdelt', 'bilateral', params],
    queryFn: ({ signal: querySignal }) => fetchGdeltBilateralData(params, querySignal ?? signal),
    enabled: Boolean(params.country1 && params.country2 && params.dateStart && params.dateEnd),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<GdeltBilateralData>);
};
