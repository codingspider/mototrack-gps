import { isBlank, isValidPhone, validateNewPassword } from '../src/utils/validators';

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

describe('validateNewPassword', () => {
  it('asks for a password', () => {
    expect(validateNewPassword('', '')).toBe('Enter a new password');
    expect(validateNewPassword('   ', '   ')).toBe('Enter a new password');
  });

  it('needs both entries to match', () => {
    expect(validateNewPassword('Abcdef1!', 'Abcdef1')).toBe('The two passwords do not match');
  });

  it('accepts matching passwords', () => {
    expect(validateNewPassword('Abcdef1!', 'Abcdef1!')).toBeNull();
  });
});
