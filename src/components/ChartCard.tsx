'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

type Datum = { date: string; value: number };

type ChartCardProps = {
  title: string;
  data: Datum[];
  height?: number;
  className?: string;
  emptyHint?: string;
};

type ChartPoint = Datum & { ma28: number | null };

function computeMovingAverage(data: Datum[], windowSize = 28): ChartPoint[] {
  if (!data.length) return [];

  const points: ChartPoint[] = [];
  let rollingSum = 0;

  for (let index = 0; index < data.length; index += 1) {
    const point = data[index];
    rollingSum += point.value;

    if (index >= windowSize) {
      rollingSum -= data[index - windowSize].value;
    }

    const denominator = index < windowSize ? index + 1 : windowSize;
    points.push({
      date: point.date,
      value: point.value,
      ma28: denominator ? rollingSum / denominator : null,
    });
  }

  return points;
}

function formatDateLabel(value: string) {
  return value;
}

function ChartTooltip(props: TooltipProps<ValueType, NameType>) {
  const typed = props as TooltipProps<ValueType, NameType> & {
    payload?: { dataKey?: string; value?: ValueType }[];
    label?: string | number;
  };

  const { active } = props;
  const payload = typed.payload;
  const label = typed.label;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const daily = payload.find((item) => item.dataKey === 'value');
  const avg = payload.find((item) => item.dataKey === 'ma28');

  return (
    <div className="rounded-xl border border-white/10 bg-black/85 px-4 py-3 text-xs text-white shadow-lg backdrop-blur">
      <div className="font-medium text-white">{label}</div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-rose-200">
          <span className="inline-flex h-2 w-2 rounded-full bg-rose-400" />
          <span>Daily: {daily?.value == null ? '—' : numberFormatter.format(Number(daily.value))}</span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <span className="inline-flex h-2 w-2 rounded-full bg-white/50" />
          <span>
            MA28: {avg?.value == null ? '—' : numberFormatter.format(Number(avg.value))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChartCard({
  title,
  data,
  height = 300,
  className,
  emptyHint = 'No datapoints available for this period.',
}: ChartCardProps) {
  const chartData = useMemo(() => computeMovingAverage(data), [data]);

  const cardClasses = clsx(
    'rounded-2xl border border-white/10 bg-black/40 p-6 shadow-glow backdrop-blur-xl',
    className,
  );

  if (!chartData.length) {
    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-6 text-sm text-white/70">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="h-[300px] w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              cursor={{ stroke: 'rgba(248,113,113,0.4)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
              content={<ChartTooltip />}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f87171"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#f87171', strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="ma28"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
