import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrations';
import type { BreedRepository } from './repository';
import { createSqliteBreedRepository } from './sqliteRepository';

const DATABASE_NAME = 'dog-breeds.db';

// Promises, not values, are cached so concurrent callers share one connection
// and one repository (and with it, one write queue).
let databasePromise: Promise<SQLiteDatabase> | null = null;
let repositoryPromise: Promise<BreedRepository> | null = null;

async function open() {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await migrate(db);
  return db;
}

export function getDatabase(): Promise<SQLiteDatabase> {
  databasePromise ??= open().catch((error: unknown) => {
    // Let the next caller try again instead of caching the failure forever.
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

export function getBreedRepository(): Promise<BreedRepository> {
  repositoryPromise ??= getDatabase()
    .then(createSqliteBreedRepository)
    .catch((error: unknown) => {
      repositoryPromise = null;
      throw error;
    });
  return repositoryPromise;
}
