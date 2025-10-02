import { normalizeMarket, type RawPolyMarket } from '../usePolySearch';

describe('usePolySearch helpers', () => {
  it('calculates yes/no token pricing', () => {
    const normalized = normalizeMarket({
      id: '1',
      title: 'Example',
      tokens: [
        { id: 't1', outcome: 'YES', price: 0.6 },
        { id: 't2', outcome: 'NO', price: 0.4 },
      ],
    } as RawPolyMarket);

    expect(normalized.priceYes).toBe(0.6);
    expect(normalized.priceNo).toBe(0.4);
  });
});
