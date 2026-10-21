import type { BreedImage } from '@/domain/types';
import { imageUrl } from '@/features/breedDetail/images';

const image = (variants: Partial<Pick<BreedImage, 'thumb' | 'medium' | 'large'>>): BreedImage => ({
  id: 'img',
  thumb: null,
  medium: null,
  large: null,
  attribution: { author: null, license: null, licenseUrl: null, source: null, sourceUrl: null },
  ...variants,
});

describe('imageUrl', () => {
  it('returns the preferred variant when it exists', () => {
    const full = image({ thumb: 't', medium: 'm', large: 'l' });
    expect(imageUrl(full, 'medium')).toBe('m');
    expect(imageUrl(full, 'large')).toBe('l');
  });

  it('falls back to the nearest size', () => {
    expect(imageUrl(image({ thumb: 't', large: 'l' }), 'medium')).toBe('l');
    expect(imageUrl(image({ thumb: 't' }), 'large')).toBe('t');
  });

  it('returns null when nothing is available', () => {
    expect(imageUrl(image({}), 'medium')).toBeNull();
  });
});
