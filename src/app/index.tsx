import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';

import { BoundaryFallback, Loader, SearchInput, StateMessage } from '@/components';
import { activeFilterCount } from '@/domain/filters';
import type { BreedSectionRow } from '@/domain/sections';
import { BreedRow } from '@/features/breeds/BreedRow';
import { FilterBar } from '@/features/breeds/filters/FilterBar';
import { FilterSheet } from '@/features/breeds/filters/FilterSheet';
import { SectionHeader } from '@/features/breeds/SectionHeader';
import { SyncStatus } from '@/features/breeds/SyncStatus';
import { useFilteredBreeds } from '@/features/breeds/useFilteredBreeds';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useBreedStore } from '@/store/breedStore';
import { useFilterStore } from '@/store/filterStore';
import { useBreedSync } from '@/sync/useBreedSync';
import { spacing, useTheme } from '@/theme';

const keyExtractor = (row: BreedSectionRow) => row.key;
const getItemType = (row: BreedSectionRow) => row.type;

export default function BreedListScreen() {
  const { colors } = useTheme();
  const lastSyncedAt = useBreedStore((state) => state.syncMeta.lastSyncedAt);
  const lastError = useBreedStore((state) => state.syncMeta.lastError);
  const query = useFilterStore((state) => state.query);
  const filters = useFilterStore((state) => state.filters);
  const { setQuery, reset } = useFilterStore.getState();
  const isOnline = useIsOnline();
  const { isSyncing, error, refreshing, refresh } = useBreedSync();
  const { rows, stickyIndices, appliedQuery, resultCount, totalCount } = useFilteredBreeds();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef<FlashListRef<BreedSectionRow>>(null);

  const problem = lastError ?? error?.message ?? null;
  const activeCount = activeFilterCount(filters);
  const isNarrowed = activeCount > 0 || query.trim() !== '';

  const retry = useCallback(() => void refresh(), [refresh]);
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const openBreed = useCallback((id: string) => {
    router.push({ pathname: '/breeds/[id]', params: { id } });
  }, []);

  // A new result set should start from the top, not wherever the old one was scrolled to.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, appliedQuery]);

  const renderItem = useCallback(
    ({ item }: { item: BreedSectionRow }) =>
      item.type === 'header' ? (
        <SectionHeader title={item.title} count={item.count} />
      ) : (
        <BreedRow id={item.id} onPress={openBreed} />
      ),
    [openBreed],
  );

  let content;
  if (totalCount > 0 && resultCount === 0) {
    content = (
      <StateMessage
        title="No breeds match"
        message="Try a different search or fewer filters."
        actionLabel="Clear search and filters"
        onAction={reset}
      />
    );
  } else if (totalCount > 0) {
    content = (
      <FlashList
        ref={listRef}
        data={rows}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={renderItem}
        stickyHeaderIndices={stickyIndices}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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
        breedCount={totalCount}
        problem={problem}
        onRetry={retry}
      />
      {totalCount > 0 ? (
        <View style={styles.controls}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or other names"
          />
          <FilterBar
            activeCount={activeCount}
            resultCount={resultCount}
            totalCount={totalCount}
            isNarrowed={isNarrowed}
            onOpenFilters={openFilters}
            onClear={reset}
          />
        </View>
      ) : null}
      <ErrorBoundary FallbackComponent={BoundaryFallback}>{content}</ErrorBoundary>
      <FilterSheet visible={filtersOpen} resultCount={resultCount} onClose={closeFilters} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
