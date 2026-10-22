import { migrate, MIGRATIONS, type MigratableDatabase } from '@/db/migrations';

function fakeDatabase(userVersion: number) {
  const executed: string[] = [];
  const db: MigratableDatabase = {
    getFirstAsync: async <T>() => ({ user_version: userVersion }) as T,
    execAsync: async (sql: string) => {
      executed.push(sql.trim());
    },
    withTransactionAsync: async (task: () => Promise<void>) => task(),
  };
  return { db, executed };
}

describe('migrate', () => {
  it('creates the schema on a fresh database', async () => {
    const { db, executed } = fakeDatabase(0);

    await migrate(db);

    expect(executed[0]).toContain('CREATE TABLE breeds');
    expect(executed.at(-1)).toBe(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });

  it('upgrades an existing database without recreating its tables', async () => {
    const { db, executed } = fakeDatabase(1);

    await migrate(db);

    expect(executed[0]).toContain('CREATE TABLE image_cache');
    expect(executed.some((sql) => sql.includes('CREATE TABLE breeds'))).toBe(false);
  });

  it('does nothing when the schema is current', async () => {
    const { db, executed } = fakeDatabase(MIGRATIONS.length);
    await migrate(db);
    expect(executed).toEqual([]);
  });

  it('refuses to run against a newer schema', async () => {
    const { db } = fakeDatabase(MIGRATIONS.length + 1);
    await expect(migrate(db)).rejects.toThrow('newer than this app supports');
  });
});
