import { createDogApi } from '@/api/dogApi';
import { HttpError, InvalidResponseError, type FetchLike } from '@/api/http';

import { createFakeServer } from '../helpers/fakeServer';
import { rawBreed } from '../helpers/fixtures';

const respond =
  (body: unknown, status = 200): FetchLike =>
  async () => ({ ok: status < 400, status, json: async () => body });

describe('createDogApi', () => {
  it('requests the page number and size the API expects', async () => {
    const server = createFakeServer([rawBreed('a')]);
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn });

    await api.getBreedsPage(1, 48);

    expect(decodeURIComponent(server.requests[0] ?? '')).toBe(
      'https://api.test/breeds?page[number]=1&page[size]=48',
    );
  });

  it('reads the page count from page 1 and falls back on the last page', async () => {
    const breeds = Array.from({ length: 5 }, (_, i) => rawBreed(`b${i}`));
    const server = createFakeServer(breeds);
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn });

    const first = await api.getBreedsPage(1, 2);
    const last = await api.getBreedsPage(3, 2);

    expect(first).toMatchObject({ lastPage: 3, totalRecords: 5, invalid: 0 });
    expect(last.lastPage).toBe(3);
    expect(last.breeds).toHaveLength(1);
  });

  it('counts invalid records instead of failing the page', async () => {
    const body = {
      data: [rawBreed('good'), { id: 'bad' }],
      meta: { pagination: { current: 1, records: 2 } },
    };
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: respond(body) });

    const page = await api.getBreedsPage(1, 48);

    expect(page.breeds.map((breed) => breed.id)).toEqual(['good']);
    expect(page.invalid).toBe(1);
  });

  it('throws InvalidResponseError when the envelope is wrong', async () => {
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: respond({ nope: true }) });
    await expect(api.getBreedsPage(1, 48)).rejects.toBeInstanceOf(InvalidResponseError);
  });

  it('surfaces HTTP errors with their status', async () => {
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: respond({}, 404) });
    await expect(api.getBreed('missing')).rejects.toMatchObject({ status: 404 });
    await expect(api.getBreed('missing')).rejects.toBeInstanceOf(HttpError);
  });

  it('parses groups', async () => {
    const server = createFakeServer([]);
    const api = createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn });

    const groups = await api.getGroups();

    expect(groups.map((group) => group.attributes.name)).toEqual(['Herding Group', 'Toy Group']);
  });
});
