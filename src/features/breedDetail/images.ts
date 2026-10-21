import type { BreedImage } from '@/domain/types';

export type ImageVariant = 'thumb' | 'medium' | 'large';

const FALLBACKS: Record<ImageVariant, ImageVariant[]> = {
  thumb: ['thumb', 'medium', 'large'],
  medium: ['medium', 'large', 'thumb'],
  large: ['large', 'medium', 'thumb'],
};

/** The preferred variant's URL, falling back to the closest size that exists. */
export function imageUrl(image: BreedImage, preferred: ImageVariant): string | null {
  for (const variant of FALLBACKS[preferred]) {
    const url = image[variant];
    if (url) return url;
  }
  return null;
}
