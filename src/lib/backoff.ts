type BackoffOptions = {
  baseMs?: number;
  maxMs?: number;
  random?: () => number;
};

/**
 * Exponential backoff with "full jitter": a random delay between 0 and
 * base * 2^attempt, capped at maxMs. Jitter keeps retries from many
 * clients (or many pages) from landing on the server at the same instant.
 */
export function backoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 500, maxMs = 30_000, random = Math.random } = options;
  const ceiling = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  return Math.round(random() * ceiling);
}
