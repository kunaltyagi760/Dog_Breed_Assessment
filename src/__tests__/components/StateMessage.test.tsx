import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorFallback, StateMessage } from '@/components';

describe('StateMessage', () => {
  it('renders title and message', async () => {
    await render(<StateMessage title="No results" message="Try clearing a filter." />);

    expect(screen.getByText('No results')).toBeOnTheScreen();
    expect(screen.getByText('Try clearing a filter.')).toBeOnTheScreen();
  });

  it('only shows the action when both label and handler are given', async () => {
    await render(<StateMessage title="Empty" actionLabel="Reload" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls the action handler', async () => {
    const onAction = jest.fn();
    await render(<StateMessage title="Empty" actionLabel="Reload" onAction={onAction} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorFallback', () => {
  it('shows the error message and retries', async () => {
    const onRetry = jest.fn();
    await render(<ErrorFallback error={new Error('Network down')} onRetry={onRetry} />);

    expect(screen.getByText('Network down')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('handles non-Error values', async () => {
    await render(<ErrorFallback error="boom" onRetry={jest.fn()} />);
    expect(screen.getByText('Unexpected error')).toBeOnTheScreen();
  });
});
