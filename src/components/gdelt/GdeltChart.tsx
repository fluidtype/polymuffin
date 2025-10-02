"use client";

import { useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { GdeltSeriesPoint } from '@/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const xAxisFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const tooltipDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type MetricKey = 'conflict_events' | 'avg_sentiment' | 'avg_impact' | 'relative_coverage';

type MetricConfig = {
  key: MetricKey;
  label: string;
  description: string;
  color: string;
  gradientStops: [color: string, offset: number][];
  formatter: (value: number) => string;
  chart: 'line' | 'area';
};

const metricConfig: Record<MetricKey, MetricConfig> = {
  conflict_events: {
    key: 'conflict_events',
    label: 'Events',
    description: 'Daily conflict events captured by GDELT',
    color: '#ef4444',
    gradientStops: [
      ['rgba(239, 68, 68, 0.55)', 0],
      ['rgba(239, 68, 68, 0.05)', 100],
    ],
    formatter: (value: number) => numberFormatter.format(value),
    chart: 'line',
  },
  avg_sentiment: {
    key: 'avg_sentiment',
    label: 'Sentiment',
    description: 'Average media tone across the monitored sources',
    color: '#fb7185',
    gradientStops: [
      ['rgba(251, 113, 133, 0.55)', 0],
      ['rgba(251, 113, 133, 0.05)', 100],
    ],
    formatter: (value: number) => numberFormatter.format(value),
    chart: 'area',
  },
  avg_impact: {
    key: 'avg_impact',
    label: 'Impact',
    description: 'Average article impact score over time',
    color: '#f97316',
    gradientStops: [
      ['rgba(249, 115, 22, 0.55)', 0],
      ['rgba(249, 115, 22, 0.05)', 100],
    ],
    formatter: (value: number) => numberFormatter.format(value),
    chart: 'line',
  },
  relative_coverage: {
    key: 'relative_coverage',
    label: 'Rel Coverage',
    description: 'Share of global coverage mentioning the query',
    color: '#f43f5e',
    gradientStops: [
      ['rgba(244, 63, 94, 0.55)', 0],
      ['rgba(244, 63, 94, 0.05)', 100],
    ],
    formatter: (value: number) => percentFormatter.format(value ?? 0),
    chart: 'line',
  },
};

type TooltipPayload = {
  dataKey?: string;
  value?: number;
};

type TooltipContentProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
};

function formatMetricValue(value: number | null | undefined, metric: MetricConfig) {
  if (value == null) return '—';
  if (Number.isNaN(value)) return '—';
  return metric.formatter(value);
}

function ChartTooltip({ active, label, payload, metric }: TooltipContentProps & { metric: MetricConfig }) {
  if (!active || !payload?.length) return null;

  const point = payload.find((item) => item.dataKey === 'value');
  const value = point?.value;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur">
      <div className="font-semibold tracking-wide text-white/90">
        {label ? tooltipDateFormatter.format(new Date(label)) : '—'}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-rose-200">
          <span className="inline-flex h-2 w-2 rounded-full bg-rose-400" />
          <span className="uppercase tracking-wide text-[10px] text-rose-200/80">{metric.label}</span>
        </div>
        <div className="text-base font-semibold tracking-tight text-white">
          {formatMetricValue(typeof value === 'number' ? value : null, metric)}
        </div>
      </div>
    </div>
  );
}

export type GdeltChartProps = {
  series: GdeltSeriesPoint[];
  aggregation?: 'daily' | 'monthly';
  onDateClick?: (isoDate: string) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
};

export function GdeltChart({
  series,
  aggregation = 'daily',
  onDateClick,
  isLoading = false,
  error = null,
  emptyMessage = 'No activity detected for this window.',
}: GdeltChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('conflict_events');
  const gradientId = useId();

  const metric = metricConfig[activeMetric];

  const chartData = useMemo(() => {
    if (!Array.isArray(series)) return [];

    return [...series]
      .filter((item) => Boolean(item.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((point) => {
        const raw = point[activeMetric];
        const numeric = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
        return {
          date: point.date,
          value: numeric,
        };
      });
  }, [series, activeMetric]);

  const hasValues = chartData.some((item) => item.value != null && !Number.isNaN(item.value));

  if (isLoading) {
    return (
      <div className="relative flex h-[380px] w-full animate-pulse overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
        <div className="m-auto h-32 w-32 rounded-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex h-[380px] w-full items-center justify-center rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 shadow-[0_20px_60px_-25px_rgba(248,113,113,0.65)]">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-4 text-white shadow-[0_25px_60px_-30px_rgba(15,23,42,0.9)]">
      {aggregation === 'monthly' ? (
        <span className="absolute right-4 top-4 rounded-full bg-[var(--primary)]/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
          Monthly aggregation
        </span>
      ) : null}

      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">Conflict activity</h3>
              <p className="text-xs text-white/60">{metric.description}</p>
            </div>
          </div>

          <Tabs value={activeMetric} onValueChange={(value) => setActiveMetric(value as MetricKey)}>
            <TabsList className="w-fit bg-white/10">
              {Object.values(metricConfig).map((option) => (
                <TabsTrigger key={option.key} value={option.key}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.values(metricConfig).map((option) => (
              <TabsContent key={option.key} value={option.key}>
                {activeMetric === option.key && !hasValues ? (
                  <div className="flex h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/60">
                    {emptyMessage}
                  </div>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {hasValues ? (
          <div className="relative h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {metric.chart === 'area' ? (
                <AreaChart
                  data={chartData}
                  onClick={(state) => {
                    if (!onDateClick) return;
                    const date = typeof state?.activeLabel === 'string' ? state.activeLabel : undefined;
                    if (date) onDateClick(date);
                  }}
                  margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                  <defs>
                    <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                      {metric.gradientStops.map(([color, offset]) => (
                        <stop key={`${color}-${offset}`} offset={`${offset}%`} stopColor={color} />
                      ))}
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => xAxisFormatter.format(new Date(value))}
                    tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                    width={60}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => formatMetricValue(Number(value), metric)}
                  />
                  <Tooltip
                    content={(props) => <ChartTooltip {...props} metric={metric} />}
                    cursor={{ stroke: metric.color, strokeOpacity: 0.35, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={metric.color}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId}-fill)`}
                    fillOpacity={1}
                    activeDot={{ r: 6, strokeWidth: 0, fill: metric.color }}
                    connectNulls
                  />
                  <Brush
                    dataKey="date"
                    height={26}
                    stroke="rgba(255,255,255,0.25)"
                    travellerWidth={10}
                    fill="rgba(15,23,42,0.55)"
                    tickFormatter={(value) => xAxisFormatter.format(new Date(value))}
                  />
                </AreaChart>
              ) : (
                <LineChart
                  data={chartData}
                  onClick={(state) => {
                    if (!onDateClick) return;
                    const date = typeof state?.activeLabel === 'string' ? state.activeLabel : undefined;
                    if (date) onDateClick(date);
                  }}
                  margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                  <defs>
                    <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
                      {metric.gradientStops.map(([color, offset], index) => (
                        <stop
                          key={`${color}-${offset}`}
                          offset={`${offset}%`}
                          stopColor={color}
                          stopOpacity={index === 0 ? 1 : 0.7}
                        />
                      ))}
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => xAxisFormatter.format(new Date(value))}
                    tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                    width={60}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => formatMetricValue(Number(value), metric)}
                  />
                  <Tooltip
                    content={(props) => <ChartTooltip {...props} metric={metric} />}
                    cursor={{ stroke: metric.color, strokeOpacity: 0.35, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#${gradientId}-stroke)`}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, fill: metric.color, strokeWidth: 0 }}
                    connectNulls
                  />
                  <Brush
                    dataKey="date"
                    height={26}
                    stroke="rgba(255,255,255,0.25)"
                    travellerWidth={10}
                    fill="rgba(15,23,42,0.55)"
                    tickFormatter={(value) => xAxisFormatter.format(new Date(value))}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default GdeltChart;
