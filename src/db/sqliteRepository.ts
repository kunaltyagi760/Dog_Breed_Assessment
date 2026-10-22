import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import type { Group } from '@/domain/types';

import type { BreedRepository } from './repository';
import {
  LIST_COLUMNS,
  listRowSchema,
  parseBreedPayload,
  parseSyncMeta,
  recordToParams,
  rowToListItem,
} from './rows';
import type { WriteQueue } from './writeQueue';

const UPSERT_BREED = `
  INSERT OR REPLACE INTO breeds (
    id, name, group_id, thumb_url, size_band, coat_category, hypoallergenic,
    good_with_children, good_with_dogs, good_with_strangers, search_text, payload, synced_at
  ) VALUES (
    $id, $name, $group_id, $thumb_url, $size_band, $coat_category, $hypoallergenic,
    $good_with_children, $good_with_dogs, $good_with_strangers, $search_text, $payload, $synced_at
  )`;

const groupRowSchema = z.object({ id: z.string(), name: z.string(), label: z.string() });

const SYNC_META_KEY = 'sync';

// Pages are fetched in parallel, but writes are funnelled through `serialWrite`
// so their transactions never overlap.
export function createSqliteBreedRepository(
  db: SQLiteDatabase,
  serialWrite: WriteQueue,
): BreedRepository {
  return {
    saveGroups(groups: Group[]) {
      return serialWrite(() =>
        db.withTransactionAsync(async () => {
          await db.runAsync('DELETE FROM groups');
          for (const group of groups) {
            await db.runAsync(
              'INSERT INTO groups (id, name, label) VALUES (?, ?, ?)',
              group.id,
              group.name,
              group.label,
            );
          }
        }),
      );
    },

    saveBreeds(records, syncedAt) {
      return serialWrite(() =>
        db.withTransactionAsync(async () => {
          const statement = await db.prepareAsync(UPSERT_BREED);
          try {
            for (const record of records) {
              await statement.executeAsync(recordToParams(record, syncedAt));
            }
          } finally {
            await statement.finalizeAsync();
          }
        }),
      );
    },

    deleteBreedsSyncedBefore(syncedAt) {
      return serialWrite(async () => {
        await db.runAsync('DELETE FROM breeds WHERE synced_at < ?', syncedAt);
      });
    },

    async loadListItems() {
      const rows = await db.getAllAsync<unknown>(
        `SELECT ${LIST_COLUMNS} FROM breeds ORDER BY name COLLATE NOCASE`,
      );
      return rows.flatMap((row) => {
        const result = listRowSchema.safeParse(row);
        return result.success ? [rowToListItem(result.data)] : [];
      });
    },

    async loadBreed(id) {
      const row = await db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM breeds WHERE id = ?',
        id,
      );
      return row ? parseBreedPayload(row.payload) : null;
    },

    async loadGroups() {
      const rows = await db.getAllAsync<unknown>(
        'SELECT id, name, label FROM groups ORDER BY name',
      );
      return z.array(groupRowSchema).parse(rows);
    },

    async getSyncMeta() {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM sync_meta WHERE key = ?',
        SYNC_META_KEY,
      );
      return parseSyncMeta(row?.value);
    },

    setSyncMeta(meta) {
      return serialWrite(async () => {
        await db.runAsync(
          'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
          SYNC_META_KEY,
          JSON.stringify(meta),
        );
      });
    },
  };
}
