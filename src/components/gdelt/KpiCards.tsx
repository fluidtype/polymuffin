"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import clsx from "clsx";

import type { HTMLAttributes } from "react";

type TrendDirection = "up" | "down" | null;

type MetricValue = number | null | undefined;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string;
  trend?: TrendDirection;
};

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getTrend(value: MetricValue): TrendDirection {
  if (value == null) return null;
  if (Number.isNaN(value)) return null;
  if (value > 0) return "up";
  if (value < 0) return "down";
  return null;
}

function formatInteger(value: MetricValue) {
  if (value == null || Number.isNaN(value)) return "—";
  return integerFormatter.format(value);
}

function formatDecimal(value: MetricValue) {
  if (value == null || Number.isNaN(value)) return "—";
  return decimalFormatter.format(value);
}

function MetricCard({ label, value, trend = null, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]",
        "shadow-[0_25px_45px_-30px_rgba(255,45,45,0.55)]",
        "p-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</h3>
          {children}
        </div>
        {trend && (
          <span
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full border border-brand-red/30 bg-brand-red/10",
              trend === "up" ? "text-brand-red" : "text-brand-red/70"
            )}
          >
            {trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
    </div>
  );
}

export type KpiCardsProps = {
  totalEvents?: number | null;
  avgTone?: number | null;
  avgImpact?: number | null;
  topPair?: string | null;
  isLoading?: boolean;
  error?: string | null;
};

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="relative h-28 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]"
        >
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
        </div>
      ))}
    </div>
  );
}

export default function KpiCards({
  totalEvents = null,
  avgTone = null,
  avgImpact = null,
  topPair = null,
  isLoading = false,
  error = null,
}: KpiCardsProps) {
  if (isLoading) {
    return <KpiCardsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red shadow-[0_25px_50px_-25px_rgba(255,45,45,0.65)]">
        {error}
      </div>
    );
  }

  const metrics = [
    {
      key: "total-events",
      label: "Total Events",
      value: formatInteger(totalEvents),
      trend: getTrend(totalEvents),
    },
    {
      key: "avg-tone",
      label: "Avg Tone",
      value: formatDecimal(avgTone),
      trend: getTrend(avgTone),
    },
    {
      key: "avg-impact",
      label: "Avg Impact",
      value: formatDecimal(avgImpact),
      trend: getTrend(avgImpact),
    },
    {
      key: "top-pair",
      label: "Top Actor Pair",
      value: topPair ? topPair : "—",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <MetricCard key={metric.key} label={metric.label} value={metric.value} trend={metric.trend} />
      ))}
    </div>
  );
}
