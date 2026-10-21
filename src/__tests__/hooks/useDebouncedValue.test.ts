import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the value stops changing', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(() => jest.advanceTimersByTime(150));
    await rerender({ value: 'abc' });
    await act(() => jest.advanceTimersByTime(150));
    expect(result.current).toBe('a');

    await act(() => jest.advanceTimersByTime(50));
    expect(result.current).toBe('abc');
  });
});
