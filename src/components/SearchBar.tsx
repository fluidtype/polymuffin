'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Granularity, Source } from '@/lib/searchModel';
import { defaultSearchParams } from '@/lib/searchModel';
import { guardDateRange } from '@/lib/guards';

const toQS = (o: Record<string,string>) => new URLSearchParams(o).toString();

export default function SearchBar() {
  const r = useRouter();
  const sp = useSearchParams();

  const init = useMemo(() => {
    const d = defaultSearchParams();
    return {
      q: sp.get('q') ?? d.q,
      from: sp.get('from') ?? d.from,
      to: sp.get('to') ?? d.to,
      gran: (sp.get('gran') as Granularity) ?? d.gran,
      sources: (sp.get('src')?.split(',').filter(Boolean) as Source[]) ?? d.sources,
    };
  }, [sp]);

  const [q, setQ] = useState(init.q);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [gran, setGran] = useState<Granularity>(init.gran);
  const [sources, setSources] = useState<Source[]>(init.sources);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    setQ(init.q); setFrom(init.from); setTo(init.to);
    setGran(init.gran); setSources(init.sources);
  }, [init]);

  const toggle = (s: Source) =>
    setSources(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eMsg = guardDateRange(from, to);
    if (eMsg) { setErr(eMsg); return; }
    const src = sources.join(',');
    r.push(`/search?${toQS({ q, from, to, gran, src })}`);
  };

  const rangeDays = Math.round((+new Date(to) - +new Date(from)) / 86400000);

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-white/10 rounded-xl p-3 bg-white/10 placeholder-white/50 focus:outline-none"
          placeholder='Cerca es. "tesla", "USA", "USA→CHN"'
          value={q} onChange={e=>setQ(e.target.value)}
        />
        <button className="px-4 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15" type="submit">
          Cerca
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <span>Dal</span>
          <input type="date" className="border rounded-lg p-2 bg-white/10"
                 value={from} onChange={e=>setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-1">
          <span>Al</span>
          <input type="date" className="border rounded-lg p-2 bg-white/10"
                 value={to} onChange={e=>setTo(e.target.value)} />
        </label>
        <select className="border rounded-lg p-2 bg-white/10"
                value={gran} onChange={e=>setGran(e.target.value as Granularity)}>
          <option value="auto">Granularità: Auto</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
        </select>

        <div className="flex gap-4">
          {(['gdelt','twitter','polymarket'] as Source[]).map(s=>(
            <label key={s} className="inline-flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={sources.includes(s)} onChange={()=>toggle(s)} />
              <span className="uppercase">{s}</span>
            </label>
          ))}
        </div>

        {sources.includes('twitter') && rangeDays > 7 && (
          <span className="text-xs text-yellow-300">Twitter mostra ultimi 7 giorni</span>
        )}
        {err && <span className="text-xs text-rose-300">{err}</span>}
      </div>
    </form>
  );
}
