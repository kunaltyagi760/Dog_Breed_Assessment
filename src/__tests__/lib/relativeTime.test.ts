import { formatRelativeTime } from '@/lib/relativeTime';

const now = Date.UTC(2026, 9, 21, 12, 0, 0);
const ago = (ms: number) => now - ms;

describe('formatRelativeTime', () => {
  it.each([
    [ago(10_000), 'just now'],
    [ago(60_000), '1 minute ago'],
    [ago(5 * 60_000), '5 minutes ago'],
    [ago(2 * 3_600_000), '2 hours ago'],
    [ago(26 * 3_600_000), '1 day ago'],
    [ago(9 * 86_400_000), '9 days ago'],
  ])('%i -> %s', (timestamp, expected) => {
    expect(formatRelativeTime(timestamp, now)).toBe(expected);
  });

  it('does not go negative when the clock is behind', () => {
    expect(formatRelativeTime(now + 5_000, now)).toBe('just now');
  });
});
