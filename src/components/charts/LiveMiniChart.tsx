'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useSSE from '@/hooks/useSSE';

type Point = { date: string; value: number };
type Tick = { t: number; value: number };

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value?: number }[] }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const value = payload[0]?.value;

  return (
    <div className="rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
      Live value: {value == null ? '—' : numberFormatter.format(value)}
    </div>
  );
}

export function LiveMiniChart() {
  const tick = useSSE<Tick>('/api/stream');
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    if (!tick) return;
    const d = new Date(tick.t);
    setSeries((current) => [
      ...current.slice(-120),
      { date: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), value: tick.value },
    ]);
  }, [tick]);

  const data = useMemo(() => series, [series]);

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="date" hide tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            cursor={{ stroke: 'rgba(248,113,113,0.4)', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={<ChartTooltip />}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 5, fill: '#f87171', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LiveMiniChart;
