import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { useIsOnline } from '@/hooks/useIsOnline';

import { imageCache } from './index';

const noop = () => {};
const unsubscribeNoop = () => noop;

// A file that fails to decode is dropped and downloaded again, but only once per
// session, so a broken image on the server can't cause a download loop.
const forgotten = new Set<string>();

/**
 * Resolves a remote image URL to a local file from the image cache, downloading
 * it when it's missing and the device is online. While that happens `uri` is
 * null and the caller shows its placeholder. If the download itself fails, the
 * remote URL is returned so the photo can still load straight from the network.
 */
export function useCachedImage(url: string | null, { pinned = false } = {}) {
  const isOnline = useIsOnline();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const subscribe = useCallback(
    (listener: () => void) => (url ? imageCache.subscribe(url, listener) : unsubscribeNoop()),
    [url],
  );
  const getSnapshot = useCallback(() => (url ? imageCache.peek(url) : null), [url]);
  const localUri = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!url) return;
    if (localUri) {
      void imageCache.touch(url);
      return;
    }
    if (!isOnline) return;

    let cancelled = false;
    imageCache.ensure(url, { pinned }).catch(() => {
      if (!cancelled) setFailedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [url, localUri, pinned, isOnline]);

  const onError = useCallback(() => {
    if (url && localUri && !forgotten.has(url)) {
      forgotten.add(url);
      void imageCache.forget(url);
    }
  }, [url, localUri]);

  const uri = localUri ?? (url && failedUrl === url && isOnline ? url : null);
  return { uri, onError };
}
