import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/theme';

import { IconButton } from './IconButton';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
};

function SearchInputBase({ value, onChangeText, placeholder, testID }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        testID={testID}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
      />
      {value ? (
        <IconButton
          icon="close-circle"
          size={18}
          color={colors.textMuted}
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
        />
      ) : null}
    </View>
  );
}

export const SearchInput = memo(SearchInputBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 42,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.md,
  },
  input: { flex: 1, fontSize: fontSize.body, paddingVertical: spacing.sm },
});
