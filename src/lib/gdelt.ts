import { isoToYyyymmdd } from './dates';
import { suggestGranularity } from './guards';
import type { GdeltResp } from './types';

const BASE = process.env.NEXT_PUBLIC_GDELT_BASE || 'https://my-search-proxy.ew.r.appspot.com/gdelt';

type BuildOpts = {
  q: string;
  from: string;
  to: string;
  gran: 'auto'|'daily'|'monthly';
  mode?: 'context'|'search'|'bilateral'|'bbva';
};

function parseMode(q: string, mode?: BuildOpts['mode']) {
  const arrow = q.match(/([A-Z]{3})\s*(?:→|->)\s*([A-Z]{3})/);
  if (mode === 'bbva' && arrow) return { action: 'bilateral_conflict_coverage', a1: arrow[1], a2: arrow[2], v: 2 };
  if ((mode === 'bilateral' || arrow) && arrow) return { action: 'bilateral', c1: arrow[1], c2: arrow[2], v: 2 };
  if (mode === 'search') return { action: 'search', v: 1 };
  return { action: 'context', v: 2 };
}

export function buildGdeltUrl({ q, from, to, gran, mode }: BuildOpts) {
  const p = parseMode(q, mode);
  const v = p.v === 2 ? '/v2' : '';
  const ds = isoToYyyymmdd(from);
  const de = isoToYyyymmdd(to);
  const resolvedGran = (gran === 'auto' ? suggestGranularity(from, to) : gran);
  const g = resolvedGran === 'daily' ? '&granularity=daily' : '';

  let url = `${BASE}${v}?action=${p.action}&date_start=${ds}&date_end=${de}${g}`;

  if (p.action === 'context') {
    if (q.trim()) url += `&keywords=${encodeURIComponent(q.trim())}&include_insights=true`;
  }
  if (p.action === 'bilateral' && (p as any).c1 && (p as any).c2) {
    url += `&country1=${(p as any).c1}&country2=${(p as any).c2}`;
  }
  if (p.action === 'bilateral_conflict_coverage' && (p as any).a1 && (p as any).a2) {
    url += `&actor1_code=${(p as any).a1}&actor2_code=${(p as any).a2}&include_total=true`;
  }
  return url;
}

function mapHttpToUserError(status: number): string {
  if (status === 400) return 'Richiesta non valida per GDELT (400). Controlla parametri e formato date.';
  if (status === 401 || status === 403) return 'Accesso negato al backend GDELT (401/403). Configura NEXT_PUBLIC_GDELT_BASE verso un proxy autorizzato.';
  if (status === 404) return 'Endpoint GDELT non trovato (404). Controlla BASE URL.';
  if (status === 429) return 'Rate limit GDELT (429). Riprova tra poco.';
  if (status === 500) return 'Errore interno backend GDELT (500).';
  if (status === 502 || status === 503 || status === 504) return 'Backend GDELT temporaneamente non disponibile (5xx).';
  return `Errore GDELT (${status}).`;
}

export async function fetchGdelt(opts: BuildOpts): Promise<GdeltResp> {
  const url = buildGdeltUrl(opts);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return { status: 'error', error: mapHttpToUserError(res.status) } as any;
    }
    const json = await res.json();
    if (json?.status === 'error') {
      return { status: 'error', error: json.error || 'GDELT ha risposto con errore.' } as any;
    }
    return json;
  } catch (e: any) {
    return { status: 'error', error: `Rete non raggiungibile: ${e?.message || e}` } as any;
  }
}
