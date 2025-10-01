export type QueryKind = 'topic' | 'country' | 'bilateral' | 'bilateralDirectional';

export function parseQuery(input: string): { kind: QueryKind; tokens: string[] } {
  const q = (input || '').trim();

  if (!q) return { kind:'topic', tokens: [] };

  const arrow = q.match(/(^|[^A-Z])([A-Z]{3})\s*->\s*([A-Z]{3})([^A-Z]|$)/);
  if (arrow) return { kind:'bilateralDirectional', tokens:[arrow[2], arrow[3]] };

  const iso = q.split(/\s+/).filter(t => /^[A-Z]{3}$/.test(t));
  if (iso.length === 2) return { kind:'bilateral', tokens: iso.slice(0,2) };
  if (iso.length === 1) return { kind:'country', tokens: iso };

  return { kind:'topic', tokens: q.split(/\s+/) };
}
