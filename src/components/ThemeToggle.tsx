import { useCallback } from 'react';

import { useThemeStore } from '@/store/themeStore';
import { useTheme } from '@/theme';

import { IconButton } from './IconButton';

export function ThemeToggle() {
  const { dark } = useTheme();
  const setPreference = useThemeStore((state) => state.setPreference);

  const toggle = useCallback(() => setPreference(dark ? 'light' : 'dark'), [dark, setPreference]);

  return (
    <IconButton
      icon={dark ? 'sunny-outline' : 'moon-outline'}
      onPress={toggle}
      accessibilityLabel={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    />
  );
}
