import { differenceInCalendarDays, parseISO } from 'date-fns';

export function guardDateRange(from: string, to: string) {
  if (!from || !to) return 'Seleziona un intervallo valido.';
  if (new Date(from) > new Date(to)) return 'La data iniziale è successiva alla finale.';
  return null;
}

export function suggestGranularity(from: string, to: string): 'daily' | 'monthly' {
  const d = differenceInCalendarDays(parseISO(to), parseISO(from));
  return d <= 365 ? 'daily' : 'monthly';
}

export function daysDiff(from: string, to: string) {
  return differenceInCalendarDays(parseISO(to), parseISO(from));
}
