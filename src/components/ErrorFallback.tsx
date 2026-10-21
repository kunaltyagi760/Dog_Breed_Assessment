import type { FallbackProps } from 'react-error-boundary';

import { StateMessage } from './StateMessage';

type Props = {
  error: unknown;
  onRetry: () => void;
  title?: string;
};

export function ErrorFallback({ error, onRetry, title = 'Something went wrong' }: Props) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return (
    <StateMessage title={title} message={message} actionLabel="Try again" onAction={onRetry} />
  );
}

// Adapter so it can be passed straight to <ErrorBoundary FallbackComponent />.
export function BoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorFallback error={error} onRetry={resetErrorBoundary} />;
}
