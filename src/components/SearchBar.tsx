'use client';

import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ErrorBanner from './ErrorBanner';
import Input from './ui/Input';
import Button, { PrimaryButton } from './ui/Button';
import type { Granularity, Source } from '@/lib/searchModel';
import { defaultSearchParams } from '@/lib/searchModel';
import { guardDateRange, daysDiff, suggestGranularity } from '@/lib/guards';
import Banner from './Banner';

const toQS = (o: Record<string, string>) => new URLSearchParams(o).toString();

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
  const [err, setErr] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    setQ(init.q);
    setFrom(init.from);
    setTo(init.to);
    setGran(init.gran);
    setSources(init.sources);
    setErr(null);
    setWarn(null);
  }, [init]);

  const toggle = (s: Source) =>
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eMsg = guardDateRange(from, to);
    if (eMsg) {
      setErr(eMsg);
      setWarn(null);
      return;
    }
    setErr(null);

    const diff = daysDiff(from, to);
    let nextGran: Granularity = gran;
    if (gran === 'auto') {
      const suggested = suggestGranularity(from, to);
      if (suggested === 'daily' && diff > 365) {
        nextGran = 'monthly';
        setWarn('Intervallo > 365 giorni: passo automaticamente a monthly.');
      } else {
        nextGran = suggested;
        setWarn(null);
      }
    } else {
      setWarn(null);
    }

    const src = sources.join(',');
    r.push(`/search?${toQS({ q, from, to, gran: nextGran, src })}`);
  };

  const rangeDays = Math.round((+new Date(to) - +new Date(from)) / 86400000);

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      {err && <ErrorBanner message={err} />}
      {warn && <Banner kind="warn">{warn}</Banner>}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          className="flex-1"
          placeholder='Search e.g. "tesla", "USA", "USA→CHN"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <PrimaryButton type="submit">Search</PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-text-secondary">
          <span>From</span>
          <Input type="date" className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-text-secondary">
          <span>To</span>
          <Input type="date" className="w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <select
          className="rounded-xl border border-line-subtle/15 bg-white/5 px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-red/30"
          value={gran}
          onChange={(e) => setGran(e.target.value as Granularity)}
        >
          <option value="auto">Granularity: Auto</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
        </select>

        <div className="flex flex-wrap gap-2">
          {(['gdelt', 'twitter', 'polymarket'] as Source[]).map((s) => (
            <Button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={clsx(
                'px-3 py-1.5 text-xs uppercase tracking-wide border border-line-subtle/15',
                sources.includes(s)
                  ? 'bg-brand-red/20 text-white border-brand-red/40 shadow-glowSm'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              )}
            >
              {s}
            </Button>
          ))}
        </div>

        {sources.includes('twitter') && rangeDays > 7 && (
          <span className="text-xs text-text-muted">Twitter only covers the last 7 days.</span>
        )}
      </div>
    </form>
  );
}
