'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { defaultSearchParams } from '@/lib/searchModel';

export type GlobalFiltersState = {
  keywords: string[];
  dateStart: string;
  dateEnd: string;
};

const splitKeywords = (value: string) =>
  value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

export function useGlobalFilters(): GlobalFiltersState {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const defaults = defaultSearchParams();
    const q = searchParams?.get('q') ?? defaults.q;
    const from = searchParams?.get('from') ?? defaults.from;
    const to = searchParams?.get('to') ?? defaults.to;

    return {
      keywords: q ? splitKeywords(q) : [],
      dateStart: from,
      dateEnd: to,
    };
  }, [searchParams]);
}
