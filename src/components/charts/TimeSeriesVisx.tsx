'use client';
import { XYChart, AnimatedAxis, AnimatedGrid, AnimatedLineSeries, Tooltip, buildChartTheme } from '@visx/xychart';

const theme = buildChartTheme({
  backgroundColor: 'transparent',
  colors: ['#ff2d2d', '#ff5a5a'],
  gridColor: 'rgba(255,255,255,0.06)',
  gridColorDark: 'rgba(255,255,255,0.06)',
  svgLabelSmall: { fill: 'rgba(255,255,255,0.7)' },
  svgLabelBig: { fill: 'rgba(255,255,255,0.9)' },
  tickLength: 6,
});

type D = { date: string; value: number };

export default function TimeSeriesVisx({
  series, height = 260, onBrush,
}:{ series: { id:string; data:D[] }[]; height?:number; onBrush?:(a:string,b:string)=>void }) {

  return (
    <div className="h-[300px]">
      <XYChart
        height={height}
        xScale={{ type: 'band' }}
        yScale={{ type: 'linear' }}
        theme={theme}
      >
        <AnimatedAxis orientation="bottom" hideTicks />
        <AnimatedAxis orientation="left" numTicks={5} />
        <AnimatedGrid columns={false} />
        {series.map(s => (
          <AnimatedLineSeries
            key={s.id}
            dataKey={s.id}
            data={s.data}
            xAccessor={(d:D) => d.date}
            yAccessor={(d:D) => d.value}
          />
        ))}
        <Tooltip<D>
          showVerticalCrosshair
          renderTooltip={({ tooltipData }) => {
            const p = tooltipData?.nearestDatum;
            const d = p?.datum as D;
            if (!d) return null;
            return (
              <div className="rounded-lg border border-white/10 bg-bg-surface/95 px-3 py-2">
                <div className="text-xs text-text-secondary">{d.date}</div>
                <div className="font-medium">{d.value.toFixed(2)}</div>
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
