export type WriteQueue = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * Runs tasks one at a time, in order. Transactions on one SQLite connection
 * must not overlap, and several parts of the app write to the same database,
 * so they all share one queue.
 */
export function createWriteQueue(): WriteQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>) => {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}
