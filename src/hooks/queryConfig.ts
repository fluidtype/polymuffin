'use client';

export const COMMON_QUERY_OPTIONS = {
  cacheTime: 10 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const commonOnError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Query failed:', message);
};
