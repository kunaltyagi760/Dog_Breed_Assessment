import { fireEvent, render, screen } from '@testing-library/react-native';
import Storage from 'expo-sqlite/kv-store';
import { Appearance } from 'react-native';

import { ThemeToggle } from '@/components';
import { useThemeStore } from '@/store/themeStore';

describe('ThemeToggle', () => {
  it('switches to dark from the light theme and remembers the choice', async () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
    await render(<ThemeToggle />);

    await fireEvent.press(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(setColorScheme).toHaveBeenCalledWith('dark');
    expect(useThemeStore.getState().preference).toBe('dark');
    expect(Storage.getItemSync('theme-preference')).toBe('dark');
    setColorScheme.mockRestore();
  });
});
