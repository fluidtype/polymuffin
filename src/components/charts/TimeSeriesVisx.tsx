'use client';
import { Fragment } from 'react';
import {
  XYChart,
  AnimatedAreaSeries,
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  Tooltip,
  buildChartTheme,
} from '@visx/xychart';
import type { CurveFactory, CurveFactoryLineOnly } from 'd3-shape';

const theme = buildChartTheme({
  backgroundColor: 'transparent',
  colors: ['#ff2d2d', '#ff5a5a'],
  gridColor: 'rgba(255,255,255,0.06)',
  gridColorDark: 'rgba(255,255,255,0.06)',
  svgLabelSmall: { fill: 'rgb(var(--text-muted))' },
  svgLabelBig: { fill: 'rgb(var(--text-muted))' },
  tickLength: 6,
});

type D = {
  date: string;
  value: number;
  secondary?: Record<string, number | string>;
};

type Series = {
  id: string;
  label?: string;
  data: D[];
};

type Props = {
  series: Series[];
  height?: number;
  onBrush?: (from: string, to: string) => void;
  yDomain?: [number, number];
  curve?: CurveFactory | CurveFactoryLineOnly;
  showGrid?: boolean;
};

const formatValue = (value: number) =>
  Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: 'compact' }).format(value);

const toRgba = (hex: string, alpha: number) => {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getX = (d: D) => d.date;
const getY = (d: D) => d.value;

const isAreaCurve = (
  curve: CurveFactory | CurveFactoryLineOnly,
): curve is CurveFactory => 'areaStart' in curve && 'areaEnd' in curve;

export default function TimeSeriesVisx({
  series,
  height = 260,
  onBrush,
  yDomain,
  curve,
  showGrid = true,
}: Props) {
  return (
    <div className="h-[300px]">
      <XYChart
        height={height}
        xScale={{ type: 'band' }}
        yScale={{ type: 'linear', domain: yDomain }}
        theme={theme}
        margin={{ top: 16, right: 16, bottom: 36, left: 56 }}
      >
        <AnimatedAxis
          orientation="bottom"
          hideTicks
          tickLabelProps={() => ({
            fill: 'rgb(var(--text-muted))',
            fontSize: 11,
            dy: 8,
            textAnchor: 'middle',
          })}
          stroke="rgba(255,255,255,0.1)"
        />
        <AnimatedAxis
          orientation="left"
          numTicks={5}
          tickLabelProps={() => ({
            fill: 'rgb(var(--text-muted))',
            fontSize: 11,
            dx: -4,
            textAnchor: 'end',
          })}
          tickLineProps={{ stroke: 'rgba(255,255,255,0.08)' }}
          stroke="rgba(255,255,255,0.1)"
        />
        {showGrid && <AnimatedGrid columns={false} numTicks={5} />}
        {series.map((s, index) => {
          const strokeColor = theme.colors[index % theme.colors.length];
          return (
            <g key={s.id}>
              <defs>
                <linearGradient id={`gradient-${s.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={toRgba(strokeColor, 0.35)} />
                  <stop offset="100%" stopColor={toRgba(strokeColor, 0)} />
                </linearGradient>
              </defs>
              <AnimatedAreaSeries
                dataKey={`${s.id}-area`}
                data={s.data}
                xAccessor={getX}
                yAccessor={getY}
                curve={curve && isAreaCurve(curve) ? curve : undefined}
                fill={`url(#gradient-${s.id})`}
                stroke="transparent"
              />
              <AnimatedLineSeries
                dataKey={s.id}
                data={s.data}
                xAccessor={getX}
                yAccessor={getY}
                stroke={strokeColor}
                curve={curve}
              />
            </g>
          );
        })}
        <Tooltip<D>
          showVerticalCrosshair
          snapTooltipToDatumX
          snapTooltipToDatumY
          renderTooltip={({ tooltipData, colorScale }) => {
            if (!tooltipData?.nearestDatum) return null;
            const nearestKeyRaw = tooltipData.nearestDatum.key as string;
            const normalizedNearestKey = nearestKeyRaw?.endsWith('-area')
              ? nearestKeyRaw.replace(/-area$/, '')
              : nearestKeyRaw;
            const fallbackKey = normalizedNearestKey || nearestKeyRaw || 'series';
            const nearestDatum =
              (tooltipData.datumByKey?.[fallbackKey]?.datum as D) ??
              (tooltipData.nearestDatum.datum as D);
            const fallbackLabel = series.find((s) => s.id === fallbackKey)?.label ?? fallbackKey;
            const fallbackColor = colorScale?.(fallbackKey) ?? theme.colors[0];
            const fallbackEntry = {
              key: fallbackKey,
              label: fallbackLabel,
              value: (tooltipData.nearestDatum.datum as D).value,
              secondary: (tooltipData.nearestDatum.datum as D).secondary,
              color: fallbackColor,
            };
            const seriesEntries = Object.entries(tooltipData.datumByKey ?? {})
              .filter(([key]) => !key.endsWith('-area'))
              .map(([key, datum]) => {
                const datumValue = (datum?.datum as D | undefined)?.value;
                const secondary = (datum?.datum as D | undefined)?.secondary;
                return {
                  key,
                  label: series.find((s) => s.id === key)?.label ?? key,
                  value: datumValue,
                  secondary,
                  color: colorScale?.(key) ?? theme.colors[0],
                };
              })
              .filter((entry) => entry.value !== undefined);

            return (
              <div className="space-y-2 rounded-xl border border-white/10 bg-bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {nearestDatum.date}
                </div>
                <div className="space-y-2">
                  {(seriesEntries.length ? seriesEntries : [fallbackEntry]).map(
                    ({ key, label, value, secondary, color }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <span
                            aria-hidden
                            className="inline-flex h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="uppercase tracking-wide text-[11px] text-text-muted">
                            {label}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {value !== undefined ? formatValue(value) : '—'}
                        </span>
                      </div>
                      {secondary && (
                        <dl className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-[11px] text-text-muted">
                          {Object.entries(secondary).map(([secondaryLabel, metric]) => (
                            <Fragment key={`${key}-${secondaryLabel}`}>
                              <dt className="uppercase">{secondaryLabel}</dt>
                              <dd className="text-right font-medium text-text-secondary">
                                {typeof metric === 'number' ? formatValue(metric) : metric}
                              </dd>
                            </Fragment>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
      </XYChart>
      {/* Brush area semplice (placeholder): in prod usa @visx/brush per selezioni */}
      {onBrush && (
        <div className="mt-2 text-xs text-text-secondary/80">Tip: drag to brush (todo)</div>
      )}
    </div>
  );
}
