import { withRetry } from '@/lib/retry';

const noWait = async () => {};

describe('withRetry', () => {
  it('returns the first successful result', async () => {
    const task = jest.fn().mockResolvedValue('ok');
    await expect(withRetry(task, { sleep: noWait })).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries until the task succeeds', async () => {
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValue('ok');

    await expect(withRetry(task, { retries: 3, sleep: noWait })).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('gives up after the configured retries', async () => {
    const task = jest.fn().mockRejectedValue(new Error('down'));

    await expect(withRetry(task, { retries: 2, sleep: noWait })).rejects.toThrow('down');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('stops immediately for errors that should not be retried', async () => {
    const task = jest.fn().mockRejectedValue(new Error('404'));

    await expect(withRetry(task, { shouldRetry: () => false, sleep: noWait })).rejects.toThrow();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('waits a backoff delay between attempts', async () => {
    const sleep = jest.fn(noWait);
    const task = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');

    await withRetry(task, { sleep, delay: (attempt) => (attempt + 1) * 100 });

    expect(sleep).toHaveBeenCalledWith(100);
  });
});
