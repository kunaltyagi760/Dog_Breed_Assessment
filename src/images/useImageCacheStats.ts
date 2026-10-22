import { useSyncExternalStore } from 'react';

import { imageCache } from './index';

const subscribe = (listener: () => void) => imageCache.subscribeStats(listener);
const getSnapshot = () => imageCache.getStats();

export function useImageCacheStats() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
