import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';

import { BoundaryFallback, Loader, StateMessage } from '@/components';
import { BreedRow } from '@/features/breeds/BreedRow';
import { SyncStatus } from '@/features/breeds/SyncStatus';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useBreedStore } from '@/store/breedStore';
import { useBreedSync } from '@/sync/useBreedSync';
import { useTheme } from '@/theme';

const keyExtractor = (id: string) => id;

export default function BreedListScreen() {
  const { colors } = useTheme();
  const breedIds = useBreedStore((state) => state.breeds.allIds);
  const lastSyncedAt = useBreedStore((state) => state.syncMeta.lastSyncedAt);
  const lastError = useBreedStore((state) => state.syncMeta.lastError);
  const isOnline = useIsOnline();
  const { isSyncing, error, refreshing, refresh } = useBreedSync();

  const problem = lastError ?? error?.message ?? null;
  const retry = useCallback(() => void refresh(), [refresh]);

  const openBreed = useCallback((id: string) => {
    router.push({ pathname: '/breeds/[id]', params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: string }) => <BreedRow id={item} onPress={openBreed} />,
    [openBreed],
  );

  let content;
  if (breedIds.length > 0) {
    content = (
      <FlashList
        data={breedIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={retry}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  } else if (isSyncing) {
    content = <Loader message="Downloading breeds…" />;
  } else if (!isOnline) {
    content = (
      <StateMessage
        title="No saved breeds yet"
        message="Connect to the internet once and the breed list will be available offline."
      />
    );
  } else {
    content = (
      <StateMessage
        title="Couldn't load breeds"
        message={problem ?? undefined}
        actionLabel="Try again"
        onAction={retry}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SyncStatus
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        breedCount={breedIds.length}
        problem={problem}
        onRetry={retry}
      />
      <ErrorBoundary FallbackComponent={BoundaryFallback}>{content}</ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
