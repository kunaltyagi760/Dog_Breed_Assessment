import { Image } from 'expo-image';
import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, LinkText, Section, TagList } from '@/components';
import { sizeBandFor } from '@/domain/derive';
import { SIZE_LABELS } from '@/domain/labels';
import type { Breed } from '@/domain/types';
import { formatRange } from '@/lib/format';
import { useBreedStore } from '@/store/breedStore';
import { radius, spacing, useTheme } from '@/theme';

import { DetailRow } from './DetailRow';
import { imageUrl } from './images';

type Props = { breed: Breed };

function describeCoat({ type, length }: Breed['coat']): string | null {
  const parts = [length, type].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function OverviewTabBase({ breed }: Props) {
  const { colors } = useTheme();
  const groupLabel = useBreedStore((state) =>
    breed.groupId ? state.groups.byId[breed.groupId]?.label : undefined,
  );
  const hero = breed.images[0];
  const heroUrl = hero ? imageUrl(hero, 'medium') : null;
  const sizeBand = sizeBandFor(breed.weight, breed.height);
  const { country, region, era } = breed.origin;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {heroUrl ? (
        <Image
          source={heroUrl}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={200}
          style={[styles.hero, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLabel={`Photo of a ${breed.name}`}
        />
      ) : null}

      <Section title="About">
        <AppText tone={breed.description ? 'default' : 'muted'}>
          {breed.description ?? 'No description available.'}
        </AppText>
      </Section>

      <Section title="At a glance">
        <View>
          <DetailRow label="Group" value={groupLabel ?? null} />
          <DetailRow label="Size" value={sizeBand ? SIZE_LABELS[sizeBand] : null} />
          <DetailRow label="Life span" value={formatRange(breed.lifeSpan, 'years')} />
          <DetailRow label="Hypoallergenic" value={breed.hypoallergenic ? 'Yes' : 'No'} />
          <DetailRow label="Coat" value={describeCoat(breed.coat)} />
        </View>
      </Section>

      <Section title="Weight & height">
        <View>
          <DetailRow label="Male weight" value={formatRange(breed.weight.male, 'kg')} />
          <DetailRow label="Female weight" value={formatRange(breed.weight.female, 'kg')} />
          <DetailRow label="Male height" value={formatRange(breed.height.male, 'cm')} />
          <DetailRow label="Female height" value={formatRange(breed.height.female, 'cm')} />
        </View>
      </Section>

      <Section title="Origin">
        <View>
          <DetailRow label="Country" value={country} />
          <DetailRow label="Region" value={region} />
          <DetailRow label="Era" value={era} />
        </View>
      </Section>

      <Section title="Coat colours">
        <TagList tags={breed.coat.colors} />
      </Section>

      <Section title="Also known as">
        <TagList tags={breed.otherNames} emptyText="No other names" />
      </Section>

      <Section title="Recognized by">
        <TagList tags={breed.recognizedBy} emptyText="No kennel clubs listed" />
      </Section>

      {breed.sources.length ? (
        <Section title="Sources">
          <View style={styles.sources}>
            {breed.sources.map((source, index) => (
              <LinkText key={`${source.url}-${index}`} url={source.url} variant="caption">
                {source.title ?? source.url}
              </LinkText>
            ))}
          </View>
        </Section>
      ) : null}
    </ScrollView>
  );
}

export const OverviewTab = memo(OverviewTabBase);

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  hero: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg },
  sources: { gap: spacing.sm },
});
