import type { Market } from './types';
export async function listMarketsStub(): Promise<Market[]> {
  return [{ id:'m1', question:'[STUB] Example market' }];
}
