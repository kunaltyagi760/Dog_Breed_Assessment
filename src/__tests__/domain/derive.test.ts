import { coatCategoryFor, groupLabel, sizeBandFor, toRange, toScore } from '@/domain/derive';

const range = (min: number, max: number) => ({ min, max });
const noHeight = { male: null, female: null };

describe('toRange', () => {
  it('keeps a well-formed range', () => {
    expect(toRange({ min: 10, max: 14 })).toEqual(range(10, 14));
  });

  it('fills a missing bound from the other one', () => {
    expect(toRange({ min: null, max: 12 })).toEqual(range(12, 12));
  });

  it('swaps reversed bounds', () => {
    expect(toRange({ min: 30, max: 20 })).toEqual(range(20, 30));
  });

  it('returns null for missing or zero ranges', () => {
    expect(toRange(null)).toBeNull();
    expect(toRange({ min: 0, max: 0 })).toBeNull();
  });
});

describe('sizeBandFor', () => {
  it.each([
    [range(3, 6), range(3, 5), 'small'],
    [range(15, 22), range(12, 18), 'medium'],
    [range(30, 40), range(25, 34), 'large'],
    [range(50, 100), range(45, 70), 'giant'],
  ] as const)('male %o / female %o -> %s', (male, female, expected) => {
    expect(sizeBandFor({ male, female }, noHeight)).toBe(expected);
  });

  it('uses whichever weight is available', () => {
    expect(sizeBandFor({ male: range(5, 8), female: null }, noHeight)).toBe('small');
  });

  it('falls back to height when weight is missing', () => {
    expect(
      sizeBandFor({ male: null, female: null }, { male: range(70, 80), female: range(65, 72) }),
    ).toBe('giant');
  });

  it('returns null with no measurements at all', () => {
    expect(sizeBandFor({ male: null, female: null }, noHeight)).toBeNull();
  });
});

describe('coatCategoryFor', () => {
  it('treats a wire coat type as wire whatever its length', () => {
    expect(coatCategoryFor({ type: 'wire', length: 'short' })).toBe('wire');
  });

  it('uses the length for other coat types', () => {
    expect(coatCategoryFor({ type: 'double', length: 'long' })).toBe('long');
    expect(coatCategoryFor({ type: 'smooth', length: 'Short' })).toBe('short');
  });

  it('recognises hairless breeds from either field', () => {
    expect(coatCategoryFor({ type: 'hairless', length: null })).toBe('hairless');
    expect(coatCategoryFor({ type: null, length: 'hairless' })).toBe('hairless');
  });

  it('falls back to unknown', () => {
    expect(coatCategoryFor(null)).toBe('unknown');
    expect(coatCategoryFor({ type: 'curly', length: null })).toBe('unknown');
  });
});

describe('groupLabel', () => {
  it('drops the Group/Class suffix', () => {
    expect(groupLabel('Herding Group')).toBe('Herding');
    expect(groupLabel('Miscellaneous Class')).toBe('Miscellaneous');
    expect(groupLabel('Foundation Stock Service')).toBe('Foundation Stock Service');
  });
});

describe('toScore', () => {
  it('only accepts scores between 1 and 5', () => {
    expect(toScore(3)).toBe(3);
    expect(toScore(0)).toBeNull();
    expect(toScore(9)).toBeNull();
    expect(toScore(undefined)).toBeNull();
  });
});
