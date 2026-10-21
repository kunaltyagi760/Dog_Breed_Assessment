import type { z } from 'zod';

import { getJson, InvalidResponseError, type FetchLike } from './http';
import {
  breedPageSchema,
  breedResourceSchema,
  groupListSchema,
  singleBreedSchema,
  type BreedResource,
  type GroupResource,
} from './schemas';

export type BreedsPage = {
  breeds: BreedResource[];
  /** Records on this page that failed validation and were skipped. */
  invalid: number;
  lastPage: number;
  totalRecords: number | null;
};

export type DogApi = {
  getBreedsPage(page: number, pageSize: number): Promise<BreedsPage>;
  getGroups(): Promise<GroupResource[]>;
  getBreed(id: string): Promise<BreedResource>;
};

type Options = {
  baseUrl: string;
  fetchFn?: FetchLike;
  timeoutMs?: number;
};

function parse<T>(schema: z.ZodType<T>, body: unknown, what: string): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new InvalidResponseError(
      `Unexpected ${what} response: ${result.error.issues[0]?.message}`,
    );
  }
  return result.data;
}

export function createDogApi({ baseUrl, fetchFn = fetch, timeoutMs = 15_000 }: Options): DogApi {
  const get = (path: string) => getJson(`${baseUrl}${path}`, { fetchFn, timeoutMs });

  return {
    async getBreedsPage(page, pageSize) {
      const query = new URLSearchParams({
        'page[number]': String(page),
        'page[size]': String(pageSize),
      });
      const body = parse(breedPageSchema, await get(`/breeds?${query}`), 'breeds page');

      const breeds: BreedResource[] = [];
      for (const record of body.data) {
        const result = breedResourceSchema.safeParse(record);
        if (result.success) breeds.push(result.data);
      }

      const { current, last, records } = body.meta.pagination;
      return {
        breeds,
        invalid: body.data.length - breeds.length,
        // `last` is left out on the final page.
        lastPage: last ?? current,
        totalRecords: records ?? null,
      };
    },

    async getGroups() {
      return parse(groupListSchema, await get('/groups'), 'groups').data;
    },

    async getBreed(id) {
      return parse(singleBreedSchema, await get(`/breeds/${encodeURIComponent(id)}`), 'breed').data;
    },
  };
}
