import { backoffDelay } from './backoff';

export type RetryOptions = {
  retries?: number;
  shouldRetry?: (error: unknown) => boolean;
  delay?: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    shouldRetry = () => true,
    delay = (attempt) => backoffDelay(attempt),
    sleep = wait,
  } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) throw error;
      await sleep(delay(attempt));
    }
  }
}
