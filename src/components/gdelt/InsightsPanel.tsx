"use client";

import { useMemo } from "react";

import clsx from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GdeltInsights } from "@/types";

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const tooltipFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function normalizeTemporalDistribution(insights?: GdeltInsights | null) {
  if (!insights) return [] as { date: string; count: number }[];
  const raw = (insights.temporal_distribution ?? (insights["temporalDistribution"] as unknown)) as
    | { date?: string; count?: number; total?: number; value?: number }[]
    | undefined;
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const dateValue = item.date ?? ("DayDate" in item ? (item as { DayDate?: string }).DayDate : undefined);
      const asNumber = typeof dateValue === "number" ? dateValue : Number(dateValue);
      const parsedDate =
        typeof dateValue === "string" && /^\d{8}$/.test(dateValue)
          ? new Date(`${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`)
          : !Number.isNaN(asNumber) && `${asNumber}`.length === 8
          ? new Date(`${`${asNumber}`.slice(0, 4)}-${`${asNumber}`.slice(4, 6)}-${`${asNumber}`.slice(6, 8)}`)
          : dateValue
          ? new Date(dateValue)
          : null;
      return {
        date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split("T")[0] : dateValue ?? "",
        count: item.count ?? item.total ?? item.value ?? 0,
      };
    })
    .filter((entry) => Boolean(entry.date));
}

function normalizeKeywords(insights?: GdeltInsights | null) {
  if (!insights?.keyword_matches) return [] as { keyword: string; count: number }[];
  return Object.entries(insights.keyword_matches)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function normalizeActors(insights?: GdeltInsights | null) {
  const actors = (insights?.top_actors ?? []) as ({ name: string; mentions?: number } | string)[];
  return actors.map((actor) =>
    typeof actor === "string"
      ? { name: actor, mentions: undefined }
      : { name: actor.name, mentions: actor.mentions }
  );
}

function normalizeSpikes(insights?: GdeltInsights | null) {
  const spikes = insights?.spikes ?? [];
  if (!Array.isArray(spikes)) return [] as { label: string; severity: "low" | "medium" | "high" }[];
  return spikes.map((spike) => {
    const label = typeof spike === "string" ? spike : spike.label ?? "";
    const severity = typeof spike === "string" ? "high" : spike.severity ?? "high";
    return { label, severity };
  });
}

export type InsightsPanelProps = {
  insights?: GdeltInsights | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
};

export function InsightsPanelSkeleton() {
  return (
    <div className="card compact p-4">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-3 w-full animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export default function InsightsPanel({ insights = null, isLoading = false, error = null, className }: InsightsPanelProps) {
  const keywords = useMemo(() => normalizeKeywords(insights), [insights]);
  const temporalDistribution = useMemo(() => normalizeTemporalDistribution(insights), [insights]);
  const actors = useMemo(() => normalizeActors(insights), [insights]);
  const spikes = useMemo(() => normalizeSpikes(insights), [insights]);

  if (isLoading) {
    return <InsightsPanelSkeleton />;
  }

  if (error) {
    return (
      <div className="card compact p-4">
        <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      </div>
    );
  }

  const hasContent = keywords.length || temporalDistribution.length || actors.length || spikes.length;

  if (!hasContent) {
    return (
      <div className="card compact p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[var(--muted)]">
          No contextual insights available yet.
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("card compact p-4", className)}>
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Context Insights</h3>
          {insights?.last_updated && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Updated {insights.last_updated}
            </span>
          )}
        </header>

        {keywords.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Top Keywords</h4>
            <ul className="mt-2 space-y-2 text-sm text-white/90">
              {keywords.map((entry) => (
                <li key={entry.keyword} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                  <span>{entry.keyword}</span>
                  <span className="text-xs font-semibold text-brand-red">{countFormatter.format(entry.count)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {temporalDistribution.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Temporal Distribution</h4>
            </div>
            <div className="h-32 rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporalDistribution}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => tooltipFormatter.format(new Date(value))}
                    stroke="rgba(255,255,255,0.35)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
                  <YAxis
                    tickFormatter={(value) => countFormatter.format(value)}
                    stroke="rgba(255,255,255,0.35)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(244,63,94,0.08)" }}
                    contentStyle={{
                      backgroundColor: "rgba(17,17,17,0.9)",
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                    formatter={(value: number) => countFormatter.format(value)}
                    labelFormatter={(label: string) => tooltipFormatter.format(new Date(label))}
                  />
                  <defs>
                    <linearGradient id="insights-bar" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(244,63,94,0.9)" />
                      <stop offset="100%" stopColor="rgba(244,63,94,0.2)" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" fill="url(#insights-bar)" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {actors.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Top Actors</h4>
            <div className="flex flex-wrap gap-2">
              {actors.map((actor) => (
                <span
                  key={actor.name}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {actor.name}
                  {typeof actor.mentions === "number" && (
                    <span className="text-[10px] font-semibold text-brand-red/80">
                      {countFormatter.format(actor.mentions)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

        {spikes.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Spikes</h4>
            <div className="flex flex-wrap gap-2">
              {spikes.map((spike, index) => (
                <span
                  key={`${spike.label}-${index}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    spike.severity === "high"
                      ? "border-brand-red/60 bg-brand-red/10 text-brand-red"
                      : spike.severity === "medium"
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  }`}
                >
                  {spike.severity === "high" ? "🔺" : spike.severity === "medium" ? "⚠️" : "🟢"}
                  {spike.label}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
