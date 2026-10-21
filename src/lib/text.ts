/** Lowercases and strips accents so "Löwchen" matches a search for "lowchen". */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
