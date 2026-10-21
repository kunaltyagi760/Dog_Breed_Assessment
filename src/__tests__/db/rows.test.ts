import { EMPTY_SYNC_META } from '@/db/repository';
import { listRowSchema, parseSyncMeta, recordToParams, rowToListItem } from '@/db/rows';
import { toBreed, toListItem } from '@/domain/normalize';

import { breedResource } from '../helpers/fixtures';

describe('breed rows', () => {
  it('round-trips a list item through its SQLite row', () => {
    const resource = breedResource('rt');
    const item = toListItem(toBreed(resource));
    const params = recordToParams({ resource, item }, 42);

    // What SQLite would hand back: the same columns without the "$" prefix.
    const row = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key.slice(1), value]),
    );

    expect(rowToListItem(listRowSchema.parse(row))).toEqual(item);
    expect(params.$synced_at).toBe(42);
    expect(JSON.parse(params.$payload)).toMatchObject({ id: 'rt' });
  });

  it('rejects rows with values the app does not know about', () => {
    expect(listRowSchema.safeParse({ id: 'x', coat_category: 'fluffy' }).success).toBe(false);
  });
});

describe('parseSyncMeta', () => {
  it('parses a stored value', () => {
    const meta = { lastSyncedAt: 1, lastAttemptAt: 2, failedPages: [3], lastError: 'x' };
    expect(parseSyncMeta(JSON.stringify(meta))).toEqual(meta);
  });

  it('falls back to empty meta for missing or corrupt values', () => {
    expect(parseSyncMeta(null)).toEqual(EMPTY_SYNC_META);
    expect(parseSyncMeta('{not json')).toEqual(EMPTY_SYNC_META);
    expect(parseSyncMeta('{"lastSyncedAt":"yesterday"}')).toEqual(EMPTY_SYNC_META);
  });
});
