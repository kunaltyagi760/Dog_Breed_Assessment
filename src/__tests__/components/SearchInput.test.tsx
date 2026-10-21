import { fireEvent, render, screen } from '@testing-library/react-native';

import { SearchInput } from '@/components';

describe('SearchInput', () => {
  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(<SearchInput value="" onChangeText={onChangeText} placeholder="Search breeds" />);

    await fireEvent.changeText(screen.getByLabelText('Search breeds'), 'bea');
    expect(onChangeText).toHaveBeenCalledWith('bea');
  });

  it('only shows the clear button when there is text, and clears it', async () => {
    const onChangeText = jest.fn();
    const { rerender } = await render(
      <SearchInput value="" onChangeText={onChangeText} placeholder="Search breeds" />,
    );
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    await rerender(
      <SearchInput value="bea" onChangeText={onChangeText} placeholder="Search breeds" />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
