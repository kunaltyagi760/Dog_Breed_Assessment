import { mapSettledWithLimit } from '@/lib/concurrency';

export type CacheEntry = {
  url: string;
  fileName: string;
  bytes: number;
  /** Pinned images (list thumbnails) are never evicted. */
  pinned: boolean;
  lastUsed: number;
};

/** Where the index of cached files is persisted. */
export type CacheIndexStore = {
  load(): Promise<CacheEntry[]>;
  save(entry: CacheEntry): Promise<void>;
  remove(urls: string[]): Promise<void>;
};

/** The file system side: where files live and how they get there. */
export type CacheFiles = {
  uriFor(fileName: string): string;
  /** Downloads `url` into `fileName` and returns its size in bytes. */
  download(url: string, fileName: string): Promise<number>;
  remove(fileName: string): void;
};

export type CacheStats = {
  pinnedCount: number;
  pinnedBytes: number;
  photoCount: number;
  photoBytes: number;
  budgetBytes: number;
};

type Options = {
  index: CacheIndexStore;
  files: CacheFiles;
  budgetBytes: number;
  now?: () => number;
};

/** Stable, file-name-safe key for a URL (two 32-bit FNV-1a hashes). */
export function fileNameFor(url: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x811c9dc5);
  }
  return `${(a >>> 0).toString(36)}${(b >>> 0).toString(36)}`;
}

/**
 * A disk cache for remote images with a size budget.
 *
 * Thumbnails are pinned: all 283 come to about 5 MB and the list needs every
 * one of them offline. Everything else (gallery and full-screen photos) counts
 * against `budgetBytes`, and the least recently viewed files go first.
 */
export function createImageCache({ index, files, budgetBytes, now = Date.now }: Options) {
  const entries = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<string>>();
  const urlListeners = new Map<string, Set<() => void>>();
  const statsListeners = new Set<() => void>();
  let initPromise: Promise<void> | null = null;
  let stats: CacheStats = computeStats();

  function computeStats(): CacheStats {
    const result = { pinnedCount: 0, pinnedBytes: 0, photoCount: 0, photoBytes: 0, budgetBytes };
    for (const entry of entries.values()) {
      if (entry.pinned) {
        result.pinnedCount++;
        result.pinnedBytes += entry.bytes;
      } else {
        result.photoCount++;
        result.photoBytes += entry.bytes;
      }
    }
    return result;
  }

  function notify(urls: Iterable<string>) {
    stats = computeStats();
    for (const url of urls) urlListeners.get(url)?.forEach((listener) => listener());
    statsListeners.forEach((listener) => listener());
  }

  async function evict(urls: string[]) {
    if (!urls.length) return;
    for (const url of urls) {
      const entry = entries.get(url);
      if (!entry) continue;
      entries.delete(url);
      try {
        files.remove(entry.fileName);
      } catch {
        // Already gone; the index entry was the only thing left to clean up.
      }
    }
    await index.remove(urls);
    notify(urls);
  }

  /** Evicts least recently used photos until they fit the budget, never `keepUrl`. */
  async function enforceBudget(keepUrl?: string) {
    let total = 0;
    const candidates: CacheEntry[] = [];
    for (const entry of entries.values()) {
      if (entry.pinned) continue;
      total += entry.bytes;
      if (entry.url !== keepUrl) candidates.push(entry);
    }
    if (total <= budgetBytes) return;

    candidates.sort((x, y) => x.lastUsed - y.lastUsed);
    const doomed: string[] = [];
    for (const entry of candidates) {
      if (total <= budgetBytes) break;
      total -= entry.bytes;
      doomed.push(entry.url);
    }
    await evict(doomed);
  }

  async function download(url: string, pinned: boolean): Promise<string> {
    const fileName = fileNameFor(url);
    const bytes = await files.download(url, fileName);
    const entry: CacheEntry = { url, fileName, bytes, pinned, lastUsed: now() };
    entries.set(url, entry);
    await index.save(entry);
    notify([url]);
    if (!pinned) await enforceBudget(url);
    return files.uriFor(fileName);
  }

  async function ensure(url: string, { pinned = false }: { pinned?: boolean } = {}) {
    const existing = entries.get(url);
    if (existing) {
      if (pinned && !existing.pinned) {
        const upgraded = { ...existing, pinned: true };
        entries.set(url, upgraded);
        await index.save(upgraded);
        notify([url]);
      }
      return files.uriFor(existing.fileName);
    }

    const pending = inFlight.get(url);
    if (pending) return pending;
    const task = download(url, pinned).finally(() => inFlight.delete(url));
    inFlight.set(url, task);
    return task;
  }

  return {
    /** Loads the persisted index. Safe to call more than once. */
    init(): Promise<void> {
      initPromise ??= index.load().then((loaded) => {
        for (const entry of loaded) entries.set(entry.url, entry);
        notify(loaded.map((entry) => entry.url));
      });
      return initPromise;
    },

    /** Local file URI if `url` is cached, otherwise null. Synchronous. */
    peek(url: string): string | null {
      const entry = entries.get(url);
      return entry ? files.uriFor(entry.fileName) : null;
    },

    /** Returns a local URI for `url`, downloading it first if needed. */
    ensure,

    /** Marks a cached photo as just viewed, so it's the last to be evicted. */
    async touch(url: string): Promise<void> {
      const entry = entries.get(url);
      if (!entry || entry.pinned) return;
      const touched = { ...entry, lastUsed: now() };
      entries.set(url, touched);
      await index.save(touched);
    },

    /** Drops an entry whose file turned out to be missing or unreadable. */
    forget(url: string): Promise<void> {
      return evict([url]);
    },

    /** Downloads every missing URL as pinned; stops early when `shouldContinue` says so. */
    async prefetchPinned(
      urls: readonly string[],
      {
        concurrency = 3,
        shouldContinue = () => true,
      }: { concurrency?: number; shouldContinue?: () => boolean } = {},
    ): Promise<{ downloaded: number; failed: number }> {
      const missing = urls.filter((url) => !entries.get(url)?.pinned);
      let downloaded = 0;
      let failed = 0;
      await mapSettledWithLimit(missing, concurrency, async (url) => {
        if (!shouldContinue()) return;
        try {
          await ensure(url, { pinned: true });
          downloaded++;
        } catch {
          failed++;
        }
      });
      return { downloaded, failed };
    },

    /**
     * Unpins thumbnails that no longer belong to any breed. They aren't deleted
     * outright; they just become ordinary entries that age out under the budget.
     */
    async releasePinnedExcept(keep: ReadonlySet<string>): Promise<void> {
      const released: string[] = [];
      for (const entry of entries.values()) {
        if (entry.pinned && !keep.has(entry.url)) {
          const unpinned = { ...entry, pinned: false };
          entries.set(entry.url, unpinned);
          await index.save(unpinned);
          released.push(entry.url);
        }
      }
      if (released.length) {
        notify(released);
        await enforceBudget();
      }
    },

    /** Deletes every cached photo; thumbnails stay so the list keeps working offline. */
    clearPhotos(): Promise<void> {
      return evict(
        [...entries.values()].filter((entry) => !entry.pinned).map((entry) => entry.url),
      );
    },

    getStats(): CacheStats {
      return stats;
    },

    subscribe(url: string, listener: () => void): () => void {
      let set = urlListeners.get(url);
      if (!set) urlListeners.set(url, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) urlListeners.delete(url);
      };
    },

    subscribeStats(listener: () => void): () => void {
      statsListeners.add(listener);
      return () => statsListeners.delete(listener);
    },
  };
}

export type ImageCache = ReturnType<typeof createImageCache>;
