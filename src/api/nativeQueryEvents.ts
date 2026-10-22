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

/** Cellular and personal hotspots report themselves as expensive. */
export function isMeteredConnection(state: NetInfoState): boolean {
  return state.details !== null && state.details.isConnectionExpensive;
}

/**
 * React Query listens to browser online/focus events by default, which don't
 * exist in React Native. This wires them to NetInfo and AppState instead, so
 * refetchOnReconnect and refetchOnWindowFocus work on a phone.
 */
export function useNativeQueryEvents() {
  useEffect(() => {
    // NetInfo waits for the OS to announce that the network is back, and that
    // announcement sometimes never comes (reliably so in the iOS simulator).
    // While offline, ask for the current state every few seconds instead.
    let recheck: ReturnType<typeof setInterval> | null = null;
    const startRechecking = () => {
      recheck ??= setInterval(() => void NetInfo.refresh(), OFFLINE_RECHECK_MS);
    };
    const stopRechecking = () => {
      if (recheck) clearInterval(recheck);
      recheck = null;
    };
    // Subscribe before NetInfo reports its first state, so that report counts too.
    const unsubscribeOnline = onlineManager.subscribe((online) =>
      online ? stopRechecking() : startRechecking(),
    );

    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => setOnline(isOnline(state))),
    );

    // Already offline with no change left to observe: launched without a
    // connection, or remounted after a reload while offline.
    if (!onlineManager.isOnline()) startRechecking();

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
