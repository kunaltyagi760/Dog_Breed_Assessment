import type { SyncMeta } from '@/db/repository';

const RECONNECT_GAP_MS = 60 * 1000;

/**
 * Coming back online always syncs, unless a sync succeeded less than a minute
 * ago: a flaky connection that drops and returns every few seconds shouldn't
 * re-download every breed each time.
 */
export function shouldSyncOnReconnect(meta: SyncMeta, now: number): boolean {
  const recentSuccess =
    meta.lastError === null &&
    meta.lastAttemptAt !== null &&
    now - meta.lastAttemptAt < RECONNECT_GAP_MS;
  return !recentSuccess;
}
