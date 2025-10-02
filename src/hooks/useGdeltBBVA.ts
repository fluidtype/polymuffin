'use client';

import { useQuery } from '@tanstack/react-query';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import type { UseQueryOptionsWithSignal } from './useGdeltContext';

export interface UseGdeltBBVAParams {
  actor1: string;
  actor2: string;
  dateStart: string;
  dateEnd: string;
  includeTotal?: boolean;
  cameoCodes?: string;
}

export type GdeltBBVAData = Record<string, unknown>;

const buildBBVASearchParams = (params: UseGdeltBBVAParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('action', 'bilateral_conflict_coverage');
  searchParams.set('mode', 'artlist');
  searchParams.set('format', 'json');
  searchParams.set('actor1_code', params.actor1);
  searchParams.set('actor2_code', params.actor2);
  searchParams.set('date_start', params.dateStart);
  searchParams.set('date_end', params.dateEnd);
  searchParams.set('include_total', String(params.includeTotal ?? false));
  if (params.cameoCodes) {
    searchParams.set('cameo_codes', params.cameoCodes);
  }
  return searchParams;
};

export const fetchGdeltBBVAData = async (
  params: UseGdeltBBVAParams,
  signal?: AbortSignal,
): Promise<GdeltBBVAData> => {
  const searchParams = buildBBVASearchParams(params);
  const response = await fetch(`/api/gdelt?${searchParams.toString()}`, { signal });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Service unavailable');
    }

    const message = await response.text();
    throw new Error(message || 'Failed to fetch GDELT BBVA data');
  }

  return (await response.json()) as GdeltBBVAData;
};

export const useGdeltBBVA = (params: UseGdeltBBVAParams) => {
  const signal = useAbortSignal();

  return useQuery<GdeltBBVAData>({
    queryKey: ['gdelt', 'bbva', params],
    queryFn: ({ signal: querySignal }) => fetchGdeltBBVAData(params, querySignal ?? signal),
    enabled: Boolean(params.actor1 && params.actor2 && params.dateStart && params.dateEnd),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<GdeltBBVAData>);
};
