import { StyleSheet, View } from 'react-native';

import { AppText, Chip } from '@/components';
import { spacing } from '@/theme';

export type FilterOption<T> = { value: T; label: string };

type Props<T> = {
  title: string;
  options: readonly FilterOption<T>[];
  isSelected: (value: T) => boolean;
  onSelect: (value: T) => void;
};

export function FilterSection<T extends string | number>({
  title,
  options,
  isSelected,
  onSelect,
}: Props<T>) {
  return (
    <View style={styles.section}>
      <AppText variant="subtitle">{title}</AppText>
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={isSelected(option.value)}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
