import { useEffect, useState } from 'react';

/** Current time, refreshed every `intervalMs`. Keeps "2 minutes ago" labels honest. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
