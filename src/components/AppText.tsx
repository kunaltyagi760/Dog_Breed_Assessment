import { memo } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { fontSize, useTheme, type Palette } from '@/theme';

type Variant = 'title' | 'subtitle' | 'body' | 'caption';
type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'warning';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

const toneColor: Record<Tone, keyof Palette> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primary',
  danger: 'danger',
  warning: 'warning',
};

function AppTextBase({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  const { colors } = useTheme();
  return <Text style={[styles[variant], { color: colors[toneColor[tone]] }, style]} {...rest} />;
}

export const AppText = memo(AppTextBase);

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700' },
  subtitle: { fontSize: fontSize.subtitle, fontWeight: '600' },
  body: { fontSize: fontSize.body, lineHeight: 21 },
  caption: { fontSize: fontSize.caption, lineHeight: 16 },
});
