import { normalizeGdeltDate } from '../gdeltUtils';
import { fetchGdeltContextData } from '../useGdeltContext';

describe('useGdeltContext helpers', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('normalizes GDELT day dates into ISO strings', () => {
    expect(normalizeGdeltDate('20250831')).toBe('2025-08-31');
  });

  it('propagates API guard rails', async () => {
    expect.assertions(1);

    global.fetch = jest.fn(
      () =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              status: 'error',
              message: 'Daily queries limited to 365 days',
            }),
        } as unknown as Response),
    ) as unknown as typeof fetch;

    await expect(
      fetchGdeltContextData({
        keywords: ['gdelt'],
        dateStart: '2020-01-01',
        dateEnd: '2025-01-01',
      }),
    ).rejects.toThrow('Daily queries limited to 365 days');
  });
});
