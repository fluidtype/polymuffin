'use client';

import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  Input,
  PrimaryButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useGdeltMode, type GdeltMode, type GdeltModePayload } from '@/stores/useGdeltMode';

export interface AdvancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContextFormState = {
  keywords: string;
  limit: string;
  includeInsights: boolean;
};

type CountryFormState = {
  country: string;
};

type BilateralFormState = {
  country1: string;
  country2: string;
};

type BbvaFormState = {
  actor1: string;
  actor2: string;
  includeTotal: boolean;
  cameoCodes: string;
};

const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'USA', name: 'United States' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'FRA', name: 'France' },
  { code: 'DEU', name: 'Germany' },
  { code: 'CHN', name: 'China' },
  { code: 'RUS', name: 'Russia' },
  { code: 'UKR', name: 'Ukraine' },
  { code: 'ISR', name: 'Israel' },
  { code: 'PSE', name: 'Palestine' },
  { code: 'IRN', name: 'Iran' },
  { code: 'TUR', name: 'Türkiye' },
  { code: 'IND', name: 'India' },
  { code: 'PAK', name: 'Pakistan' },
];

const DEFAULT_LIMIT = '500';

const asKeywordString = (keywords: string[]) => keywords.join(', ');
const toKeywordArray = (value: string) =>
  value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

const coerceDate = (value: string, fallback: string) => (value ? value : fallback);

const withinRange = (start: string, end: string) => {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }
    const diff = Math.abs(differenceInCalendarDays(endDate, startDate));
    return diff <= 365;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const hydrateContextState = (
  params: Partial<GdeltModePayload['context']>,
  keywords: string[],
): ContextFormState => ({
  keywords: asKeywordString(params?.keywords && params.keywords.length ? params.keywords : keywords),
  limit: params?.limit ? String(params.limit) : DEFAULT_LIMIT,
  includeInsights: params?.includeInsights ?? true,
});

const hydrateCountryState = (params: Partial<GdeltModePayload['country']>): CountryFormState => ({
  country: params?.country ?? '',
});

const hydrateBilateralState = (
  params: Partial<GdeltModePayload['bilateral']>,
): BilateralFormState => ({
  country1: params?.country1 ?? '',
  country2: params?.country2 ?? '',
});

const hydrateBbvaState = (params: Partial<GdeltModePayload['bbva']>): BbvaFormState => ({
  actor1: params?.actor1 ?? '',
  actor2: params?.actor2 ?? '',
  includeTotal: params?.includeTotal ?? false,
  cameoCodes: params?.cameoCodes ?? '',
});

const Skeleton = () => (
  <div className="space-y-4">
    <div className="h-6 w-1/3 rounded-full bg-white/5" />
    <div className="h-10 w-full rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
    <div className="h-40 w-full rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
  </div>
);

const Toast = ({ message }: { message: string }) => (
  <div className="fixed inset-x-0 top-4 z-[999] flex justify-center px-4">
    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-200 shadow-lg shadow-red-900/30">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      <span>{message}</span>
    </div>
  </div>
);

const buildContextPayload = (
  state: ContextFormState,
  dateStart: string,
  dateEnd: string,
  fallbackKeywords: string[],
): Partial<GdeltModePayload['context']> => {
  const keywords = toKeywordArray(state.keywords).length
    ? toKeywordArray(state.keywords)
    : fallbackKeywords;

  return {
    keywords,
    dateStart,
    dateEnd,
    limit: Number(state.limit) || Number(DEFAULT_LIMIT),
    includeInsights: state.includeInsights,
  };
};

const buildCountryPayload = (
  state: CountryFormState,
  dateStart: string,
  dateEnd: string,
): Partial<GdeltModePayload['country']> => ({
  country: state.country,
  dateStart,
  dateEnd,
});

const buildBilateralPayload = (
  state: BilateralFormState,
  dateStart: string,
  dateEnd: string,
): Partial<GdeltModePayload['bilateral']> => ({
  country1: state.country1,
  country2: state.country2,
  dateStart,
  dateEnd,
});

const buildBbvaPayload = (
  state: BbvaFormState,
  dateStart: string,
  dateEnd: string,
): Partial<GdeltModePayload['bbva']> => ({
  actor1: state.actor1,
  actor2: state.actor2,
  includeTotal: state.includeTotal,
  cameoCodes: state.cameoCodes,
  dateStart,
  dateEnd,
});

export default function AdvancedModal({ open, onOpenChange }: AdvancedModalProps) {
  const filters = useGlobalFilters();
  const { mode, params, setMode } = useGdeltMode();
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<GdeltMode>('context');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<string>(filters.dateStart);
  const [dateEnd, setDateEnd] = useState<string>(filters.dateEnd);
  const [contextState, setContextState] = useState<ContextFormState>(() =>
    hydrateContextState(params as Partial<GdeltModePayload['context']>, filters.keywords),
  );
  const [countryState, setCountryState] = useState<CountryFormState>(() =>
    hydrateCountryState(params as Partial<GdeltModePayload['country']>),
  );
  const [bilateralState, setBilateralState] = useState<BilateralFormState>(() =>
    hydrateBilateralState(params as Partial<GdeltModePayload['bilateral']>),
  );
  const [bbvaState, setBbvaState] = useState<BbvaFormState>(() =>
    hydrateBbvaState(params as Partial<GdeltModePayload['bbva']>),
  );

  useEffect(() => {
    if (!open) {
      setHydrated(false);
      setToastMessage(null);
      return;
    }

    const payload = params as Partial<GdeltModePayload[typeof mode]>;
    setActiveTab(mode);
    setDateStart(coerceDate((payload as { dateStart?: string })?.dateStart ?? '', filters.dateStart));
    setDateEnd(coerceDate((payload as { dateEnd?: string })?.dateEnd ?? '', filters.dateEnd));
    setContextState(hydrateContextState(params as Partial<GdeltModePayload['context']>, filters.keywords));
    setCountryState(hydrateCountryState(params as Partial<GdeltModePayload['country']>));
    setBilateralState(hydrateBilateralState(params as Partial<GdeltModePayload['bilateral']>));
    setBbvaState(hydrateBbvaState(params as Partial<GdeltModePayload['bbva']>));

    const handle = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(handle);
  }, [open, mode, params, filters]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const countries = useMemo(() => COUNTRY_OPTIONS, []);

  const showToast = (message: string) => {
    console.error(message);
    setToastMessage(message);
  };

  const closeModal = () => onOpenChange(false);

  const handleApply = () => {
    const start = dateStart || filters.dateStart;
    const end = dateEnd || filters.dateEnd;

    if (!withinRange(start, end)) {
      showToast('Daily queries limited to 365 days. Try a shorter range or switch aggregation.');
      return;
    }

    if (new Date(start) > new Date(end)) {
      showToast('Start date must be before end date.');
      return;
    }

    if (activeTab === 'context') {
      const keywords = toKeywordArray(contextState.keywords).length
        ? toKeywordArray(contextState.keywords)
        : filters.keywords;

      if (!keywords.length) {
        showToast('Please provide at least one keyword to query context.');
        return;
      }

      setMode('context', buildContextPayload(contextState, start, end, filters.keywords));
      closeModal();
      return;
    }

    if (activeTab === 'country') {
      if (!countryState.country) {
        showToast('Select a country to query.');
        return;
      }
      setMode('country', buildCountryPayload(countryState, start, end));
      closeModal();
      return;
    }

    if (activeTab === 'bilateral') {
      if (!bilateralState.country1 || !bilateralState.country2) {
        showToast('Select two countries for a bilateral query.');
        return;
      }
      if (bilateralState.country1 === bilateralState.country2) {
        showToast('Choose two different countries for bilateral analysis.');
        return;
      }
      setMode('bilateral', buildBilateralPayload(bilateralState, start, end));
      closeModal();
      return;
    }

    if (activeTab === 'bbva') {
      if (!bbvaState.actor1 || !bbvaState.actor2) {
        showToast('Provide both actor codes for the BBVA query.');
        return;
      }
      setMode('bbva', buildBbvaPayload(bbvaState, start, end));
      closeModal();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {toastMessage ? <Toast message={toastMessage} /> : null}
      <DialogContent>
        <DialogHeader
          title="Advanced GDELT Modes"
          description="Switch between context, country, bilateral, and BBVA analytics with tailored parameters."
        />
        {!hydrated ? (
          <Skeleton />
        ) : (
          <div className="relative space-y-6">
            {activeTab !== 'context' ? null : (
              <span className="absolute right-0 top-0 rounded-full bg-brand-red/20 px-3 py-1 text-xs text-brand-red">
                Context mode
              </span>
            )}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GdeltMode)}>
              <TabsList className="bg-white/5">
                <TabsTrigger value="context">Context</TabsTrigger>
                <TabsTrigger value="country">Country</TabsTrigger>
                <TabsTrigger value="bilateral">Bilateral</TabsTrigger>
                <TabsTrigger value="bbva">BBVA</TabsTrigger>
              </TabsList>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="relative col-span-1 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Temporal Range</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Start Date</span>
                      <Input
                        type="date"
                        value={dateStart}
                        max={dateEnd}
                        onChange={(event) => setDateStart(event.target.value)}
                        className="bg-black/20"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-white/60">
                      <span>End Date</span>
                      <Input
                        type="date"
                        value={dateEnd}
                        min={dateStart}
                        onChange={(event) => setDateEnd(event.target.value)}
                        className="bg-black/20"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-white/40">
                    Daily mode supports up to 365 days. Extend your horizon by switching to aggregated views.
                  </p>
                </Card>
                <TabsContent value="context" className="col-span-1 space-y-4">
                  <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <h3 className="text-sm font-semibold text-white/70">Keywords</h3>
                    <Input
                      placeholder="e.g. ceasefire, border clashes"
                      value={contextState.keywords}
                      onChange={(event) =>
                        setContextState((state) => ({ ...state, keywords: event.target.value }))
                      }
                      className="bg-black/20"
                    />
                    <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
                      <label className="space-y-1">
                        <span>Result limit</span>
                        <Input
                          type="number"
                          min={10}
                          max={1000}
                          value={contextState.limit}
                          onChange={(event) =>
                            setContextState((state) => ({ ...state, limit: event.target.value }))
                          }
                          className="bg-black/20"
                        />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2 text-xs text-white/70">
                        <Checkbox
                          checked={contextState.includeInsights}
                          onCheckedChange={(checked) =>
                            setContextState((state) => ({
                              ...state,
                              includeInsights: Boolean(checked),
                            }))
                          }
                        />
                        Include insights summary
                      </label>
                    </div>
                    <p className="text-xs text-white/50">
                      We default to your global search filters. Override them here for ad-hoc exploration.
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="country" className="col-span-1 space-y-4">
                  <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <h3 className="text-sm font-semibold text-white/70">Country focus</h3>
                    <Select
                      value={countryState.country}
                      onValueChange={(value) => setCountryState({ country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.name} ({option.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-white/50">
                      Surface daily sentiment, tone, and coverage metrics for a specific country.
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="bilateral" className="col-span-1 space-y-4">
                  <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <h3 className="text-sm font-semibold text-white/70">Country pair</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Select
                        value={bilateralState.country1}
                        onValueChange={(value) =>
                          setBilateralState((state) => ({ ...state, country1: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Primary country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((option) => (
                            <SelectItem key={`primary-${option.code}`} value={option.code}>
                              {option.name} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={bilateralState.country2}
                        onValueChange={(value) =>
                          setBilateralState((state) => ({ ...state, country2: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Counterpart" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((option) => (
                            <SelectItem key={`secondary-${option.code}`} value={option.code}>
                              {option.name} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-white/50">
                      Explore dyadic interactions, tone shifts, and daily conflict coverage between two actors.
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="bbva" className="col-span-1 space-y-4">
                  <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <h3 className="text-sm font-semibold text-white/70">BBVA conflict coverage</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Select
                        value={bbvaState.actor1}
                        onValueChange={(value) => setBbvaState((state) => ({ ...state, actor1: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Actor 1 (ISO3)" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((option) => (
                            <SelectItem key={`actor1-${option.code}`} value={option.code}>
                              {option.name} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={bbvaState.actor2}
                        onValueChange={(value) => setBbvaState((state) => ({ ...state, actor2: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Actor 2 (ISO3)" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((option) => (
                            <SelectItem key={`actor2-${option.code}`} value={option.code}>
                              {option.name} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2 text-xs text-white/70">
                        <Checkbox
                          checked={bbvaState.includeTotal}
                          onCheckedChange={(checked) =>
                            setBbvaState((state) => ({
                              ...state,
                              includeTotal: Boolean(checked),
                            }))
                          }
                        />
                        Include total coverage
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>CAMEO codes (optional)</span>
                        <Input
                          placeholder="e.g. 141, 1732"
                          value={bbvaState.cameoCodes}
                          onChange={(event) =>
                            setBbvaState((state) => ({ ...state, cameoCodes: event.target.value }))
                          }
                          className="bg-black/20"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-white/50">
                      Narrow to specific conflict interactions with optional CAMEO filters and totals.
                    </p>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
            <footer className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button className="bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/15">Cancel</Button>
              </DialogClose>
              <PrimaryButton type="button" className="px-5 py-2 text-sm" onClick={handleApply}>
                Apply mode
              </PrimaryButton>
            </footer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
