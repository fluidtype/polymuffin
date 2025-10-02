"use client";

import { useMemo, useRef } from "react";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { GdeltEvent } from "@/types";

type GdeltEventsListProps = {
  events: GdeltEvent[];
  activeDate?: string;
  onOpen?: (event: GdeltEvent) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
};

type NormalizedEvent = {
  event: GdeltEvent;
  isoDate: string;
  hostname: string;
  pathname: string;
  toneValue: number | null;
  countries: string[];
};

function normalizeSqlDate(value: GdeltEvent["SQLDATE"]): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  if (/^\d{8}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
}

function extractUrlParts(url: string | undefined) {
  if (!url) {
    return { hostname: "Unknown source", pathname: "" };
  }

  try {
    const { hostname, pathname } = new URL(url);
    return {
      hostname: hostname || "Unknown source",
      pathname: pathname && pathname !== "/" ? pathname : "",
    };
  } catch {
    return {
      hostname: "Unknown source",
      pathname: "",
    };
  }
}

function collectCountryCodes(event: GdeltEvent): string[] {
  const codes = new Set<string>();
  const possibleKeys = [
    "Actor1CountryCode",
    "Actor2CountryCode",
    "ActionGeo_CountryCode",
    "ActionGeo_CountryName",
    "Actor1Name",
    "Actor2Name",
  ];

  for (const key of possibleKeys) {
    const value = event[key];
    if (typeof value === "string" && value.trim()) {
      codes.add(value.trim());
    }
  }

  return Array.from(codes).slice(0, 3);
}

function truncatePath(pathname: string) {
  if (!pathname) return "";
  return pathname.length > 48 ? `${pathname.slice(0, 45)}…` : pathname;
}

function getEventCodeClass(eventCode: string | undefined, toneValue: number | null) {
  if (!eventCode) {
    return "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30";
  }

  const negativeTone = typeof toneValue === "number" && toneValue < 0;
  const highRiskCode = /^(0|1|2|14|19|20)/.test(eventCode);

  if (negativeTone || highRiskCode) {
    return "border border-rose-400/30 bg-rose-500/15 text-rose-200";
  }

  return "border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]";
}

function getToneBadgeClass(toneValue: number | null) {
  if (toneValue == null || Number.isNaN(toneValue)) {
    return "border border-white/10 bg-white/5 text-white/70";
  }

  if (toneValue >= 0) {
    return "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }

  return "border border-rose-400/30 bg-rose-500/15 text-rose-200";
}

export function GdeltEventsList({
  events,
  activeDate,
  onOpen,
  isLoading = false,
  error = null,
  emptyMessage = "No events captured for this period.",
}: GdeltEventsListProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const normalizedEvents = useMemo<NormalizedEvent[]>(() => {
    return (events ?? []).map((event) => {
      const isoDate = normalizeSqlDate(event.SQLDATE);
      const { hostname, pathname } = extractUrlParts(event.SOURCEURL);
      const tone = event.AvgTone;
      const toneValue =
        typeof tone === "number"
          ? tone
          : tone == null
          ? null
          : Number.isNaN(Number(tone))
          ? null
          : Number(tone);

      return {
        event,
        isoDate,
        hostname,
        pathname,
        toneValue,
        countries: collectCountryCodes(event),
      };
    });
  }, [events]);

  const rowVirtualizer = useVirtualizer({
    count: normalizedEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 12,
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] flex-col gap-3 rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-2xl bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-3xl border border-rose-400/40 bg-rose-500/15 p-6 text-sm text-rose-100 shadow-[0_24px_60px_-30px_rgba(244,63,94,0.75)]">
        <span>{error}</span>
      </div>
    );
  }

  if (!normalizedEvents.length) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 text-sm text-white/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="relative flex h-[400px] flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-4 shadow-[0_40px_120px_-45px_rgba(244,63,94,0.45)]">
      <div className="flex items-baseline justify-between pb-2">
        <div>
          <h3 className="text-base font-semibold text-white">Event stream</h3>
          <p className="text-xs text-white/60">Top 500 matching articles</p>
        </div>
        {activeDate ? (
          <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-medium text-[var(--primary)]">
            Focus: {activeDate}
          </span>
        ) : null}
      </div>

      <div
        ref={parentRef}
        className="relative mt-2 flex-1 overflow-auto rounded-2xl border border-white/5 bg-black/10"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
            width: "100%",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = normalizedEvents[virtualRow.index];
            const isActive = Boolean(
              item.isoDate && activeDate && item.isoDate === activeDate
            );
            const eventCode =
              (typeof item.event.EventCode === "string"
                ? item.event.EventCode
                : String(item.event.EventCode ?? "").trim()) || undefined;

            const eventCodeClass = getEventCodeClass(eventCode, item.toneValue);
            const toneClass = getToneBadgeClass(item.toneValue);
            const truncatedPath = truncatePath(item.pathname);

            return (
              <div
                key={virtualRow.key}
                ref={virtualRow.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={clsx(
                  "group relative flex cursor-pointer items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 pr-5 transition-all duration-200 hover:border-[var(--primary)]/60 hover:bg-white/10 hover:shadow-[0_18px_45px_-28px_rgba(244,63,94,0.65)]",
                  isActive &&
                    "border-[var(--primary)]/70 bg-[var(--primary)]/10 shadow-[0_24px_60px_-35px_rgba(244,63,94,0.75)]"
                )}
                onClick={() => onOpen?.(item.event)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex min-w-0 flex-col gap-1 text-sm text-white">
                    <span className="font-semibold text-white/90">
                      {item.hostname}
                    </span>
                    {truncatedPath ? (
                      <span className="truncate text-xs text-white/60">
                        {truncatedPath}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                    {item.isoDate ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                        {item.isoDate}
                      </span>
                    ) : null}
                    {eventCode ? (
                      <span className={clsx("rounded-full px-2 py-1 text-[10px]", eventCodeClass)}>
                        Event {eventCode}
                      </span>
                    ) : null}
                    {item.toneValue != null ? (
                      <span className={clsx("rounded-full px-2 py-1 text-[10px]", toneClass)}>
                        Tone {item.toneValue.toFixed(2)}
                      </span>
                    ) : null}
                    {item.countries.map((code) => (
                      <span
                        key={code}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70"
                      >
                        {code.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={item.event.SOURCEURL || "#"}
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition group-hover:border-[var(--primary)]/60 group-hover:text-[var(--primary)]"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  aria-label="Open source article"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

