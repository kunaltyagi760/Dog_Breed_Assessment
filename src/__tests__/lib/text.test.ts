import { foldText } from '@/lib/text';

describe('foldText', () => {
  it('lowercases, trims and strips accents', () => {
    expect(foldText('  Löwchen ')).toBe('lowchen');
    expect(foldText('Chien Français Blanc')).toBe('chien francais blanc');
  });
});
