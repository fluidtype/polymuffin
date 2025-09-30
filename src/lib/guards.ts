export function guardDateRange(from:string, to:string) {
  if (!from || !to) return 'Invalid date range';
  if (new Date(from) > new Date(to)) return 'Start date must be <= end date';
  return null;
}
