import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import type { WriteQueue } from '@/db/writeQueue';

import type { CacheEntry, CacheIndexStore } from './imageCache';

const rowSchema = z.object({
  url: z.string(),
  file_name: z.string(),
  bytes: z.number(),
  pinned: z.number(),
  last_used: z.number(),
});

// SQLite caps bound parameters per statement; stay well under the lowest limit.
const DELETE_CHUNK = 200;

export function createSqliteCacheIndex(
  getDb: () => Promise<SQLiteDatabase>,
  serialWrite: WriteQueue,
): CacheIndexStore {
  return {
    async load() {
      const rows = await (await getDb()).getAllAsync<unknown>('SELECT * FROM image_cache');
      return rows.flatMap((row): CacheEntry[] => {
        const result = rowSchema.safeParse(row);
        if (!result.success) return [];
        const { url, file_name, bytes, pinned, last_used } = result.data;
        return [{ url, fileName: file_name, bytes, pinned: pinned === 1, lastUsed: last_used }];
      });
    },

    save(entry) {
      return serialWrite(async () => {
        await (
          await getDb()
        ).runAsync(
          'INSERT OR REPLACE INTO image_cache (url, file_name, bytes, pinned, last_used) VALUES (?, ?, ?, ?, ?)',
          entry.url,
          entry.fileName,
          entry.bytes,
          entry.pinned ? 1 : 0,
          entry.lastUsed,
        );
      });
    },

    remove(urls) {
      return serialWrite(async () => {
        const db = await getDb();
        for (let i = 0; i < urls.length; i += DELETE_CHUNK) {
          const chunk = urls.slice(i, i + DELETE_CHUNK);
          const placeholders = chunk.map(() => '?').join(', ');
          await db.runAsync(`DELETE FROM image_cache WHERE url IN (${placeholders})`, chunk);
        }
      });
    },
  };
}
