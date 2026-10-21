import { mapSettledWithLimit } from '@/lib/concurrency';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('mapSettledWithLimit', () => {
  it('never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;

    await mapSettledWithLimit([1, 2, 3, 4, 5, 6, 7], 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await tick();
      running--;
    });

    expect(peak).toBe(3);
  });

  it('keeps results in input order and captures failures', async () => {
    const results = await mapSettledWithLimit([3, 1, 2], 2, async (n) => {
      await new Promise((resolve) => setTimeout(resolve, n));
      if (n === 1) throw new Error('one');
      return n * 10;
    });

    expect(results[0]).toEqual({ status: 'fulfilled', value: 30 });
    expect(results[1]).toMatchObject({ status: 'rejected' });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 20 });
  });

  it('handles an empty list', async () => {
    await expect(mapSettledWithLimit([], 3, async () => 1)).resolves.toEqual([]);
  });
});
