import type { FetchLike, FetchResponse } from '@/api/http';

import { rawGroup } from './fixtures';

const json = (body: unknown, status = 200): FetchResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const queryNumber = (url: string, key: string) => {
  const match = decodeURIComponent(url).match(new RegExp(`${key}=(\\d+)`));
  return match ? Number(match[1]) : NaN;
};

/**
 * A stand-in for dogapi.dog that serves `breeds` in pages the same way the real
 * API does (including leaving `last` off the final page), with knobs to make
 * specific pages fail.
 */
export function createFakeServer(breeds: unknown[]) {
  const pageFailures = new Map<number, number>();
  let groupsStatus = 200;
  let totalOverride: number | null = null;
  const requests: string[] = [];

  const fetchFn: FetchLike = async (url) => {
    requests.push(url);

    if (url.endsWith('/groups')) {
      return groupsStatus === 200
        ? json({ data: [rawGroup('g-herding', 'Herding Group'), rawGroup('g-toy', 'Toy Group')] })
        : json({}, groupsStatus);
    }

    const page = queryNumber(url, 'page\\[number\\]');
    const size = queryNumber(url, 'page\\[size\\]');

    const remaining = pageFailures.get(page) ?? 0;
    if (remaining > 0) {
      pageFailures.set(page, remaining - 1);
      return json({ error: 'unavailable' }, 503);
    }

    const last = Math.max(1, Math.ceil(breeds.length / size));
    return json({
      data: breeds.slice((page - 1) * size, page * size),
      meta: {
        pagination: {
          current: page,
          ...(page < last ? { next: page + 1, last } : {}),
          records: totalOverride ?? breeds.length,
        },
      },
    });
  };

  return {
    fetchFn,
    requests,
    /** Fail the next `times` requests for `page` with a 503. */
    failPage(page: number, times = Infinity) {
      pageFailures.set(page, times);
    },
    failGroups(status = 500) {
      groupsStatus = status;
    },
    reportTotal(total: number) {
      totalOverride = total;
    },
  };
}
