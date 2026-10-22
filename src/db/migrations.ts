import type { SQLiteDatabase } from 'expo-sqlite';

// Each entry moves the schema up one version. Never edit a shipped migration;
// add a new one instead.
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL
  );

  CREATE TABLE breeds (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    group_id TEXT,
    thumb_url TEXT,
    size_band TEXT,
    coat_category TEXT NOT NULL,
    hypoallergenic INTEGER NOT NULL,
    good_with_children INTEGER,
    good_with_dogs INTEGER,
    good_with_strangers INTEGER,
    search_text TEXT NOT NULL,
    payload TEXT NOT NULL,
    synced_at INTEGER NOT NULL
  );

  CREATE TABLE sync_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE image_cache (
    url TEXT PRIMARY KEY NOT NULL,
    file_name TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    pinned INTEGER NOT NULL,
    last_used INTEGER NOT NULL
  );
  `,
];

export type MigratableDatabase = Pick<
  SQLiteDatabase,
  'getFirstAsync' | 'execAsync' | 'withTransactionAsync'
>;

export async function migrate(db: MigratableDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const target = MIGRATIONS.length;

  if (current > target) {
    throw new Error(`Database schema v${current} is newer than this app supports (v${target})`);
  }
  if (current === target) return;

  // Schema changes and the version bump commit together or not at all.
  await db.withTransactionAsync(async () => {
    for (const sql of MIGRATIONS.slice(current)) {
      await db.execAsync(sql);
    }
    await db.execAsync(`PRAGMA user_version = ${target}`);
  });
}
