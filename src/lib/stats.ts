import { yyyymmddToIso } from './dates';
import type { GdeltDaily } from './types';

export const toSeries = (rows: GdeltDaily[] = [], key: keyof GdeltDaily) =>
  rows.map((row) => ({ date: yyyymmddToIso(row.DayDate), value: Number(row[key] ?? 0) }));

export function movingAverage(series: { date: string; value: number }[], win = 28) {
  const out: { date: string; value: number }[] = [];
  let acc = 0;

  for (let i = 0; i < series.length; i += 1) {
    acc += series[i].value;
    if (i >= win) acc -= series[i - win].value;
    const denom = i < win ? i + 1 : win;
    out.push({ date: series[i].date, value: acc / denom });
  }

  return out;
}

export function kpiVolume(rows: GdeltDaily[] = []) {
  return rows.reduce(
    (acc, row) => acc + (row.interaction_count ?? row.conflict_events ?? 0),
    0,
  );
}

export function kpiSentimentAvg(rows: GdeltDaily[] = []) {
  if (!rows.length) return 0;
  const sum = rows.reduce((acc, row) => acc + Number(row.avg_sentiment ?? 0), 0);
  return sum / rows.length;
}

export function kpiDeltaVsPrev(curr: GdeltDaily[] = [], prev: GdeltDaily[] = []) {
  const current = kpiVolume(curr);
  const previous = kpiVolume(prev) || 1;
  return (current - previous) / previous;
}

export function seriesCoverage(rows: GdeltDaily[] = []) {
  return toSeries(rows, 'relative_coverage');
}
