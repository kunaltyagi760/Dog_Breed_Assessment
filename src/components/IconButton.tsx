import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
};

function IconButtonBase({ icon, onPress, accessibilityLabel, size = 22, color }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={size} color={color ?? colors.text} />
    </Pressable>
  );
}

export const IconButton = memo(IconButtonBase);

const styles = StyleSheet.create({
  button: { padding: 6 },
  pressed: { opacity: 0.5 },
});
