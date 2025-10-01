import { isoToYyyymmdd } from './dates';
import { suggestGranularity } from './guards';
import type { GdeltResp } from './types';

const BASE = process.env.NEXT_PUBLIC_GDELT_BASE ?? 'https://my-search-proxy.ew.r.appspot.com/gdelt';

type BuildOpts = {
  q: string;
  from: string;
  to: string;
  gran: 'auto' | 'daily' | 'monthly';
  mode?: 'context' | 'search' | 'bilateral' | 'bbva';
};

type ContextMode = { action: 'context'; v: 2 };
type SearchMode = { action: 'search'; v: 1 };
type BilateralMode = { action: 'bilateral'; v: 1; c1: string; c2: string };
type BilateralConflictMode = {
  action: 'bilateral_conflict_coverage';
  v: 2;
  a1: string;
  a2: string;
};

type ParsedMode = ContextMode | SearchMode | BilateralMode | BilateralConflictMode;

function parseMode(q: string, mode?: BuildOpts['mode']): ParsedMode {
  const arrow = q.match(/([A-Z]{3})\s*->\s*([A-Z]{3})/);
  if (mode === 'bbva' && arrow) {
    return { action: 'bilateral_conflict_coverage', a1: arrow[1]!, a2: arrow[2]!, v: 2 };
  }
  if ((mode === 'bilateral' || arrow) && arrow) {
    return { action: 'bilateral', c1: arrow[1]!, c2: arrow[2]!, v: 1 };
  }
  if (mode === 'search') {
    return { action: 'search', v: 1 };
  }
  return { action: 'context', v: 2 };
}

export function buildGdeltUrl({ q, from, to, gran, mode }: BuildOpts) {
  const parsed = parseMode(q, mode);
  const versionSuffix = parsed.v === 2 ? '/v2' : '';
  const ds = isoToYyyymmdd(from);
  const de = isoToYyyymmdd(to);
  const granularity =
    (gran === 'auto' ? suggestGranularity(from, to) : gran) === 'daily'
      ? '&granularity=daily'
      : '';

  let url = `${BASE}${versionSuffix}?action=${parsed.action}&date_start=${ds}&date_end=${de}${granularity}`;

  if (parsed.action === 'context') {
    if (q.trim()) {
      url += `&keywords=${encodeURIComponent(q.trim())}&include_insights=true`;
    }
  }
  if (parsed.action === 'bilateral') {
    url += `&country1=${parsed.c1}&country2=${parsed.c2}`;
  }
  if (parsed.action === 'bilateral_conflict_coverage') {
    url += `&actor1_code=${parsed.a1}&actor2_code=${parsed.a2}&include_total=true`;
  }
  return url;
}

export async function fetchGdelt(opts: BuildOpts): Promise<GdeltResp> {
  const url = buildGdeltUrl(opts);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    let detail: string | null = null;
    try {
      detail = await res.text();
    } catch {
      detail = null;
    }
    const message = detail?.trim()?.length
      ? detail.trim()
      : res.statusText || 'Unknown response';
    throw new Error(`GDELT request failed (${res.status}): ${message}`);
  }
  return res.json();
}
