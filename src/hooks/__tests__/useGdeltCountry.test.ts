import { fetchGdeltCountryData } from '../useGdeltCountry';
import { commonOnError } from '../queryConfig';

describe('useGdeltCountry error handling', () => {
  const realFetch = global.fetch;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = realFetch;
    consoleSpy.mockRestore();
  });

  it('logs service unavailable errors to the console', async () => {
    expect.assertions(2);

    global.fetch = jest.fn(
      () =>
        Promise.resolve({
          ok: false,
          status: 503,
          text: () => Promise.resolve('Service unavailable'),
        } as unknown as Response),
    ) as unknown as typeof fetch;

    try {
      await fetchGdeltCountryData({
        country: 'USA',
        dateStart: '2024-01-01',
        dateEnd: '2024-01-31',
      });
    } catch (error) {
      commonOnError(error);
      expect((error as Error).message).toBe('Service unavailable');
    }

    expect(consoleSpy).toHaveBeenCalledWith('Query failed:', 'Service unavailable');
  });
});
