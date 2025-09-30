export type Source = 'gdelt' | 'twitter' | 'polymarket';
export type Granularity = 'auto' | 'daily' | 'monthly';
export type SearchParamsModel = { q:string; from:string; to:string; gran:Granularity; sources:Source[]; };
export function defaultSearchParams(now = new Date()): SearchParamsModel {
  const to = now.toISOString().slice(0,10);
  const d = new Date(now); d.setDate(d.getDate() - 30);
  const from = d.toISOString().slice(0,10);
  return { q:'', from, to, gran:'auto', sources:['gdelt','twitter','polymarket'] };
}
