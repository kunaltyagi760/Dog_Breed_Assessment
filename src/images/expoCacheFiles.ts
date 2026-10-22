import { Directory, File, Paths } from 'expo-file-system';

import type { CacheFiles } from './imageCache';

const DOWNLOAD_TIMEOUT_MS = 20_000;

// The documents directory isn't purged by the OS, unlike the caches directory,
// which matters for thumbnails the list relies on offline.
let directory: Directory | null = null;
let directoryUri = '';

function cacheDirectory() {
  if (!directory) {
    directory = new Directory(Paths.document, 'image-cache');
    directory.create({ idempotent: true, intermediates: true });
    directoryUri = directory.uri.endsWith('/') ? directory.uri : `${directory.uri}/`;
  }
  return directory;
}

export const expoCacheFiles: CacheFiles = {
  // A plain string join: this runs on every list row render, so no native calls.
  uriFor(fileName) {
    cacheDirectory();
    return `${directoryUri}${fileName}`;
  },

  async download(url, fileName) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
      const file = await File.downloadFileAsync(url, new File(cacheDirectory(), fileName), {
        idempotent: true,
        signal: controller.signal,
      });
      return file.size;
    } finally {
      clearTimeout(timer);
    }
  },

  remove(fileName) {
    const file = new File(cacheDirectory(), fileName);
    if (file.exists) file.delete();
  },
};
