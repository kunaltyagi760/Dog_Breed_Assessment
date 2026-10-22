import { env } from '@/config/env';
import { getDatabase, writeQueue } from '@/db/database';

import { expoCacheFiles } from './expoCacheFiles';
import { createImageCache } from './imageCache';
import { createSqliteCacheIndex } from './sqliteCacheIndex';

export const imageCache = createImageCache({
  index: createSqliteCacheIndex(getDatabase, writeQueue),
  files: expoCacheFiles,
  budgetBytes: env.imageCacheMb * 1024 * 1024,
});
