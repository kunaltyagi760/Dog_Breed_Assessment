import {
  getJson,
  HttpError,
  InvalidResponseError,
  isRetryable,
  NetworkError,
  type FetchLike,
} from '@/api/http';

describe('isRetryable', () => {
  it.each([
    [new NetworkError('offline'), true],
    [new HttpError(503, '/x'), true],
    [new HttpError(429, '/x'), true],
    [new HttpError(404, '/x'), false],
    [new InvalidResponseError('bad'), false],
    [new Error('other'), false],
  ])('%s -> %s', (error, expected) => {
    expect(isRetryable(error)).toBe(expected);
  });
});

describe('getJson', () => {
  it('wraps connection failures in NetworkError', async () => {
    const fetchFn: FetchLike = async () => {
      throw new TypeError('Network request failed');
    };
    await expect(getJson('/x', { fetchFn, timeoutMs: 1_000 })).rejects.toBeInstanceOf(NetworkError);
  });

  it('aborts and reports a timeout', async () => {
    const fetchFn: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });

    await expect(getJson('/x', { fetchFn, timeoutMs: 10 })).rejects.toThrow('Request timed out');
  });

  it('rejects a body that is not JSON', async () => {
    const fetchFn: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });
    await expect(getJson('/x', { fetchFn, timeoutMs: 1_000 })).rejects.toBeInstanceOf(
      InvalidResponseError,
    );
  });
});
