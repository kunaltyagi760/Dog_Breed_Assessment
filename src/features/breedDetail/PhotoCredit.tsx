import { memo } from 'react';

import { AppText, LinkText } from '@/components';
import type { ImageAttribution } from '@/domain/types';
import { formatSourceName } from '@/lib/format';

type Props = { attribution: ImageAttribution };

// The images are CC-licensed, so the credit has to be shown alongside the photo.
function PhotoCreditBase({ attribution }: Props) {
  const { author, license, licenseUrl, source, sourceUrl } = attribution;

  return (
    <AppText variant="caption" tone="muted">
      Photo by {author ?? 'an unknown author'}
      {' · '}
      <LinkText url={licenseUrl} variant="caption">
        {license ?? 'License not stated'}
      </LinkText>
      {' · '}
      <LinkText url={sourceUrl} variant="caption">
        {source ? formatSourceName(source) : 'Source'}
      </LinkText>
    </AppText>
  );
}

export const PhotoCredit = memo(PhotoCreditBase);
