export type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

// 5xx, 429 and connection problems are worth retrying; 4xx and bad payloads are not.
export function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof HttpError) return error.status >= 500 || error.status === 429;
  return false;
}

type GetJsonOptions = {
  fetchFn: FetchLike;
  timeoutMs: number;
};

export async function getJson(url: string, { fetchFn, timeoutMs }: GetJsonOptions) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: FetchResponse;
  try {
    response = await fetchFn(url, { signal: controller.signal });
  } catch (error) {
    const message = controller.signal.aborted ? 'Request timed out' : 'Network request failed';
    throw new NetworkError(message, { cause: error });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new HttpError(response.status, url);

  try {
    return await response.json();
  } catch {
    throw new InvalidResponseError('Response was not valid JSON');
  }
}
