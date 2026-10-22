import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, IconButton } from '@/components';
import type { HypoallergenicFilter, SocialTrait } from '@/domain/filters';
import { COAT_LABELS, SIZE_LABELS } from '@/domain/labels';
import { SIZE_BANDS, type CoatCategory } from '@/domain/types';
import { useBreedStore } from '@/store/breedStore';
import { useFilterStore } from '@/store/filterStore';
import { spacing, useTheme } from '@/theme';

import { FilterSection, type FilterOption } from './FilterSection';

type Props = {
  visible: boolean;
  resultCount: number;
  onClose: () => void;
};

const SIZE_OPTIONS = SIZE_BANDS.map((value) => ({ value, label: SIZE_LABELS[value] }));

// "unknown" isn't offered: there's nothing useful to filter for.
const COAT_OPTIONS: FilterOption<CoatCategory>[] = (
  ['short', 'medium', 'long', 'wire', 'hairless'] as const
).map((value) => ({ value, label: COAT_LABELS[value] }));

const HYPOALLERGENIC_OPTIONS: FilterOption<HypoallergenicFilter>[] = [
  { value: 'any', label: 'Any' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const SCORE_OPTIONS: FilterOption<number>[] = [
  { value: 0, label: 'Any' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5' },
];

const TRAIT_SECTIONS: { trait: SocialTrait; title: string }[] = [
  { trait: 'goodWithChildren', title: 'Good with children' },
  { trait: 'goodWithDogs', title: 'Good with other dogs' },
  { trait: 'goodWithStrangers', title: 'Good with strangers' },
];

// Filters apply as soon as a chip is tapped; the sheet just shows the live count.
export function FilterSheet({ visible, resultCount, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const groups = useBreedStore((state) => state.groups);
  const filters = useFilterStore((state) => state.filters);
  const { toggleGroup, toggleSize, toggleCoat, setHypoallergenic, setMinScore, clearFilters } =
    useFilterStore.getState();

  const groupOptions = useMemo(
    () =>
      groups.allIds
        .flatMap((id) => {
          const group = groups.byId[id];
          return group ? [{ value: id, label: group.label }] : [];
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [groups],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <AppText variant="title">Filters</AppText>
          <IconButton icon="close" accessibilityLabel="Close filters" onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <FilterSection
            title="Breed group"
            options={groupOptions}
            isSelected={(id) => filters.groupIds.includes(id)}
            onSelect={toggleGroup}
          />
          <FilterSection
            title="Size"
            options={SIZE_OPTIONS}
            isSelected={(size) => filters.sizes.includes(size)}
            onSelect={toggleSize}
          />
          <FilterSection
            title="Coat"
            options={COAT_OPTIONS}
            isSelected={(coat) => filters.coats.includes(coat)}
            onSelect={toggleCoat}
          />
          <FilterSection
            title="Hypoallergenic"
            options={HYPOALLERGENIC_OPTIONS}
            isSelected={(value) => filters.hypoallergenic === value}
            onSelect={setHypoallergenic}
          />
          {TRAIT_SECTIONS.map(({ trait, title }) => (
            <FilterSection
              key={trait}
              title={title}
              options={SCORE_OPTIONS}
              isSelected={(score) => filters.minScores[trait] === score}
              onSelect={(score) => setMinScore(trait, score)}
            />
          ))}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Button label="Clear all" variant="ghost" onPress={clearFilters} style={styles.button} />
          <Button
            label={resultCount === 1 ? 'Show 1 breed' : `Show ${resultCount} breeds`}
            onPress={onClose}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: { padding: spacing.lg, gap: spacing.xl },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: { flex: 1 },
});
