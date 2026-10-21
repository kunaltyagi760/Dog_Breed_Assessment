import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { SyncStatus } from '@/features/breeds/SyncStatus';

type Props = ComponentProps<typeof SyncStatus>;

const baseProps: Props = {
  isOnline: true,
  isSyncing: false,
  lastSyncedAt: null,
  breedCount: 283,
  problem: null,
  onRetry: jest.fn(),
};

const renderStatus = (props: Partial<Props> = {}) =>
  render(<SyncStatus {...baseProps} {...props} />);

describe('SyncStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.UTC(2026, 9, 21, 12) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows how fresh the data is', async () => {
    await renderStatus({ lastSyncedAt: Date.UTC(2026, 9, 21, 10) });
    expect(screen.getByText('283 breeds · Last synced 2 hours ago')).toBeOnTheScreen();
  });

  it('says when a sync is running', async () => {
    await renderStatus({ isSyncing: true });
    expect(screen.getByText('283 breeds · Syncing…')).toBeOnTheScreen();
  });

  it('shows the offline banner with cached data', async () => {
    await renderStatus({ isOnline: false });
    expect(screen.getByText("You're offline. Showing saved breeds.")).toBeOnTheScreen();
  });

  it('shows a different offline message when nothing is cached', async () => {
    await renderStatus({ isOnline: false, breedCount: 0 });
    expect(
      screen.getByText("You're offline. Breeds will download when you reconnect."),
    ).toBeOnTheScreen();
  });

  it('shows a partial failure with a retry action', async () => {
    const onRetry = jest.fn();
    await renderStatus({ problem: "2 of 6 pages couldn't be refreshed", onRetry });

    expect(
      screen.getByText("2 of 6 pages couldn't be refreshed. Showing saved data."),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('prefers the offline banner over a sync error', async () => {
    await renderStatus({ isOnline: false, problem: 'Request failed' });
    expect(screen.queryByText(/Request failed/)).toBeNull();
  });

  it('hides the error banner while a retry is in flight', async () => {
    await renderStatus({ isSyncing: true, problem: 'Request failed' });
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});
