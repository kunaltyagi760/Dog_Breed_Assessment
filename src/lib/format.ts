import type { Range } from '@/domain/types';

/** "10–14 years", "12 kg" when both ends match, or null when there's no data. */
export function formatRange(range: Range | null, unit: string): string | null {
  if (!range) return null;
  return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
}

/** "wikimedia_commons" -> "Wikimedia Commons". */
export function formatSourceName(source: string): string {
  return source
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

/** Only web links are opened; anything else in the data is shown as plain text. */
export function isWebUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

/** "820 KB", "5.1 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
