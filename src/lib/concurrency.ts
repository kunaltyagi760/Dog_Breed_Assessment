/**
 * Like Promise.allSettled over items.map(fn), but never runs more than
 * `limit` tasks at once. Results keep the order of `items`.
 */
export async function mapSettledWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const queue = items.map((item, index) => ({ item, index }));
  const results: PromiseSettledResult<R>[] = new Array(items.length);

  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        results[job.index] = { status: 'fulfilled', value: await fn(job.item) };
      } catch (reason) {
        results[job.index] = { status: 'rejected', reason };
      }
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
