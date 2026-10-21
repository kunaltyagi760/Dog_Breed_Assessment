import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);
const getSnapshot = () => onlineManager.isOnline();

/** Same source of truth React Query uses to pause and resume requests. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
