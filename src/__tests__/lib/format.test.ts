import { formatBytes, formatRange, formatSourceName, isWebUrl } from '@/lib/format';

describe('formatRange', () => {
  it('formats a range with its unit', () => {
    expect(formatRange({ min: 10, max: 14 }, 'years')).toBe('10–14 years');
  });

  it('shows a single value when both ends match', () => {
    expect(formatRange({ min: 12, max: 12 }, 'kg')).toBe('12 kg');
  });

  it('returns null for missing data', () => {
    expect(formatRange(null, 'cm')).toBeNull();
  });
});

describe('formatSourceName', () => {
  it('turns API keys into readable names', () => {
    expect(formatSourceName('wikimedia_commons')).toBe('Wikimedia Commons');
    expect(formatSourceName('flickr')).toBe('Flickr');
  });
});

describe('isWebUrl', () => {
  it('only accepts http and https links', () => {
    expect(isWebUrl('https://commons.wikimedia.org')).toBe(true);
    expect(isWebUrl('http://example.com')).toBe(true);
    expect(isWebUrl('javascript:alert(1)')).toBe(false);
    expect(isWebUrl('')).toBe(false);
    expect(isWebUrl(null)).toBe(false);
  });
});

describe('formatBytes', () => {
  it('uses KB below a megabyte and MB above', () => {
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(5.25 * 1024 * 1024)).toBe('5.3 MB');
    expect(formatBytes(0)).toBe('0 KB');
  });
});
