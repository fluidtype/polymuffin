"use client";

import clsx from "clsx";
import { ExternalLink } from "lucide-react";

import type { PolyMarket, PolyToken } from "@/types";
import { PrimaryButton } from "../ui/Button";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

type MarketMeta = {
  label: string;
  value: string;
};

function getPriceFromTokens(tokens: PolyToken[], outcome: "YES" | "NO") {
  const token = tokens.find((item) => item.outcome === outcome);
  return token?.price;
}

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return priceFormatter.format(value);
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return currencyFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}

function getStatusBadgeClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

function getMarketMeta(market: PolyMarket): MarketMeta[] {
  return [
    {
      label: "Volume 24h",
      value: formatCurrency(market.volume24h),
    },
    {
      label: "Liquidity",
      value: formatCurrency(market.liquidity),
    },
    {
      label: "End Date",
      value: formatDate(market.endDate),
    },
  ];
}

function MarketCard({ market, onOpen }: { market: PolyMarket; onOpen?: (id: string) => void }) {
  const yesPrice = market.priceYes ?? getPriceFromTokens(market.tokens, "YES");
  const noPrice = market.priceNo ?? getPriceFromTokens(market.tokens, "NO");

  const meta = getMarketMeta(market);

  return (
    <article
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/8",
        "bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]",
        "shadow-[0_32px_50px_-28px_rgba(255,45,45,0.4)] transition-shadow hover:shadow-[0_30px_55px_-20px_rgba(255,65,65,0.65)]"
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-lg font-semibold leading-snug text-white"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {market.title}
          </h3>
          <span
            className={clsx(
              "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
              getStatusBadgeClasses(market.status)
            )}
          >
            {market.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            YES · {formatPrice(yesPrice)}
          </span>
          <span className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-red">
            NO · {formatPrice(noPrice)}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-white/80 sm:grid-cols-3">
          {meta.map((item) => (
            <div
              key={item.label}
              className="flex flex-col rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-xs uppercase tracking-wide text-white/60"
            >
              <dt>{item.label}</dt>
              <dd className="mt-1 text-base font-semibold text-white/90">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <PrimaryButton
            type="button"
            onClick={() => onOpen?.(market.id)}
            disabled={!onOpen}
            className={clsx(!onOpen && "cursor-not-allowed opacity-60")}
          >
            Open
          </PrimaryButton>
          <a
            href={`https://polymarket.com/market/${market.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            View on Polymarket
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export type PolyMarketGridProps = {
  markets?: PolyMarket[];
  onOpen?: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
};

export function PolyMarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative h-64 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]"
        >
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
        </div>
      ))}
    </div>
  );
}

export default function PolyMarketGrid({ markets = [], onOpen, isLoading = false, error = null }: PolyMarketGridProps) {
  if (isLoading) {
    return <PolyMarketGridSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red shadow-[0_25px_50px_-25px_rgba(255,45,45,0.65)]">
        {error}
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/70">
        No markets found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} onOpen={onOpen} />
      ))}
    </div>
  );
}
