export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  body: 15,
  subtitle: 17,
  title: 22,
} as const;

const light = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EFEA',
  border: '#E2E0D8',
  text: '#1C1B18',
  textMuted: '#6B6960',
  primary: '#B5562B',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  dangerSurface: '#FCE8E6',
  warning: '#8A5A00',
  warningSurface: '#FFF4D6',
};

export type Palette = typeof light;

const dark: Palette = {
  background: '#121210',
  surface: '#1C1B19',
  surfaceMuted: '#262522',
  border: '#34322E',
  text: '#F2F0EA',
  textMuted: '#A3A097',
  primary: '#E58A5C',
  onPrimary: '#1C1B18',
  danger: '#F2B8B5',
  dangerSurface: '#3B1C1A',
  warning: '#F5C66B',
  warningSurface: '#3A2E12',
};

export const palettes = { light, dark };
