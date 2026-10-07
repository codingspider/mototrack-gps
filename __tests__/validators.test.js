import { isBlank, isValidPhone } from '../src/utils/validators';

describe('validators', () => {
  it('detects blank text', () => {
    expect(isBlank('  ')).toBe(true);
    expect(isBlank('a')).toBe(false);
  });
  it('accepts Bangladesh mobile numbers', () => {
    expect(isValidPhone('01712345678')).toBe(true);
    expect(isValidPhone('+8801712345678')).toBe(true);
    expect(isValidPhone('0171234')).toBe(false);
  });
});