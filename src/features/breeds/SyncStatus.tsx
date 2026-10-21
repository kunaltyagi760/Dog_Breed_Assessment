import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Banner } from '@/components';
import { useNow } from '@/hooks/useNow';
import { formatRelativeTime } from '@/lib/relativeTime';
import { spacing } from '@/theme';

type Props = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  breedCount: number;
  /** Why the last sync didn't fully succeed, if it didn't. */
  problem: string | null;
  onRetry: () => void;
};

function FreshnessLabel({
  isSyncing,
  lastSyncedAt,
  breedCount,
}: Omit<Props, 'isOnline' | 'problem' | 'onRetry'>) {
  const now = useNow();

  let label = 'Not synced yet';
  if (isSyncing) label = 'Syncing…';
  else if (lastSyncedAt) label = `Last synced ${formatRelativeTime(lastSyncedAt, now)}`;

  return (
    <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
      {breedCount > 0 ? `${breedCount} breeds · ${label}` : label}
    </AppText>
  );
}

function SyncStatusBase({
  isOnline,
  isSyncing,
  lastSyncedAt,
  breedCount,
  problem,
  onRetry,
}: Props) {
  const hasData = breedCount > 0;

  let banner = null;
  if (!isOnline) {
    banner = (
      <Banner
        tone="warning"
        icon="cloud-offline-outline"
        message={
          hasData
            ? "You're offline. Showing saved breeds."
            : "You're offline. Breeds will download when you reconnect."
        }
      />
    );
  } else if (problem && !isSyncing) {
    banner = (
      <Banner
        tone="danger"
        message={hasData ? `${problem}. Showing saved data.` : problem}
        actionLabel="Retry"
        onAction={onRetry}
      />
    );
  }

  return (
    <View style={styles.container}>
      {banner}
      <FreshnessLabel isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} breedCount={breedCount} />
    </View>
  );
}

export const SyncStatus = memo(SyncStatusBase);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
