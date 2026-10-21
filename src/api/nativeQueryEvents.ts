import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export const OFFLINE_RECHECK_MS = 5_000;

// isInternetReachable is null while NetInfo is still checking; only treat an
// explicit `false` as offline so the app doesn't flash an offline banner on launch.
export function isOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * React Query listens to browser online/focus events by default, which don't
 * exist in React Native. This wires them to NetInfo and AppState instead, so
 * refetchOnReconnect and refetchOnWindowFocus work on a phone.
 */
export function useNativeQueryEvents() {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => setOnline(isOnline(state))),
    );

    // NetInfo waits for the OS to announce that the network is back, and that
    // announcement sometimes never comes (reliably so in the iOS simulator).
    // While offline, ask for the current state every few seconds instead.
    let recheck: ReturnType<typeof setInterval> | null = null;
    const stopRechecking = () => {
      if (recheck) clearInterval(recheck);
      recheck = null;
    };
    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) stopRechecking();
      else recheck ??= setInterval(() => void NetInfo.refresh(), OFFLINE_RECHECK_MS);
    });

    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => {
      subscription.remove();
      unsubscribeOnline();
      stopRechecking();
    };
  }, []);
}
