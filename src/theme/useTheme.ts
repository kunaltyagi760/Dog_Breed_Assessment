import { useColorScheme } from 'react-native';

import { palettes, type Palette } from './tokens';

export type Theme = {
  dark: boolean;
  colors: Palette;
};

const lightTheme: Theme = { dark: false, colors: palettes.light };
const darkTheme: Theme = { dark: true, colors: palettes.dark };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
