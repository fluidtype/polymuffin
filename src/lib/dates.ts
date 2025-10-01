import { format, parseISO, differenceInCalendarDays, subDays } from 'date-fns';

export const isoToYyyymmdd = (iso: string) => iso.replaceAll('-', '');
export const yyyymmddToIso = (yyyymmdd: number | string) => {
  const s = String(yyyymmdd);
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
};
export const daysBetween = (aIso: string, bIso: string) =>
  differenceInCalendarDays(parseISO(bIso), parseISO(aIso));

export const lastNDaysISO = (n: number, ref = new Date()) => {
  const to = format(ref, 'yyyy-MM-dd');
  const from = format(subDays(ref, n), 'yyyy-MM-dd');
  return { from, to };
};
