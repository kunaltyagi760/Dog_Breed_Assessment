import {
  createImageCache,
  fileNameFor,
  type CacheEntry,
  type CacheFiles,
  type CacheIndexStore,
} from '@/images/imageCache';

const KB = 1024;

function setup({ budget = 300 * KB, sizes = {} as Record<string, number> } = {}) {
  const saved = new Map<string, CacheEntry>();
  const files = new Set<string>();
  const downloads: string[] = [];
  let clock = 1_000;
  let failNext = false;

  const index: CacheIndexStore = {
    load: async () => [...saved.values()],
    save: async (entry) => {
      saved.set(entry.url, entry);
    },
    remove: async (urls) => {
      urls.forEach((url) => saved.delete(url));
    },
  };

  const fileStore: CacheFiles = {
    uriFor: (name) => `file:///cache/${name}`,
    download: async (url, name) => {
      downloads.push(url);
      if (failNext) {
        failNext = false;
        throw new Error('offline');
      }
      files.add(name);
      return sizes[url] ?? 100 * KB;
    },
    remove: (name) => {
      files.delete(name);
    },
  };

  const cache = createImageCache({
    index,
    files: fileStore,
    budgetBytes: budget,
    now: () => clock,
  });

  return {
    cache,
    saved,
    files,
    downloads,
    tick: (ms = 1) => (clock += ms),
    failNextDownload: () => (failNext = true),
  };
}

describe('createImageCache', () => {
  it('downloads once and serves the local file afterwards', async () => {
    const { cache, downloads } = setup();

    expect(cache.peek('a')).toBeNull();
    const uri = await cache.ensure('a');

    expect(uri).toBe(`file:///cache/${fileNameFor('a')}`);
    expect(cache.peek('a')).toBe(uri);
    await cache.ensure('a');
    expect(downloads).toEqual(['a']);
  });

  it('shares one download between concurrent requests', async () => {
    const { cache, downloads } = setup();

    await Promise.all([cache.ensure('a'), cache.ensure('a'), cache.ensure('a')]);

    expect(downloads).toEqual(['a']);
  });

  it('evicts the least recently used photos once over budget', async () => {
    const { cache, tick } = setup({ budget: 250 * KB });

    await cache.ensure('old');
    tick();
    await cache.ensure('middle');
    tick();
    await cache.ensure('new');

    expect(cache.peek('old')).toBeNull();
    expect(cache.peek('middle')).not.toBeNull();
    expect(cache.peek('new')).not.toBeNull();
  });

  it('counts a viewed photo as recently used', async () => {
    const { cache, tick } = setup({ budget: 250 * KB });

    await cache.ensure('first');
    tick();
    await cache.ensure('second');
    tick();
    await cache.touch('first');
    tick();
    await cache.ensure('third');

    expect(cache.peek('first')).not.toBeNull();
    expect(cache.peek('second')).toBeNull();
  });

  it('never evicts pinned thumbnails, whatever the budget', async () => {
    const { cache } = setup({ budget: 100 * KB });

    await cache.ensure('thumb-1', { pinned: true });
    await cache.ensure('thumb-2', { pinned: true });
    await cache.ensure('photo-1');
    await cache.ensure('photo-2');

    expect(cache.peek('thumb-1')).not.toBeNull();
    expect(cache.peek('thumb-2')).not.toBeNull();
    expect(cache.peek('photo-1')).toBeNull();
    expect(cache.getStats()).toMatchObject({ pinnedCount: 2, photoCount: 1 });
  });

  it('keeps a just-downloaded photo even if it alone is over budget', async () => {
    const { cache } = setup({ budget: 50 * KB, sizes: { huge: 500 * KB } });

    const uri = await cache.ensure('huge');

    expect(cache.peek('huge')).toBe(uri);
  });

  it('upgrades a cached photo to pinned without downloading again', async () => {
    const { cache, downloads, saved } = setup();

    await cache.ensure('a');
    await cache.ensure('a', { pinned: true });

    expect(downloads).toEqual(['a']);
    expect(saved.get('a')?.pinned).toBe(true);
  });

  it('restores its index from storage, loading it only once', async () => {
    const first = setup();
    await first.cache.ensure('a');
    const load = jest.fn(async () => [...first.saved.values()]);
    const restored = createImageCache({
      index: { load, save: async () => {}, remove: async () => {} },
      files: { uriFor: (n) => `file:///cache/${n}`, download: async () => 1, remove: () => {} },
      budgetBytes: KB,
    });

    await Promise.all([restored.init(), restored.init()]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(restored.peek('a')).not.toBeNull();
  });

  it('can load its index again after a failed first attempt', async () => {
    const load = jest
      .fn<Promise<CacheEntry[]>, []>()
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValue([{ url: 'a', fileName: 'f', bytes: 1, pinned: true, lastUsed: 1 }]);
    const cache = createImageCache({
      index: { load, save: async () => {}, remove: async () => {} },
      files: { uriFor: (n) => `file:///cache/${n}`, download: async () => 1, remove: () => {} },
      budgetBytes: KB,
    });

    await expect(cache.init()).rejects.toThrow('database unavailable');
    await cache.init();

    expect(load).toHaveBeenCalledTimes(2);
    expect(cache.peek('a')).toBe('file:///cache/f');
  });

  it('forget removes both the file and the index entry', async () => {
    const { cache, files, saved } = setup();
    await cache.ensure('a');

    await cache.forget('a');

    expect(cache.peek('a')).toBeNull();
    expect(files.size).toBe(0);
    expect(saved.size).toBe(0);
  });

  it('clearPhotos keeps the thumbnails', async () => {
    const { cache } = setup();
    await cache.ensure('thumb', { pinned: true });
    await cache.ensure('photo');

    await cache.clearPhotos();

    expect(cache.peek('thumb')).not.toBeNull();
    expect(cache.peek('photo')).toBeNull();
  });

  it('releases thumbnails of breeds that no longer exist', async () => {
    const { cache, saved } = setup();
    await cache.ensure('kept', { pinned: true });
    await cache.ensure('removed-breed', { pinned: true });

    await cache.releasePinnedExcept(new Set(['kept']));

    expect(saved.get('kept')?.pinned).toBe(true);
    expect(saved.get('removed-breed')?.pinned).toBe(false);
  });

  it('prefetches only missing thumbnails and reports failures', async () => {
    const { cache, downloads, failNextDownload } = setup();
    await cache.ensure('have', { pinned: true });
    failNextDownload();

    const result = await cache.prefetchPinned(['have', 'b', 'c'], { concurrency: 1 });

    expect(downloads).toEqual(['have', 'b', 'c']);
    expect(result).toEqual({ downloaded: 1, failed: 1 });
  });

  it('stops prefetching when told to', async () => {
    const { cache, downloads } = setup();
    let allowed = 2;

    await cache.prefetchPinned(['a', 'b', 'c', 'd'], {
      concurrency: 1,
      shouldContinue: () => allowed-- > 0,
    });

    expect(downloads).toEqual(['a', 'b']);
  });

  it('notifies listeners for the URL that changed and for the stats', async () => {
    const { cache } = setup();
    const onA = jest.fn();
    const onB = jest.fn();
    const onStats = jest.fn();
    cache.subscribe('a', onA);
    cache.subscribe('b', onB);
    cache.subscribeStats(onStats);

    await cache.ensure('a');

    expect(onA).toHaveBeenCalled();
    expect(onB).not.toHaveBeenCalled();
    expect(onStats).toHaveBeenCalled();
    expect(cache.getStats()).toMatchObject({ photoCount: 1, photoBytes: 100 * KB });
  });
});

describe('fileNameFor', () => {
  it('is stable and distinguishes similar URLs', () => {
    const url = 'https://images.dogapi.dog/abc123';
    expect(fileNameFor(url)).toBe(fileNameFor(url));
    expect(fileNameFor(url)).not.toBe(fileNameFor(`${url}4`));
    expect(fileNameFor(url)).toMatch(/^[a-z0-9]+$/);
  });
});
