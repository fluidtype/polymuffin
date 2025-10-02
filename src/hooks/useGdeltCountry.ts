'use client';

import { useQuery } from '@tanstack/react-query';
import { COMMON_QUERY_OPTIONS, commonOnError } from './queryConfig';
import { useAbortSignal } from './useAbortSignal';
import type { UseQueryOptionsWithSignal } from './useGdeltContext';

export interface UseGdeltCountryParams {
  country: string;
  dateStart: string;
  dateEnd: string;
}

export type GdeltCountryData = Record<string, unknown>;

const buildCountrySearchParams = (params: UseGdeltCountryParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('action', 'country');
  searchParams.set('mode', 'artlist');
  searchParams.set('format', 'json');
  searchParams.set('country', params.country);
  searchParams.set('date_start', params.dateStart);
  searchParams.set('date_end', params.dateEnd);
  searchParams.set('time_unit', 'day');
  return searchParams;
};

export const fetchGdeltCountryData = async (
  params: UseGdeltCountryParams,
  signal?: AbortSignal,
): Promise<GdeltCountryData> => {
  const searchParams = buildCountrySearchParams(params);
  const response = await fetch(`/api/gdelt?${searchParams.toString()}`, { signal });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Service unavailable');
    }

    const message = await response.text();
    throw new Error(message || 'Failed to fetch GDELT country data');
  }

  return (await response.json()) as GdeltCountryData;
};

export const useGdeltCountry = (params: UseGdeltCountryParams) => {
  const signal = useAbortSignal();

  return useQuery<GdeltCountryData>({
    queryKey: ['gdelt', 'country', params],
    queryFn: ({ signal: querySignal }) => fetchGdeltCountryData(params, querySignal ?? signal),
    enabled: Boolean(params.country && params.dateStart && params.dateEnd),
    ...COMMON_QUERY_OPTIONS,
    onError: commonOnError,
    signal,
  } as UseQueryOptionsWithSignal<GdeltCountryData>);
};
