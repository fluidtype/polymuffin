import { daysBetween } from './dates';

export function guardDateRange(from: string, to: string) {
  if (!from || !to) return 'Seleziona un intervallo valido.';
  if (new Date(from) > new Date(to)) return 'La data iniziale è successiva alla finale.';
  return null;
}

export function suggestGranularity(from: string, to: string): 'daily' | 'monthly' {
  return daysBetween(from, to) <= 365 ? 'daily' : 'monthly';
}
