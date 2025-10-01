'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useSSE from '@/hooks/useSSE';

type Point = { date: string; value: number };

type Tick = { t: number; value: number };

const TimeSeriesVisx = dynamic(() => import('@/components/charts/TimeSeriesVisx'), {
  ssr: false,
  loading: () => <div className="h-44 rounded-2xl bg-white/5 animate-pulse" />,
});

export function LiveMiniChart() {
  const tick = useSSE<Tick>('/api/stream');
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    if (!tick) return;
    const d = new Date(tick.t);
    setSeries((s) => [...s.slice(-60), { date: d.toLocaleTimeString(), value: tick.value }]);
  }, [tick]);

  return <TimeSeriesVisx series={[{ id: 'live', data: series }]} height={180} />;
}

export default LiveMiniChart;
