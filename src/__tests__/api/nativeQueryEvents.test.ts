import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';

import { isOnline, OFFLINE_RECHECK_MS, useNativeQueryEvents } from '@/api/nativeQueryEvents';

const refresh = jest.mocked(NetInfo.refresh);

describe('useNativeQueryEvents', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    refresh.mockClear();
  });

  afterEach(() => {
    // Hooks are unmounted by now, so no act() needed; onlineManager is a global.
    onlineManager.setOnline(true);
    jest.useRealTimers();
  });

  it('keeps asking NetInfo for the real state while offline', async () => {
    const { unmount } = await renderHook(() => useNativeQueryEvents());

    await act(() => onlineManager.setOnline(false));
    await act(() => jest.advanceTimersByTime(OFFLINE_RECHECK_MS * 3));

    expect(refresh).toHaveBeenCalledTimes(3);
    await unmount();
  });

  it('stops checking once back online', async () => {
    const { unmount } = await renderHook(() => useNativeQueryEvents());

    await act(() => onlineManager.setOnline(false));
    await act(() => jest.advanceTimersByTime(OFFLINE_RECHECK_MS));
    await act(() => onlineManager.setOnline(true));
    await act(() => jest.advanceTimersByTime(OFFLINE_RECHECK_MS * 5));

    expect(refresh).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it('does not poll while online', async () => {
    const { unmount } = await renderHook(() => useNativeQueryEvents());

    await act(() => jest.advanceTimersByTime(OFFLINE_RECHECK_MS * 5));

    expect(refresh).not.toHaveBeenCalled();
    await unmount();
  });

  it('stops checking when unmounted', async () => {
    const { unmount } = await renderHook(() => useNativeQueryEvents());
    await act(() => onlineManager.setOnline(false));

    await unmount();
    await act(() => jest.advanceTimersByTime(OFFLINE_RECHECK_MS * 5));

    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('isOnline', () => {
  const state = (isConnected: boolean | null, isInternetReachable: boolean | null) =>
    ({ isConnected, isInternetReachable }) as NetInfoState;

  it('needs a connection and no explicit "unreachable"', () => {
    expect(isOnline(state(true, true))).toBe(true);
    expect(isOnline(state(true, null))).toBe(true);
    expect(isOnline(state(true, false))).toBe(false);
    expect(isOnline(state(false, null))).toBe(false);
  });
});
