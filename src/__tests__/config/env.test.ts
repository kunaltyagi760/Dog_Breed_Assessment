import { parseEnv } from '@/config/env';

const empty = {
  apiBaseUrl: undefined,
  pageSize: undefined,
  staleAfterHours: undefined,
  imageCacheMb: undefined,
};

describe('parseEnv', () => {
  it('falls back to defaults when nothing is set', () => {
    expect(parseEnv(empty)).toEqual({
      apiBaseUrl: 'https://dogapi.dog/api/v2',
      pageSize: 48,
      staleAfterHours: 6,
      imageCacheMb: 100,
    });
  });

  it('treats blank values as unset', () => {
    expect(parseEnv({ ...empty, pageSize: '  ' }).pageSize).toBe(48);
  });

  it('coerces numeric strings', () => {
    const result = parseEnv({ ...empty, pageSize: '30', staleAfterHours: '0.5' });
    expect(result.pageSize).toBe(30);
    expect(result.staleAfterHours).toBe(0.5);
  });

  it('rejects values the API would not accept', () => {
    expect(() => parseEnv({ ...empty, pageSize: '5000' })).toThrow();
    expect(() => parseEnv({ ...empty, apiBaseUrl: 'not a url' })).toThrow();
  });
});
