import { useCallback } from 'react';
import { Linking, type StyleProp, type TextStyle } from 'react-native';

import { isWebUrl } from '@/lib/format';

import { AppText } from './AppText';

type Props = {
  url: string | null | undefined;
  children: string;
  variant?: 'body' | 'caption';
  style?: StyleProp<TextStyle>;
};

/** Opens a web link in the browser; renders plain text when the URL isn't usable. */
export function LinkText({ url, children, variant = 'body', style }: Props) {
  const open = useCallback(() => {
    if (isWebUrl(url)) {
      Linking.openURL(url).catch(() => {
        // Nothing sensible to do if no browser can handle it.
      });
    }
  }, [url]);

  if (!isWebUrl(url)) {
    return (
      <AppText variant={variant} style={style}>
        {children}
      </AppText>
    );
  }

  return (
    <AppText
      variant={variant}
      tone="primary"
      accessibilityRole="link"
      onPress={open}
      suppressHighlighting
      style={[{ textDecorationLine: 'underline' }, style]}
    >
      {children}
    </AppText>
  );
}
