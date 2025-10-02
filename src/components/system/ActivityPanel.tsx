"use client";

import clsx from "clsx";

const statusMap = {
  online: { label: "Operational", emoji: "🟢", className: "text-emerald-300" },
  degraded: { label: "Degraded", emoji: "🟡", className: "text-amber-200" },
  offline: { label: "Offline", emoji: "🔴", className: "text-brand-red" },
} as const;

export type DatasetStatus = {
  id: string;
  label: string;
  lastFetch?: string | null;
  status?: keyof typeof statusMap;
  fallback?: string | null;
};

export type QueryLog = {
  id: string;
  query: string;
  dataset?: string;
  timestamp: string;
};

export type ActivityPanelProps = {
  datasets?: DatasetStatus[];
  lastQueries?: QueryLog[];
  updatedAt?: string | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
};

function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActivitySkeleton() {
  return (
    <div className="card compact p-4">
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 w-full animate-pulse rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-3 w-full animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActivityPanel({
  datasets = [],
  lastQueries = [],
  updatedAt = null,
  isLoading = false,
  error = null,
  className,
}: ActivityPanelProps) {
  if (isLoading) {
    return <ActivitySkeleton />;
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

  return (
    <div
      className={clsx(
        "card compact p-4",
        "rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]",
        "shadow-[0_35px_60px_-35px_rgba(244,63,94,0.55)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Activity Monitor</h3>
        {updatedAt && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
            Updated {formatTimestamp(updatedAt)}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Dataset Status</h4>
          <div className="space-y-2">
            {datasets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-[var(--muted)]">
                No datasets tracked yet.
              </div>
            ) : (
              datasets.map((dataset) => {
                const status = dataset.status ? statusMap[dataset.status] : statusMap.online;
                return (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx("text-lg", status.className)}>{status.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white/90">{dataset.label}</div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                          Last fetch: {formatTimestamp(dataset.lastFetch)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{status.label}</span>
                      {dataset.fallback && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                          🟡 {dataset.fallback}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/70">Recent Queries</h4>
          {lastQueries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-[var(--muted)]">
              No recent queries recorded.
            </div>
          ) : (
            <ul className="space-y-2">
              {lastQueries.map((query) => (
                <li
                  key={query.id}
                  className="rounded-2xl border border-white/10 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-2)] px-3 py-2 text-xs text-white/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white/90">{query.query}</span>
                    <span className="font-mono uppercase tracking-widest text-[var(--muted)]">
                      {formatTimestamp(query.timestamp)}
                    </span>
                  </div>
                  {query.dataset && (
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-red/80">{query.dataset}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
