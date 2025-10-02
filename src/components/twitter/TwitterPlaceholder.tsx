"use client";

import { useEffect, useMemo, useState } from "react";

import clsx from "clsx";

type TwitterEntry = {
  id: string;
  text: string;
  author?: string;
  created_at?: string;
  permalink?: string;
};

type FetchState = {
  items: TwitterEntry[];
  isLoading: boolean;
  error: string | null;
};

export type TwitterPlaceholderProps = {
  comingSoon: boolean;
  className?: string;
};

function SkeletonTweet() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/10" />
      <div className="flex grow flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTimestamp(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export default function TwitterPlaceholder({ comingSoon, className }: TwitterPlaceholderProps) {
  const [state, setState] = useState<FetchState>({
    items: [],
    isLoading: !comingSoon,
    error: null,
  });

  useEffect(() => {
    if (comingSoon) return;

    const controller = new AbortController();

    async function load() {
      try {
        setState((current) => ({ ...current, isLoading: true, error: null }));
        const response = await fetch("/api/twitter", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(response.statusText || "Unable to fetch timeline");
        }
        const payload = (await response.json()) as { data?: TwitterEntry[] } | TwitterEntry[];
        const items = Array.isArray(payload) ? payload : payload?.data ?? [];
        setState({ items, isLoading: false, error: null });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState({ items: [], isLoading: false, error: (error as Error).message || "Failed to load" });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [comingSoon]);

  const content = useMemo(() => {
    if (comingSoon) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm font-medium text-brand-red shadow-[0_25px_40px_-25px_rgba(244,63,94,0.65)]">
            Twitter Integration Coming Soon
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonTweet key={index} />
            ))}
          </div>
        </div>
      );
    }

    if (state.isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonTweet key={index} />
          ))}
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {state.error}
        </div>
      );
    }

    if (!state.items.length) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[var(--muted)]">
          No tweets available yet. Check back soon.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {state.items.map((item) => (
          <article
            key={item.id}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-3 shadow-[0_20px_35px_-25px_rgba(244,63,94,0.4)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red/20 text-sm font-semibold text-brand-red">
              {item.author ? item.author.slice(0, 2).toUpperCase() : "TW"}
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.author ?? "Unknown"}</div>
              <p className="text-sm text-white/90">{item.text}</p>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                {formatTimestamp(item.created_at)}
              </div>
              {item.permalink && (
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red transition hover:text-brand-red/80"
                >
                  View Thread
                  <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  }, [comingSoon, state.error, state.isLoading, state.items]);

  return (
    <div
      className={clsx(
        "card p-4",
        "rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]",
        "shadow-[0_35px_65px_-40px_rgba(244,63,94,0.65)]",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Twitter Signals</h2>
        <span className="text-[10px] font-medium uppercase tracking-widest text-brand-red/80">Beta</span>
      </div>
      {content}
    </div>
  );
}
