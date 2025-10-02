"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Copy, ExternalLink, Share2, X } from 'lucide-react';

import type { GdeltEvent, PolyMarket } from '@/types';
import { Drawer, DrawerContent } from '@/components/ui';
import Button, { PrimaryButton } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useSidePanel } from '@/stores/useSidePanel';
import { usePolyMarketDetails } from '@/hooks/usePolyMarketDetails';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

type FeedbackState = {
  message: string;
  tone: 'success' | 'error' | 'info';
};

type MarketMeta = {
  label: string;
  value: string;
};

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return currencyFormatter.format(value);
}

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return priceFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return dateFormatter.format(date);
}

function formatSqlDate(value: GdeltEvent['SQLDATE'] | undefined) {
  if (!value) return '';
  const raw = String(value);

  if (/^\d{8}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

function getToneBadgeClasses(value: number | null) {
  if (value == null) {
    return 'border border-white/10 bg-white/5 text-white/60';
  }

  if (value >= 0) {
    return 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }

  return 'border border-brand-red/40 bg-brand-red/10 text-brand-red';
}

function getStatusBadgeClasses(status?: string) {
  if (!status) {
    return 'border border-white/10 bg-white/5 text-white/70';
  }

  if (status.toLowerCase() === 'active') {
    return 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
  }

  return 'border border-white/15 bg-white/5 text-white/70';
}

function getPriceFromTokens(tokens: PolyMarket['tokens'] = [], outcome: 'YES' | 'NO') {
  const token = tokens.find((item) => item.outcome === outcome);
  return token?.price;
}

function getMarketMeta(market: PolyMarket | null | undefined): MarketMeta[] {
  if (!market) {
    return [];
  }

  return [
    {
      label: 'Volume 24h',
      value: formatCurrency(market.volume24h),
    },
    {
      label: 'Liquidity',
      value: formatCurrency(market.liquidity),
    },
    {
      label: 'End Date',
      value: formatDate(market.endDate),
    },
  ];
}

function getToneValue(value: GdeltEvent['AvgTone']): number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function renderFeedback(feedback: FeedbackState | null) {
  if (!feedback) return null;

  const toneClass =
    feedback.tone === 'success'
      ? 'text-emerald-300'
      : feedback.tone === 'error'
      ? 'text-brand-red'
      : 'text-white/70';

  return <p className={clsx('text-xs', toneClass)}>{feedback.message}</p>;
}

export default function SidePanel() {
  const { open, mode, payload, close } = useSidePanel();
  const [shareFeedback, setShareFeedback] = useState<FeedbackState | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<FeedbackState | null>(null);

  const eventData = useMemo(() => {
    if (mode !== 'event') return null;
    if (!payload?.json || typeof payload.json !== 'object') return null;
    return payload.json as GdeltEvent;
  }, [mode, payload]);

  const marketId = mode === 'market' && payload?.id ? payload.id : '';
  const { data: marketData, isLoading: isMarketLoading, isError: isMarketError, error: marketError } =
    usePolyMarketDetails({ id: marketId || '' });

  const market = marketData?.market ?? null;
  const marketMeta = useMemo(() => getMarketMeta(market), [market]);

  const eventDate = eventData ? formatSqlDate(eventData.SQLDATE) : '';
  const toneValue = getToneValue(eventData?.AvgTone);
  const sourceUrl = typeof eventData?.SOURCEURL === 'string' ? eventData.SOURCEURL : '';

  useEffect(() => {
    if (!open) {
      setShareFeedback(null);
      setCopyFeedback(null);
    }
  }, [open]);

  const handleShare = useCallback(async () => {
    if (!sourceUrl) {
      setShareFeedback({ message: 'No source link available for this event.', tone: 'error' });
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: 'GDELT Event', url: sourceUrl });
        setShareFeedback({ message: 'Share sheet opened.', tone: 'success' });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sourceUrl);
        setShareFeedback({ message: 'Link copied to clipboard.', tone: 'success' });
        return;
      }

      setShareFeedback({ message: sourceUrl, tone: 'info' });
    } catch (error) {
      console.error('Failed to share event link', error);
      setShareFeedback({ message: 'Unable to share this event link.', tone: 'error' });
    }
  }, [sourceUrl]);

  const handleCopyMarketId = useCallback(async () => {
    if (!marketId) {
      setCopyFeedback({ message: 'Missing market identifier.', tone: 'error' });
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(marketId);
        setCopyFeedback({ message: 'Market ID copied to clipboard.', tone: 'success' });
      } else {
        setCopyFeedback({ message: marketId, tone: 'info' });
      }
    } catch (error) {
      console.error('Copy market id failed', error);
      setCopyFeedback({ message: 'Unable to copy market ID.', tone: 'error' });
    }
  }, [marketId]);

  const headerTitle = mode === 'market' ? 'Market Details' : 'Event Details';

  return (
    <Drawer open={open} onOpenChange={(next) => (!next ? close() : null)}>
      <DrawerContent>
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Side Panel</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{headerTitle}</h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close panel</span>
            </button>
          </header>

          <div className="relative flex-1 overflow-y-auto px-6 py-5">
            {mode === 'event' ? (
              eventData ? (
                <div className="space-y-5 pb-16">
                  <div className="card compact space-y-4 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge>{eventDate || 'Unknown date'}</Badge>
                      {eventData.EventCode ? (
                        <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                          Event · {eventData.EventCode}
                        </span>
                      ) : null}
                      <span
                        className={clsx(
                          'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                          getToneBadgeClasses(toneValue),
                        )}
                      >
                        Tone · {toneValue == null ? 'n/a' : toneValue.toFixed(2)}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 text-sm text-white/80">
                      <div className="flex flex-col rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                        <dt className="text-xs uppercase tracking-wide text-white/50">Source</dt>
                        <dd className="mt-1 break-words text-white/80">{sourceUrl || '—'}</dd>
                      </div>
                      {'ActionGeo_FullName' in eventData ? (
                        <div className="flex flex-col rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                          <dt className="text-xs uppercase tracking-wide text-white/50">Location</dt>
                          <dd className="mt-1 text-white/80">{String(eventData.ActionGeo_FullName)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div className="card compact space-y-4 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton type="button" onClick={handleShare} disabled={!sourceUrl} className={clsx(!sourceUrl && 'cursor-not-allowed opacity-60')}>
                        <Share2 className="h-4 w-4" aria-hidden="true" /> Share event
                      </PrimaryButton>
                      {sourceUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                        >
                          Visit source
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                    {renderFeedback(shareFeedback)}
                  </div>

                  <div className="card compact space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Event payload</h3>
                      <span className="text-xs text-white/40">Raw JSON</span>
                    </div>
                    <pre className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-white/80">
                      {JSON.stringify(eventData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="card compact p-6 text-sm text-white/70">No event selected.</div>
              )
            ) : (
              <div className="space-y-5 pb-16">
                {isMarketLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="card compact h-24 overflow-hidden"
                      >
                        <div className="h-full w-full animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {isMarketError ? (
                  <div className="rounded-3xl border border-brand-red/40 bg-brand-red/15 px-4 py-3 text-sm text-brand-red">
                    {marketError instanceof Error ? marketError.message : 'Failed to load market details.'}
                  </div>
                ) : null}

                {!isMarketLoading && !isMarketError ? (
                  market ? (
                    <>
                      <div className="card compact space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-white/50">Market</p>
                            <h3 className="mt-1 text-lg font-semibold text-white">{market.title}</h3>
                          </div>
                          <span
                            className={clsx(
                              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                              getStatusBadgeClasses(market.status),
                            )}
                          >
                            {market.status}
                          </span>
                        </div>
                        {market.category ? (
                          <div className="flex flex-wrap gap-2 text-xs text-white/60">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{market.category}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="card compact space-y-3 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Pricing</h3>
                        <div className="flex flex-wrap gap-3">
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                            YES · {formatPrice(market.priceYes ?? getPriceFromTokens(market.tokens, 'YES'))}
                          </span>
                          <span className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-red">
                            NO · {formatPrice(market.priceNo ?? getPriceFromTokens(market.tokens, 'NO'))}
                          </span>
                        </div>
                      </div>

                      <div className="card compact space-y-3 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Stats</h3>
                        <dl className="grid grid-cols-1 gap-3 text-sm text-white/80">
                          {marketMeta.map((item) => (
                            <div
                              key={item.label}
                              className="flex flex-col rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
                            >
                              <dt className="text-xs uppercase tracking-wide text-white/50">{item.label}</dt>
                              <dd className="mt-1 text-base font-semibold text-white/90">{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div className="card compact space-y-4 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Actions</h3>
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={`https://polymarket.com/market/${market.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                          >
                            Open on Polymarket
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <Button type="button" onClick={handleCopyMarketId}>
                            <Copy className="h-4 w-4" aria-hidden="true" /> Copy Market ID
                          </Button>
                        </div>
                        {renderFeedback(copyFeedback)}
                      </div>

                      <div className="card compact space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Market payload</h3>
                          <span className="text-xs text-white/40">Raw JSON</span>
                        </div>
                        <pre className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-white/80">
                          {JSON.stringify(marketData?.raw, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="card compact p-6 text-sm text-white/70">No market details available.</div>
                  )
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
