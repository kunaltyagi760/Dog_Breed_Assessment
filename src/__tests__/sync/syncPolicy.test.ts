import { EMPTY_SYNC_META } from '@/db/repository';
import { shouldSyncOnReconnect } from '@/sync/syncPolicy';

const now = 1_000_000;

describe('shouldSyncOnReconnect', () => {
  it('syncs when nothing has been synced yet', () => {
    expect(shouldSyncOnReconnect(EMPTY_SYNC_META, now)).toBe(true);
  });

  it('syncs even when the data is still fresh', () => {
    const meta = {
      ...EMPTY_SYNC_META,
      lastSyncedAt: now - 5 * 60_000,
      lastAttemptAt: now - 5 * 60_000,
    };
    expect(shouldSyncOnReconnect(meta, now)).toBe(true);
  });

  it('skips a sync that succeeded less than a minute ago', () => {
    const meta = { ...EMPTY_SYNC_META, lastSyncedAt: now - 20_000, lastAttemptAt: now - 20_000 };
    expect(shouldSyncOnReconnect(meta, now)).toBe(false);
  });

  it('always retries straight away after a failed attempt', () => {
    const meta = {
      ...EMPTY_SYNC_META,
      lastAttemptAt: now - 5_000,
      lastError: 'Network request failed',
    };
    expect(shouldSyncOnReconnect(meta, now)).toBe(true);
  });
});
