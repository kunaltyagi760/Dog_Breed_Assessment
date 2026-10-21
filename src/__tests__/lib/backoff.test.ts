import { backoffDelay } from '@/lib/backoff';

describe('backoffDelay', () => {
  const maxRandom = () => 1;

  it('doubles the ceiling on every attempt', () => {
    expect(backoffDelay(0, { baseMs: 100, random: maxRandom })).toBe(100);
    expect(backoffDelay(1, { baseMs: 100, random: maxRandom })).toBe(200);
    expect(backoffDelay(3, { baseMs: 100, random: maxRandom })).toBe(800);
  });

  it('never exceeds maxMs', () => {
    expect(backoffDelay(20, { baseMs: 100, maxMs: 5_000, random: maxRandom })).toBe(5_000);
  });

  it('applies jitter between zero and the ceiling', () => {
    expect(backoffDelay(2, { baseMs: 100, random: () => 0 })).toBe(0);
    expect(backoffDelay(2, { baseMs: 100, random: () => 0.5 })).toBe(200);
  });

  it('treats negative attempts as the first attempt', () => {
    expect(backoffDelay(-3, { baseMs: 100, random: maxRandom })).toBe(100);
  });
});
