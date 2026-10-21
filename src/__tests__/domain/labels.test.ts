import { breedSummary } from '@/domain/labels';

import { listItem } from '../helpers/fixtures';

describe('breedSummary', () => {
  it('describes size, coat and hypoallergenic', () => {
    expect(
      breedSummary(
        listItem('x', { sizeBand: 'small', coatCategory: 'wire', hypoallergenic: true }),
      ),
    ).toBe('Small · Wire coat · Hypoallergenic');
  });

  it('says "Hairless" rather than "Hairless coat"', () => {
    expect(breedSummary(listItem('x', { coatCategory: 'hairless' }))).toBe('Medium · Hairless');
  });

  it('leaves out unknown values', () => {
    expect(breedSummary(listItem('x', { sizeBand: null, coatCategory: 'unknown' }))).toBe('');
  });
});
