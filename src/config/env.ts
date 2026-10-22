import { z } from 'zod';

const envSchema = z.object({
  apiBaseUrl: z.url().default('https://dogapi.dog/api/v2'),
  pageSize: z.coerce.number().int().min(1).max(1000).default(48),
  staleAfterHours: z.coerce.number().positive().default(6),
  imageCacheMb: z.coerce.number().positive().default(100),
  listBenchmark: z.stringbool().default(false),
});

export type Env = z.infer<typeof envSchema>;

type RawEnv = Record<keyof Env, string | undefined>;

// Empty strings come through when a key is present in .env but left blank.
const blankToUndefined = (value: string | undefined) => (value?.trim() ? value : undefined);

export function parseEnv(raw: RawEnv): Env {
  return envSchema.parse({
    apiBaseUrl: blankToUndefined(raw.apiBaseUrl),
    pageSize: blankToUndefined(raw.pageSize),
    staleAfterHours: blankToUndefined(raw.staleAfterHours),
    imageCacheMb: blankToUndefined(raw.imageCacheMb),
    listBenchmark: blankToUndefined(raw.listBenchmark),
  });
}

// Expo only inlines EXPO_PUBLIC_* when accessed by their full literal name.
export const env = parseEnv({
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  pageSize: process.env.EXPO_PUBLIC_PAGE_SIZE,
  staleAfterHours: process.env.EXPO_PUBLIC_STALE_AFTER_HOURS,
  imageCacheMb: process.env.EXPO_PUBLIC_IMAGE_CACHE_MB,
  listBenchmark: process.env.EXPO_PUBLIC_LIST_BENCHMARK,
});
