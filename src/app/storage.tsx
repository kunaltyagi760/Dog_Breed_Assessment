import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, ProgressBar, Section } from '@/components';
import { HydrationGate } from '@/features/shared/HydrationGate';
import { imageCache } from '@/images';
import { useImageCacheStats } from '@/images/useImageCacheStats';
import { formatBytes } from '@/lib/format';
import { useBreedStore } from '@/store/breedStore';
import { spacing, useTheme } from '@/theme';

function Storage() {
  const { colors } = useTheme();
  const stats = useImageCacheStats();
  const breedCount = useBreedStore((state) => state.breeds.allIds.length);
  const [clearing, setClearing] = useState(false);

  const clearPhotos = useCallback(async () => {
    setClearing(true);
    try {
      await imageCache.clearPhotos();
    } finally {
      setClearing(false);
    }
  }, []);

  const thumbProgress = breedCount ? Math.min(1, stats.pinnedCount / breedCount) : 0;
  const photoProgress = stats.photoBytes / stats.budgetBytes;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Section title="List thumbnails" caption="Kept permanently so the whole list works offline">
        <AppText>
          {stats.pinnedCount} of {breedCount} saved · {formatBytes(stats.pinnedBytes)}
        </AppText>
        <ProgressBar progress={thumbProgress} accessibilityLabel="Thumbnails saved" />
        <AppText variant="caption" tone="muted">
          Missing thumbnails download in the background on Wi-Fi. On mobile data they only load as
          rows appear.
        </AppText>
      </Section>

      <Section title="Photos" caption="Gallery and full-screen photos you have viewed">
        <AppText>
          {stats.photoCount} photos · {formatBytes(stats.photoBytes)} of{' '}
          {formatBytes(stats.budgetBytes)}
        </AppText>
        <ProgressBar progress={photoProgress} accessibilityLabel="Photo storage used" />
        <AppText variant="caption" tone="muted">
          When the limit is reached, the photos you looked at longest ago are removed first.
        </AppText>
        <Button
          label={clearing ? 'Clearing…' : 'Clear cached photos'}
          variant="ghost"
          onPress={clearPhotos}
          disabled={clearing || stats.photoCount === 0}
        />
      </Section>
    </ScrollView>
  );
}

export default function StorageScreen() {
  return (
    <HydrationGate>
      <Storage />
    </HydrationGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
});
